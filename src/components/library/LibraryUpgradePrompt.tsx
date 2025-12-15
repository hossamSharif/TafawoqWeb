'use client'

import Link from 'next/link'
import { Crown, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { brand } from '@/lib/brand'
import type { UserLibraryAccess } from '@/types/library'

interface LibraryUpgradePromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userAccess: UserLibraryAccess
}

export function LibraryUpgradePrompt({
  open,
  onOpenChange,
  userAccess,
}: LibraryUpgradePromptProps) {
  const freeLimits = brand.subscription.free.limits
  const premiumLimits = brand.subscription.premium.limits

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            ترقية إلى الحساب المميز
          </DialogTitle>
          <DialogDescription>
            لقد وصلت إلى الحد الأقصى للوصول المجاني للمكتبة ({userAccess.accessUsed}/{userAccess.accessLimit}).
            ترقَّ الآن للحصول على وصول غير محدود!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Free Column */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-semibold mb-2 text-muted-foreground">المجاني</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-destructive" />
                  <span>{freeLimits.libraryAccessCount} اختبار من المكتبة</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 flex-shrink-0" />
                  <span>{freeLimits.examsPerMonth} اختبارات/شهر</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 flex-shrink-0" />
                  <span>{freeLimits.examSharesPerMonth} مشاركات</span>
                </li>
              </ul>
            </div>

            {/* Premium Column */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="font-semibold mb-2 text-primary">المميز</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>وصول غير محدود</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{premiumLimits.examsPerMonth} اختبارات/شهر</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{premiumLimits.examSharesPerMonth} مشاركات</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Price */}
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {brand.subscription.premium.price} ر.س
              <span className="text-sm font-normal text-muted-foreground">/شهر</span>
            </p>
            {brand.subscription.premium.originalPrice && (
              <p className="text-sm text-muted-foreground line-through">
                {brand.subscription.premium.originalPrice} ر.س
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/subscription" onClick={() => onOpenChange(false)}>
            <Button className="w-full gap-2">
              <Crown className="w-4 h-4" />
              ترقية الآن
            </Button>
          </Link>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ربما لاحقاً
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
