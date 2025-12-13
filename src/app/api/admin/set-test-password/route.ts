import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/admin/set-test-password
 * TEMPORARY: Set password for testing - DELETE AFTER TESTING
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, newPassword } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error('Admin password update error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    console.error('Admin password catch error:', error)
    return NextResponse.json({
      error: 'Failed to update password',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
