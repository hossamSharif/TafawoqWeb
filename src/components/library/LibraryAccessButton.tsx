'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Unlock, Play, CheckCircle2, Loader2, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LibraryUpgradePrompt } from './LibraryUpgradePrompt'
import type { UserLibraryAccess } from '@/types/library'

interface LibraryAccessButtonProps {
  postId: string
  userHasAccess: boolean
  userCompleted: boolean
  userAccess: UserLibraryAccess
  onAccessGranted?: () => void
}

export function LibraryAccessButton({
  postId,
  userHasAccess,
  userCompleted,
  userAccess,
  onAccessGranted,
}: LibraryAccessButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequestAccess = async () => {
    // Check if user can access more
    if (!userAccess.canAccessMore) {
      setShowUpgradePrompt(true)
      return
    }

    // For free users, show confirmation since they have limited access
    if (userAccess.tier === 'free') {
      setShowConfirmDialog(true)
      return
    }

    // For premium users, grant access directly
    await grantAccess()
  }

  const grantAccess = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/library/${postId}/access`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.upgradeRequired) {
          setShowUpgradePrompt(true)
          return
        }
        throw new Error(data.error || 'فشل في الحصول على الوصول')
      }

      onAccessGranted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const handleStartExam = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/library/${postId}/start`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في بدء الاختبار')
      }

      // Redirect to the exam page with the session ID
      router.push(`/exam/${data.sessionId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
      setIsLoading(false)
    }
  }

  // Already completed
  if (userCompleted) {
    return (
      <div className="space-y-2">
        <Button disabled className="w-full gap-2" variant="secondary">
          <CheckCircle2 className="w-4 h-4" />
          تم إكمال هذا الاختبار
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          يمكنك مراجعة نتائجك في سجل الاختبارات
        </p>
      </div>
    )
  }

  // Has access but not completed
  if (userHasAccess) {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleStartExam}
          disabled={isLoading}
          className="w-full gap-2"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل الاختبار...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              بدء الاختبار
            </>
          )}
        </Button>
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
      </div>
    )
  }

  // No access yet
  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={handleRequestAccess}
          disabled={isLoading}
          className="w-full gap-2"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري المعالجة...
            </>
          ) : userAccess.tier === 'premium' ? (
            <>
              <Crown className="w-4 h-4" />
              فتح الاختبار
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" />
              فتح الاختبار
            </>
          )}
        </Button>

        {userAccess.tier === 'free' && userAccess.canAccessMore && (
          <p className="text-xs text-muted-foreground text-center">
            متبقي لك {(userAccess.accessLimit ?? 0) - userAccess.accessUsed} وصول من المكتبة
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
      </div>

      {/* Confirmation Dialog for Free Users */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الوصول للاختبار</AlertDialogTitle>
            <AlertDialogDescription>
              أنت على وشك استخدام الوصول المجاني الوحيد لمكتبة الاختبارات.
              بعد ذلك ستحتاج للترقية إلى الحساب المميز للوصول لاختبارات أخرى.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={grantAccess} disabled={isLoading}>
              {isLoading ? 'جاري المعالجة...' : 'تأكيد'}
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Prompt */}
      <LibraryUpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        userAccess={userAccess}
      />
    </>
  )
}
