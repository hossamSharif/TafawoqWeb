import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess, resolveReport } from '@/lib/admin/queries'
import { createNotification } from '@/lib/notifications/service'
import type { ModerationAction } from '@/lib/admin/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id: reportId } = await params

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

    // Parse request body
    const body = await request.json()
    const { action, notes } = body as { action: ModerationAction; notes?: string }

    // Validate action
    if (!['approve', 'delete_content', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid action' } },
        { status: 400 }
      )
    }

    // Get report details before resolving
    const { data: reportData } = await supabase
      .from('reports')
      .select('reporter_id')
      .eq('id', reportId)
      .single()

    // Type assertion for report data
    const report = reportData as { reporter_id: string } | null

    // Resolve report
    await resolveReport(user.id, reportId, action, notes)

    // Notify reporter
    if (report?.reporter_id) {
      await createNotification({
        user_id: report.reporter_id,
        type: 'report_resolved',
        title: 'تم مراجعة بلاغك',
        message: action === 'delete_content'
          ? 'تم حذف المحتوى المبلغ عنه. شكراً لمساعدتك في الحفاظ على سلامة المجتمع.'
          : action === 'dismiss'
          ? 'تمت مراجعة بلاغك ولم يتم العثور على مخالفة.'
          : 'تمت مراجعة بلاغك. شكراً لاهتمامك.',
        target_type: 'report',
        target_id: reportId,
      })
    }

    return NextResponse.json({
      id: reportId,
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      resolved_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Resolve report API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve report' } },
      { status: 500 }
    )
  }
}
