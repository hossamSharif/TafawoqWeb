import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * PATCH /api/profile/track
 * Update user's academic track (scientific/literary)
 * This affects the question distribution in full exams
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
    const { track } = body

    // Validate track value
    if (!track || !['scientific', 'literary'].includes(track)) {
      return NextResponse.json(
        { error: 'المسار الأكاديمي يجب أن يكون علمي (scientific) أو أدبي (literary)' },
        { status: 400 }
      )
    }

    // Check if user has any in-progress exam sessions
    const { data: activeExams, error: examError } = await supabase
      .from('exam_sessions')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('status', 'in_progress')
      .limit(1)

    if (examError) {
      console.error('Error checking active exams:', examError)
    }

    if (activeExams && activeExams.length > 0) {
      return NextResponse.json(
        {
          error: 'لا يمكن تغيير المسار الأكاديمي أثناء وجود اختبار قيد التقدم',
          hasActiveExam: true
        },
        { status: 409 }
      )
    }

    // Get current profile to check if track is changing
    const { data: currentProfile, error: profileFetchError } = await supabase
      .from('user_profiles')
      .select('academic_track')
      .eq('user_id', session.user.id)
      .single()

    if (profileFetchError) {
      console.error('Error fetching current profile:', profileFetchError)
      return NextResponse.json(
        { error: 'فشل في استرداد الملف الشخصي' },
        { status: 500 }
      )
    }

    const previousTrack = currentProfile?.academic_track

    // Update academic track
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        academic_track: track,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile track update error:', updateError)
      return NextResponse.json(
        { error: 'فشل تحديث المسار الأكاديمي' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: track === previousTrack
        ? 'المسار الأكاديمي لم يتغير'
        : 'تم تحديث المسار الأكاديمي بنجاح',
      profile: updatedProfile,
      previousTrack,
      newTrack: track,
      trackChanged: track !== previousTrack,
    })
  } catch (error) {
    console.error('Unexpected track update error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
