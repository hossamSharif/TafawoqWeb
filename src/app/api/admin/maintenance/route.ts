// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import { DEFAULT_MAINTENANCE_MESSAGE } from '@/types'

interface MaintenanceStatusResponse {
  enabled: boolean
  message: string | null
  enabledAt: string | null
  enabledBy: string | null
}

interface MaintenanceLog {
  id: string
  adminId: string
  adminName?: string
  action: 'enabled' | 'disabled'
  message: string | null
  createdAt: string
}

/**
 * GET /api/admin/maintenance
 * Get current maintenance mode status
 * Query params: ?logs=true to include recent logs
 */
export async function GET(request: NextRequest) {
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

    // Get maintenance mode status from feature_toggles
    const { data: toggle, error: toggleError } = await supabase
      .from('feature_toggles')
      .select('is_enabled, description, updated_at, updated_by')
      .eq('feature_name', 'maintenance_mode')
      .maybeSingle()

    if (toggleError) {
      console.error('Error fetching maintenance status:', toggleError)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch maintenance status' } },
        { status: 500 }
      )
    }

    // Get admin name if enabled
    let enabledByName: string | null = null
    if (toggle?.is_enabled && toggle?.updated_by) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', toggle.updated_by)
        .single()
      enabledByName = profile?.display_name || null
    }

    const status: MaintenanceStatusResponse = {
      enabled: toggle?.is_enabled || false,
      message: toggle?.is_enabled ? (toggle.description || DEFAULT_MAINTENANCE_MESSAGE.ar) : null,
      enabledAt: toggle?.is_enabled ? toggle.updated_at : null,
      enabledBy: enabledByName,
    }

    // Check if logs are requested
    const searchParams = request.nextUrl.searchParams
    const includeLogs = searchParams.get('logs') === 'true'

    if (includeLogs) {
      // Get recent maintenance logs
      const { data: logs, error: logsError } = await supabase
        .from('maintenance_log')
        .select(`
          id,
          admin_id,
          action,
          message,
          created_at,
          user_profiles!maintenance_log_admin_id_fkey (
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (logsError) {
        console.error('Error fetching maintenance logs:', logsError)
      }

      const formattedLogs: MaintenanceLog[] = (logs || []).map((log) => {
        const profile = log.user_profiles as { display_name: string | null } | null
        return {
          id: log.id,
          adminId: log.admin_id,
          adminName: profile?.display_name || undefined,
          action: log.action as 'enabled' | 'disabled',
          message: log.message,
          createdAt: log.created_at,
        }
      })

      return NextResponse.json({ ...status, logs: formattedLogs })
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Maintenance API GET error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch maintenance status' } },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/maintenance
 * Enable or disable maintenance mode
 */
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { enabled, message } = body as { enabled: boolean; message?: string }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'enabled field is required and must be boolean' } },
        { status: 400 }
      )
    }

    const maintenanceMessage = enabled ? (message || DEFAULT_MAINTENANCE_MESSAGE.ar) : null

    // Update or insert feature toggle
    const { error: toggleError } = await supabase
      .from('feature_toggles')
      .upsert({
        feature_name: 'maintenance_mode',
        is_enabled: enabled,
        description: maintenanceMessage,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'feature_name',
      })

    if (toggleError) {
      console.error('Error updating maintenance mode:', toggleError)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update maintenance mode' } },
        { status: 500 }
      )
    }

    // Log the action
    const { error: logError } = await supabase
      .from('maintenance_log')
      .insert({
        admin_id: user.id,
        action: enabled ? 'enabled' : 'disabled',
        message: maintenanceMessage,
      })

    if (logError) {
      console.error('Error logging maintenance action:', logError)
      // Don't fail the request, just log the error
    }

    // Get admin name for response
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single()

    const response: MaintenanceStatusResponse = {
      enabled,
      message: maintenanceMessage,
      enabledAt: enabled ? new Date().toISOString() : null,
      enabledBy: enabled ? profile?.display_name || null : null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Maintenance API PATCH error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update maintenance mode' } },
      { status: 500 }
    )
  }
}
