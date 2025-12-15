import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess, getFeatureToggles } from '@/lib/admin/queries'

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

    // Get feature toggles
    const features = await getFeatureToggles()

    return NextResponse.json({ features })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch settings' } },
      { status: 500 }
    )
  }
}
