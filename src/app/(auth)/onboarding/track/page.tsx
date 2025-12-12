'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BookOpen, Calculator, CheckCircle2 } from 'lucide-react'

type AcademicTrack = 'scientific' | 'literary'

export default function TrackSelectionPage() {
  const router = useRouter()
  const [selectedTrack, setSelectedTrack] = useState<AcademicTrack | null>(null)

  const handleContinue = () => {
    if (selectedTrack) {
      sessionStorage.setItem('selectedTrack', selectedTrack)
      router.push('/onboarding/plan')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">اختر مسارك الأكاديمي</CardTitle>
        <CardDescription>
          سيتم تخصيص الأسئلة بناءً على مسارك الدراسي
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Scientific Track */}
          <button
            onClick={() => setSelectedTrack('scientific')}
            className={cn(
              'relative p-6 rounded-xl border-2 text-right transition-all',
              'hover:border-primary/50 hover:bg-primary/5',
              selectedTrack === 'scientific'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-white'
            )}
          >
            {selectedTrack === 'scientific' && (
              <div className="absolute top-3 left-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mb-4',
              selectedTrack === 'scientific' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            )}>
              <Calculator className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">المسار العلمي</h3>
            <p className="text-sm text-muted-foreground mb-4">للطلاب الذين يدرسون المسار العلمي</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />~60% أسئلة كمية</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />~40% أسئلة لفظية</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />تركيز على الرياضيات</li>
            </ul>
          </button>

          {/* Literary Track */}
          <button
            onClick={() => setSelectedTrack('literary')}
            className={cn(
              'relative p-6 rounded-xl border-2 text-right transition-all',
              'hover:border-primary/50 hover:bg-primary/5',
              selectedTrack === 'literary'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-white'
            )}
          >
            {selectedTrack === 'literary' && (
              <div className="absolute top-3 left-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mb-4',
              selectedTrack === 'literary' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            )}>
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">المسار الأدبي</h3>
            <p className="text-sm text-muted-foreground mb-4">للطلاب الذين يدرسون المسار الأدبي</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />~30% أسئلة كمية</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />~70% أسئلة لفظية</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />تركيز على القراءة والفهم</li>
            </ul>
          </button>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <p><strong>ملاحظة:</strong> يمكنك تغيير مسارك الأكاديمي في أي وقت من إعدادات الملف الشخصي.</p>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={handleContinue} className="w-full" disabled={!selectedTrack} size="lg">
          متابعة
        </Button>
      </CardFooter>
    </Card>
  )
}
