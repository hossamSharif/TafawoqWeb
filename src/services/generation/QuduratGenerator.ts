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
