/**
 * error-actions.ts
 * Server Actions for error reporting and question flagging
 *
 * Features:
 * - Report question errors (mathematical, grammatical, diagram, other)
 * - Insert into question_errors table
 * - Auto-flag questions for review queue
 *
 * @see User Story 2 (FR-009a) - Error reporting
 * @see specs/1-gat-exam-v3/data-model.md - question_errors schema
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ErrorType = 'mathematical' | 'grammatical' | 'diagram' | 'other';

export interface ReportQuestionErrorParams {
  questionId: string;
  errorType: ErrorType;
  description?: string;
  userId?: string;
}

export interface ReportQuestionErrorResult {
  success: boolean;
  error?: string;
  errorId?: string;
}

/**
 * Report an error with a question (T059)
 * Inserts into question_errors table and updates error_count
 *
 * @param params - Error report parameters
 * @returns Result with success status and error ID
 */
export async function reportQuestionError(
  params: ReportQuestionErrorParams
): Promise<ReportQuestionErrorResult> {
  try {
    const supabase = await createServerClient();

    // Verify question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, error_count')
      .eq('id', params.questionId)
      .single();

    if (questionError || !question) {
      return {
        success: false,
        error: 'Question not found',
      };
    }

    // Insert error report
    const { data: errorReport, error: insertError } = await supabase
      .from('question_errors')
      .insert({
        question_id: params.questionId,
        error_type: params.errorType,
        description: params.description || null,
        reported_by: params.userId || null,
        reported_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !errorReport) {
      console.error('Failed to insert error report:', insertError);
      return {
        success: false,
        error: 'Failed to report error',
      };
    }

    // Increment error_count on question
    const { error: updateError } = await supabase
      .from('questions')
      .update({
        error_count: (question.error_count || 0) + 1,
      })
      .eq('id', params.questionId);

    if (updateError) {
      console.error('Failed to update error count:', updateError);
      // Continue anyway - error report was created
    }

    // If this is the first error, add to review queue
    if ((question.error_count || 0) === 0) {
      await addToReviewQueue(params.questionId, params.errorType);
    }

    // Revalidate pages that might show this question
    revalidatePath('/practice');
    revalidatePath('/admin/review-queue');

    return {
      success: true,
      errorId: errorReport.id,
    };
  } catch (error) {
    console.error('Error reporting question error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Add question to review queue
 * Internal helper function
 */
async function addToReviewQueue(
  questionId: string,
  flagType: ErrorType
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('review_queue').insert({
    question_id: questionId,
    flag_type: flagType,
    flagged_at: new Date().toISOString(),
    status: 'pending',
    priority: flagType === 'mathematical' ? 'high' : 'medium',
  });

  if (error) {
    console.error('Failed to add to review queue:', error);
  }
}

/**
 * Get error reports for a question
 * Useful for admin review interface
 */
export async function getQuestionErrors(questionId: string) {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('question_errors')
      .select('*')
      .eq('question_id', questionId)
      .order('reported_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch question errors:', error);
      return { success: false, errors: [], error: 'Failed to fetch errors' };
    }

    return { success: true, errors: data };
  } catch (error) {
    console.error('Error fetching question errors:', error);
    return { success: false, errors: [], error: 'An unexpected error occurred' };
  }
}

/**
 * Bulk flag questions with quality issues
 * Used by generation service to automatically flag questions
 */
export async function flagQuestionsForReview(
  flaggedQuestions: Array<{
    questionId: string;
    flags: string[];
  }>
): Promise<{ success: boolean; flaggedCount: number; error?: string }> {
  try {
    const supabase = await createServerClient();

    let flaggedCount = 0;

    for (const { questionId, flags } of flaggedQuestions) {
      if (flags.length === 0) continue;

      // Determine primary flag type
      const primaryFlag = flags.includes('grammar')
        ? 'grammatical'
        : flags.includes('mathematical')
          ? 'mathematical'
          : flags.includes('diagram_accessibility')
            ? 'diagram'
            : 'other';

      const { error } = await supabase.from('review_queue').insert({
        question_id: questionId,
        flag_type: primaryFlag,
        flagged_at: new Date().toISOString(),
        status: 'pending',
        priority: flags.includes('mathematical') ? 'high' : 'medium',
        notes: `Auto-flagged with issues: ${flags.join(', ')}`,
      });

      if (!error) {
        flaggedCount++;
      } else {
        console.error(`Failed to flag question ${questionId}:`, error);
      }
    }

    revalidatePath('/admin/review-queue');

    return {
      success: true,
      flaggedCount,
    };
  } catch (error) {
    console.error('Error flagging questions:', error);
    return {
      success: false,
      flaggedCount: 0,
      error: 'An unexpected error occurred',
    };
  }
}
