import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, termsAccepted, privacyAccepted } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // Validate terms and privacy acceptance
    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json(
        { error: 'يجب الموافقة على الشروط وسياسة الخصوصية' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      )
    }

    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام' },
        { status: 400 }
      )
    }

    // Create Supabase admin client for registration
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Register the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
        },
      },
    })

    if (error) {
      console.error('Registration error:', error)

      // Handle specific error cases
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مسجل مسبقاً' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'فشل إنشاء الحساب' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error('Unexpected registration error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
