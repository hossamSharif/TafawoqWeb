/**
 * Next.js Server Actions for Question Generation
 * Feature: GAT Exam Platform v3.0
 *
 * Server Actions provide the interface between the frontend admin UI
 * and the backend generation service that calls Claude API.
 *
 * Architecture:
 * - Client (Admin UI) → Server Action → Generation Service → Claude API
 * - Uses Next.js 14+ Server Actions with 'use server' directive
 * - Returns typed results (not HTTP responses)
 * - Automatic serialization/deserialization
 */

'use server';

import { GenerationParams, ExamConfig, GenerationResult, ExamGenerationResult } from './generation-service';

// ============================================================================
// Server Actions for Admin UI
// ============================================================================

/**
 * Generate a batch of questions
 * Called from admin UI: generateQuestions({ ... })
 *
 * @param params - Generation parameters
 * @returns Generation result or error
 */
export async function generateQuestionsAction(
  params: GenerationParams
): Promise<ActionResult<GenerationResult>> {
  // Implementation will call QuduratGenerator service
  // Placeholder type definition
  throw new Error('Not implemented - will be implemented in tasks phase');
}

/**
 * Generate a full 120-question exam
 * Called from admin UI: generateFullExam({ ... })
 *
 * @param config - Exam configuration
 * @returns Job information
 */
export async function generateFullExamAction(
  config: ExamConfig
): Promise<ActionResult<ExamGenerationResult>> {
  throw new Error('Not implemented - will be implemented in tasks phase');
}

/**
 * Get status of exam generation job
 * Called from admin UI: getGenerationStatus(jobId)
 *
 * @param jobId - Job identifier
 * @returns Current job status
 */
export async function getGenerationStatusAction(
  jobId: string
): Promise<ActionResult<JobStatusResult>> {
  throw new Error('Not implemented - will be implemented in tasks phase');
}

/**
 * Report an error in a question
 * Called from student/teacher UI: reportQuestionError({ ... })
 *
 * @param report - Error report data
 * @returns Report confirmation
 */
export async function reportQuestionErrorAction(
  report: ErrorReportInput
): Promise<ActionResult<ErrorReportResult>> {
  throw new Error('Not implemented - will be implemented in tasks phase');
}

/**
 * Get review queue items (admin only)
 * Called from admin UI: getReviewQueue({ ... })
 *
 * @param filters - Optional filters
 * @returns Review queue items
 */
export async function getReviewQueueAction(
  filters?: ReviewQueueFilters
): Promise<ActionResult<ReviewQueueResult>> {
  throw new Error('Not implemented - will be implemented in tasks phase');
}

/**
 * Review a flagged question (admin only)
 * Called from admin UI: reviewQueueItem({ ... })
 *
 * @param review - Review data
 * @returns Updated queue item
 */
export async function reviewQueueItemAction(
  review: ReviewInput
): Promise<ActionResult<ReviewQueueItem>> {
  throw new Error('Not implemented - will be implemented in tasks phase');
}

// ============================================================================
// Action Input/Output Types
// ============================================================================

