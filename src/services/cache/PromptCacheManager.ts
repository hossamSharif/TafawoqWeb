/**
 * PromptCacheManager.ts
 * Manages Claude API prompt caching for cost optimization
 *
 * Features:
 * - Ephemeral caching with 5-minute TTL
 * - Cache control configuration for system prompts
 * - ~70-75% cost reduction for batch generation
 * - Cache hit tracking and metrics
 *
 * Cost Savings:
 * - Without caching: ~$0.015 per question (full tokens)
 * - With caching: ~$0.004 per question (cache hits)
 * - Reduction: 73% for batches within 5-minute window
 *
 * @see specs/1-gat-exam-v3/plan.md - Prompt Caching Strategy
 * @see User Story 6 (FR-009, SC-006, SC-007) - Batch efficiency
 */

import type { MessageCreateParams } from '@anthropic-ai/sdk/resources/messages';

export interface CacheConfig {
  /** Whether to enable caching for this request */
  enabled: boolean;
  /** Which message blocks to cache (typically system prompts) */
  cacheBlocks: CacheBlock[];
  /** Estimated token count for cache validation */
  estimatedTokens: number;
}

export interface CacheBlock {
  /** Block type: 'system' or 'user' */
  type: 'system' | 'user';
  /** Content to cache */
  content: string;
  /** Whether to apply cache control */
  enableCache: boolean;
}

export interface CacheMetrics {
  /** Total API calls made */
  totalCalls: number;
  /** Calls that hit the cache */
  cacheHits: number;
  /** Calls that missed the cache */
  cacheMisses: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
  /** Estimated cost savings */
  costSavings: number;
}

export class PromptCacheManager {
  // Claude API caching constants
  private static readonly MIN_CACHEABLE_TOKENS = 1024; // Minimum tokens for caching
  private static readonly CACHE_TTL_MINUTES = 5; // Ephemeral cache TTL
  private static readonly COST_PER_TOKEN = 0.000003; // Approximate cost per token (Sonnet)
  private static readonly COST_PER_CACHED_TOKEN = 0.0000003; // 10x cheaper for cache hits

  private metrics: CacheMetrics = {
    totalCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    costSavings: 0,
  };

  /**
   * Create cache configuration for a request
   * @param systemPrompt - The system prompt (usually from Skills)
   * @param userPrompt - The user prompt
   * @param enableCaching - Whether to enable caching (default: true)
   * @returns Cache configuration
   */
  createCacheConfig(
    systemPrompt: string,
    userPrompt: string,
    enableCaching: boolean = true
  ): CacheConfig {
    const systemTokens = this.estimateTokens(systemPrompt);
    const userTokens = this.estimateTokens(userPrompt);
    const totalTokens = systemTokens + userTokens;

    // Only cache if system prompt is large enough (skills are ~15K tokens)
    const shouldCache =
      enableCaching && systemTokens >= PromptCacheManager.MIN_CACHEABLE_TOKENS;

    return {
      enabled: shouldCache,
      cacheBlocks: [
        {
          type: 'system',
          content: systemPrompt,
          enableCache: shouldCache,
        },
        {
          type: 'user',
          content: userPrompt,
          enableCache: false, // Don't cache user prompts (they vary)
        },
      ],
      estimatedTokens: totalTokens,
    };
  }

  /**
   * Apply cache control to Claude API messages
   * @param config - Cache configuration
   * @returns Messages with cache control applied
   */
  applyCacheControl(config: CacheConfig): MessageCreateParams['messages'] {
    const messages: MessageCreateParams['messages'] = [];

    for (const block of config.cacheBlocks) {
      if (block.type === 'system') {
        // System messages go in the system parameter, not messages array
        // Cache control is applied in the system parameter itself
        continue;
      }

      if (block.type === 'user') {
        messages.push({
          role: 'user',
          content: block.content,
        });
      }
    }

    return messages;
  }

