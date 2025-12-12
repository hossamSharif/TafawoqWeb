'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { OTPInput } from '@/components/ui/otp-input'
import { Loader2, Mail, RefreshCw } from 'lucide-react'

export default function VerifyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Get email from session storage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('verificationEmail')
    if (!storedEmail) {
      router.push('/register')
      return
    }
    setEmail(storedEmail)
  }, [router])

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || otp.length !== 6) return

    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل التحقق')
      }

      // Clear stored email
      sessionStorage.removeItem('verificationEmail')

      // Redirect to onboarding
      router.push('/onboarding/track')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
      setOtp('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || cooldown > 0) return

    setError(null)
    setSuccess(null)
    setIsResending(true)

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.cooldownRemaining) {
          setCooldown(data.cooldownRemaining)
        }
        throw new Error(data.error || 'فشل إرسال الرمز')
      }

      setSuccess('تم إرسال رمز التحقق الجديد')
      setCooldown(data.cooldownSeconds || 60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">التحقق من البريد الإلكتروني</CardTitle>
        <CardDescription>
          أرسلنا رمز التحقق المكون من 6 أرقام إلى
          <br />
          <span className="font-medium text-foreground" dir="ltr">{email}</span>
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleVerify}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg border border-green-200">
              {success}
            </div>
          )}

          {/* OTP Input */}
          <div className="space-y-2">
            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-center text-muted-foreground">
              أدخل الرمز المكون من 6 أرقام
            </p>
          </div>

          {/* Resend OTP */}
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="text-muted-foreground hover:text-primary"
            >
              {isResending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="ml-2 h-4 w-4" />
                  إعادة الإرسال بعد {cooldown} ثانية
                </>
              ) : (
                <>
                  <RefreshCw className="ml-2 h-4 w-4" />
                  إعادة إرسال الرمز
                </>
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              'تأكيد الرمز'
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            <Link href="/register" className="text-primary hover:underline">
              تغيير البريد الإلكتروني
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
