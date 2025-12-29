// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import { logAdminAction } from '@/lib/admin/audit'
import type { Question } from '@/types/question'

// GET /api/admin/content - List admin-uploaded content
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Verify admin access
    try {
      await verifyAdminAccess(user.id)
    } catch {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    // Fetch admin-uploaded content from forum_posts with is_admin_upload = true
    const { data: posts, error } = await supabase
      .from('forum_posts')
      .select(`
        id,
        title,
        body,
        post_type,
        created_at,
        completion_count,
        shared_exam_id,
        shared_practice_id,
        is_library_visible
      `)
      .eq('is_admin_upload', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin content:', error)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content' } },
        { status: 500 }
      )
    }

    // Get library access counts for each post
    const postIds = posts?.map(p => p.id) || []
    let accessCounts: Record<string, number> = {}

    if (postIds.length > 0) {
      const { data: accessData } = await supabase
        .from('library_access')
        .select('post_id')
        .in('post_id', postIds)

      if (accessData) {
        accessCounts = accessData.reduce((acc: Record<string, number>, item) => {
          acc[item.post_id] = (acc[item.post_id] || 0) + 1
          return acc
        }, {})
      }
    }

    // Get question counts from exam_sessions for each post
    const sharedExamIds = posts?.filter(p => p.shared_exam_id).map(p => p.shared_exam_id) || []
    let examQuestionCounts: Record<string, number> = {}

    if (sharedExamIds.length > 0) {
      const { data: examData } = await supabase
        .from('exam_sessions')
        .select('id, total_questions')
        .in('id', sharedExamIds)

      if (examData) {
        examQuestionCounts = examData.reduce((acc: Record<string, number>, exam) => {
          acc[exam.id] = exam.total_questions || 0
          return acc
        }, {})
      }
    }

    // Get question counts and difficulty from practice_sessions for each post
    const sharedPracticeIds = posts?.filter(p => p.shared_practice_id).map(p => p.shared_practice_id) || []
    let practiceInfo: Record<string, { questionCount: number; difficulty: string }> = {}

    if (sharedPracticeIds.length > 0) {
      const { data: practiceData } = await supabase
        .from('practice_sessions')
        .select('id, question_count, difficulty, questions')
        .in('id', sharedPracticeIds)

      if (practiceData) {
        practiceInfo = practiceData.reduce((acc: Record<string, { questionCount: number; difficulty: string }>, practice) => {
          // Get question count from question_count field or from questions array length
          const questionCount = practice.question_count ||
            (Array.isArray(practice.questions) ? practice.questions.length : 0)
          acc[practice.id] = {
            questionCount,
            difficulty: practice.difficulty || 'medium'
          }
          return acc
        }, {})
      }
    }

    // Transform to response format
    const contents = (posts || []).map(post => {
      // Determine content type from post_type
      const contentType = post.post_type === 'practice_share' ? 'practice' : 'exam'

      // Try to get section and difficulty from body if it's JSON
      let section: 'quantitative' | 'verbal' = 'quantitative'
      let difficulty: 'easy' | 'medium' | 'hard' | undefined = undefined
      try {
        if (post.body) {
          const bodyData = JSON.parse(post.body)
          if (bodyData.section) {
            section = bodyData.section
          }
          if (bodyData.difficulty) {
            difficulty = bodyData.difficulty
          }
        }
      } catch {
        // Not JSON body, use default
      }

      // Get question count based on content type
      let questionCount = 0
      if (contentType === 'practice' && post.shared_practice_id) {
        questionCount = practiceInfo[post.shared_practice_id]?.questionCount || 0
        // Also get difficulty from practice session if not in body
        if (!difficulty && practiceInfo[post.shared_practice_id]?.difficulty) {
          difficulty = practiceInfo[post.shared_practice_id].difficulty as 'easy' | 'medium' | 'hard'
        }
      } else if (contentType === 'exam' && post.shared_exam_id) {
        questionCount = examQuestionCounts[post.shared_exam_id] || 0
      }

      return {
        id: post.id,
        title: post.title,
        contentType,
        section,
        difficulty: contentType === 'practice' ? difficulty : undefined,
        questionCount,
        accessCount: accessCounts[post.id] || 0,
        completionCount: post.completion_count || 0,
        createdAt: post.created_at,
        isLibraryVisible: post.is_library_visible ?? true,
      }
    })

    return NextResponse.json({ contents })
  } catch (error) {
    console.error('Admin content list error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content' } },
      { status: 500 }
    )
  }
}

