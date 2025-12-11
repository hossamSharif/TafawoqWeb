import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

    // Fetch user profile to check onboarding status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('academic_track, onboarding_completed')
      .eq('user_id', data.user.id)
      .single()

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
