import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/auth/login
 * Sign in an existing user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'صيغة البريد الإلكتروني غير صحيحة' },
        { status: 400 }
      )
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)

      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
          { status: 401 }
        )
      }

      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          {
            error: 'لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من بريدك.',
            requiresVerification: true,
          },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      )
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'فشل تسجيل الدخول' },
        { status: 500 }
      )
    }

    // Fetch user profile to check onboarding and phone completion status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('academic_track, onboarding_completed, profile_completed, phone_number')
      .eq('user_id', data.user.id)
      .single()

    // Set session cookies for server-side authentication
    const cookieStore = await cookies()

    // Create the server client to properly set cookies
    const supabaseServer = createServerClient(
      supabaseUrl,
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

    // Set the session using the tokens from the login
    await supabaseServer.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    // Check if user needs to complete phone number
    const requiresPhone = profile ? !profile.profile_completed : false

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at !== null,
      },
      profile: profile || null,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
      requiresPhone, // Signal frontend to redirect to phone completion
      requiresOnboarding: !profile?.onboarding_completed,
    })
  } catch (error) {
    console.error('Unexpected login error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
