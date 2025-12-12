'use client'

import { useState } from 'react'
import { BookOpen, Calculator, BookText, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AcademicTrackSwitcherProps {
  currentTrack: 'scientific' | 'literary'
  onTrackChange?: (newTrack: 'scientific' | 'literary') => Promise<void>
  disabled?: boolean
  className?: string
}

const trackInfo = {
  scientific: {
    label: 'علمي',
    description: 'تركيز أكبر على الأسئلة الكمية والرياضيات',
    distribution: '~60% كمي، ~40% لفظي',
    icon: Calculator,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:border-blue-400',
  },
  literary: {
    label: 'أدبي',
    description: 'تركيز أكبر على الأسئلة اللفظية والقراءة',
    distribution: '~30% كمي، ~70% لفظي',
    icon: BookText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverColor: 'hover:border-purple-400',
  },
}

export function AcademicTrackSwitcher({
  currentTrack,
  onTrackChange,
  disabled = false,
  className,
}: AcademicTrackSwitcherProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingTrack, setPendingTrack] = useState<'scientific' | 'literary' | null>(null)

  const handleTrackClick = (track: 'scientific' | 'literary') => {
    if (track === currentTrack || disabled || isLoading) return

    setPendingTrack(track)
    setShowConfirm(true)
    setError(null)
  }

  const handleConfirmChange = async () => {
    if (!pendingTrack || !onTrackChange) return

    setIsLoading(true)
    setError(null)

    try {
      await onTrackChange(pendingTrack)
      setShowConfirm(false)
      setPendingTrack(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تغيير المسار')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
    setPendingTrack(null)
    setError(null)
  }

  return (
    <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-gray-900">المسار الأكاديمي</h2>
      </div>

      {/* Track Options */}
      <div className="grid md:grid-cols-2 gap-4">
        {(Object.keys(trackInfo) as Array<'scientific' | 'literary'>).map((track) => {
          const info = trackInfo[track]
          const isSelected = currentTrack === track
          const Icon = info.icon

          return (
            <button
              key={track}
              onClick={() => handleTrackClick(track)}
              disabled={disabled || isLoading}
              className={cn(
                'p-4 rounded-xl border-2 text-right transition-all',
                isSelected
                  ? `${info.borderColor} ${info.bgColor}`
                  : `border-gray-200 hover:bg-gray-50 ${info.hoverColor}`,
                (disabled || isLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isSelected ? info.bgColor : 'bg-gray-100'
                  )}
                >
                  <Icon
                    className={cn('w-5 h-5', isSelected ? info.color : 'text-gray-400')}
                  />
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className={cn('font-bold', isSelected ? info.color : 'text-gray-900')}>
                      {info.label}
                    </span>
                    {isSelected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-white">
                        الحالي
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{info.distribution}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && pendingTrack && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-800">تأكيد تغيير المسار</h3>
              <p className="text-sm text-yellow-700 mt-1">
                هل أنت متأكد من تغيير المسار إلى{' '}
                <strong>{trackInfo[pendingTrack].label}</strong>؟
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                سيؤثر هذا على توزيع الأسئلة في الاختبارات القادمة.
              </p>

              {error && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleConfirmChange}
                  disabled={isLoading}
                  className="gap-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري التغيير...
                    </>
                  ) : (
                    'تأكيد التغيير'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      <p className="text-xs text-gray-500 mt-4">
        ملاحظة: لا يمكن تغيير المسار أثناء وجود اختبار قيد التقدم.
      </p>
    </div>
  )
}
