/**
 * Rate limiting utilities
 * Purpose: Prevent API abuse and spam
 *
 * NOTE: This is an in-memory implementation suitable for development
 * and low-to-medium traffic. For production scale (>1000 req/min),
 * consider migrating to Redis/Upstash for distributed rate limiting.
 */

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

interface RateLimitStore {
  count: number
  resetAt: number
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitStore>()

// Cleanup old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000) // 5 minutes
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the rate limit (e.g., "forum_post:user_id")
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and remaining count
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const store = rateLimitStore.get(identifier)

  // New window or expired window
  if (!store || store.resetAt < now) {
    const newStore: RateLimitStore = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    rateLimitStore.set(identifier, newStore)

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newStore.resetAt,
    }
  }

  // Check if limit exceeded
  if (store.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: store.resetAt,
    }
  }

  // Increment count
  store.count++

  return {
    allowed: true,
    remaining: config.maxRequests - store.count,
    resetAt: store.resetAt,
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // General forum post creation (text posts)
  FORUM_POST_CREATE: {
    maxRequests: 10, // 10 posts per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'لقد تجاوزت الحد الأقصى لإنشاء المنشورات. يرجى المحاولة لاحقاً.',
  },

  // Exam/practice sharing (more restrictive due to credit cost)
  FORUM_SHARE_CREATE: {
    maxRequests: 5, // 5 shares per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'لقد تجاوزت الحد الأقصى لمشاركة الاختبارات. يرجى المحاولة لاحقاً.',
  },

  // Starting shared exams (prevent spam)
  FORUM_START_EXAM: {
    maxRequests: 20, // 20 exam starts per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'لقد تجاوزت الحد الأقصى لبدء الاختبارات. يرجى المحاولة لاحقاً.',
  },

  // Contact form submission (prevent spam)
  CONTACT_FORM: {
    maxRequests: 3, // 3 submissions per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'لقد تجاوزت الحد الأقصى لإرسال الرسائل. يرجى المحاولة لاحقاً.',
  },
} as const

/**
 * Clear rate limit for a specific identifier (useful for testing)
 * @param identifier - The identifier to clear
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}

/**
 * Get current rate limit status without incrementing
 * @param identifier - The identifier to check
 * @returns Current rate limit info or null if not found
 */
export function getRateLimitStatus(identifier: string): {
  count: number
  resetAt: number
} | null {
  const store = rateLimitStore.get(identifier)
  if (!store || store.resetAt < Date.now()) {
    return null
  }
  return { count: store.count, resetAt: store.resetAt }
}
