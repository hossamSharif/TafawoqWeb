/**
 * Email Template for Admin Review Notifications
 * Sent when a user submits a new review
 */

interface AdminReviewNotificationEmailProps {
  reviewerName: string
  reviewerEmail: string
  rating: number
  reviewText: string
  reviewId: string
  submittedAt: string
}

export function AdminReviewNotificationEmail({
  reviewerName,
  reviewerEmail,
  rating,
  reviewText,
  reviewId,
  submittedAt,
}: AdminReviewNotificationEmailProps) {
  const adminDashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/reviews`
  const reviewUrl = `${adminDashboardUrl}?highlight=${reviewId}`

  // Generate stars display
  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', direction: 'rtl', padding: '20px', backgroundColor: '#f8f9fa' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#3B82F6', padding: '30px', textAlign: 'center' }}>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>مراجعة جديدة للتطبيق</h1>
          <p style={{ color: '#E0F2FE', margin: '8px 0 0', fontSize: '14px' }}>قدراتك - Qudratak</p>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
          {/* Rating Display */}
          <div style={{ textAlign: 'center', marginBottom: '20px', padding: '20px', backgroundColor: '#F1F5F9', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stars}</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>
              {rating} من 5 نجوم
            </div>
          </div>

          {/* Reviewer Info */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1E293B', fontSize: '18px', marginTop: 0, marginBottom: '16px' }}>معلومات المراجع</h2>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#64748B', fontSize: '14px', display: 'block', marginBottom: '4px' }}>الاسم:</span>
              <span style={{ color: '#1E293B', fontSize: '16px', fontWeight: '600' }}>{reviewerName}</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#64748B', fontSize: '14px', display: 'block', marginBottom: '4px' }}>البريد الإلكتروني:</span>
              <a href={`mailto:${reviewerEmail}`} style={{ color: '#3B82F6', fontSize: '16px', fontWeight: '600', textDecoration: 'none' }}>{reviewerEmail}</a>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '14px', display: 'block', marginBottom: '4px' }}>تاريخ الإرسال:</span>
              <span style={{ color: '#1E293B', fontSize: '16px', fontWeight: '600' }}>{submittedAt}</span>
            </div>
          </div>

          {/* Review Text */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', border: '2px solid #E2E8F0', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1E293B', fontSize: '18px', marginTop: 0, marginBottom: '16px' }}>نص المراجعة:</h2>
            <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>{reviewText}</p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a
              href={reviewUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#3B82F6',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
            >
              عرض في لوحة الإدارة
            </a>
            <a
              href={adminDashboardUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#ffffff',
                color: '#3B82F6',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                border: '2px solid #3B82F6'
              }}
            >
              جميع المراجعات
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: '#F8FAFC', padding: '20px', textAlign: 'center', borderTop: '1px solid #E2E8F0' }}>
          <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>
            هذه المراجعة تم نشرها تلقائياً وهي متاحة للعامة
          </p>
          <p style={{ color: '#CBD5E1', fontSize: '11px', margin: '8px 0 0' }}>
            © {new Date().getFullYear()} Qudratak. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  )
}
