/**
 * QuduratGenerator.ts
 * Main service for generating GAT exam questions using Claude API
 *
 * Features:
 * - Question generation with retry logic (max 3 retries, exponential backoff: 1s/2s/4s)
 * - Batch generation support (20 questions per batch)
 * - Prompt caching integration for cost optimization
 * - Error tracking and quality flagging
 * - Cache hit/miss tracking
 *
 * @see specs/1-gat-exam-v3/plan.md - Generation Architecture
 * @see User Story 2 (FR-009) - Error handling and retry
 * @see User Story 6 (SC-006, SC-007) - Batch generation efficiency
 */

import Anthropic from '@anthropic-ai/sdk';
import { PromptBuilder, type QuestionGenerationParams } from './PromptBuilder';
import { ResponseParser } from './ResponseParser';
import { QuestionValidator, type QuestionData, type ValidationResult } from './QuestionValidator';
import { PromptCacheManager } from '../cache/PromptCacheManager';

export interface GenerationResult {
  /** Successfully generated and validated questions */
  questions: QuestionData[];
  /** Questions that failed validation */
  failed: Array<{
    data: any;
    validation: ValidationResult;
  }>;
  /** Whether generation was successful */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
  /** Generation metadata */
  metadata: GenerationMetadata;
}

export interface GenerationMetadata {
  /** Model used */
  model: string;
  /** Batch ID */
  batchId: string;
  /** Whether cache was hit */
  cacheHit: boolean;
  /** Number of retries attempted */
  retriesAttempted: number;
  /** Generation timestamp */
  generatedAt: string;
  /** Estimated cost */
  estimatedCost: number;
  /** Total tokens used */
  totalTokens: number;
}

export interface GenerationConfig {
  /** API key for Claude */
  apiKey?: string;
  /** Model to use (default: claude-sonnet-4-20250514) */
  model?: string;
  /** Max tokens for response (default: 8000) */
  maxTokens?: number;
  /** Temperature (default: 1.0) */
  temperature?: number;
  /** Enable prompt caching (default: true) */
  enableCaching?: boolean;
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
  /** Retry delays in ms (default: [1000, 2000, 4000]) */
  retryDelays?: number[];
}

const DEFAULT_CONFIG: Required<Omit<GenerationConfig, 'apiKey'>> = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8000,
  temperature: 1.0,
  enableCaching: true,
  maxRetries: 3,
  retryDelays: [1000, 2000, 4000],
};

export class QuduratGenerator {
  private anthropic: Anthropic;
  private config: Required<GenerationConfig>;
  private promptBuilder: PromptBuilder;
  private responseParser: ResponseParser;
  private questionValidator: QuestionValidator;
  private cacheManager: PromptCacheManager;

  constructor(config: GenerationConfig) {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.config = { ...DEFAULT_CONFIG, ...config, apiKey };
    this.anthropic = new Anthropic({ apiKey });
    this.promptBuilder = new PromptBuilder();
    this.responseParser = new ResponseParser();
    this.questionValidator = new QuestionValidator();
    this.cacheManager = new PromptCacheManager();
  }

  /**
   * Generate questions with automatic retry on failure
   * @param params - Generation parameters
   * @returns Generation result with questions or error
   */
  async generateWithRetry(params: QuestionGenerationParams): Promise<GenerationResult> {
    const batchId = this.generateBatchId();
    let lastError: Error | null = null;
    let retriesAttempted = 0;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (exponential backoff)
          const delay = this.config.retryDelays[attempt - 1] || 4000;
          console.log(`Retry attempt ${attempt}/${this.config.maxRetries} after ${delay}ms...`);
          await this.sleep(delay);
        }

        retriesAttempted = attempt;

        // Attempt generation
        const result = await this.generate(params, batchId, retriesAttempted);

