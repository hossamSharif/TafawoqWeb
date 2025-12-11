import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production
  silent: process.env.NODE_ENV !== 'production',

  // Upload source maps for better stack traces
  widenClientFileUpload: true,

  // Hide source maps from clients
  hideSourceMaps: true,

  // Disable telemetry
  disableLogger: true,

  // Automatically instrument API routes
  automaticVercelMonitors: true,
})
