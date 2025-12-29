'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface TakeExamButtonProps {
  postId: string
  postType: 'exam_share' | 'practice_share'
  isAuthor: boolean
  userCompleted: boolean
  isAuthenticated: boolean
}

export function TakeExamButton({
  postId,
  postType,
  isAuthor,
  userCompleted,
  isAuthenticated,
}: TakeExamButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Don't show button if user is the post author
  if (isAuthor) {
    return null
  }

  // Show completion badge if user already completed
  if (userCompleted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span className="font-medium">تم الإكمال</span>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <Link href="/login?redirect=/forum">
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="w-4 h-4" />
          تسجيل الدخول للمشاركة
        </Button>
      </Link>
    )
  }

  const buttonText = postType === 'exam_share' ? 'ابدأ الاختبار' : 'ابدأ التمرين'
  const loadingText = 'جاري التحميل...'

  const handleStartExam = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/forum/posts/${postId}/start-exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()

        // Map status codes to Arabic error messages
        let errorMessage = 'حدث خطأ. حاول مرة أخرى.'

        switch (response.status) {
          case 401:
            errorMessage = 'يرجى تسجيل الدخول أولاً'
            break
          case 403:
            errorMessage = 'لا يمكنك حل اختبارك المشارك'
            break
          case 409:
            errorMessage = 'لقد أكملت هذا الاختبار من قبل'
            break
          case 404:
            errorMessage = 'الاختبار غير موجود'
            break
          case 503:
            errorMessage = 'المنتدى غير متاح حالياً'
            break
          default:
            errorMessage = error.error || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Navigate to the exam/practice page
      if (data.redirect_url) {
        router.push(data.redirect_url)
      } else {
        throw new Error('رابط الاختبار غير متوفر')
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ. حاول مرة أخرى.'
      toast.error(message)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleStartExam}
      disabled={isLoading}
      size="sm"
      className="gap-2 bg-primary hover:bg-primary/90"
      aria-label={`ابدأ ${postType === 'exam_share' ? 'الاختبار' : 'التمرين'}`}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          {buttonText}
        </>
      )}
    </Button>
  )
}
