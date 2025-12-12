'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { validatePassword } from '@/lib/utils/password'
import { supabase } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = searchParams // Keep useSearchParams usage for URL hash handling

  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: [] as string[],
  })

  // Validate password on change
  useEffect(() => {
    if (formData.password) {
      const validation = validatePassword(formData.password)
      setPasswordValidation(validation)
    } else {
      setPasswordValidation({ isValid: false, errors: [] })
    }
  }, [formData.password])

  // Handle the password reset token from URL hash
  useEffect(() => {
    const handleHashParams = async () => {
      setIsValidating(true)

      // Supabase sends tokens in the URL hash for password reset
      // Format: #access_token=xxx&refresh_token=xxx&type=recovery
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)

      const token = params.get('access_token')
      const type = params.get('type')

      if (token && type === 'recovery') {
        // Verify the session with Supabase
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: params.get('refresh_token') || '',
        })

        if (error || !session) {
          setTokenValid(false)
          setError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية.')
        } else {
          setTokenValid(true)
          setAccessToken(token)
        }
      } else {
        // Check if there's already a recovery session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setTokenValid(true)
          setAccessToken(session.access_token)
        } else {
          setTokenValid(false)
          setError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية.')
        }
      }

      setIsValidating(false)
    }

    handleHashParams()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    // Validate password strength
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0] || 'كلمة المرور غير صالحة')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: formData.password,
          accessToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في تحديث كلمة المرور')
      }

      // Sign out the recovery session
      await supabase.auth.signOut()

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while validating token
  if (isValidating) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">جاري التحقق من الرابط...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">رابط غير صالح</CardTitle>
          <CardDescription>
            {error || 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية.'}
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex flex-col gap-4">
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">
              طلب رابط جديد
            </Button>
          </Link>

          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة لتسجيل الدخول
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Success state
  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">تم تحديث كلمة المرور</CardTitle>
          <CardDescription>
            تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
          </CardDescription>
        </CardHeader>

        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">
              تسجيل الدخول
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Password reset form
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">إعادة تعيين كلمة المرور</CardTitle>
        <CardDescription>
          أدخل كلمة المرور الجديدة
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
            <PasswordInput
              id="password"
              placeholder="أدخل كلمة المرور الجديدة"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
              dir="ltr"
              className="text-left"
            />
            {formData.password && !passwordValidation.isValid && (
              <ul className="text-xs text-red-600 space-y-1 mt-2">
                {passwordValidation.errors.map((err, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-red-600" />
                    {err}
                  </li>
                ))}
              </ul>
            )}
            {formData.password && passwordValidation.isValid && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                كلمة المرور قوية
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="أعد إدخال كلمة المرور"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
              dir="ltr"
              className="text-left"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600">كلمات المرور غير متطابقة</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                كلمات المرور متطابقة
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !passwordValidation.isValid ||
              formData.password !== formData.confirmPassword
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              'تحديث كلمة المرور'
            )}
          </Button>

          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة لتسجيل الدخول
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}

function ResetPasswordFormFallback() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFormFallback />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