        // Success - return result
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`Generation attempt ${attempt + 1} failed:`, error);

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }
      }
    }

    // All retries exhausted
    return {
      questions: [],
      failed: [],
      success: false,
      error: `Generation failed after ${retriesAttempted} retries: ${lastError?.message || 'Unknown error'}`,
      metadata: {
        model: this.config.model,
        batchId,
        cacheHit: false,
        retriesAttempted,
        generatedAt: new Date().toISOString(),
        estimatedCost: 0,
        totalTokens: 0,
      },
    };
  }

  /**
   * Generate questions (single attempt)
   */
  private async generate(
    params: QuestionGenerationParams,
    batchId: string,
    retriesAttempted: number
  ): Promise<GenerationResult> {
    // Build prompts
    const prompt = await this.promptBuilder.buildPrompt(params);

    // Create system parameter with cache control
    const systemParam = this.cacheManager.createSystemParameter(
      prompt.systemPrompt,
      this.config.enableCaching
    );

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemParam,
      messages: [
        {
          role: 'user',
          content: prompt.userPrompt,
        },
      ],
    });

    // Extract response text
    const responseText = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    // Parse response
    const parsed = this.responseParser.parseBatch(responseText);

    if (!parsed.success) {
      throw new Error(`Failed to parse response: ${parsed.error}`);
    }

    // Validate each question
    const validQuestions: QuestionData[] = [];
    const failedQuestions: Array<{ data: any; validation: ValidationResult }> = [];

    for (const questionData of parsed.data) {
      const validation = this.questionValidator.validate(questionData);

      if (validation.valid && validation.question) {
        // Add generation metadata
        const enrichedQuestion: QuestionData = {
          ...validation.question,
          generation_metadata: {
            model: this.config.model,
            batch_id: batchId,
            cache_hit: this.detectCacheHit(response),
            generated_at: new Date().toISOString(),
          },
        };

        validQuestions.push(enrichedQuestion);
      } else {
        failedQuestions.push({ data: questionData, validation });
      }
    }

    // Track cache metrics
    const cacheHit = this.detectCacheHit(response);
    const totalTokens = response.usage.input_tokens + response.usage.output_tokens;

    if (cacheHit) {
      this.cacheManager.recordCacheHit(response.usage.input_tokens);
    } else {
      this.cacheManager.recordCacheMiss(totalTokens);
    }

    // Calculate estimated cost
    const estimatedCost = this.estimateCost(response.usage, cacheHit);

    return {
      questions: validQuestions,
      failed: failedQuestions,
      success: validQuestions.length > 0,
      error: validQuestions.length === 0 ? 'All questions failed validation' : undefined,
      metadata: {
        model: this.config.model,
        batchId,
        cacheHit,
        retriesAttempted,
        generatedAt: new Date().toISOString(),
        estimatedCost,
        totalTokens,
      },
    };
  }

  /**
   * Generate a batch of questions (optimized for caching)
   * @param paramsArray - Array of generation parameters
   * @returns Generation result
   */
  async generateBatch(
    paramsArray: QuestionGenerationParams[]
  ): Promise<GenerationResult> {
    const batchId = this.generateBatchId();

    // Build batch prompt
    const prompt = await this.promptBuilder.buildBatchPrompt(paramsArray);

    // Create system parameter with cache control
    const systemParam = this.cacheManager.createSystemParameter(
      prompt.systemPrompt,
      this.config.enableCaching
    );

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemParam,
      messages: [
        {
          role: 'user',
          content: prompt.userPrompt,
        },
      ],
    });

    // Extract and parse response
    const responseText = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    const parsed = this.responseParser.parseBatch(responseText);

    if (!parsed.success) {
      throw new Error(`Failed to parse batch response: ${parsed.error}`);
    }

    // Validate all questions
    const validQuestions: QuestionData[] = [];
    const failedQuestions: Array<{ data: any; validation: ValidationResult }> = [];

    for (const questionData of parsed.data) {
      const validation = this.questionValidator.validate(questionData);

      if (validation.valid && validation.question) {
        const enrichedQuestion: QuestionData = {
          ...validation.question,
          generation_metadata: {
            model: this.config.model,
            batch_id: batchId,
            cache_hit: this.detectCacheHit(response),
            generated_at: new Date().toISOString(),
          },
        };

        validQuestions.push(enrichedQuestion);
      } else {
        failedQuestions.push({ data: questionData, validation });
      }
    }

    // Track cache metrics
    const cacheHit = this.detectCacheHit(response);
    const totalTokens = response.usage.input_tokens + response.usage.output_tokens;

    if (cacheHit) {
      this.cacheManager.recordCacheHit(response.usage.input_tokens);
    } else {
      this.cacheManager.recordCacheMiss(totalTokens);
    }

    return {
      questions: validQuestions,
      failed: failedQuestions,
      success: validQuestions.length > 0,
      metadata: {
        model: this.config.model,
        batchId,
        cacheHit,
        retriesAttempted: 0,
        generatedAt: new Date().toISOString(),
        estimatedCost: this.estimateCost(response.usage, cacheHit),
        totalTokens,
      },
    };
  }

  /**
   * Generate a batch of 20 questions with consistent quality and retry logic (T057, T058)
   * This method preserves successfully generated questions and retries only failed ones
   * @param params - Base generation parameters
   * @param targetCount - Number of questions to generate (default: 20)
   * @returns Generation result with all successfully generated questions
   */
  async generateBatchWithRetry(
    params: QuestionGenerationParams,
    targetCount: number = 20
  ): Promise<GenerationResult> {
    const batchId = this.generateBatchId();
    const allQuestions: QuestionData[] = [];
    const allFailed: Array<{ data: any; validation: ValidationResult }> = [];
    let totalRetriesAttempted = 0;
    let totalCost = 0;
    let totalTokens = 0;
    let cacheHitOverall = false;

    // Calculate how many questions to request per batch
    // Request slightly more to account for validation failures
    const requestCount = Math.ceil(targetCount * 1.2);

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const remaining = targetCount - allQuestions.length;

      if (remaining <= 0) {
        // We have enough valid questions
        break;
      }

      if (attempt > 0) {
        // Wait before retry (exponential backoff)
        const delay = this.config.retryDelays[attempt - 1] || 4000;
        console.log(
          `Batch retry ${attempt}/${this.config.maxRetries} for ${remaining} remaining questions after ${delay}ms...`
        );
        await this.sleep(delay);
        totalRetriesAttempted = attempt;
      }

      try {
        // Generate questions for this attempt
        const paramsArray = Array(remaining).fill(params);
        const result = await this.generateBatch(paramsArray);

        // Collect valid questions
        allQuestions.push(...result.questions);
        allFailed.push(...result.failed);

        // Track metrics
        totalCost += result.metadata.estimatedCost;
        totalTokens += result.metadata.totalTokens;
        cacheHitOverall = cacheHitOverall || result.metadata.cacheHit;

        console.log(
          `Batch attempt ${attempt + 1}: ${result.questions.length} valid, ${result.failed.length} failed, ${allQuestions.length}/${targetCount} total`
        );

        // If we have enough questions, stop
        if (allQuestions.length >= targetCount) {
          break;
        }
      } catch (error) {
        console.error(`Batch generation attempt ${attempt + 1} failed:`, error);

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }
      }
    }

    // Trim to exact target count if we generated more
    const finalQuestions = allQuestions.slice(0, targetCount);

    return {
      questions: finalQuestions,
      failed: allFailed,
      success: finalQuestions.length >= targetCount,
      error:
        finalQuestions.length < targetCount
          ? `Only generated ${finalQuestions.length}/${targetCount} valid questions after retries`
          : undefined,
      metadata: {
        model: this.config.model,
        batchId,
        cacheHit: cacheHitOverall,
        retriesAttempted: totalRetriesAttempted,
        generatedAt: new Date().toISOString(),
        estimatedCost: totalCost,
        totalTokens,
      },
    };
  }

  /**
   * Validate batch quality after generation
   * Checks topic and difficulty distribution against targets
   */
  async validateBatchQuality(
    questions: QuestionData[],
    targetTopicDistribution: Record<string, number>,
    targetDifficultyDistribution?: Record<string, number>
  ): Promise<{
    topicValid: boolean;
    difficultyValid: boolean;
    topicErrors: string[];
    difficultyErrors: string[];
  }> {
    // Validate topic distribution
    const topicValidation = this.questionValidator.validateTopicDistribution(
      questions,
      targetTopicDistribution,
      0.05 // 5% tolerance
    );

    // Validate difficulty distribution
    const difficultyValidation = targetDifficultyDistribution
      ? this.questionValidator.validateDifficultyDistribution(
          questions,
          targetDifficultyDistribution,
          0.05 // 5% tolerance
        )
      : { valid: true, errors: [] };

    return {
      topicValid: topicValidation.valid,
      difficultyValid: difficultyValidation.valid,
      topicErrors: topicValidation.errors,
      difficultyErrors: difficultyValidation.errors,
    };
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics() {
    return this.cacheManager.getMetrics();
  }

  /**
   * Reset cache metrics (for new session)
   */
  resetCacheMetrics() {
    this.cacheManager.resetMetrics();
  }

  /**
   * Generate analogy questions with balanced distribution across relationship types
   * Ensures diverse coverage of all 22 relationship types (User Story 5)
   *
   * @param count - Total number of analogy questions to generate
   * @param track - Scientific or literary track
   * @param difficulty - Difficulty distribution (default: 30% easy, 50% medium, 20% hard)
   * @returns Generation result with balanced relationship types
   */
  async generateAnalogyQuestionsBalanced(
    count: number,
    track: 'scientific' | 'literary',
    difficulty?: { easy: number; medium: number; hard: number }
  ): Promise<GenerationResult> {
    // Import relationship types
    const { getAllAnalogyRelationshipIds } = await import('@/lib/constants/analogy-relationships');
    const allRelationshipTypes = getAllAnalogyRelationshipIds();

    // Default difficulty distribution: 30% easy, 50% medium, 20% hard
    const difficultyDist = difficulty || { easy: 0.3, medium: 0.5, hard: 0.2 };

    // Calculate how many questions per relationship type
    const questionsPerType = Math.floor(count / allRelationshipTypes.length);
    const remainder = count % allRelationshipTypes.length;

    // Create generation params for each relationship type
    const paramsArray: QuestionGenerationParams[] = [];

    // Distribute questions across all 22 relationship types
    for (let i = 0; i < allRelationshipTypes.length; i++) {
      const relationshipType = allRelationshipTypes[i];

      // Add base questions for this type
      let questionsForThisType = questionsPerType;

      // Add remainder to first few types
      if (i < remainder) {
        questionsForThisType += 1;
      }

      // Distribute difficulty for this type
      for (let j = 0; j < questionsForThisType; j++) {
        // Determine difficulty based on distribution
        let questionDifficulty: 'easy' | 'medium' | 'hard';
        const rand = Math.random();

        if (rand < difficultyDist.easy) {
          questionDifficulty = 'easy';
        } else if (rand < difficultyDist.easy + difficultyDist.medium) {
          questionDifficulty = 'medium';
        } else {
          questionDifficulty = 'hard';
        }

        paramsArray.push({
          section: 'verbal',
          track,
          questionType: 'analogy',
          topic: 'analogy',
          subtopic: relationshipType,
          difficulty: questionDifficulty,
          relationshipType, // Specify the exact relationship type
        });
      }
    }

    // Shuffle params to avoid sequential relationship types
    const shuffledParams = this.shuffleArray(paramsArray);

    // Generate in batches of 20 for optimal caching
    const batchSize = 20;
    const batches: QuestionGenerationParams[][] = [];

    for (let i = 0; i < shuffledParams.length; i += batchSize) {
      batches.push(shuffledParams.slice(i, i + batchSize));
    }

    // Generate each batch
    const allQuestions: QuestionData[] = [];
    const allFailed: Array<{ data: any; validation: ValidationResult }> = [];
    let totalCost = 0;
    let totalTokens = 0;
    const batchId = this.generateBatchId();

    for (let i = 0; i < batches.length; i++) {
      console.log(`Generating batch ${i + 1}/${batches.length} for analogy questions...`);

      const result = await this.generateBatch(batches[i]);

      allQuestions.push(...result.questions);
      allFailed.push(...result.failed);
      totalCost += result.metadata.estimatedCost;
      totalTokens += result.metadata.totalTokens;
    }

    return {
      questions: allQuestions,
      failed: allFailed,
      success: allQuestions.length > 0,
      error: allQuestions.length === 0 ? 'No valid questions generated' : undefined,
      metadata: {
        model: this.config.model,
        batchId,
        cacheHit: true, // Batches should benefit from caching
        retriesAttempted: 0,
        generatedAt: new Date().toISOString(),
        estimatedCost: totalCost,
        totalTokens,
      },
    };
  }

  /**
   * Generate a full 120-question exam in sequential batches (T085, User Story 6)
   * Sequential execution maximizes cache reuse within 5-minute TTL window
   *
   * IMPORTANT: Generates quantitative batches first, then verbal batches separately
   * to ensure correct skills are loaded for each section type.
   *
   * @param examConfig - Exam configuration with topic/difficulty distribution
   * @param progressCallback - Optional callback for batch progress updates
   * @returns Complete exam with 120 questions
   */
  async generateFullExamSequential(
    examConfig: {
      track: 'scientific' | 'literary';
      sectionSplit: { quantitative: number; verbal: number }; // e.g., {quantitative: 60, verbal: 60}
      topicDistribution: {
        quantitative?: Record<string, number>;
        verbal?: Record<string, number>;
      };
      difficultyDistribution: { easy: number; medium: number; hard: number };
      batchSize?: number; // default: 20
    },
    progressCallback?: (progress: {
      currentBatch: number;
      totalBatches: number;
      questionsGenerated: number;
      targetQuestions: number;
      cacheHitRate: number;
      estimatedCostSoFar: number;
    }) => void
  ): Promise<GenerationResult> {
    const batchSize = examConfig.batchSize || 20;
    const totalQuestions =
      examConfig.sectionSplit.quantitative + examConfig.sectionSplit.verbal;

    // Calculate batches per section (separate quantitative and verbal)
    const quantBatches = Math.ceil(examConfig.sectionSplit.quantitative / batchSize);
    const verbalBatches = Math.ceil(examConfig.sectionSplit.verbal / batchSize);
    const totalBatches = quantBatches + verbalBatches;

    console.log(
      `Starting sequential generation of ${totalQuestions} questions in ${totalBatches} batches...`
    );
    console.log(`Batch size: ${batchSize}, Track: ${examConfig.track}`);
    console.log(`Quantitative: ${examConfig.sectionSplit.quantitative} questions in ${quantBatches} batches`);
    console.log(`Verbal: ${examConfig.sectionSplit.verbal} questions in ${verbalBatches} batches`);

    const allQuestions: QuestionData[] = [];
    const allFailed: Array<{ data: any; validation: ValidationResult }> = [];
    let totalCost = 0;
    let totalTokens = 0;
    let cacheHits = 0;
    let batchesCompleted = 0;
    const batchId = this.generateBatchId();

    // Reset cache metrics for this exam generation
    this.resetCacheMetrics();

    // ========================================================================
    // PHASE 1: Generate ALL quantitative questions first
    // ========================================================================
    if (examConfig.sectionSplit.quantitative > 0 && examConfig.topicDistribution.quantitative) {
      console.log(`\n========== PHASE 1: QUANTITATIVE (${examConfig.sectionSplit.quantitative} questions) ==========`);

      let quantQuestionsGenerated = 0;

      for (let i = 0; i < quantBatches; i++) {
        const batchStartTime = Date.now();
        batchesCompleted++;

        console.log(`\n=== Quantitative Batch ${i + 1}/${quantBatches} (Overall: ${batchesCompleted}/${totalBatches}) ===`);

        // Calculate questions for this batch
        const remaining = examConfig.sectionSplit.quantitative - quantQuestionsGenerated;
        const questionCountForBatch = Math.min(batchSize, remaining);

        // Build params for quantitative batch only
        const batchParams = this.distributeQuestionsByTopicAndDifficulty(
          'quantitative',
          examConfig.track,
          questionCountForBatch,
          examConfig.topicDistribution.quantitative,
          examConfig.difficultyDistribution
        );

        // Generate this batch
        try {
          const result = await this.generateBatch(batchParams);

          allQuestions.push(...result.questions);
          allFailed.push(...result.failed);
          totalCost += result.metadata.estimatedCost;
          totalTokens += result.metadata.totalTokens;
          quantQuestionsGenerated += result.questions.length;

          if (result.metadata.cacheHit) {
            cacheHits++;
          }

          const batchDuration = Date.now() - batchStartTime;
          const cacheHitRate = cacheHits / batchesCompleted;

          console.log(
            `Batch complete: ${result.questions.length} valid questions in ${(batchDuration / 1000).toFixed(1)}s`
          );
          console.log(`Cache hit: ${result.metadata.cacheHit ? 'YES' : 'NO'}`);
          console.log(`Cost for batch: $${result.metadata.estimatedCost.toFixed(4)}`);
          console.log(`Quantitative progress: ${quantQuestionsGenerated}/${examConfig.sectionSplit.quantitative}`);

          // Call progress callback
          if (progressCallback) {
            progressCallback({
              currentBatch: batchesCompleted,
              totalBatches,
              questionsGenerated: allQuestions.length,
              targetQuestions: totalQuestions,
              cacheHitRate,
              estimatedCostSoFar: totalCost,
            });
          }
        } catch (error) {
          console.error(`Quantitative batch ${i + 1} failed:`, error);

          if (this.isNonRetryableError(error)) {
            console.error('Non-retryable error encountered, aborting exam generation');
            break;
          }
          console.log('Continuing to next batch despite error...');
        }

        // Small delay between batches
        if (i < quantBatches - 1) {
          await this.sleep(500);
        }
      }
    }

    // ========================================================================
    // PHASE 2: Generate ALL verbal questions
    // ========================================================================
    if (examConfig.sectionSplit.verbal > 0 && examConfig.topicDistribution.verbal) {
      console.log(`\n========== PHASE 2: VERBAL (${examConfig.sectionSplit.verbal} questions) ==========`);

      let verbalQuestionsGenerated = 0;

      for (let i = 0; i < verbalBatches; i++) {
        const batchStartTime = Date.now();
        batchesCompleted++;

        console.log(`\n=== Verbal Batch ${i + 1}/${verbalBatches} (Overall: ${batchesCompleted}/${totalBatches}) ===`);

        // Calculate questions for this batch
        const remaining = examConfig.sectionSplit.verbal - verbalQuestionsGenerated;
        const questionCountForBatch = Math.min(batchSize, remaining);

        // Build params for verbal batch only
        const batchParams = this.distributeQuestionsByTopicAndDifficulty(
          'verbal',
          examConfig.track,
          questionCountForBatch,
          examConfig.topicDistribution.verbal,
          examConfig.difficultyDistribution
        );

        // Generate this batch
        try {
          const result = await this.generateBatch(batchParams);

          allQuestions.push(...result.questions);
          allFailed.push(...result.failed);
          totalCost += result.metadata.estimatedCost;
          totalTokens += result.metadata.totalTokens;
          verbalQuestionsGenerated += result.questions.length;

          if (result.metadata.cacheHit) {
            cacheHits++;
          }

          const batchDuration = Date.now() - batchStartTime;
          const cacheHitRate = cacheHits / batchesCompleted;

          console.log(
            `Batch complete: ${result.questions.length} valid questions in ${(batchDuration / 1000).toFixed(1)}s`
          );
          console.log(`Cache hit: ${result.metadata.cacheHit ? 'YES' : 'NO'}`);
          console.log(`Cost for batch: $${result.metadata.estimatedCost.toFixed(4)}`);
          console.log(`Verbal progress: ${verbalQuestionsGenerated}/${examConfig.sectionSplit.verbal}`);

          // Call progress callback
          if (progressCallback) {
            progressCallback({
              currentBatch: batchesCompleted,
              totalBatches,
              questionsGenerated: allQuestions.length,
              targetQuestions: totalQuestions,
              cacheHitRate,
              estimatedCostSoFar: totalCost,
            });
          }
        } catch (error) {
          console.error(`Verbal batch ${i + 1} failed:`, error);

          if (this.isNonRetryableError(error)) {
            console.error('Non-retryable error encountered, aborting exam generation');
            break;
          }
          console.log('Continuing to next batch despite error...');
        }

        // Small delay between batches
        if (i < verbalBatches - 1) {
          await this.sleep(500);
        }
      }
    }

    // Final metrics
    const finalCacheHitRate = batchesCompleted > 0 ? cacheHits / batchesCompleted : 0;
    const averageCostPerQuestion = allQuestions.length > 0 ? totalCost / allQuestions.length : 0;

    console.log(`\n=== Exam Generation Complete ===`);
    console.log(`Total questions: ${allQuestions.length}/${totalQuestions}`);
    console.log(`Total cost: $${totalCost.toFixed(4)}`);
    console.log(`Average cost per question: $${averageCostPerQuestion.toFixed(4)}`);
    console.log(`Cache hit rate: ${(finalCacheHitRate * 100).toFixed(1)}%`);
    console.log(
      `Cost savings vs no caching: ${((1 - finalCacheHitRate) * 100).toFixed(1)}%`
    );

    return {
      questions: allQuestions,
      failed: allFailed,
      success: allQuestions.length >= totalQuestions * 0.9, // Allow 10% tolerance
      error:
        allQuestions.length < totalQuestions
          ? `Generated ${allQuestions.length}/${totalQuestions} questions`
          : undefined,
      metadata: {
        model: this.config.model,
        batchId,
        cacheHit: cacheHits > 0,
        retriesAttempted: 0,
        generatedAt: new Date().toISOString(),
        estimatedCost: totalCost,
        totalTokens,
      },
    };
  }

  /**
   * Helper: Distribute questions by topic and difficulty
   */
  private distributeQuestionsByTopicAndDifficulty(
    section: 'quantitative' | 'verbal',
    track: 'scientific' | 'literary',
    count: number,
    topicDistribution: Record<string, number>,
    difficultyDistribution: { easy: number; medium: number; hard: number }
  ): QuestionGenerationParams[] {
    const params: QuestionGenerationParams[] = [];

    // Calculate questions per topic
    const topics = Object.entries(topicDistribution);
    const topicCounts: Record<string, number> = {};

    for (const [topic, weight] of topics) {
      topicCounts[topic] = Math.round(count * weight);
    }

    // Adjust for rounding errors
    const totalAllocated = Object.values(topicCounts).reduce((a, b) => a + b, 0);
    const diff = count - totalAllocated;

    if (diff !== 0) {
      // Add/subtract from largest topic
      const largestTopic = topics.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
      topicCounts[largestTopic] += diff;
    }

    // Generate params for each topic
    for (const [topic, topicCount] of Object.entries(topicCounts)) {
      if (topicCount === 0) continue;

      // Distribute difficulty for this topic
      const easyCount = Math.round(topicCount * difficultyDistribution.easy);
      const hardCount = Math.round(topicCount * difficultyDistribution.hard);
      const mediumCount = topicCount - easyCount - hardCount;

      // For geometry, distribute between regular diagrams and overlapping shapes
      // ~30% overlapping shapes (User Story 1 requirement)
      const isGeometry = topic === 'geometry' && section === 'quantitative';
      const overlappingCount = isGeometry ? Math.max(1, Math.round(topicCount * 0.3)) : 0;
      let overlappingRemaining = overlappingCount;

      // Add easy questions
      for (let i = 0; i < easyCount; i++) {
        // Overlapping shapes at easy difficulty use simpler patterns
        const useOverlapping = isGeometry && overlappingRemaining > 0 && i < Math.ceil(overlappingCount * 0.3);
        const subtopic = useOverlapping ? 'overlapping-shapes' : undefined;
        if (useOverlapping) overlappingRemaining--;

        params.push({
          section,
          track,
          questionType: this.getDefaultQuestionType(section, topic, subtopic),
          topic,
          subtopic,
          difficulty: 'easy',
        });
      }

      // Add medium questions - most overlapping shapes go here
      for (let i = 0; i < mediumCount; i++) {
        const useOverlapping = isGeometry && overlappingRemaining > 0 && i < Math.ceil(overlappingCount * 0.5);
        const subtopic = useOverlapping ? 'overlapping-shapes' : undefined;
        if (useOverlapping) overlappingRemaining--;

        params.push({
          section,
          track,
          questionType: this.getDefaultQuestionType(section, topic, subtopic),
          topic,
          subtopic,
          difficulty: 'medium',
        });
      }

      // Add hard questions - remaining overlapping shapes
      for (let i = 0; i < hardCount; i++) {
        const useOverlapping = isGeometry && overlappingRemaining > 0;
        const subtopic = useOverlapping ? 'overlapping-shapes' : undefined;
        if (useOverlapping) overlappingRemaining--;

        params.push({
          section,
          track,
          questionType: this.getDefaultQuestionType(section, topic, subtopic),
          topic,
          subtopic,
          difficulty: 'hard',
        });
      }
    }

    return params;
  }

  /**
   * Helper: Get default question type for a topic
   */
  private getDefaultQuestionType(
    section: 'quantitative' | 'verbal',
    topic: string,
    subtopic?: string
  ): QuestionGenerationParams['questionType'] {
    if (section === 'quantitative') {
      // Geometry questions: use overlapping-diagram for overlapping-shapes subtopic
      if (topic === 'geometry') {
        return subtopic === 'overlapping-shapes' ? 'overlapping-diagram' : 'diagram';
      }
      // Other quantitative questions are MCQ
      return 'mcq';
    } else {
      // Verbal question types based on topic
      const verbalTypeMap: Record<string, QuestionGenerationParams['questionType']> = {
        reading: 'reading',
        analogy: 'analogy',
        completion: 'completion',
        error: 'error',
        'odd-word': 'odd-word',
      };
      return verbalTypeMap[topic] || 'reading';
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private detectCacheHit(response: Anthropic.Message): boolean {
    // Check if response used cached tokens
    return (response.usage as any).cache_read_input_tokens > 0;
  }

  private estimateCost(
    usage: Anthropic.Message['usage'],
    cacheHit: boolean
  ): number {
    const COST_PER_INPUT_TOKEN = 0.000003; // $3 per million tokens
    const COST_PER_OUTPUT_TOKEN = 0.000015; // $15 per million tokens
    const COST_PER_CACHED_TOKEN = 0.0000003; // 10x cheaper

    const inputCost = cacheHit
      ? usage.input_tokens * COST_PER_CACHED_TOKEN
      : usage.input_tokens * COST_PER_INPUT_TOKEN;

    const outputCost = usage.output_tokens * COST_PER_OUTPUT_TOKEN;

    return inputCost + outputCost;
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry on validation errors or auth errors
    const nonRetryableCodes = ['invalid_request_error', 'authentication_error'];
    return nonRetryableCodes.includes(error?.error?.type);
  }
}
