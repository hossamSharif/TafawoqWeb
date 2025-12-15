// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
/**
 * Grace Period Expiry Processing API
 * T087: Implement grace period expiry handling
 *
 * POST /api/admin/grace-period - Process expired grace periods
 * This endpoint should be called by a scheduled job (cron) to auto-downgrade
 * users whose grace periods have expired.
 *
 * Security: Requires admin auth or API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { processExpiredGracePeriods } from '@/lib/subscription'

/**
 * Get admin Supabase client
 */
function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/admin/grace-period
 * Process expired grace periods and downgrade users
 *
 * Can be called:
 * 1. By admin user (authenticated)
 * 2. By cron job with API key header
 */
export async function POST(request: NextRequest) {
  // Check for cron API key or admin authentication
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Check cron secret if provided
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (cronSecret && token === cronSecret) {
      // Valid cron request
      const supabaseAdmin = getSupabaseAdmin()
      const result = await processExpiredGracePeriods(supabaseAdmin)

      console.log(`[Grace Period Cron] Processed ${result.processed} expired grace periods`)
      if (result.errors.length > 0) {
        console.error('[Grace Period Cron] Errors:', result.errors)
      }

      return NextResponse.json({
        success: true,
        processed: result.processed,
        errors: result.errors,
      })
    }
  }

  // Otherwise, check for admin authentication
  const supabaseAdmin = getSupabaseAdmin()

  // Get session from cookie
  const { createServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    )
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json(
      { error: 'صلاحيات المسؤول مطلوبة' },
      { status: 403 }
    )
  }

  // Process expired grace periods
  const result = await processExpiredGracePeriods(supabaseAdmin)

  console.log(`[Grace Period Admin] Processed ${result.processed} expired grace periods by admin ${user.id}`)
  if (result.errors.length > 0) {
    console.error('[Grace Period Admin] Errors:', result.errors)
  }

  return NextResponse.json({
    success: true,
    processed: result.processed,
    errors: result.errors,
    executedBy: user.id,
  })
}

/**
 * GET /api/admin/grace-period
 * Get list of users in grace period (admin only)
 */
export async function GET(_request: NextRequest) {
  const { createServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    )
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json(
      { error: 'صلاحيات المسؤول مطلوبة' },
      { status: 403 }
    )
  }

  // Get all users in grace period
  const supabaseAdmin = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data: inGracePeriod, error: graceError } = await supabaseAdmin
    .from('user_subscriptions')
    .select(`
      user_id,
      grace_period_end,
      payment_failed_at,
      downgrade_scheduled,
      user_profiles!inner (
        display_name
      )
    `)
    .not('grace_period_end', 'is', null)
    .gte('grace_period_end', now)

  if (graceError) {
    console.error('Error fetching grace period users:', graceError)
    return NextResponse.json(
      { error: 'فشل في جلب البيانات' },
      { status: 500 }
    )
  }

  // Get users with expired grace periods pending processing
  const { data: expiredPending, error: expiredError } = await supabaseAdmin
    .from('user_subscriptions')
    .select(`
      user_id,
      grace_period_end,
      payment_failed_at,
      downgrade_scheduled,
      user_profiles!inner (
        display_name
      )
    `)
    .not('grace_period_end', 'is', null)
    .lt('grace_period_end', now)
    .eq('downgrade_scheduled', true)

  if (expiredError) {
    console.error('Error fetching expired grace periods:', expiredError)
  }

  return NextResponse.json({
    inGracePeriod: inGracePeriod || [],
    expiredPendingDowngrade: expiredPending || [],
    currentTime: now,
  })
}
