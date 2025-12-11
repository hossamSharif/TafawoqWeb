import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * GET /api/profile
 * Retrieve current user's profile information
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

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'غير مصرح. يرجى تسجيل الدخول.' },
        { status: 401 }
      )
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile doesn't exist - create one
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: session.user.id,
            academic_track: 'scientific',
            onboarding_completed: false,
          })
          .select()
          .single()

        if (createError) {
          console.error('Profile creation error:', createError)
          return NextResponse.json(
            { error: 'فشل إنشاء الملف الشخصي' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          profile: newProfile,
        })
      }

      console.error('Profile retrieval error:', profileError)
      return NextResponse.json(
        { error: 'فشل استرداد الملف الشخصي' },
        { status: 500 }
      )
    }

    // Fetch subscription status
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', session.user.id)
      .single()

    // Fetch analytics data
    const { data: analytics } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        email: session.user.email,
      },
      subscription: subscription || { tier: 'free', status: 'active' },
      analytics: analytics || null,
    })
  } catch (error) {
    console.error('Unexpected profile error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile information
 */
export async function PATCH(request: NextRequest) {
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

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'غير مصرح. يرجى تسجيل الدخول.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { academicTrack } = body

    // Build update object with only allowed fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Validate and add academic track if provided
    if (academicTrack !== undefined) {
      if (!['scientific', 'literary'].includes(academicTrack)) {
        return NextResponse.json(
          { error: 'المسار الأكاديمي يجب أن يكون علمي أو أدبي' },
          { status: 400 }
        )
      }
      updateData.academic_track = academicTrack
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'فشل تحديث الملف الشخصي' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      profile: updatedProfile,
    })
  } catch (error) {
    console.error('Unexpected profile update error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
