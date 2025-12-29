import { Resend } from 'resend'
import { AdminReviewNotificationEmail } from '@/components/reviews/AdminReviewNotificationEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAdminReviewNotification(review: {
  id: string
  rating: number
  review_text: string
  created_at: string
  user: {
    display_name: string | null
    email?: string
  }
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return
  }

  if (!process.env.ADMIN_REVIEW_EMAIL) {
    console.warn('ADMIN_REVIEW_EMAIL not configured, skipping email')
    return
  }

  try {
    const reviewerName = review.user.display_name || review.user.email?.split('@')[0] || 'مستخدم'
    const reviewerEmail = review.user.email || 'unknown@example.com'
    const submittedAt = new Date(review.created_at).toLocaleString('ar-SA', {
      dateStyle: 'long',
      timeStyle: 'short',
    })

    const { data, error } = await resend.emails.send({
      from: 'Qudratak Reviews <noreply@qudratak.app>',
      to: [process.env.ADMIN_REVIEW_EMAIL],
      subject: `مراجعة جديدة: ${review.rating} نجوم من ${reviewerName}`,
      react: AdminReviewNotificationEmail({
        reviewerName,
        reviewerEmail,
        rating: review.rating,
        reviewText: review.review_text,
        reviewId: review.id,
        submittedAt,
      }),
    })

    if (error) {
      console.error('Failed to send admin review notification:', error)
      return
    }

    console.log('Admin review notification sent:', { email_id: data?.id, review_id: review.id })
  } catch (error) {
    console.error('Error sending admin review notification:', error)
  }
}