  /**
   * Create system parameter with cache control
   * @param systemPrompt - The system prompt
   * @param enableCache - Whether to enable caching
   * @returns System parameter with cache control
   */
  createSystemParameter(
    systemPrompt: string,
    enableCache: boolean = true
  ): MessageCreateParams['system'] {
    const tokens = this.estimateTokens(systemPrompt);
    const shouldCache = enableCache && tokens >= PromptCacheManager.MIN_CACHEABLE_TOKENS;

    if (shouldCache) {
      // Return system prompt with cache control
      return [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ];
    }

    // Return plain system prompt without caching
    return systemPrompt;
  }

  /**
   * Record a cache hit
   * @param cachedTokens - Number of tokens that were cached
   */
  recordCacheHit(cachedTokens: number): void {
    this.metrics.totalCalls++;
    this.metrics.cacheHits++;
    this.updateMetrics(cachedTokens, true);
  }

  /**
   * Record a cache miss
   * @param totalTokens - Total tokens in the request
   */
  recordCacheMiss(totalTokens: number): void {
    this.metrics.totalCalls++;
    this.metrics.cacheMisses++;
    this.updateMetrics(totalTokens, false);
  }

  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (for new batch or session)
   */
  resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      costSavings: 0,
    };
  }

  /**
   * Estimate token count (rough approximation)
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Update metrics after a request
   */
  private updateMetrics(tokens: number, cacheHit: boolean): void {
    // Calculate hit rate
    if (this.metrics.totalCalls > 0) {
      this.metrics.hitRate = this.metrics.cacheHits / this.metrics.totalCalls;
    }

    // Calculate cost savings
    const fullCost = tokens * PromptCacheManager.COST_PER_TOKEN;
    const cachedCost = tokens * PromptCacheManager.COST_PER_CACHED_TOKEN;
    const savings = cacheHit ? fullCost - cachedCost : 0;

    this.metrics.costSavings += savings;
  }

  /**
   * Calculate expected savings for a batch
   * @param batchSize - Number of questions to generate
   * @param systemTokens - Estimated system prompt tokens
   * @param userTokens - Estimated user prompt tokens per question
   * @returns Expected cost and savings
   */
  estimateBatchSavings(
    batchSize: number,
    systemTokens: number,
    userTokens: number
  ): {
    withoutCaching: number;
    withCaching: number;
    savings: number;
    savingsPercent: number;
  } {
    // Without caching: pay full price for all tokens
    const tokensPerQuestion = systemTokens + userTokens;
    const totalTokensWithoutCache = tokensPerQuestion * batchSize;
    const costWithoutCaching = totalTokensWithoutCache * PromptCacheManager.COST_PER_TOKEN;

    // With caching: first request pays full price, rest get cached system prompt
    const firstRequestCost =
      (systemTokens + userTokens) * PromptCacheManager.COST_PER_TOKEN;
    const subsequentRequestCost =
      systemTokens * PromptCacheManager.COST_PER_CACHED_TOKEN +
      userTokens * PromptCacheManager.COST_PER_TOKEN;

    const costWithCaching =
      firstRequestCost + subsequentRequestCost * (batchSize - 1);

    const savings = costWithoutCaching - costWithCaching;
    const savingsPercent = (savings / costWithoutCaching) * 100;

    return {
      withoutCaching: costWithoutCaching,
      withCaching: costWithCaching,
      savings,
      savingsPercent,
    };
  }

  /**
   * Format metrics as a human-readable report
   */
  formatMetricsReport(): string {
    const m = this.metrics;
    return `
=== Prompt Caching Metrics ===

Total API Calls: ${m.totalCalls}
Cache Hits: ${m.cacheHits}
Cache Misses: ${m.cacheMisses}
Hit Rate: ${(m.hitRate * 100).toFixed(1)}%
Cost Savings: $${m.costSavings.toFixed(4)}

Cache Performance:
${m.hitRate >= 0.7 ? '✅ EXCELLENT' : m.hitRate >= 0.5 ? '⚠️  GOOD' : '❌ POOR'}
Target: ≥70% hit rate for batch generation
Actual: ${(m.hitRate * 100).toFixed(1)}%
    `.trim();
  }
}

/**
 * Singleton instance for convenient access
 */
export const promptCacheManager = new PromptCacheManager();
