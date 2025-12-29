import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { validateContactForm, type ContactFormData } from '@/lib/contact/validation'
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { EmailTemplate } from '@/components/contact/EmailTemplate'

/**
 * POST /api/contact - Handle contact form submissions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ContactFormData = await request.json()
    const { name, email, phone, subject, message } = body

    // Validate all required fields exist
    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // Validate form data
    const validationResult = validateContactForm(body)
    if (!validationResult.isValid) {
      const firstError = Object.values(validationResult.errors)[0]
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      )
    }

    // Rate limiting (3 submissions per hour per email)
    const rateLimitResult = checkRateLimit(`contact:${email}`, RATE_LIMIT_CONFIGS.CONTACT_FORM)

    if (!rateLimitResult.allowed) {
      const minutesRemaining = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 60000
      )

      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `لقد تجاوزت الحد الأقصى لإرسال الرسائل. يرجى المحاولة بعد ${minutesRemaining} دقيقة`,
          retry_after_minutes: minutesRemaining,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
            ),
            'X-RateLimit-Limit': String(RATE_LIMIT_CONFIGS.CONTACT_FORM.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt / 1000)),
          },
        }
      )
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return NextResponse.json(
        { error: 'خدمة البريد الإلكتروني غير متاحة حالياً' },
        { status: 500 }
      )
    }

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: 'Qudratak <noreply@qudratak.app>',
      to: ['hossamsharif1990@gmail.com'],
      replyTo: email, // User's email for easy reply
      subject: `رسالة جديدة من نموذج الاتصال: ${subject}`,
      react: EmailTemplate({
        name,
        email,
        phone,
        subject,
        message,
      }),
    })

    if (error) {
      console.error('Resend email error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة لاحقاً' },
        { status: 500 }
      )
    }

    console.log('Contact form email sent successfully:', {
      email_id: data?.id,
      from: email,
      subject,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'تم إرسال رسالتك بنجاح. سنتواصل معك قريباً',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً' },
      { status: 500 }
    )
  }
}
