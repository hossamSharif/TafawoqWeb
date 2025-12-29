import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * PATCH /api/profile/onboarding
 * Complete user onboarding - sets academic track and marks onboarding as complete
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Use server client to get the session from cookies
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

    // Get current session
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'غير مصرح. يرجى تسجيل الدخول.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { academicTrack, subscriptionPlan } = body

    // Validate academic track
    if (!academicTrack || !['scientific', 'literary'].includes(academicTrack)) {
      return NextResponse.json(
        { error: 'يجب اختيار المسار الأكاديمي (علمي أو أدبي)' },
        { status: 400 }
      )
    }

    // Use service role client for database operations (bypasses RLS for initial profile setup)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if user profile exists
    const { data: currentProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, email')
      .eq('user_id', session.user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Profile check error:', checkError)
      return NextResponse.json(
        { error: 'فشل التحقق من الملف الشخصي' },
        { status: 500 }
      )
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile check error:', profileError)
      return NextResponse.json(
        { error: 'فشل التحقق من الملف الشخصي' },
        { status: 500 }
      )
    }

    let updatedProfile

    if (!existingProfile) {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: session.user.id,
          email: session.user.email,
          display_name: session.user.email?.split('@')[0] || 'مستخدم',
          academic_track: academicTrack,
          onboarding_completed: true,
          total_practice_hours: 0,
          is_admin: false,
          is_banned: false,
          is_disabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
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
      updatedProfile = newProfile
    } else {
      // Update existing profile
      const { data: profile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          academic_track: academicTrack,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
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
      updatedProfile = profile
    }

    // Create subscription record if needed
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!existingSubscription) {
      // Create free subscription by default
      const subscriptionTier = subscriptionPlan === 'premium' ? 'premium' : 'free'
      const subscriptionStatus = subscriptionPlan === 'premium' ? 'trialing' : 'active'

      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: session.user.id,
          tier: subscriptionTier,
          status: subscriptionStatus,
          trial_end_at: subscriptionPlan === 'premium'
            ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days trial
            : null,
        })

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError)
        // Don't fail onboarding if subscription creation fails
      }
    }

    // Create or update user analytics
    const { data: existingAnalytics } = await supabase
      .from('user_analytics')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!existingAnalytics) {
      const { error: analyticsError } = await supabase
        .from('user_analytics')
        .insert({
          user_id: session.user.id,
        })

      if (analyticsError) {
        console.error('Analytics creation error:', analyticsError)
        // Don't fail onboarding if analytics creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم إكمال عملية التسجيل بنجاح',
      profile: updatedProfile,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    console.error('Unexpected onboarding error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
