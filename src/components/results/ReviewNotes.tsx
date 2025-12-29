'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, ChevronDown, ChevronUp, Trash2, Check, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ReviewNotesProps {
  questionIndex: number
  noteText?: string
  isSaving?: boolean
  hasError?: boolean
  onNoteChange: (questionIndex: number, text: string) => void
  onDeleteNote: (questionIndex: number) => Promise<void>
  className?: string
  maxLength?: number
  autoExpand?: boolean
}

/**
 * ReviewNotes - Personal notes editor for questions
 *
 * Features:
 * - Expandable/collapsible section
 * - Character counter (max 1000 by default)
 * - Auto-save indicator (Saved, Saving, Error)
 * - RTL support for Arabic
 * - Delete button for clearing
 * - Auto-expand if note exists
 */
export function ReviewNotes({
  questionIndex,
  noteText = '',
  isSaving = false,
  hasError = false,
  onNoteChange,
  onDeleteNote,
  className,
  maxLength = 1000,
  autoExpand = true,
}: ReviewNotesProps) {
  const [isExpanded, setIsExpanded] = useState(autoExpand && noteText.length > 0)
  const [isDeleting, setIsDeleting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expand when note exists
  useEffect(() => {
    if (autoExpand && noteText.length > 0 && !isExpanded) {
      setIsExpanded(true)
    }
  }, [noteText, autoExpand, isExpanded])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    if (newText.length <= maxLength) {
      onNoteChange(questionIndex, newText)
    }
  }

  const handleDelete = async () => {
    if (isDeleting || !noteText) return

    setIsDeleting(true)
    try {
      await onDeleteNote(questionIndex)
    } finally {
      setIsDeleting(false)
    }
  }

  const characterCount = noteText.length
  const characterPercentage = (characterCount / maxLength) * 100
  const isNearLimit = characterPercentage >= 90

  // Save status
  let saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle'
  if (isSaving) saveStatus = 'saving'
  else if (hasError) saveStatus = 'error'
  else if (noteText.length > 0 && !isSaving) saveStatus = 'saved'

  return (
    <div className={cn('border-t border-gray-200 bg-gray-50', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-right hover:bg-gray-100 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`notes-${questionIndex}`}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp size={18} className="text-gray-500" />
          ) : (
            <ChevronDown size={18} className="text-gray-500" />
          )}
          <span className="text-sm text-gray-500">
            {isExpanded ? 'إخفاء' : 'عرض'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <FileText size={18} className="text-gray-700" />
          <span className="font-medium text-gray-900" dir="rtl">
            ملاحظاتي الشخصية
          </span>
          {noteText.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {characterCount}
            </span>
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          id={`notes-${questionIndex}`}
          className="px-4 pb-4 space-y-3"
        >
          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={noteText}
              onChange={handleChange}
              placeholder="اكتب ملاحظاتك الشخصية هنا..."
              className={cn(
                'w-full min-h-[120px] p-3 border rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'resize-y text-right',
                'placeholder:text-gray-400',
                hasError && 'border-red-300 focus:ring-red-500'
              )}
              dir="rtl"
              maxLength={maxLength}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm">
            {/* Character count */}
            <div
              className={cn(
                'flex items-center gap-1',
                isNearLimit ? 'text-orange-600' : 'text-gray-500'
              )}
            >
              <span dir="ltr">
                {characterCount} / {maxLength}
              </span>
              {isNearLimit && (
                <span className="text-xs" dir="rtl">
                  (قريب من الحد الأقصى)
                </span>
              )}
            </div>

            {/* Save status and actions */}
            <div className="flex items-center gap-3">
              {/* Delete button */}
              {noteText.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="animate-spin ml-1" />
                  ) : (
                    <Trash2 size={16} className="ml-1" />
                  )}
                  <span dir="rtl">حذف</span>
                </Button>
              )}

              {/* Save status indicator */}
              <div className="flex items-center gap-1.5">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span className="text-blue-600" dir="rtl">
                      جاري الحفظ...
                    </span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check size={16} className="text-green-600" />
                    <span className="text-green-600" dir="rtl">
                      تم الحفظ
                    </span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <AlertCircle size={16} className="text-red-600" />
                    <span className="text-red-600" dir="rtl">
                      خطأ في الحفظ
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewNotes
