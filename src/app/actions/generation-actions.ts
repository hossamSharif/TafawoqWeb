/**
 * generation-actions.ts
 * Next.js Server Actions for AI question generation
 *
 * These actions run server-side only and handle:
 * - Full exam generation (120 questions in 6 batches)
 * - Batch generation with progress tracking
 * - Question generation with retry logic
 * - Integration with Supabase for persistence
 *
 * @see specs/1-gat-exam-v3/contracts/server-actions.ts
 * @see User Story 6 (T087) - Batch generation efficiency
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { QuduratGenerator, type GenerationConfig } from '@/services/generation/QuduratGenerator';
import type { QuestionGenerationParams } from '@/services/generation/PromptBuilder';
import type { QuestionData } from '@/services/generation/QuestionValidator';

/**
 * Exam configuration for full exam generation
 */
export interface ExamConfiguration {
  /** Exam configuration ID (from exam_configs table) */
  configId?: string;
  /** Exam name/description */
  name: string;
  /** Academic track */
  track: 'scientific' | 'literary';
  /** Section split (quantitative and verbal) */
  sectionSplit: {
    quantitative: number;
    verbal: number;
  };
  /** Topic distribution for each section */
  topicDistribution: {
    quantitative: Record<string, number>;
    verbal: Record<string, number>;
  };
  /** Difficulty distribution */
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  /** Questions per batch (default: 20) */
  batchSize?: number;
}

/**
 * Progress update for exam generation
 */
export interface ExamGenerationProgress {
  /** Current batch number (1-indexed) */
  currentBatch: number;
  /** Total number of batches */
  totalBatches: number;
  /** Questions generated so far */
  questionsGenerated: number;
  /** Target total questions */
  targetQuestions: number;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
  /** Estimated cost so far */
  estimatedCostSoFar: number;
  /** Status message */
  status: string;
}

/**
 * Result of full exam generation
 */
export interface ExamGenerationResult {
  /** Whether generation succeeded */
  success: boolean;
  /** Generated questions (if successful) */
  questions?: QuestionData[];
  /** Error message (if failed) */
  error?: string;
  /** Generation statistics */
  stats?: {
    totalQuestions: number;
    totalCost: number;
    cacheHitRate: number;
    totalDuration: number;
    averageCostPerQuestion: number;
  };
}

/**
 * Generate a full exam (120 questions) in 6 sequential batches
 * Uses prompt caching for 70%+ cost reduction (User Story 6)
 *
 * @param config - Exam configuration
 * @param onProgress - Optional progress callback (for real-time updates)
 * @returns Exam generation result
 */
