import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// In-memory rate limiting store (in production, use Redis)
const resendAttempts = new Map<string, { count: number; lastAttempt: number }>()

const COOLDOWN_SECONDS = 60
const MAX_ATTEMPTS_PER_HOUR = 5

/**
 * POST /api/auth/resend-otp
 * Resend OTP code to user's email with rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
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

    // Check rate limiting
    const now = Date.now()
    const attempts = resendAttempts.get(email)

    if (attempts) {
      const timeSinceLastAttempt = (now - attempts.lastAttempt) / 1000

      // Check cooldown (60 seconds between attempts)
      if (timeSinceLastAttempt < COOLDOWN_SECONDS) {
        const remainingSeconds = Math.ceil(COOLDOWN_SECONDS - timeSinceLastAttempt)
        return NextResponse.json(
          {
            error: `يرجى الانتظار ${remainingSeconds} ثانية قبل طلب رمز جديد`,
            cooldownRemaining: remainingSeconds,
          },
          { status: 429 }
        )
      }

      // Check hourly limit
      const oneHourAgo = now - 60 * 60 * 1000
      if (attempts.lastAttempt > oneHourAgo && attempts.count >= MAX_ATTEMPTS_PER_HOUR) {
        return NextResponse.json(
          { error: 'تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة بعد ساعة.' },
          { status: 429 }
        )
      }

      // Reset count if more than an hour has passed
      if (attempts.lastAttempt < oneHourAgo) {
        resendAttempts.set(email, { count: 1, lastAttempt: now })
      } else {
        resendAttempts.set(email, { count: attempts.count + 1, lastAttempt: now })
      }
    } else {
      resendAttempts.set(email, { count: 1, lastAttempt: now })
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Resend the OTP
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('Resend OTP error:', error)

      // Handle specific error cases
      if (error.message.includes('already confirmed')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مؤكد مسبقاً. يمكنك تسجيل الدخول.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'فشل إرسال رمز التحقق. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
      cooldownSeconds: COOLDOWN_SECONDS,
    })
  } catch (error) {
    console.error('Unexpected resend OTP error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
