/**
 * TypeScript types for Claude Sonnet 4.5 batch generation
 */

import type { Question } from '@/types/question'

/**
 * Context stored in database for generation continuity
 * Used for deduplication and resumption
 */
export interface GenerationContext {
  /**
   * IDs of all questions generated so far.
   * Used to instruct Claude to avoid duplicates.
   */
  generatedIds: string[]

  /**
   * Index of the last successfully generated batch (0-indexed).
   * Next batch to generate = lastBatchIndex + 1
   */
  lastBatchIndex: number
}

/**
 * Configuration for a single batch generation request
 */
export interface BatchConfig {
  /** Session ID for this generation */
  sessionId: string

  /** 0-indexed batch number to generate */
  batchIndex: number

  /** Number of questions per batch (default: 10) */
  batchSize: number

  /** Section for this batch */
  section: 'quantitative' | 'verbal'

  /** Student track affects question distribution */
  track: 'scientific' | 'literary'

  /** Categories to include in this batch */
  categories?: string[]
}

/**
 * Usage metrics from Claude API response
 * Used for cost tracking and cache performance monitoring
 */
export interface UsageMetrics {
  /** Total input tokens (uncached) */
  inputTokens: number

  /** Total output tokens */
  outputTokens: number

  /** Tokens read from cache (cost: 0.1x base) */
  cacheReadTokens: number

  /** Tokens written to cache (cost: 1.25x base) */
  cacheCreationTokens: number
}

/**
 * Response from batch generation
 */
export interface BatchResponse {
  /** Generated questions */
  questions: Question[]

  /** Updated generation context */
  updatedContext: GenerationContext

  /** API usage metrics */
  usage: UsageMetrics

  /** Response metadata */
  meta: {
    /** Whether cache was hit (true for batches 2+) */
    cacheHit: boolean
    /** Provider used ('claude' or 'openrouter') */
    provider: 'claude' | 'openrouter'
    /** Generation time in milliseconds */
    durationMs: number
  }
}

/**
 * Content block for Claude system messages with cache control
 */
export interface CachedTextBlock {
  type: 'text'
  text: string
  cache_control: { type: 'ephemeral' }
}

/**
 * Track distribution configuration
 */
export const TRACK_DISTRIBUTION = {
  scientific: {
    quantitative: 57,
    verbal: 39,
  },
  literary: {
    quantitative: 29,
    verbal: 67,
  },
} as const

/**
 * Batch distribution for a 96-question exam
 * Scientific: 6 quant batches + 4 verbal batches = 10 total
 * Literary: 3 quant batches + 7 verbal batches = 10 total
 */
export const BATCH_DISTRIBUTION = {
  scientific: {
    quantitative: 6, // batches 0-5 (57 questions, last batch has 7)
    verbal: 4,       // batches 6-9 (39 questions, last batch has 9)
  },
  literary: {
    quantitative: 3, // batches 0-2 (29 questions, last batch has 9)
    verbal: 7,       // batches 3-9 (67 questions, last batch has 7)
  },
} as const
