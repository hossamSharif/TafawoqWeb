/**
 * Claude API Contracts
 * Feature: GAT Exam Platform v3.0
 *
 * Type definitions for Claude API requests and responses
 * Based on @anthropic-ai/sdk
 *
 * This file documents how we use Claude API for question generation:
 * - System prompt with Skills modules
 * - Prompt caching for cost optimization
 * - Structured JSON output parsing
 * - Error handling and retry logic
 */

import Anthropic from '@anthropic-ai/sdk';
import { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages';

// ============================================================================
// Claude API Configuration
// ============================================================================

export interface ClaudeConfig {
  apiKey: string;  // From environment: ANTHROPIC_API_KEY
  model: string;  // Default: "claude-sonnet-4-20250514"
  maxTokens: number;  // Default: 8000
  temperature: number;  // Default: 1.0 (full creativity)
  enableCaching: boolean;  // Default: true
}

export const DEFAULT_CLAUDE_CONFIG: Omit<ClaudeConfig, 'apiKey'> = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8000,
  temperature: 1.0,
  enableCaching: true,
};

// ============================================================================
// System Prompt Structure (with Caching)
// ============================================================================

/**
 * System prompt format for Claude API
 * Uses cache_control to enable prompt caching (75% cost reduction)
 */
export interface SystemPromptWithCache {
  type: 'text';
  text: string;  // Combined Skills modules (~15,000 tokens)
  cache_control: {
    type: 'ephemeral';  // 5-minute TTL
  };
}

/**
 * Build system prompt with cache control
 */
export function buildCachedSystemPrompt(skillsContent: string): SystemPromptWithCache {
  return {
    type: 'text',
    text: skillsContent,
    cache_control: {
      type: 'ephemeral',
    },
  };
}

// ============================================================================
// Message Request Structure
// ============================================================================

/**
 * Claude API message request for question generation
 *
 * Example usage:
 * ```typescript
 * const request = buildGenerationRequest(systemPrompt, userPrompt, config);
 * const response = await anthropic.messages.create(request);
 * ```
 */
export interface QuestionGenerationRequest extends MessageCreateParamsNonStreaming {
  model: string;
  max_tokens: number;
  system: SystemPromptWithCache[];  // Array with single cached prompt
  messages: Array<{
    role: 'user';
    content: string;  // User prompt with batch parameters
  }>;
  temperature?: number;
}

export function buildGenerationRequest(
  systemPrompt: string,
  userPrompt: string,
  config: ClaudeConfig
): QuestionGenerationRequest {
  return {
    model: config.model,
    max_tokens: config.maxTokens,
    system: config.enableCaching
      ? [buildCachedSystemPrompt(systemPrompt)]
      : [{ type: 'text', text: systemPrompt }],
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    temperature: config.temperature,
  };
}

// ============================================================================
// User Prompt Template
// ============================================================================

/**
 * Template for user prompt sent to Claude API
 * Skills modules are in system prompt (cached)
 * User prompt specifies batch parameters (not cached)
 */
export interface UserPromptParams {
  batchSize: number;
  section: 'quantitative' | 'verbal';
  track: 'scientific' | 'literary';
  batchNumber?: number;
  totalBatches?: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  diagramCount?: number;
  topicFocus?: string[];
}

export function buildUserPrompt(params: UserPromptParams): string {
  const {
    batchSize,
    section,
    track,
    batchNumber,
    totalBatches,
    difficulty,
    diagramCount = 0,
    topicFocus,
  } = params;

  const difficultyInstructions =
    difficulty === 'mixed'
      ? '30% easy, 50% medium, 20% hard'
      : `All ${difficulty} difficulty`;

  const batchInfo =
    batchNumber && totalBatches
      ? `This is batch ${batchNumber} of ${totalBatches}.`
      : '';

  const topicFocusInfo = topicFocus
    ? `Focus on these topics: ${topicFocus.join(', ')}.`
    : '';

  return `
Generate ${batchSize} questions for GAT (Qudurat) exam preparation.

**Exam Configuration:**
- Section: ${section}
- Track: ${track}
- Difficulty Distribution: ${difficultyInstructions}
${batchInfo}

**Requirements:**
- Include ${diagramCount} questions with diagrams (geometry or statistics)
- All text in formal Arabic (فصحى)
- Follow topic distribution from Skills
- Ensure mental calculation only (no calculator needed)
- Generate realistic distractors based on common errors
${topicFocusInfo}

**Output Format:**
Return a valid JSON array of questions following the qudurat-schema format.
Each question MUST include all required fields.
Do NOT include any text before or after the JSON array.

Example structure:
\`\`\`json
[
  {
    "id": "uuid-v4",
    "version": "3.0",
    "section": "${section}",
    "track": "${track}",
    "questionType": "mcq",
    "topic": "geometry",
    "subtopic": "circles",
    "difficulty": "medium",
    "questionText": "ما مساحة الدائرة التي نصف قطرها 7 سم؟",
    "choices": ["154 سم²", "49 سم²", "14π سم²", "98 سم²"],
    "correctAnswer": "154 سم²",
    "explanation": "مساحة الدائرة = π × نق² = 3.14 × 7² = 3.14 × 49 = 153.86 ≈ 154 سم²",
    "generationMetadata": {
      "model": "${DEFAULT_CLAUDE_CONFIG.model}",
      "batchId": "batch-uuid",
      "cacheHit": false,
      "generatedAt": "ISO-8601-timestamp"
    },
    "qualityFlags": []
  }
]
\`\`\`

Generate ${batchSize} complete questions now.
`.trim();
}

// ============================================================================
// Response Structure
// ============================================================================

