/**
 * Library queries for fetching exam library data
 * T016: Library queries implementation
 */

import { createClient } from '@/lib/supabase/client'
import type {
  LibraryExam,
  LibraryExamDetail,
  LibraryFilters,
  LibraryListResponse,
  UserLibraryAccess,
} from '@/types'
import { TIER_LIMITS } from '@/types'

/**
 * Get paginated list of library exams
 */
export async function getLibraryExams(
  userId: string,
  filters: LibraryFilters = {}
): Promise<LibraryListResponse> {
  const supabase = createClient()
  const { section, sort = 'popular', page = 1, limit = 20 } = filters
  const offset = (page - 1) * limit

  // Get user's subscription tier and library access info
  const userAccess = await getUserLibraryAccess(userId)

  // Call the database function for library exams
  const { data, error } = await supabase.rpc('get_library_exams', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
    p_section: section || null,
    p_sort: sort,
  })

  if (error) {
    console.error('Error fetching library exams:', error)
    throw new Error('Failed to fetch library exams')
  }

  // Get total count for pagination
  const { count } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .eq('post_type', 'exam_share')
    .eq('is_library_visible', true)
    .neq('status', 'deleted')

  const exams: LibraryExam[] = (data || []).map((row: Record<string, unknown>) => ({
    postId: row.post_id as string,
    title: row.title as string,
    section: row.section as LibraryExam['section'],
    questionCount: row.question_count as number,
    creator: {
      id: row.creator_id as string,
      displayName: row.creator_name as string | null,
    },
    completionCount: row.completion_count as number,
    userHasAccess: row.user_has_access as boolean,
    userCompleted: row.user_completed as boolean,
    createdAt: row.created_at as string,
  }))

  return {
    exams,
    pagination: {
      page,
      limit,
      total: count || 0,
      hasMore: offset + exams.length < (count || 0),
    },
    userAccess,
  }
}

/**
 * Get a single library exam by post ID
 */
export async function getLibraryExamById(
  postId: string,
  userId: string
): Promise<LibraryExamDetail | null> {
  const supabase = createClient()

  // Get the forum post with exam details
  const { data: post, error: postError } = await supabase
    .from('forum_posts')
    .select(`
      id,
      title,
      body,
      author_id,
      shared_exam_id,
      completion_count,
      created_at,
      user_profiles!forum_posts_author_id_fkey (
        display_name
      ),
      exam_sessions!forum_posts_shared_exam_id_fkey (
        track,
        total_questions
      )
    `)
    .eq('id', postId)
    .eq('is_library_visible', true)
    .single()

  if (postError || !post) {
    console.error('Error fetching library exam:', postError)
    return null
  }

  // Check if user has access
  const { data: accessData } = await supabase
    .from('library_access')
    .select('id, exam_completed')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle()

  // Check if user completed this exam
  const { data: completionData } = await supabase
    .from('shared_exam_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle()

  const userProfile = post.user_profiles as { display_name: string | null } | null
  const examSession = post.exam_sessions as { track: string | null; total_questions: number } | null

  return {
    postId: post.id,
    title: post.title,
    description: post.body,
    body: post.body,
    section: examSession?.track as LibraryExam['section'],
    questionCount: examSession?.total_questions || 0,
    difficulty: 'mixed', // Default, could be calculated
    estimatedTime: examSession?.total_questions ? Math.ceil(examSession.total_questions * 1.5) : null,
    creator: {
      id: post.author_id,
      displayName: userProfile?.display_name || null,
    },
    completionCount: post.completion_count || 0,
    userHasAccess: !!accessData,
    userCompleted: !!completionData,
    createdAt: post.created_at || '',
  }
}

/**
 * Check if user has access to a specific library exam
 */
export async function checkLibraryAccess(
  userId: string,
  postId: string
): Promise<{ hasAccess: boolean; accessId: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('library_access')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle()

  if (error) {
    console.error('Error checking library access:', error)
    return { hasAccess: false, accessId: null }
  }

  return {
    hasAccess: !!data,
    accessId: data?.id || null,
  }
}

/**
 * Get user's library access status and limits
 */
export async function getUserLibraryAccess(userId: string): Promise<UserLibraryAccess> {
  const supabase = createClient()

  // Get user's subscription tier
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle()

  const tier = (subscription?.tier as 'free' | 'premium') || 'free'
  const limits = TIER_LIMITS[tier]

  // Count user's library accesses
  const { count } = await supabase
    .from('library_access')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const accessUsed = count || 0
  const accessLimit = limits.libraryAccessCount

  return {
    tier,
    accessUsed,
    accessLimit,
    canAccessMore: accessLimit === null || accessUsed < accessLimit,
  }
}

/**
 * Get user's accessed library exams
 */
export async function getUserAccessedExams(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ exams: LibraryExam[]; total: number }> {
  const supabase = createClient()
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('library_access')
    .select(`
      id,
      accessed_at,
      exam_completed,
      forum_posts!library_access_post_id_fkey (
        id,
        title,
        author_id,
        completion_count,
        created_at,
        user_profiles!forum_posts_author_id_fkey (
          display_name
        ),
        exam_sessions!forum_posts_shared_exam_id_fkey (
          track,
          total_questions
        )
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('accessed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching user accessed exams:', error)
    return { exams: [], total: 0 }
  }

  const exams: LibraryExam[] = (data || []).map((access) => {
    const post = access.forum_posts as {
      id: string
      title: string
      author_id: string
      completion_count: number | null
      created_at: string | null
      user_profiles: { display_name: string | null } | null
      exam_sessions: { track: string | null; total_questions: number } | null
    }

    return {
      postId: post.id,
      title: post.title,
      section: post.exam_sessions?.track as LibraryExam['section'],
      questionCount: post.exam_sessions?.total_questions || 0,
      creator: {
        id: post.author_id,
        displayName: post.user_profiles?.display_name || null,
      },
      completionCount: post.completion_count || 0,
      userHasAccess: true,
      userCompleted: access.exam_completed || false,
      createdAt: post.created_at || '',
    }
  })

  return { exams, total: count || 0 }
}
