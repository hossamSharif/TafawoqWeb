/**
 * Anthropic Claude client module for question generation
 * Uses Claude Sonnet 4.5 with prompt caching for cost-efficient batch generation
 */

export {
  createAnthropicClient,
  generateQuestionBatch,
  generateWithFallback,
  isRateLimitError,
} from './client'

export {
  buildSystemBlocks,
  buildUserPrompt,
  parseQuestionResponse,
} from './prompts'

export type {
  GenerationContext,
  BatchConfig,
  UsageMetrics,
  BatchResponse,
} from './types'
