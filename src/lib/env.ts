/**
 * Type-safe environment variable access
 * This file provides runtime validation of environment variables
 */

// Server-only environment variables (never exposed to client)
const serverEnvSchema = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  // Batch generation configuration
  EXAM_BATCH_SIZE: process.env.EXAM_BATCH_SIZE,
  PRACTICE_BATCH_SIZE: process.env.PRACTICE_BATCH_SIZE,
  PREFETCH_THRESHOLD: process.env.PREFETCH_THRESHOLD,
}

// Client-safe environment variables (NEXT_PUBLIC_ prefix)
const clientEnvSchema = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}

/**
 * Server-side environment variables
 * Only use these in server components, API routes, or server actions
 */
export const serverEnv = {
  supabase: {
    serviceRoleKey: serverEnvSchema.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  stripe: {
    secretKey: serverEnvSchema.STRIPE_SECRET_KEY || '',
    webhookSecret: serverEnvSchema.STRIPE_WEBHOOK_SECRET || '',
    premiumPriceId: serverEnvSchema.STRIPE_PREMIUM_PRICE_ID || '',
  },
  gemini: {
    apiKey: serverEnvSchema.GEMINI_API_KEY || '',
  },
  openrouter: {
    apiKey: serverEnvSchema.OPENROUTER_API_KEY || '',
  },
  anthropic: {
    apiKey: serverEnvSchema.ANTHROPIC_API_KEY || '',
  },
  sentry: {
    authToken: serverEnvSchema.SENTRY_AUTH_TOKEN || '',
  },
  batchGeneration: {
    examBatchSize: parseInt(serverEnvSchema.EXAM_BATCH_SIZE || '10', 10),
    practiceBatchSize: parseInt(serverEnvSchema.PRACTICE_BATCH_SIZE || '5', 10),
    prefetchThreshold: parseFloat(serverEnvSchema.PREFETCH_THRESHOLD || '0.7'),
  },
}

/**
 * Client-safe environment variables
 * Safe to use in any component (server or client)
 */
export const clientEnv = {
  supabase: {
    url: clientEnvSchema.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: clientEnvSchema.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  stripe: {
    publishableKey: clientEnvSchema.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
  sentry: {
    dsn: clientEnvSchema.NEXT_PUBLIC_SENTRY_DSN || '',
  },
  app: {
    url: clientEnvSchema.NEXT_PUBLIC_APP_URL,
  },
}

/**
 * Validate that required environment variables are set
 * Call this in development to catch missing env vars early
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  // Required server variables
  const requiredServer = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'OPENROUTER_API_KEY',
  ]

  // Required client variables
  const requiredClient = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  ]

  for (const key of requiredServer) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  for (const key of requiredClient) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Check if we're in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Check if we're in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production'
