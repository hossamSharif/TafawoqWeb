'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { CONTACT_LIMITS } from '@/lib/contact/validation'

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Field validation
  const nameLength = name.length
  const emailLength = email.length
  const phoneLength = phone.length
  const subjectLength = subject.length
  const messageLength = message.length

  const isNameValid = nameLength >= CONTACT_LIMITS.NAME_MIN_LENGTH && nameLength <= CONTACT_LIMITS.NAME_MAX_LENGTH
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && emailLength <= CONTACT_LIMITS.EMAIL_MAX_LENGTH
  const isPhoneValid = phoneLength >= CONTACT_LIMITS.PHONE_MIN_LENGTH && phoneLength <= CONTACT_LIMITS.PHONE_MAX_LENGTH
  const isSubjectValid = subjectLength >= CONTACT_LIMITS.SUBJECT_MIN_LENGTH && subjectLength <= CONTACT_LIMITS.SUBJECT_MAX_LENGTH
  const isMessageValid = messageLength >= CONTACT_LIMITS.MESSAGE_MIN_LENGTH && messageLength <= CONTACT_LIMITS.MESSAGE_MAX_LENGTH

  const isFormValid = isNameValid && isEmailValid && isPhoneValid && isSubjectValid && isMessageValid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!isFormValid) {
      setError('يرجى ملء جميع الحقول بشكل صحيح')
      return
    }

    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryMinutes = data.retry_after_minutes || 'بعض'
          setError(`لقد تجاوزت الحد الأقصى لإرسال الرسائل. يرجى المحاولة بعد ${retryMinutes} دقيقة`)
        } else {
          setError(data.error || data.message || 'حدث خطأ أثناء إرسال الرسالة')
        }
        return
      }

      // Success
      setSuccess(true)
      setError(null)

      // Reset form
      setName('')
      setEmail('')
      setPhone('')
      setSubject('')
      setMessage('')

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (err) {
      console.error('Contact form error:', err)
      setError('حدث خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>أرسل لنا رسالة</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                تم إرسال رسالتك بنجاح. سنتواصل معك قريباً عبر البريد الإلكتروني أو الهاتف.
              </AlertDescription>
            </Alert>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              الاسم الكامل <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل"
              maxLength={CONTACT_LIMITS.NAME_MAX_LENGTH}
              disabled={isLoading}
              className={!isNameValid && nameLength > 0 ? 'border-destructive' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>الاسم الذي ترغب أن نناديك به</span>
              <span className={nameLength > CONTACT_LIMITS.NAME_MAX_LENGTH ? 'text-destructive' : ''}>
                {nameLength}/{CONTACT_LIMITS.NAME_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">
              البريد الإلكتروني <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              maxLength={CONTACT_LIMITS.EMAIL_MAX_LENGTH}
              disabled={isLoading}
              className={!isEmailValid && emailLength > 0 ? 'border-destructive' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>سنستخدمه للرد على رسالتك</span>
              <span className={emailLength > CONTACT_LIMITS.EMAIL_MAX_LENGTH ? 'text-destructive' : ''}>
                {emailLength}/{CONTACT_LIMITS.EMAIL_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              رقم الجوال <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="رقم الجوال (مثال: +966501234567)"
              maxLength={CONTACT_LIMITS.PHONE_MAX_LENGTH}
              disabled={isLoading}
              className={!isPhoneValid && phoneLength > 0 ? 'border-destructive' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>يفضل استخدام الصيغة الدولية (+966...)</span>
              <span className={phoneLength > CONTACT_LIMITS.PHONE_MAX_LENGTH ? 'text-destructive' : ''}>
                {phoneLength}/{CONTACT_LIMITS.PHONE_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              الموضوع <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع الرسالة"
              maxLength={CONTACT_LIMITS.SUBJECT_MAX_LENGTH}
              disabled={isLoading}
              className={!isSubjectValid && subjectLength > 0 ? 'border-destructive' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>عنوان مختصر لموضوع رسالتك</span>
              <span className={subjectLength > CONTACT_LIMITS.SUBJECT_MAX_LENGTH ? 'text-destructive' : ''}>
                {subjectLength}/{CONTACT_LIMITS.SUBJECT_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message">
              الرسالة <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              rows={6}
              maxLength={CONTACT_LIMITS.MESSAGE_MAX_LENGTH}
              disabled={isLoading}
              className={!isMessageValid && messageLength > 0 ? 'border-destructive' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>اشرح لنا كيف يمكننا مساعدتك</span>
              <span className={messageLength > CONTACT_LIMITS.MESSAGE_MAX_LENGTH ? 'text-destructive' : ''}>
                {messageLength}/{CONTACT_LIMITS.MESSAGE_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال الرسالة
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
