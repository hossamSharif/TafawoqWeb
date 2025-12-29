/**
 * Email Template for Contact Form Submissions
 * Used by Resend to send email notifications
 */

interface EmailTemplateProps {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export function EmailTemplate({ name, email, phone, subject, message }: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', direction: 'rtl', padding: '20px', backgroundColor: '#f8f9fa' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#3B82F6', padding: '30px', textAlign: 'center' }}>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>رسالة جديدة من نموذج الاتصال</h1>
          <p style={{ color: '#E0F2FE', margin: '8px 0 0', fontSize: '14px' }}>قدراتك - Qudratak</p>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
          {/* Contact Info Card */}
          <div style={{ backgroundColor: '#F1F5F9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1E293B', fontSize: '18px', marginTop: 0, marginBottom: '16px' }}>معلومات المرسل</h2>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#64748B', fontSize: '14px', display: 'block', marginBottom: '4px' }}>الاسم:</span>
              <span style={{ color: '#1E293B', fontSize: '16px', fontWeight: '600' }}>{name}</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#64748B', fontSize: '14px', display: 'block', marginBottom: '4px' }}>البريد الإلكتروني:</span>
              <a href={`mailto:${email}`} style={{ color: '#3B82F6', fontSize: '16px', fontWeight: '600', textDecoration: 'none' }}>{email}</a>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#64748B', fontSize: '14px', display: 'block', marginBottom: '4px' }}>رقم الجوال:</span>
              <a href={`tel:${phone}`} style={{ color: '#3B82F6', fontSize: '16px', fontWeight: '600', textDecoration: 'none' }}>{phone}</a>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '14px', display: 'block', marginBottom: '4px' }}>الموضوع:</span>
              <span style={{ color: '#1E293B', fontSize: '16px', fontWeight: '600' }}>{subject}</span>
            </div>
          </div>

          {/* Message Card */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', border: '2px solid #E2E8F0', borderRadius: '8px' }}>
            <h2 style={{ color: '#1E293B', fontSize: '18px', marginTop: 0, marginBottom: '16px' }}>نص الرسالة:</h2>
            <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>{message}</p>
          </div>

          {/* Quick Reply Button */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <a
              href={`mailto:${email}?subject=رد: ${subject}`}
              style={{
                display: 'inline-block',
                backgroundColor: '#3B82F6',
                color: '#ffffff',
                padding: '12px 30px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
            >
              الرد على الرسالة
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: '#F8FAFC', padding: '20px', textAlign: 'center', borderTop: '1px solid #E2E8F0' }}>
          <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>
            تم إرسال هذه الرسالة من خلال نموذج الاتصال في موقع قدراتك
          </p>
          <p style={{ color: '#CBD5E1', fontSize: '11px', margin: '8px 0 0' }}>
            © {new Date().getFullYear()} Qudratak. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  )
}
