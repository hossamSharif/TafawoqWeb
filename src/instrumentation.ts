import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enabled: process.env.NODE_ENV === 'production',
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    })

    // Validate API keys on startup
    const { logAPIKeyStatus } = await import('./lib/api-key-validator')
    logAPIKeyStatus()
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enabled: process.env.NODE_ENV === 'production',
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    })
  }
}
