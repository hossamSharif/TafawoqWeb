import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /auth/callback
 * OAuth callback handler for Google authentication
 * Routes users based on profile completion status
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('[OAuth Callback] Error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed&message=${encodeURIComponent(errorDescription || 'حدث خطأ في تسجيل الدخول')}`, requestUrl.origin)
    )
  }

  // Code is required for token exchange
  if (!code) {
    console.error('[OAuth Callback] No authorization code provided')
    return NextResponse.redirect(
      new URL('/login?error=no_code', requestUrl.origin)
    )
  }

  try {
    const cookieStore = await cookies()

    // Create auth client for session management
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

    // Exchange code for session
    const { error: exchangeError } = await supabaseAuth.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[OAuth Callback] Session exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL(`/login?error=session_failed&message=${encodeURIComponent('فشل إنشاء الجلسة')}`, requestUrl.origin)
      )
    }

    // Get user info
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()

    if (userError || !user) {
      console.error('[OAuth Callback] User fetch error:', userError)
      return NextResponse.redirect(
        new URL('/login?error=user_fetch_failed', requestUrl.origin)
      )
    }

    console.log('[OAuth Callback] User authenticated:', user.id, user.email)

    // Use service role client to check/create profile (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[OAuth Callback] Profile check error:', profileError)
      return NextResponse.redirect(
        new URL('/login?error=profile_check_failed', requestUrl.origin)
      )
    }

    // New user - create profile
    if (!profile) {
      console.log('[OAuth Callback] Creating new profile for user:', user.id)

      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          display_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'مستخدم',
          academic_track: 'scientific', // Default, will be updated during onboarding
          auth_provider: 'google',
          onboarding_completed: false,
          profile_completed: false,
        })

      if (createError) {
        console.error('[OAuth Callback] Profile creation error:', createError)
        return NextResponse.redirect(
          new URL('/login?error=profile_creation_failed', requestUrl.origin)
        )
      }

      // Redirect new OAuth user to phone completion
      console.log('[OAuth Callback] Redirecting new user to phone completion')
      return NextResponse.redirect(new URL('/onboarding/phone', requestUrl.origin))
    }

    // Existing user - check profile completion status
    console.log('[OAuth Callback] Existing profile found:', {
      profile_completed: profile.profile_completed,
      onboarding_completed: profile.onboarding_completed,
      has_phone: !!profile.phone_number,
    })

    // Phone number not completed - redirect to phone page
    if (!profile.profile_completed) {
      console.log('[OAuth Callback] User needs to complete phone')
      return NextResponse.redirect(new URL('/onboarding/phone', requestUrl.origin))
    }

    // Profile completed but onboarding not done - redirect to track selection
    if (!profile.onboarding_completed) {
      console.log('[OAuth Callback] User needs to complete onboarding')
      return NextResponse.redirect(new URL('/onboarding/track', requestUrl.origin))
    }

    // Everything completed - go to dashboard
    console.log('[OAuth Callback] User fully onboarded, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  } catch (error) {
    console.error('[OAuth Callback] Unexpected error:', error)
    return NextResponse.redirect(
      new URL('/login?error=unexpected&message=' + encodeURIComponent('حدث خطأ غير متوقع'), requestUrl.origin)
    )
  }
}
