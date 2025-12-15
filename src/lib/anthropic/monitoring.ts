/**
 * Monitoring utilities for Claude API usage and cache performance
 */

import type { BatchConfig, UsageMetrics } from './types'

/**
 * Claude Sonnet pricing per million tokens (USD)
 * @see https://www.anthropic.com/pricing
 */
const CLAUDE_PRICING = {
  inputPerMillion: 3.0,        // $3 per 1M input tokens
  outputPerMillion: 15.0,      // $15 per 1M output tokens
  cacheWriteMultiplier: 1.25,  // Cache writes cost 25% more
  cacheReadMultiplier: 0.1,    // Cache reads cost 90% less
} as const

/**
 * Cache performance metrics for monitoring
 */
export interface CachePerformanceMetrics {
  sessionId: string
  batchIndex: number
  cacheReadTokens: number
  cacheCreationTokens: number
  hitRate: number
  estimatedCost: number
  estimatedSavings: number
}

/**
 * Calculate cache hit rate from usage metrics
 */
export function calculateCacheHitRate(usage: UsageMetrics): number {
  const totalCacheTokens = usage.cacheReadTokens + usage.cacheCreationTokens
  if (totalCacheTokens === 0) return 0
  return usage.cacheReadTokens / totalCacheTokens
}

/**
 * Calculate estimated cost and savings from usage metrics
 */
export function calculateCostMetrics(usage: UsageMetrics): { cost: number; savings: number } {
  const baseInputCost = (usage.inputTokens / 1_000_000) * CLAUDE_PRICING.inputPerMillion
  const outputCost = (usage.outputTokens / 1_000_000) * CLAUDE_PRICING.outputPerMillion

  // Cache write cost (25% premium)
  const cacheWriteCost = (usage.cacheCreationTokens / 1_000_000) *
    CLAUDE_PRICING.inputPerMillion * CLAUDE_PRICING.cacheWriteMultiplier

  // Cache read cost (90% discount)
  const cacheReadCost = (usage.cacheReadTokens / 1_000_000) *
    CLAUDE_PRICING.inputPerMillion * CLAUDE_PRICING.cacheReadMultiplier

  // What we would have paid without caching
  const hypotheticalCost = ((usage.inputTokens + usage.cacheReadTokens + usage.cacheCreationTokens) / 1_000_000) *
    CLAUDE_PRICING.inputPerMillion + outputCost

  const actualCost = baseInputCost + outputCost + cacheWriteCost + cacheReadCost
  const savings = hypotheticalCost - actualCost

  return { cost: actualCost, savings: Math.max(0, savings) }
}

/**
 * Log comprehensive cache performance metrics
 */
export function logCachePerformance(
  config: BatchConfig,
  usage: UsageMetrics,
  durationMs: number
): void {
  const hitRate = calculateCacheHitRate(usage)
  const { cost, savings } = calculateCostMetrics(usage)

  console.log(`[Claude Cache] Session ${config.sessionId}, Batch ${config.batchIndex}:`, {
    cacheRead: usage.cacheReadTokens,
    cacheWrite: usage.cacheCreationTokens,
    hitRate: `${(hitRate * 100).toFixed(1)}%`,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    estimatedCost: `$${cost.toFixed(4)}`,
    estimatedSavings: `$${savings.toFixed(4)}`,
    latencyMs: durationMs,
  })
}

/**
 * Log usage metrics for cost monitoring
 */
export function logUsageMetrics(
  config: BatchConfig,
  usage: UsageMetrics,
  provider: 'claude' | 'openrouter'
): void {
  const { cost } = calculateCostMetrics(usage)

  console.log(`[Usage Metrics] ${provider.toUpperCase()}:`, {
    sessionId: config.sessionId,
    batchIndex: config.batchIndex,
    section: config.section,
    totalInputTokens: usage.inputTokens + usage.cacheReadTokens + usage.cacheCreationTokens,
    outputTokens: usage.outputTokens,
    estimatedCost: provider === 'claude' ? `$${cost.toFixed(4)}` : 'N/A (OpenRouter pricing varies)',
  })
}

/**
 * Log request timing for latency monitoring
 */
export function logRequestTiming(
  config: BatchConfig,
  phase: 'start' | 'end',
  durationMs?: number,
  attempt?: number
): void {
  if (phase === 'start') {
    console.log(`[Timing] Batch ${config.batchIndex} generation started`, {
      sessionId: config.sessionId,
      section: config.section,
      batchSize: config.batchSize,
      timestamp: new Date().toISOString(),
    })
  } else {
    console.log(`[Timing] Batch ${config.batchIndex} generation completed`, {
      sessionId: config.sessionId,
      durationMs,
      attemptsUsed: attempt,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Log provider switch event
 */
export function logProviderSwitch(
  config: BatchConfig,
  reason: string
): void {
  console.log(`[Provider Switch] Falling back to OpenRouter for batch ${config.batchIndex}`, {
    sessionId: config.sessionId,
    reason,
    timestamp: new Date().toISOString(),
  })
}