/**
 * Claude API response structure
 * We use the Message type from @anthropic-ai/sdk
 */
export type ClaudeResponse = Anthropic.Messages.Message;

/**
 * Extract text content from Claude response
 */
export function extractTextContent(response: ClaudeResponse): string {
  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  throw new Error('Unexpected response content type');
}

/**
 * Check if response used cached prompt
 */
export function wasCacheHit(response: ClaudeResponse): boolean {
  // Check usage metadata for cache information
  const usage = response.usage as any;
  return usage?.cache_read_input_tokens > 0;
}

/**
 * Calculate cost from usage
 */
export function calculateCost(response: ClaudeResponse): number {
  const usage = response.usage as any;

  // Claude Sonnet 4 pricing (as of 2025)
  const INPUT_COST_PER_1K = 0.003;  // $3 per million tokens
  const OUTPUT_COST_PER_1K = 0.015;  // $15 per million tokens
  const CACHE_HIT_COST_PER_1K = 0.0003;  // 90% discount

  const inputTokens = usage.input_tokens || 0;
  const cacheReadTokens = usage.cache_read_input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;

  const newInputCost = ((inputTokens - cacheReadTokens) / 1000) * INPUT_COST_PER_1K;
  const cachedInputCost = (cacheReadTokens / 1000) * CACHE_HIT_COST_PER_1K;
  const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K;

  return newInputCost + cachedInputCost + outputCost;
}

// ============================================================================
// Error Response Handling
// ============================================================================

/**
 * Claude API error types
 */
export type ClaudeErrorType =
  | 'invalid_request_error'
  | 'authentication_error'
  | 'permission_error'
  | 'not_found_error'
  | 'rate_limit_error'
  | 'api_error'
  | 'overloaded_error';

/**
 * Determine if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const retryableTypes: ClaudeErrorType[] = [
    'rate_limit_error',
    'api_error',
    'overloaded_error',
  ];

  const errorType = error?.error?.type as ClaudeErrorType;
  return retryableTypes.includes(errorType);
}

/**
 * Get retry delay from rate limit error
 */
export function getRetryDelay(error: any): number {
  // Check for Retry-After header
  const retryAfter = error?.response?.headers?.['retry-after'];
  if (retryAfter) {
    return parseInt(retryAfter, 10) * 1000;  // Convert to ms
  }

  // Default exponential backoff
  return 1000;  // 1 second base delay
}

// ============================================================================
// Prompt Caching Strategy
// ============================================================================

/**
 * Cache TTL and constraints
 */
export const PROMPT_CACHE_CONFIG = {
  TTL_MINUTES: 5,  // Claude API cache TTL
  MIN_TOKENS_FOR_CACHE: 1024,  // Minimum tokens to benefit from caching
  EXPECTED_SYSTEM_PROMPT_TOKENS: 15000,  // Our Skills modules size
  SAVINGS_PER_CACHE_HIT: 0.90,  // 90% cost reduction
} as const;

/**
 * Calculate expected cost savings with caching
 */
export function calculateCacheSavings(totalBatches: number): {
  withoutCache: number;
  withCache: number;
  savings: number;
  savingsPercent: number;
} {
  const INPUT_COST_PER_1K = 0.003;
  const systemPromptTokens = PROMPT_CACHE_CONFIG.EXPECTED_SYSTEM_PROMPT_TOKENS;

  // Without caching: full cost for every batch
  const withoutCache = totalBatches * (systemPromptTokens / 1000) * INPUT_COST_PER_1K;

  // With caching: full cost for first batch, 10% cost for remaining batches
  const firstBatchCost = (systemPromptTokens / 1000) * INPUT_COST_PER_1K;
  const cachedBatchCost = firstBatchCost * 0.1;
  const withCache = firstBatchCost + (totalBatches - 1) * cachedBatchCost;

  const savings = withoutCache - withCache;
  const savingsPercent = (savings / withoutCache) * 100;

  return {
    withoutCache,
    withCache,
    savings,
    savingsPercent,
  };
}

// ============================================================================
// Usage Tracking
// ============================================================================

export interface UsageMetrics {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export function extractUsageMetrics(response: ClaudeResponse): UsageMetrics {
  const usage = response.usage as any;
  return {
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    cacheReadTokens: usage.cache_read_input_tokens || 0,
    cacheCreationTokens: usage.cache_creation_input_tokens || 0,
  };
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example: Generate questions with Claude API
 *
 * ```typescript
 * import Anthropic from '@anthropic-ai/sdk';
 * import { buildGenerationRequest, buildUserPrompt, extractTextContent } from './claude-api-contracts';
 *
 * const anthropic = new Anthropic({
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 * });
 *
 * const skillsContent = await skillLoader.buildSystemPrompt('quant-only');
 * const userPrompt = buildUserPrompt({
 *   batchSize: 20,
 *   section: 'quantitative',
 *   track: 'scientific',
 *   difficulty: 'mixed',
 *   diagramCount: 3,
 * });
 *
 * const request = buildGenerationRequest(skillsContent, userPrompt, {
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 *   model: 'claude-sonnet-4-20250514',
 *   maxTokens: 8000,
 *   temperature: 1.0,
 *   enableCaching: true,
 * });
 *
 * const response = await anthropic.messages.create(request);
 * const jsonText = extractTextContent(response);
 * const questions = JSON.parse(jsonText);
 * const cost = calculateCost(response);
 * const cacheHit = wasCacheHit(response);
 *
 * console.log(`Generated ${questions.length} questions`);
 * console.log(`Cost: $${cost.toFixed(4)}`);
 * console.log(`Cache hit: ${cacheHit}`);
 * ```
 */
