import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/auth/verify-otp
 * Verify OTP code sent to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    // Validate required fields
    if (!email || !token) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني ورمز التحقق مطلوبان' },
        { status: 400 }
      )
    }

    // Validate token format (6 digits)
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: 'رمز التحقق يجب أن يكون 6 أرقام' },
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

    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })

    if (error) {
      console.error('OTP verification error:', error)

      // Handle specific error cases
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.' },
          { status: 400 }
        )
      }

      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'رمز التحقق غير صحيح' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'فشل التحقق من الرمز. يرجى المحاولة مرة أخرى.' },
        { status: 400 }
      )
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'فشل التحقق من الحساب' },
        { status: 500 }
      )
    }

    // Create response with session cookies
    const response = NextResponse.json({
      success: true,
      message: 'تم التحقق من البريد الإلكتروني بنجاح',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at !== null,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    })

    return response
  } catch (error) {
    console.error('Unexpected OTP verification error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
