import { serverEnv } from '@/lib/env'

/**
 * OpenRouter API client with automatic model fallback
 * Switches between free-tier models when quota is exhausted
 */

// Free models in priority order (verified working on OpenRouter)
export const FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.2-1b-instruct:free',
  'huggingfaceh4/zephyr-7b-beta:free',
  'openchat/openchat-7b:free',
] as const

export type FreeModel = (typeof FREE_MODELS)[number]

// Track current model index (persists across requests in memory)
let currentModelIndex = 0
let lastResetTime = Date.now()
const RESET_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Reset model index to primary model (called periodically or manually)
 */
export function resetModelIndex(): void {
  currentModelIndex = 0
  lastResetTime = Date.now()
  console.log('[OpenRouter] Reset to primary model:', FREE_MODELS[0])
}

/**
 * Get the currently active model
 */
export function getCurrentModel(): FreeModel {
  // Auto-reset after 24 hours
  if (Date.now() - lastResetTime > RESET_INTERVAL) {
    resetModelIndex()
  }
  return FREE_MODELS[currentModelIndex] || FREE_MODELS[0]
}

/**
 * OpenRouter API configuration
 */
export interface OpenRouterConfig {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  temperature?: number
  maxTokens?: number
  topP?: number
}

/**
 * OpenRouter API response structure
 */
interface OpenRouterResponse {
  id: string
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: {
    message: string
    code?: string | number
  }
}

/**
 * Custom error class for OpenRouter API errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRateLimited: boolean = false
  ) {
    super(message)
    this.name = 'OpenRouterError'
  }
}

/**
 * Check if error indicates rate limiting or quota exhaustion
 */
function isRateLimitError(error: unknown, statusCode?: number): boolean {
  if (statusCode === 429) return true

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return (
      msg.includes('rate limit') ||
      msg.includes('quota') ||
      msg.includes('429') ||
      msg.includes('too many requests') ||
      msg.includes('exceeded') ||
      msg.includes('limit reached')
    )
  }
  return false
}

/**
 * Check if error is retryable (network issues, server errors)
 */
function isRetryableError(error: unknown, statusCode?: number): boolean {
  if (statusCode && statusCode >= 500 && statusCode < 600) return true

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return (
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('fetch failed') ||
      msg.includes('econnreset') ||
      msg.includes('socket')
    )
  }
  return false
}

/**
 * Exponential backoff delay
 */
async function delay(attempt: number): Promise<void> {
  const baseDelay = 1000
  const maxDelay = 10000
  const delayMs = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  await new Promise(resolve => setTimeout(resolve, delayMs))
}

/**
 * Call OpenRouter API with automatic model fallback
 */
export async function callOpenRouter(config: OpenRouterConfig): Promise<string> {
  const { messages, temperature = 0.7, maxTokens = 8192, topP = 0.95 } = config

  // Auto-reset after 24 hours
  if (Date.now() - lastResetTime > RESET_INTERVAL) {
    resetModelIndex()
  }

  const startIndex = currentModelIndex

  // Try each model starting from current index
  for (let i = startIndex; i < FREE_MODELS.length; i++) {
    const model = FREE_MODELS[i]
    const maxRetries = 2

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[OpenRouter] Calling model: ${model} (attempt ${attempt + 1})`)

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serverEnv.openrouter.apiKey}`,
            'HTTP-Referer': 'https://tafawoq.com',
            'X-Title': 'Tafawoq Exam Platform',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            top_p: topP,
          }),
        })

        // Handle rate limiting - switch to next model
        if (response.status === 429) {
          console.warn(`[OpenRouter] Rate limited on ${model}, switching to next model`)
          currentModelIndex = i + 1
          break // Exit retry loop, try next model
        }

        // Handle server errors with retry
        if (response.status >= 500) {
          if (attempt < maxRetries) {
            console.warn(`[OpenRouter] Server error ${response.status}, retrying...`)
            await delay(attempt)
            continue
          }
          // After retries, try next model
          console.warn(`[OpenRouter] Server errors on ${model}, switching to next model`)
          currentModelIndex = i + 1
          break
        }

        // Handle other errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error?.message || `HTTP ${response.status}`

          if (isRateLimitError(new Error(errorMessage), response.status)) {
            console.warn(`[OpenRouter] Quota exhausted on ${model}, switching to next model`)
            currentModelIndex = i + 1
            break
          }

          // Handle invalid model errors (400) - try next model
          if (response.status === 400 && errorMessage.toLowerCase().includes('not a valid model')) {
            console.warn(`[OpenRouter] Invalid model ${model}, switching to next model`)
            currentModelIndex = i + 1
            break
          }

          // Handle model not found errors (404) - try next model
          if (response.status === 404) {
            console.warn(`[OpenRouter] Model not found ${model}, switching to next model`)
            currentModelIndex = i + 1
            break
          }

          throw new OpenRouterError(errorMessage, response.status)
        }

        // Success - parse response
        const data: OpenRouterResponse = await response.json()

        if (data.error) {
          if (isRateLimitError(new Error(data.error.message))) {
            console.warn(`[OpenRouter] API error (rate limit) on ${model}, switching to next model`)
            currentModelIndex = i + 1
            break
          }
          throw new OpenRouterError(data.error.message, 400)
        }

        const content = data.choices?.[0]?.message?.content
        if (!content) {
          throw new OpenRouterError('Empty response from API', 500)
        }

        console.log(`[OpenRouter] Success with model: ${model}`)
        return content

      } catch (error) {
        console.error(`[OpenRouter] Error with ${model}:`, error)

        // Rate limit errors - switch model immediately
        if (isRateLimitError(error)) {
          currentModelIndex = i + 1
          break
        }

        // Retryable errors - retry then switch model
        if (isRetryableError(error) && attempt < maxRetries) {
          await delay(attempt)
          continue
        }

        // Non-retryable errors on last retry - switch model
        if (attempt >= maxRetries) {
          currentModelIndex = i + 1
          break
        }

        // Non-retryable, non-rate-limit error - throw
        throw error
      }
    }
  }

  // All models exhausted
  throw new OpenRouterError(
    'جميع النماذج المجانية استنفدت حصتها. يرجى المحاولة لاحقاً.',
    503,
    true
  )
}

/**
 * Generation config presets for different use cases
 */
export const GenerationPresets = {
  // For regular question generation
  questions: {
    temperature: 0.7,
    maxTokens: 8192,
    topP: 0.95,
  },
  // For exam batch generation (~20 questions per batch)
  exam: {
    temperature: 0.8,
    maxTokens: 12000,
    topP: 0.95,
  },
  // For analysis and feedback
  analysis: {
    temperature: 0.3,
    maxTokens: 4096,
    topP: 0.9,
  },
} as const

/**
 * Generate content using the question generation preset
 */
export async function generateWithPreset(
  preset: keyof typeof GenerationPresets,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const config = GenerationPresets[preset]

  return callOpenRouter({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    ...config,
  })
}