export async function generateFullExamAction(
  config: ExamConfiguration,
  onProgress?: (progress: ExamGenerationProgress) => void
): Promise<ExamGenerationResult> {
  const startTime = Date.now();

  try {
    // Initialize Supabase client
    const supabase = await createServerClient();

    // Verify user is authenticated and authorized (admin only)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: User must be authenticated',
      };
    }

    // TODO: Add admin role check
    // For now, allow all authenticated users
    // In production, add: const isAdmin = await checkUserIsAdmin(user.id);

    // Initialize generator
    const generatorConfig: GenerationConfig = {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 8000,
      temperature: 1.0,
      enableCaching: true,
      maxRetries: 3,
      retryDelays: [1000, 2000, 4000],
    };

    const generator = new QuduratGenerator(generatorConfig);

    console.log(`Starting exam generation for: ${config.name}`);
    console.log(`Track: ${config.track}`);
    console.log(
      `Sections: ${config.sectionSplit.quantitative} quantitative, ${config.sectionSplit.verbal} verbal`
    );

    // Generate exam with progress tracking
    const result = await generator.generateFullExamSequential(
      {
        track: config.track,
        sectionSplit: config.sectionSplit,
        topicDistribution: config.topicDistribution,
        difficultyDistribution: config.difficultyDistribution,
        batchSize: config.batchSize || 20,
      },
      (progress) => {
        // Report progress
        const status = `Generating batch ${progress.currentBatch}/${progress.totalBatches}...`;
        console.log(status);

        if (onProgress) {
          onProgress({
            ...progress,
            status,
          });
        }
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Exam generation failed',
      };
    }

    // Save questions to database
    const insertResults = await Promise.allSettled(
      result.questions.map(async (question) => {
        const { error } = await supabase.from('questions').insert({
          version: '3.0',
          section: question.section,
          track: question.track,
          question_type: question.question_type,
          topic: question.topic,
          subtopic: question.subtopic,
          difficulty: question.difficulty,
          question_text: question.question_text,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          choices: question.choices || null,
          comparison_values: question.comparison_values || null,
          shape_type: question.shape_type || null,
          pattern_id: question.pattern_id || null,
          diagram_config: question.diagram_config || null,
          relationship_type: question.relationship_type || null,
          generation_metadata: question.generation_metadata || {},
          quality_flags: question.quality_flags || [],
        });

        if (error) {
          console.error('Failed to insert question:', error);
          throw error;
        }
      })
    );

    // Count successful insertions
    const successfulInsertions = insertResults.filter((r) => r.status === 'fulfilled').length;
    const failedInsertions = insertResults.filter((r) => r.status === 'rejected').length;

    console.log(`Saved ${successfulInsertions}/${result.questions.length} questions to database`);

    if (failedInsertions > 0) {
      console.warn(`Warning: ${failedInsertions} questions failed to save`);
    }

    // Calculate final statistics
    const totalDuration = Date.now() - startTime;
    const totalQuestions = result.questions.length;
    const totalCost = result.metadata.estimatedCost;
    const cacheMetrics = generator.getCacheMetrics();

    const stats = {
      totalQuestions,
      totalCost,
      cacheHitRate: cacheMetrics.hitRate,
      totalDuration,
      averageCostPerQuestion: totalCost / totalQuestions,
    };

    console.log(`\n=== Exam Generation Summary ===`);
    console.log(`Total questions: ${totalQuestions}`);
    console.log(`Total cost: $${totalCost.toFixed(4)}`);
    console.log(`Cache hit rate: ${(cacheMetrics.hitRate * 100).toFixed(1)}%`);
    console.log(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`Average cost per question: $${stats.averageCostPerQuestion.toFixed(4)}`);

    return {
      success: true,
      questions: result.questions,
      stats,
    };
  } catch (error) {
    console.error('Exam generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate a single batch of questions (20 questions)
 * Useful for testing or smaller practice sets
 *
 * @param params - Generation parameters
 * @returns Batch generation result
 */
export async function generateQuestionBatchAction(
  params: QuestionGenerationParams & { count?: number }
): Promise<ExamGenerationResult> {
  const startTime = Date.now();

  try {
    // Initialize Supabase client
    const supabase = await createServerClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: User must be authenticated',
      };
    }

    // Initialize generator
    const generator = new QuduratGenerator({
      enableCaching: true,
      maxRetries: 3,
    });

    const count = params.count || 20;

    // Generate batch
    const paramsArray = Array(count).fill(params);
    const result = await generator.generateBatch(paramsArray);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Batch generation failed',
      };
    }

    // Save to database
    const insertResults = await Promise.allSettled(
      result.questions.map(async (question) => {
        const { error } = await supabase.from('questions').insert({
          version: '3.0',
          section: question.section,
          track: question.track,
          question_type: question.question_type,
          topic: question.topic,
          subtopic: question.subtopic,
          difficulty: question.difficulty,
          question_text: question.question_text,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          choices: question.choices || null,
          comparison_values: question.comparison_values || null,
          shape_type: question.shape_type || null,
          pattern_id: question.pattern_id || null,
          diagram_config: question.diagram_config || null,
          relationship_type: question.relationship_type || null,
          generation_metadata: question.generation_metadata || {},
          quality_flags: question.quality_flags || [],
        });

        if (error) throw error;
      })
    );

    const successfulInsertions = insertResults.filter((r) => r.status === 'fulfilled').length;

    const totalDuration = Date.now() - startTime;
    const totalCost = result.metadata.estimatedCost;

    const stats = {
      totalQuestions: result.questions.length,
      totalCost,
      cacheHitRate: result.metadata.cacheHit ? 1 : 0,
      totalDuration,
      averageCostPerQuestion: totalCost / result.questions.length,
    };

    console.log(`Generated ${successfulInsertions} questions in ${(totalDuration / 1000).toFixed(1)}s`);

    return {
      success: true,
      questions: result.questions,
      stats,
    };
  } catch (error) {
    console.error('Batch generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get exam configuration by ID
 *
 * @param configId - Exam configuration UUID
 * @returns Exam configuration or null
 */
export async function getExamConfigAction(configId: string): Promise<ExamConfiguration | null> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('exam_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (error || !data) {
      console.error('Failed to fetch exam config:', error);
      return null;
    }

    return {
      configId: data.id,
      name: data.name,
      track: data.track,
      sectionSplit: data.section_split,
      topicDistribution: data.topic_distribution,
      difficultyDistribution: data.difficulty_distribution,
      batchSize: data.batch_size,
    };
  } catch (error) {
    console.error('Error fetching exam config:', error);
    return null;
  }
}

/**
 * List all exam configurations
 *
 * @returns Array of exam configurations
 */
export async function listExamConfigsAction(): Promise<ExamConfiguration[]> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('exam_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch exam configs:', error);
      return [];
    }

    return (
      data?.map((config: any) => ({
        configId: config.id,
        name: config.name,
        track: config.track,
        sectionSplit: config.section_split,
        topicDistribution: config.topic_distribution,
        difficultyDistribution: config.difficulty_distribution,
        batchSize: config.batch_size,
      })) || []
    );
  } catch (error) {
    console.error('Error fetching exam configs:', error);
    return [];
  }
}