/**
 * Standard action result wrapper
 * Provides consistent success/error handling
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

export interface ActionError {
  code: string;
  message: string;
  details?: any;
  recoverable?: boolean;
}

// Job Status Result
export interface JobStatusResult {
  jobId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress: {
    completedBatches: number;
    totalBatches: number;
    questionsGenerated: number;
    elapsedTime: number;
    estimatedTimeRemaining: number;
  };
  result?: {
    questionIds: string[];
    totalCost: number;
    totalTime: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

// Error Reporting
export interface ErrorReportInput {
  questionId: string;
  errorType: 'mathematical' | 'grammatical' | 'diagram' | 'other';
  description: string;
  userId?: string;  // Optional, from session
}

export interface ErrorReportResult {
  id: string;
  questionId: string;
  reportedBy: string;
  reportedAt: string;
  status: 'pending';
}

// Review Queue
export interface ReviewQueueFilters {
  flagType?: 'grammar' | 'quality' | 'cultural';
  status?: 'pending' | 'in_review' | 'approved' | 'rejected';
  limit?: number;
  offset?: number;
}

export interface ReviewQueueResult {
  items: ReviewQueueItem[];
  total: number;
  hasMore: boolean;
}

export interface ReviewQueueItem {
  id: string;
  questionId: string;
  question: any;  // Full question object
  addedAt: string;
  flagType: 'grammar' | 'quality' | 'cultural';
  flagReason: string;
  priority: number;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface ReviewInput {
  itemId: string;
  status: 'approved' | 'rejected';
  notes?: string;
  userId?: string;  // Optional, from session
}

// ============================================================================
// Client-Side Hook (for reference)
// ============================================================================

/**
 * Example client-side usage in React component:
 *
 * ```typescript
 * 'use client';
 *
 * import { generateQuestionsAction } from '@/server-actions';
 * import { useState } from 'react';
 *
 * export function GenerateQuestionsButton() {
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState<string | null>(null);
 *
 *   async function handleGenerate() {
 *     setLoading(true);
 *     setError(null);
 *
 *     const result = await generateQuestionsAction({
 *       examType: 'quant-only',
 *       section: 'quantitative',
 *       track: 'scientific',
 *       batchSize: 20,
 *       difficulty: 'mixed',
 *       diagramCount: 3,
 *     });
 *
 *     if (result.success) {
 *       console.log(`Generated ${result.data.questions.length} questions`);
 *       console.log(`Cost: $${result.data.batchMetadata.cost.toFixed(4)}`);
 *     } else {
 *       setError(result.error.message);
 *     }
 *
 *     setLoading(false);
 *   }
 *
 *   return (
 *     <button onClick={handleGenerate} disabled={loading}>
 *       {loading ? 'Generating...' : 'Generate Questions'}
 *     </button>
 *   );
 * }
 * ```
 */

// ============================================================================
// Internal Next.js API Routes (if needed)
// ============================================================================

/**
 * For some operations, we might need API routes instead of Server Actions
 * (e.g., webhooks, polling endpoints, public APIs)
 *
 * These would be Next.js API routes in app/api/ directory:
 *
 * - GET /api/generation-status/[jobId] - Poll for job status
 * - POST /api/webhooks/generation-complete - Webhook for async jobs
 *
 * NOT for question generation itself - that stays in Server Actions
 */

export interface PollingEndpointResponse {
  jobId: string;
  status: string;
  progress: any;
  result?: any;
  error?: any;
}

// ============================================================================
// Permission Checks (server-side)
// ============================================================================

/**
 * Helper to check if user has admin permissions
 * Used in Server Actions to gate admin-only operations
 */
export async function checkAdminPermission(userId: string): Promise<boolean> {
  // Implementation will check user role in database
  throw new Error('Not implemented - will be implemented in tasks phase');
}

/**
 * Helper to check if user can report errors
 * (Authenticated users only)
 */
export async function checkReportPermission(userId: string): Promise<boolean> {
  // Implementation will check if user is authenticated
  throw new Error('Not implemented - will be implemented in tasks phase');
}

// ============================================================================
// Rate Limiting (server-side)
// ============================================================================

/**
 * Rate limit configuration for generation actions
 * Prevents abuse of Claude API
 */
export const RATE_LIMITS = {
  GENERATE_BATCH: {
    maxRequests: 10,  // Max 10 batch generations
    windowMs: 60 * 1000,  // Per 60 seconds
  },
  GENERATE_FULL_EXAM: {
    maxRequests: 2,  // Max 2 full exam generations
    windowMs: 5 * 60 * 1000,  // Per 5 minutes
  },
  REPORT_ERROR: {
    maxRequests: 20,  // Max 20 error reports
    windowMs: 60 * 60 * 1000,  // Per hour
  },
} as const;

/**
 * Check rate limit for action
 */
export async function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Implementation will use Redis or database for tracking
  throw new Error('Not implemented - will be implemented in tasks phase');
}
