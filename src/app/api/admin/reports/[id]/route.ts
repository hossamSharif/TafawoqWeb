// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { notifyReportResolved } from '@/lib/notifications/service'
import type { ReportResolution } from '@/lib/admin/types'

const VALID_RESOLUTIONS: ReportResolution[] = ['approved', 'deleted', 'dismissed']

/**
 * PUT /api/admin/reports/[id] - Resolve a report (admin only)
 *
 * Request body:
 * - resolution: 'approved' | 'deleted' | 'dismissed'
 * - admin_notes: Optional notes from admin
 *
 * Returns:
 * - 200: Report resolved successfully
 * - 400: Invalid resolution
 * - 401: Not authenticated
 * - 403: Not authorized (not admin)
 * - 404: Report not found
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح بهذا الإجراء' },
        { status: 403 }
      )
    }

    const reportId = params.id
    const body = await request.json()
    const { resolution, admin_notes } = body

    // Validate resolution
    if (!resolution || !VALID_RESOLUTIONS.includes(resolution)) {
      return NextResponse.json(
        { error: 'قرار غير صالح' },
        { status: 400 }
      )
    }

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, reporter_id, content_type, content_id, status')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'البلاغ غير موجود' },
        { status: 404 }
      )
    }

    if (report.status !== 'pending') {
      return NextResponse.json(
        { error: 'تم معالجة هذا البلاغ مسبقاً' },
        { status: 400 }
      )
    }

    // Update report status
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'resolved',
        resolution,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
      })
      .eq('id', reportId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update report:', updateError)
      return NextResponse.json(
        { error: 'فشل في تحديث البلاغ' },
        { status: 500 }
      )
    }

    // If resolution is 'deleted', also delete/hide the content
    if (resolution === 'deleted') {
      if (report.content_type === 'post') {
        await supabase
          .from('forum_posts')
          .update({ status: 'deleted' })
          .eq('id', report.content_id)
      } else if (report.content_type === 'comment') {
        await supabase
          .from('comments')
          .update({ status: 'deleted' })
          .eq('id', report.content_id)
      }
    }

    // Trigger notification to the reporter
    await notifyReportResolved(report.reporter_id, {
      reportId: report.id,
      contentType: report.content_type as 'post' | 'comment',
      resolution,
    })

    return NextResponse.json({
      id: updatedReport.id,
      status: updatedReport.status,
      resolution: updatedReport.resolution,
      resolved_at: updatedReport.resolved_at,
    })
  } catch (error) {
    console.error('Report resolution error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * GET /api/admin/reports/[id] - Get report details (admin only)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح بهذا الإجراء' },
        { status: 403 }
      )
    }

    const reportId = params.id

    // Get report with reporter info
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:user_profiles!reporter_id(
          user_id,
          display_name,
          profile_picture_url
        )
      `)
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'البلاغ غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
