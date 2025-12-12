'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowRight, Mail, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إرسال رابط إعادة التعيين')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">تحقق من بريدك الإلكتروني</CardTitle>
          <CardDescription>
            تم إرسال رابط إعادة تعيين كلمة المرور إلى
            <br />
            <span className="font-medium text-foreground" dir="ltr">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-2">
            <p className="flex items-start gap-2">
              <Mail className="h-5 w-5 mt-0.5 shrink-0" />
              <span>
                افتح بريدك الإلكتروني واضغط على الرابط لإعادة تعيين كلمة المرور.
                الرابط صالح لمدة ساعة واحدة.
              </span>
            </p>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            لم يصلك البريد؟ تحقق من مجلد البريد غير المرغوب فيه أو{' '}
            <button
              onClick={() => {
                setSuccess(false)
                setEmail('')
              }}
              className="text-primary hover:underline font-medium"
            >
              حاول مرة أخرى
            </button>
          </p>
        </CardContent>

        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة لتسجيل الدخول
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">نسيت كلمة المرور؟</CardTitle>
        <CardDescription>
          أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              dir="ltr"
              className="text-left"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              'إرسال رابط إعادة التعيين'
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
