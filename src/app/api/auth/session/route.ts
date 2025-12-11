import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * GET /api/auth/session
 * Retrieve current user session and profile information
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session retrieval error:', sessionError)
      return NextResponse.json(
        { error: 'فشل استرداد الجلسة' },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        profile: null,
        subscription: null,
      })
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile retrieval error:', profileError)
    }

    // Fetch subscription status
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Subscription retrieval error:', subscriptionError)
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        emailVerified: session.user.email_confirmed_at !== null,
        createdAt: session.user.created_at,
      },
      profile: profile || null,
      subscription: subscription || null,
      session: {
        expiresAt: session.expires_at,
      },
    })
  } catch (error) {
    console.error('Unexpected session error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
