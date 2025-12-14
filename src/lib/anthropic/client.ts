/**
 * Claude Sonnet 4.5 client with prompt caching and OpenRouter fallback
 */

import Anthropic from '@anthropic-ai/sdk'
import { serverEnv } from '@/lib/env'
import { callOpenRouter, GenerationPresets } from '@/lib/gemini/client'
import type { Question } from '@/types/question'
import type {
  BatchConfig,
  BatchResponse,
  GenerationContext,
  UsageMetrics,
} from './types'
import { buildSystemBlocks, buildUserPrompt, parseQuestionResponse } from './prompts'

/**
 * Claude model to use for generation
 */
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250514'

/**
 * Maximum tokens for response
 */
const MAX_TOKENS = 8192

/**
 * Temperature for question generation
 * Slightly higher for variety, but not too random
 */
const TEMPERATURE = 0.7

/**
 * Maximum retries before falling back to OpenRouter
 */
const MAX_RETRIES = 3

/**
 * Exponential backoff delays in milliseconds
 */
const BACKOFF_DELAYS = [1000, 2000, 4000]

/**
 * Create Anthropic client instance
 */
export function createAnthropicClient(): Anthropic {
  if (!serverEnv.anthropic.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  return new Anthropic({
    apiKey: serverEnv.anthropic.apiKey,
  })
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return (
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('overloaded') ||
      msg.includes('capacity')
    )
  }
  return false
}

/**
 * Check if error is retryable (network issues, server errors, etc.)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return (
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('500') ||
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('504') ||
      msg.includes('fetch failed') ||
      msg.includes('econnreset') ||
      msg.includes('socket') ||
      msg.includes('overloaded')
    )
  }
  return false
}

/**
 * Delay helper for exponential backoff
 */
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate questions using Claude with prompt caching
 */
async function generateWithClaude(
  config: BatchConfig,
  context: GenerationContext
): Promise<{ questions: Question[]; usage: UsageMetrics }> {
  const client = createAnthropicClient()

  const systemBlocks = buildSystemBlocks()
  const userPrompt = buildUserPrompt(config, context)

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemBlocks,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Extract text content from response
  const textContent = response.content.find((block) => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response')
  }

  // Parse questions from response
  const questions = parseQuestionResponse(textContent.text, config)

  // Build usage metrics
  const usage: UsageMetrics = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
  }

  return { questions, usage }
}

/**
 * Fallback to OpenRouter when Claude is rate-limited
 */
async function generateWithOpenRouter(
  config: BatchConfig,
  context: GenerationContext
): Promise<Question[]> {
  console.log(`[Anthropic] Falling back to OpenRouter for batch ${config.batchIndex}`)

  const sectionName = config.section === 'quantitative' ? 'كمي' : 'لفظي'

  const systemPrompt = `أنت خبير في إعداد أسئلة اختبار القدرات العامة السعودي.
قم بإنشاء أسئلة عالية الجودة تتوافق مع معايير الاختبار الفعلي.
جميع الأسئلة يجب أن تكون باللغة العربية.
أجب بتنسيق JSON فقط.`

  const userPrompt = buildUserPrompt(config, context)

  const text = await callOpenRouter({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    ...GenerationPresets.exam,
  })

  return parseQuestionResponse(text, config)
}

/**
 * Generate a batch of questions with retry and fallback
 */
export async function generateQuestionBatch(
  config: BatchConfig,
  context: GenerationContext
): Promise<BatchResponse> {
  const startTime = Date.now()
  let lastError: Error | null = null
  let usedFallback = false

  // Try Claude with retries
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { questions, usage } = await generateWithClaude(config, context)

      // Log cache performance
      const cacheHit = usage.cacheReadTokens > 0
      console.log(`[Anthropic] Batch ${config.batchIndex}:`, {
        cacheRead: usage.cacheReadTokens,
        cacheWrite: usage.cacheCreationTokens,
        hitRate: usage.cacheReadTokens / (usage.cacheReadTokens + usage.cacheCreationTokens + 0.001),
      })

      // Build updated context
      const updatedContext: GenerationContext = {
        generatedIds: [...context.generatedIds, ...questions.map((q) => q.id)],
        lastBatchIndex: config.batchIndex,
      }

      return {
        questions,
        updatedContext,
        usage,
        meta: {
          cacheHit,
          provider: 'claude',
          durationMs: Date.now() - startTime,
        },
      }
    } catch (error) {
      console.error(`[Anthropic] Attempt ${attempt + 1} failed:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // Only retry on retryable errors
      if (!isRetryableError(error)) {
        break
      }

      // Wait before retry (except for rate limits which we'll handle with fallback)
      if (attempt < MAX_RETRIES - 1 && !isRateLimitError(error)) {
        await delay(BACKOFF_DELAYS[attempt])
      }
    }
  }

  // If rate limited, try OpenRouter fallback
  if (lastError && isRateLimitError(lastError)) {
    try {
      usedFallback = true
      const questions = await generateWithOpenRouter(config, context)

      // Build updated context
      const updatedContext: GenerationContext = {
        generatedIds: [...context.generatedIds, ...questions.map((q) => q.id)],
        lastBatchIndex: config.batchIndex,
      }

      return {
        questions,
        updatedContext,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
        },
        meta: {
          cacheHit: false,
          provider: 'openrouter',
          durationMs: Date.now() - startTime,
        },
      }
    } catch (fallbackError) {
      console.error('[Anthropic] OpenRouter fallback also failed:', fallbackError)
      // Continue to throw the original error
    }
  }

  // All retries and fallback failed
  throw new Error(
    lastError?.message || 'فشل في توليد الأسئلة. الخدمة غير متاحة حالياً.'
  )
}

/**
 * Generate questions with automatic fallback (convenience wrapper)
 */
export async function generateWithFallback(
  config: BatchConfig,
  context: GenerationContext = { generatedIds: [], lastBatchIndex: -1 }
): Promise<BatchResponse> {
  return generateQuestionBatch(config, context)
}
