'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PhoneInput } from '@/components/ui/phone-input'
import { Loader2, Smartphone, Shield, Bell, Key } from 'lucide-react'

export default function PhoneCompletionPage() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!phoneNumber) {
      setError('يرجى إدخال رقم الجوال')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/profile/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل حفظ رقم الجوال')
      }

      // Success! Proceed to track selection
      router.push('/onboarding/track')
    } catch (err) {
      console.error('[Phone Completion] Error:', err)
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">أكمل ملفك الشخصي</CardTitle>
        <CardDescription>
          يرجى إدخال رقم جوالك السعودي لإكمال التسجيل والاستمرار
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Phone Input */}
          <PhoneInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            disabled={isLoading}
            required
          />

          {/* Why we need phone number */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">لماذا نحتاج رقم جوالك؟</p>
            </div>
            <ul className="space-y-2 mr-6">
              <li className="flex items-start gap-2 text-xs text-blue-800">
                <Key className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>استعادة حسابك في حالة فقدان الوصول</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-blue-800">
                <Bell className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>إرسال إشعارات مهمة حول حسابك</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-blue-800">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>حماية إضافية لحسابك وبياناتك</span>
              </li>
            </ul>
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-muted-foreground text-center">
            لن نشارك رقم جوالك مع أي جهة خارجية. نحن نحترم خصوصيتك.
          </p>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !phoneNumber}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'متابعة'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
