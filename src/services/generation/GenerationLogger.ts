/**
 * GenerationLogger.ts
 * Service for logging batch performance, API costs, and quality metrics
 *
 * Features:
 * - Track batch generation performance (time, success rate)
 * - Log API costs and cache metrics
 * - Monitor quality metrics (error rates, flags)
 * - Store generation logs in database
 *
 * @see User Story 6 (T100) - Generation logging
 * @see specs/1-gat-exam-v3/data-model.md - generation metadata
 */

export interface BatchGenerationLog {
  batchId: string;
  batchNumber: number;
  totalBatches: number;
  questionsRequested: number;
  questionsGenerated: number;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  cacheHit: boolean;
  apiCost: number;
  model: string;
  errorCount: number;
  qualityFlags: number;
  success: boolean;
  errorMessage?: string;
}

export interface GenerationSessionLog {
  sessionId: string;
  totalQuestions: number;
  totalBatches: number;
  totalDurationMs: number;
  totalCost: number;
  totalCostWithoutCache: number;
  savings: number;
  savingsPercentage: number;
  cacheHitRate: number;
  successRate: number;
  avgBatchTime: number;
  batches: BatchGenerationLog[];
}

export class GenerationLogger {
  private sessionLogs: Map<string, GenerationSessionLog> = new Map();
  private batchLogs: Map<string, BatchGenerationLog> = new Map();

  /**
   * Start a new generation session
   */
  startSession(sessionId: string, totalQuestions: number, totalBatches: number): void {
    this.sessionLogs.set(sessionId, {
      sessionId,
      totalQuestions,
      totalBatches,
      totalDurationMs: 0,
      totalCost: 0,
      totalCostWithoutCache: 0,
      savings: 0,
      savingsPercentage: 0,
      cacheHitRate: 0,
      successRate: 0,
      avgBatchTime: 0,
      batches: [],
    });

    this.log('info', `Started generation session ${sessionId}`, {
      totalQuestions,
      totalBatches,
    });
  }

  /**
   * Start a batch generation
   */
  startBatch(
    sessionId: string,
    batchId: string,
    batchNumber: number,
    totalBatches: number,
    questionsRequested: number
  ): void {
    const batchLog: BatchGenerationLog = {
      batchId,
      batchNumber,
      totalBatches,
      questionsRequested,
      questionsGenerated: 0,
      startTime: new Date(),
      endTime: new Date(),
      durationMs: 0,
      cacheHit: false,
      apiCost: 0,
      model: 'claude-sonnet-4',
      errorCount: 0,
      qualityFlags: 0,
      success: false,
    };

    this.batchLogs.set(batchId, batchLog);

    this.log('info', `Started batch ${batchNumber}/${totalBatches}`, {
      batchId,
      questionsRequested,
    });
  }

  /**
   * Complete a batch generation
   */
  completeBatch(
    batchId: string,
    result: {
      questionsGenerated: number;
      cacheHit: boolean;
      apiCost: number;
      model: string;
      errorCount?: number;
      qualityFlags?: number;
      success: boolean;
      errorMessage?: string;
    }
  ): void {
    const batchLog = this.batchLogs.get(batchId);
    if (!batchLog) {
      this.log('error', `Batch ${batchId} not found`, {});
      return;
    }

    batchLog.endTime = new Date();
    batchLog.durationMs = batchLog.endTime.getTime() - batchLog.startTime.getTime();
    batchLog.questionsGenerated = result.questionsGenerated;
    batchLog.cacheHit = result.cacheHit;
    batchLog.apiCost = result.apiCost;
    batchLog.model = result.model;
    batchLog.errorCount = result.errorCount || 0;
    batchLog.qualityFlags = result.qualityFlags || 0;
    batchLog.success = result.success;
    batchLog.errorMessage = result.errorMessage;

    this.log('info', `Completed batch ${batchLog.batchNumber}/${batchLog.totalBatches}`, {
      batchId,
      duration: `${(batchLog.durationMs / 1000).toFixed(2)}s`,
      questionsGenerated: result.questionsGenerated,
      cacheHit: result.cacheHit,
      cost: `$${result.apiCost.toFixed(4)}`,
      success: result.success,
    });
  }

