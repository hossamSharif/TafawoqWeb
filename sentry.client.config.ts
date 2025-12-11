import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay for debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',

  // Filter out known non-critical errors
  beforeSend(event) {
    // Don't send errors for cancelled requests
    if (event.exception?.values?.[0]?.value?.includes('AbortError')) {
      return null
    }

    // Don't send network errors that are expected
    if (event.exception?.values?.[0]?.value?.includes('NetworkError')) {
      return null
    }

    return event
  },

  // Environment tag
  environment: process.env.NODE_ENV,

  // Release version (set during build)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and inputs by default for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
