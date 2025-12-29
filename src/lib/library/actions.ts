// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
/**
 * Library actions for granting access and managing library exams
 * T017: Library actions implementation
 */

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  LibraryAccessResponse,
  LibraryAccessDeniedResponse,
  LibraryStartExamResponse,
} from '@/types'
import { TIER_LIMITS } from '@/types'

/**
 * Grant library access to a user for a specific exam
 */
export async function grantLibraryAccess(
  userId: string,
  postId: string
): Promise<LibraryAccessResponse | LibraryAccessDeniedResponse> {
  const supabase = await createServerClient()

  // Check if user already has access
  const { data: existingAccess } = await supabase
    .from('library_access')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle()

  if (existingAccess) {
    return {
      success: true,
      accessId: existingAccess.id,
      message: 'Already have access to this exam',
    }
  }

  // Get user's subscription tier
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle()

  const tier = (subscription?.tier as 'free' | 'premium') || 'free'
  const limits = TIER_LIMITS[tier]

  // Check access limit for free users
  if (limits.libraryAccessCount !== null) {
    const { count } = await supabase
      .from('library_access')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const accessUsed = count || 0

    if (accessUsed >= limits.libraryAccessCount) {
      return {
        error: 'لقد وصلت إلى الحد الأقصى للوصول إلى مكتبة الاختبارات',
        upgradeRequired: true,
        currentAccess: {
          tier,
          accessUsed,
          accessLimit: limits.libraryAccessCount,
          canAccessMore: false,
        },
      }
    }
  }

  // Grant access
  const { data: newAccess, error } = await supabase
    .from('library_access')
    .insert({
      user_id: userId,
      post_id: postId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error granting library access:', error)
    throw new Error('Failed to grant library access')
  }

  // Update library access count on the post (ignore errors if function doesn't exist)
  try {
    await supabase.rpc('increment_library_access_count', { p_post_id: postId })
  } catch {
    // Ignore if function doesn't exist yet
  }

  // Update user's library_access_used in user_credits
  try {
    // First get current value, then increment
    const { data: credits } = await supabase
      .from('user_credits')
      .select('library_access_used')
      .eq('user_id', userId)
      .maybeSingle()

    const currentUsed = credits?.library_access_used || 0
    await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        library_access_used: currentUsed + 1,
      }, { onConflict: 'user_id' })
  } catch {
    // Ignore if column doesn't exist yet
  }

  revalidatePath('/library')

  return {
    success: true,
    accessId: newAccess.id,
  }
}

/**
 * Start a library exam (creates exam session from shared exam)
 */
export async function startLibraryExam(
  userId: string,
  postId: string
): Promise<LibraryStartExamResponse> {
  const supabase = await createServerClient()

  // Verify user has access
  const { data: access } = await supabase
    .from('library_access')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle()

  if (!access) {
    throw new Error('No access to this library exam')
  }

  // Get the forum post to find shared_exam_id
  const { data: post, error: postError } = await supabase
    .from('forum_posts')
    .select('shared_exam_id')
    .eq('id', postId)
    .single()

  if (postError || !post?.shared_exam_id) {
    console.error('Failed to get shared exam data:', postError, 'shared_exam_id:', post?.shared_exam_id)
    throw new Error('Failed to get shared exam data')
  }

  // Get the exam session separately (avoiding foreign key join issues)
  const { data: originalExam, error: examError } = await supabase
    .from('exam_sessions')
    .select('id, questions, total_questions, track')
    .eq('id', post.shared_exam_id)
    .single()

  if (examError || !originalExam) {
    console.error('Failed to get exam session:', examError, 'shared_exam_id:', post.shared_exam_id)
    throw new Error('Exam data not found - the linked exam may have been deleted')
  }

  // Verify questions exist
  if (!originalExam.questions) {
    console.error('Exam has no questions:', originalExam)
    throw new Error('Exam has no questions')
  }

  // Create a new exam session for this user based on the shared exam
  // Include shared_from_post_id so exam completion flow can track library exams
  const { data: newSession, error: sessionError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: userId,
      questions: originalExam.questions,
      total_questions: originalExam.total_questions,
      track: originalExam.track,
      status: 'in_progress',
      start_time: new Date().toISOString(),
      shared_from_post_id: postId, // Track that this is a library exam
      is_library_exam: true, // Flag for library exam identification
    })
    .select('id')
    .single()

  if (sessionError) {
    console.error('Error creating exam session:', sessionError)
    throw new Error('Failed to start library exam')
  }

  // Mark the library access as started
  await supabase
    .from('library_access')
    .update({ exam_started: true })
    .eq('user_id', userId)
    .eq('post_id', postId)

  return {
    sessionId: newSession.id,
    examData: {
      id: newSession.id,
      questions: originalExam.questions as unknown[],
      totalQuestions: originalExam.total_questions,
      track: originalExam.track as 'scientific' | 'literary' | null,
    },
  }
}

/**
 * Mark a library exam as completed
 */
export async function completeLibraryExam(
  userId: string,
  postId: string,
  examSessionId: string
): Promise<{ success: boolean }> {
  const supabase = await createServerClient()

  // Update library access record
  const { error: accessError } = await supabase
    .from('library_access')
    .update({ exam_completed: true })
    .eq('user_id', userId)
    .eq('post_id', postId)

  if (accessError) {
    console.error('Error updating library access:', accessError)
  }

  // Create shared exam completion record (triggers reward)
  const { error: completionError } = await supabase
    .from('shared_exam_completions')
    .insert({
      user_id: userId,
      post_id: postId,
      exam_session_id: examSessionId,
    })

  if (completionError) {
    // May fail if already completed, which is fine
    if (!completionError.message.includes('duplicate')) {
      console.error('Error recording completion:', completionError)
    }
  }

  // Increment completion count on post
  try {
    // First get current value, then increment
    const { data: postData } = await supabase
      .from('forum_posts')
      .select('completion_count')
      .eq('id', postId)
      .maybeSingle()

    const currentCount = postData?.completion_count || 0
    await supabase
      .from('forum_posts')
      .update({ completion_count: currentCount + 1 })
      .eq('id', postId)
  } catch {
    // Ignore if function doesn't exist
  }

  revalidatePath('/library')
  revalidatePath('/exam/history')

  return { success: true }
}

/**
 * Admin: Make an exam visible in the library
 */
export async function setLibraryVisibility(
  postId: string,
  isVisible: boolean,
  adminId: string
): Promise<{ success: boolean }> {
  const supabase = await createServerClient()

  // Verify admin status
  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', adminId)
    .single()

  if (!adminProfile?.is_admin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const { error } = await supabase
    .from('forum_posts')
    .update({
      is_library_visible: isVisible,
      is_admin_upload: isVisible, // Mark as admin-curated if making visible
    })
    .eq('id', postId)

  if (error) {
    console.error('Error updating library visibility:', error)
    throw new Error('Failed to update library visibility')
  }

  revalidatePath('/library')
  revalidatePath('/admin/library')

  return { success: true }
}