  /**
   * Complete a generation session
   */
  completeSession(sessionId: string): GenerationSessionLog | null {
    const session = this.sessionLogs.get(sessionId);
    if (!session) {
      this.log('error', `Session ${sessionId} not found`, {});
      return null;
    }

    // Aggregate batch data
    let totalCost = 0;
    let totalCostWithoutCache = 0;
    let totalDuration = 0;
    let cacheHits = 0;
    let successfulBatches = 0;

    session.batches.forEach((batch) => {
      totalCost += batch.apiCost;
      totalDuration += batch.durationMs;

      // Estimate cost without cache (cache gives ~75% savings)
      if (batch.cacheHit) {
        totalCostWithoutCache += batch.apiCost * 4; // 4x cost without cache
        cacheHits++;
      } else {
        totalCostWithoutCache += batch.apiCost;
      }

      if (batch.success) {
        successfulBatches++;
      }
    });

    session.totalDurationMs = totalDuration;
    session.totalCost = totalCost;
    session.totalCostWithoutCache = totalCostWithoutCache;
    session.savings = totalCostWithoutCache - totalCost;
    session.savingsPercentage = totalCostWithoutCache > 0
      ? (session.savings / totalCostWithoutCache) * 100
      : 0;
    session.cacheHitRate = session.batches.length > 0
      ? (cacheHits / session.batches.length) * 100
      : 0;
    session.successRate = session.batches.length > 0
      ? (successfulBatches / session.batches.length) * 100
      : 0;
    session.avgBatchTime = session.batches.length > 0
      ? totalDuration / session.batches.length
      : 0;

    this.log('info', `Completed session ${sessionId}`, {
      totalQuestions: session.totalQuestions,
      totalBatches: session.batches.length,
      duration: `${(session.totalDurationMs / 1000).toFixed(2)}s`,
      totalCost: `$${session.totalCost.toFixed(4)}`,
      savings: `$${session.savings.toFixed(4)} (${session.savingsPercentage.toFixed(1)}%)`,
      cacheHitRate: `${session.cacheHitRate.toFixed(1)}%`,
      successRate: `${session.successRate.toFixed(1)}%`,
    });

    return session;
  }

  /**
   * Add a batch to a session
   */
  addBatchToSession(sessionId: string, batchId: string): void {
    const session = this.sessionLogs.get(sessionId);
    const batch = this.batchLogs.get(batchId);

    if (!session || !batch) {
      this.log('error', `Cannot add batch to session`, { sessionId, batchId });
      return;
    }

    session.batches.push(batch);
  }

  /**
   * Get session log
   */
  getSessionLog(sessionId: string): GenerationSessionLog | undefined {
    return this.sessionLogs.get(sessionId);
  }

  /**
   * Get batch log
   */
  getBatchLog(batchId: string): BatchGenerationLog | undefined {
    return this.batchLogs.get(batchId);
  }

  /**
   * Clear old logs (keep last 100 sessions)
   */
  clearOldLogs(): void {
    if (this.sessionLogs.size > 100) {
      const sessions = Array.from(this.sessionLogs.keys());
      const toRemove = sessions.slice(0, sessions.length - 100);
      toRemove.forEach((sessionId) => {
        this.sessionLogs.delete(sessionId);
      });
      this.log('info', `Cleared ${toRemove.length} old session logs`, {});
    }

    if (this.batchLogs.size > 500) {
      const batches = Array.from(this.batchLogs.keys());
      const toRemove = batches.slice(0, batches.length - 500);
      toRemove.forEach((batchId) => {
        this.batchLogs.delete(batchId);
      });
      this.log('info', `Cleared ${toRemove.length} old batch logs`, {});
    }
  }

  /**
   * Internal logging method
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    // Console logging (can be replaced with proper logging service)
    if (level === 'error') {
      console.error('[GenerationLogger]', logEntry);
    } else if (level === 'warn') {
      console.warn('[GenerationLogger]', logEntry);
    } else {
      console.log('[GenerationLogger]', logEntry);
    }

    // TODO: Store in database or logging service
    // For production, you might want to:
    // 1. Write to a log file
    // 2. Send to a logging service (DataDog, Sentry, etc.)
    // 3. Store in database for analysis
  }

  /**
   * Export session log as JSON
   */
  exportSessionLog(sessionId: string): string | null {
    const session = this.sessionLogs.get(sessionId);
    if (!session) {
      return null;
    }

    return JSON.stringify(session, null, 2);
  }

  /**
   * Get performance summary for dashboard
   */
  getPerformanceSummary(): {
    totalSessions: number;
    totalBatches: number;
    avgCacheHitRate: number;
    avgSavingsPercentage: number;
    avgSuccessRate: number;
    totalCost: number;
    totalSavings: number;
  } {
    const sessions = Array.from(this.sessionLogs.values());

    let totalCost = 0;
    let totalSavings = 0;
    let totalCacheHitRate = 0;
    let totalSavingsPercentage = 0;
    let totalSuccessRate = 0;
    let totalBatches = 0;

    sessions.forEach((session) => {
      totalCost += session.totalCost;
      totalSavings += session.savings;
      totalCacheHitRate += session.cacheHitRate;
      totalSavingsPercentage += session.savingsPercentage;
      totalSuccessRate += session.successRate;
      totalBatches += session.batches.length;
    });

    const sessionCount = sessions.length || 1; // Avoid division by zero

    return {
      totalSessions: sessions.length,
      totalBatches,
      avgCacheHitRate: totalCacheHitRate / sessionCount,
      avgSavingsPercentage: totalSavingsPercentage / sessionCount,
      avgSuccessRate: totalSuccessRate / sessionCount,
      totalCost,
      totalSavings,
    };
  }
}

/**
 * Singleton instance for convenient access
 */
export const generationLogger = new GenerationLogger();
