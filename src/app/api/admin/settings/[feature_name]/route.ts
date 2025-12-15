import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess, updateFeatureToggle } from '@/lib/admin/queries'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ feature_name: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { feature_name: featureName } = await params

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
    const { is_enabled } = body

    if (typeof is_enabled !== 'boolean') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'is_enabled must be a boolean' } },
        { status: 400 }
      )
    }

    // Update feature toggle
    const updated = await updateFeatureToggle(user.id, featureName, is_enabled)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update setting API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update setting' } },
      { status: 500 }
    )
  }
}
