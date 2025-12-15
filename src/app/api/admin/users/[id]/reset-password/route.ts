import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess, resetUserPassword } from '@/lib/admin/queries'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id: userId } = await params

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

    // Trigger password reset
    await resetUserPassword(user.id, userId)

    return NextResponse.json({
      message: 'Password reset email sent',
    })
  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to reset password' } },
      { status: 500 }
    )
  }
}