// POST /api/admin/content - Upload new admin content (redirects to /api/admin/content/upload)
// Note: Main upload logic is in /api/admin/content/upload/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Verify admin access
    try {
      await verifyAdminAccess(user.id)
    } catch {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, contentType = 'exam', section, difficulty, questions } = body as {
      title: string
      description?: string
      contentType?: 'exam' | 'practice'
      section: 'quantitative' | 'verbal'
      difficulty?: 'easy' | 'medium' | 'hard'
      questions: Question[]
    }

    // Basic validation
    if (!title || !section || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      )
    }

    // Validate difficulty for practice content
    if (contentType === 'practice' && !difficulty) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Difficulty is required for practice content' } },
        { status: 400 }
      )
    }

    let sessionId: string
    let postType: 'exam_share' | 'practice_share'
    let sharedExamId: string | null = null
    let sharedPracticeId: string | null = null

    if (contentType === 'practice') {
      // Create a practice_session to hold the questions
      const categories = [...new Set(questions.map(q => q.topic))]

      const { data: practiceSession, error: practiceError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          status: 'completed',
          section: section,
          categories: categories,
          difficulty: difficulty,
          question_count: questions.length,
          questions: questions,
          created_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          time_spent_seconds: 0,
          generated_batches: 1,
        })
        .select('id')
        .single()

      if (practiceError || !practiceSession) {
        console.error('Error creating practice session:', practiceError)
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Failed to create practice session' } },
          { status: 500 }
        )
      }

      sessionId = practiceSession.id
      postType = 'practice_share'
      sharedPracticeId = practiceSession.id
    } else {
      // Create an exam_session to hold the questions
      const { data: examSession, error: examError } = await supabase
        .from('exam_sessions')
        .insert({
          user_id: user.id,
          status: 'completed',
          track: section === 'verbal' ? 'literary' : 'scientific',
          total_questions: questions.length,
          questions: questions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (examError || !examSession) {
        console.error('Error creating exam session:', examError)
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Failed to create exam session' } },
          { status: 500 }
        )
      }

      sessionId = examSession.id
      postType = 'exam_share'
      sharedExamId = examSession.id
    }

    // Create the forum post with is_admin_upload = true
    const { data: forumPost, error: postError } = await supabase
      .from('forum_posts')
      .insert({
        author_id: user.id,
        title,
        body: JSON.stringify({ description, section, contentType, difficulty }),
        post_type: postType,
        shared_exam_id: sharedExamId,
        shared_practice_id: sharedPracticeId,
        is_library_visible: true,
        is_admin_upload: true,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (postError || !forumPost) {
      console.error('Error creating forum post:', postError)
      // Clean up the session if post creation fails
      if (contentType === 'practice') {
        await supabase.from('practice_sessions').delete().eq('id', sessionId)
      } else {
        await supabase.from('exam_sessions').delete().eq('id', sessionId)
      }
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create content' } },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(user.id, {
      action_type: 'content_uploaded',
      target_type: 'forum_post',
      target_id: forumPost.id,
      details: {
        title,
        contentType,
        section,
        difficulty: contentType === 'practice' ? difficulty : undefined,
        questionCount: questions.length,
        sessionId,
      },
    })

    return NextResponse.json({
      success: true,
      contentId: forumPost.id,
      contentType,
      sessionId,
    })
  } catch (error) {
    console.error('Admin content upload error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upload content' } },
      { status: 500 }
    )
  }
}
