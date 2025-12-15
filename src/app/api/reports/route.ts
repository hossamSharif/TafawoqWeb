// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type {
  CreateReportRequest,
  CreateReportResponse,
  ReportReason,
  ReportContentType,
} from '@/lib/admin/types'
import { ADMIN_LIMITS } from '@/lib/admin/types'

const VALID_REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'inappropriate_content',
  'misinformation',
  'other',
]

const VALID_CONTENT_TYPES: ReportContentType[] = ['post', 'comment']

/**
 * POST /api/reports - Report content for moderation
 *
 * Request body:
 * - content_type: 'post' | 'comment'
 * - content_id: UUID of the content
 * - reason: Report reason category
 * - details: Optional additional details (max 500 chars)
 *
 * Returns:
 * - 201: Report created successfully
 * - 400: Invalid input or trying to report own content
 * - 401: Not authenticated
 * - 404: Content not found
 * - 409: Already reported this content
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Parse request body
    const body: CreateReportRequest = await request.json()
    const { content_type, content_id, reason, details } = body

    // Validate content_type
    if (!content_type || !VALID_CONTENT_TYPES.includes(content_type)) {
      return NextResponse.json(
        { error: 'نوع المحتوى غير صالح' },
        { status: 400 }
      )
    }

    // Validate content_id
    if (!content_id || typeof content_id !== 'string') {
      return NextResponse.json(
        { error: 'معرف المحتوى مطلوب' },
        { status: 400 }
      )
    }

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: 'سبب البلاغ غير صالح' },
        { status: 400 }
      )
    }

    // Validate details length if provided
    if (details && details.length > ADMIN_LIMITS.REPORT_DETAILS_MAX_LENGTH) {
      return NextResponse.json(
        { error: `التفاصيل يجب أن لا تتجاوز ${ADMIN_LIMITS.REPORT_DETAILS_MAX_LENGTH} حرف` },
        { status: 400 }
      )
    }

    // Check if content exists and get author_id
    let contentAuthorId: string | null = null

    if (content_type === 'post') {
      const { data: post, error: postError } = await supabase
        .from('forum_posts')
        .select('author_id, status')
        .eq('id', content_id)
        .single()

      if (postError || !post) {
        return NextResponse.json(
          { error: 'المنشور غير موجود' },
          { status: 404 }
        )
      }

      if (post.status === 'deleted') {
        return NextResponse.json(
          { error: 'هذا المنشور محذوف' },
          { status: 400 }
        )
      }

      contentAuthorId = post.author_id
    } else if (content_type === 'comment') {
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .select('author_id, status')
        .eq('id', content_id)
        .single()

      if (commentError || !comment) {
        return NextResponse.json(
          { error: 'التعليق غير موجود' },
          { status: 404 }
        )
      }

      if (comment.status === 'deleted') {
        return NextResponse.json(
          { error: 'هذا التعليق محذوف' },
          { status: 400 }
        )
      }

      contentAuthorId = comment.author_id
    }

    // Check if user is trying to report their own content
    if (contentAuthorId === user.id) {
      return NextResponse.json(
        { error: 'لا يمكنك الإبلاغ عن محتواك الخاص' },
        { status: 400 }
      )
    }

    // Check if user already reported this content
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: 'لقد قمت بالإبلاغ عن هذا المحتوى مسبقاً' },
        { status: 409 }
      )
    }

    // Create the report
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        content_type,
        content_id,
        reason,
        details: details?.trim() || null,
        status: 'pending',
      })
      .select('id, status, created_at')
      .single()

    if (insertError) {
      console.error('Failed to create report:', insertError)
      return NextResponse.json(
        { error: 'فشل في إنشاء البلاغ' },
        { status: 500 }
      )
    }

    const response: CreateReportResponse = {
      id: report.id,
      status: report.status,
      created_at: report.created_at,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Report creation error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
