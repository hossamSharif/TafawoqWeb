'use client'

import Link from 'next/link'
import { Library, Plus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface LibraryEmptyStateProps {
  title?: string
  description?: string
  showCreateAction?: boolean
}

export function LibraryEmptyState({
  title = 'لا توجد اختبارات في المكتبة',
  description = 'كن أول من يشارك اختباراً! شارك اختباراتك لمساعدة الآخرين واكسب نقاط إضافية.',
  showCreateAction = true,
}: LibraryEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Library className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>

        {showCreateAction && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/exam/start">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إنشاء اختبار جديد
              </Button>
            </Link>
            <Link href="/forum">
              <Button variant="outline" className="gap-2">
                تصفح المنتدى
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
