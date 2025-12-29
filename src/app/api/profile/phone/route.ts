import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSaudiPhone } from '@/lib/validation/phone'
import { checkPhoneUnique } from '@/lib/validation/phone-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * PATCH /api/profile/phone
 * Update user's phone number
 * Validates format and uniqueness, then marks profile as completed
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Create auth client to get session
    const supabaseAuth = createServerClient(
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

    // Verify authentication
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'غير مصرح. يرجى تسجيل الدخول.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'رقم الجوال مطلوب' },
        { status: 400 }
      )
    }

    // Validate phone number format
    const validation = validateSaudiPhone(phoneNumber)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'رقم الجوال غير صحيح' },
        { status: 400 }
      )
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if phone number is already in use by another user
    const isUnique = await checkPhoneUnique(supabase, validation.formatted!, session.user.id)

    if (!isUnique) {
      return NextResponse.json(
        { error: 'رقم الجوال مستخدم بالفعل من قبل مستخدم آخر' },
        { status: 409 }
      )
    }

    // Update user profile with phone number
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        phone_number: validation.formatted,
        phone_verified: true, // Auto-verify in Phase 1 (no SMS OTP)
        profile_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[Phone API] Update error:', updateError)

      // Handle specific database errors
      if (updateError.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'رقم الجوال مستخدم بالفعل' },
          { status: 409 }
        )
      }

      if (updateError.code === '23514') {
        // Check constraint violation
        return NextResponse.json(
          { error: 'تنسيق رقم الجوال غير صحيح' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'فشل حفظ رقم الجوال. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      )
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'لم يتم العثور على ملف المستخدم' },
        { status: 404 }
      )
    }

    console.log('[Phone API] Phone number saved successfully:', {
      user_id: session.user.id,
      phone: validation.formatted,
    })

    return NextResponse.json({
      success: true,
      message: 'تم حفظ رقم الجوال بنجاح',
      profile: updatedProfile,
    })
  } catch (error) {
    console.error('[Phone API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    )
  }
}
