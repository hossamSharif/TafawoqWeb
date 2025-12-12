import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { validatePassword } from '@/lib/utils/password'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/auth/password/update
 * Update user password (when user has a valid session from reset link)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, accessToken } = body

    // Validate required fields
    if (!password) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة مطلوبة' },
        { status: 400 }
      )
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'جلسة غير صالحة. يرجى طلب رابط إعادة تعيين جديد.' },
        { status: 401 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || 'كلمة المرور غير صالحة' },
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

    // Verify the access token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      console.error('Token verification error:', userError)
      return NextResponse.json(
        { error: 'جلسة غير صالحة أو منتهية. يرجى طلب رابط إعادة تعيين جديد.' },
        { status: 401 }
      )
    }

    // Update the user's password using admin client
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'فشل في تحديث كلمة المرور. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.',
    })
  } catch (error) {
    console.error('Unexpected password update error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    )
  }
}
