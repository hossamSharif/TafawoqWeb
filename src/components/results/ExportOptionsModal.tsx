'use client'

import { useState } from 'react'
import { Download, FileText, FileJson, Check, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ExportOptions, ExportFilterType, ExportFormat } from '@/lib/review/export'
import { DEFAULT_EXPORT_OPTIONS, getExportPreviewText, generateFilename, buildExportURL } from '@/lib/review/export'

export interface ExportOptionsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  sessionType: 'exam' | 'practice'
  totalQuestions: number
  incorrectCount: number
  bookmarkedCount: number
  filteredCount: number
  isFiltered: boolean
}

/**
 * ExportOptionsModal - Configure and trigger exam/practice review export
 *
 * Features:
 * - Format selection: PDF or JSON
 * - Filter type: All, Incorrect only, Bookmarked only, Current filter
 * - Options: Include explanations, Include notes
 * - Preview question count
 * - Download with loading state
 */
export function ExportOptionsModal({
  isOpen,
  onOpenChange,
  sessionId,
  sessionType,
  totalQuestions,
  incorrectCount,
  bookmarkedCount,
  filteredCount,
  isFiltered,
}: ExportOptionsModalProps) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate question count based on filter type
  const getQuestionCount = (filterType: ExportFilterType): number => {
    switch (filterType) {
      case 'all':
        return totalQuestions
      case 'incorrect':
        return incorrectCount
      case 'bookmarked':
        return bookmarkedCount
      case 'current-filter':
        return filteredCount
      default:
        return totalQuestions
    }
  }

  const currentQuestionCount = getQuestionCount(options.filterType)

  const handleExport = async () => {
    if (currentQuestionCount === 0) {
      toast.error('لا توجد أسئلة للتصدير')
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const url = buildExportURL(sessionId, sessionType, options)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('فشل التصدير')
      }

      // Get filename from headers or generate default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = generateFilename(sessionType, options.format, options.filterType)

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download file
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      toast.success('تم التصدير بنجاح')
      onOpenChange(false)
    } catch (err) {
      console.error('Export error:', err)
      setError('حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى.')
      toast.error('فشل التصدير')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      onOpenChange(false)
      setError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            <span>تصدير المراجعة</span>
          </DialogTitle>
          <DialogDescription className="text-right">
            اختر تنسيق التصدير والخيارات المطلوبة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">تنسيق التصدير</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) =>
                setOptions({ ...options, format: value as ExportFormat })
              }
              className="space-y-2"
            >
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="pdf" id="format-pdf" />
                <Label htmlFor="format-pdf" className="flex-1 cursor-pointer flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>PDF (مستند)</span>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="json" id="format-json" />
                <Label htmlFor="format-json" className="flex-1 cursor-pointer flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-blue-600" />
                  <span>JSON (بيانات)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Filter Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">الأسئلة المطلوب تصديرها</Label>
            <RadioGroup
              value={options.filterType}
              onValueChange={(value) =>
                setOptions({ ...options, filterType: value as ExportFilterType })
              }
              className="space-y-2"
            >
              <div className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3 flex-1">
                  <RadioGroupItem value="all" id="filter-all" />
                  <Label htmlFor="filter-all" className="cursor-pointer">
                    جميع الأسئلة
                  </Label>
                </div>
                <span className="text-sm text-gray-500">{totalQuestions} سؤال</span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3 flex-1">
                  <RadioGroupItem value="incorrect" id="filter-incorrect" />
                  <Label htmlFor="filter-incorrect" className="cursor-pointer">
                    الأسئلة الخاطئة فقط
                  </Label>
                </div>
                <span className="text-sm text-gray-500">{incorrectCount} سؤال</span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3 flex-1">
                  <RadioGroupItem value="bookmarked" id="filter-bookmarked" />
                  <Label htmlFor="filter-bookmarked" className="cursor-pointer">
                    الأسئلة المُؤشرة فقط
                  </Label>
                </div>
                <span className="text-sm text-gray-500">{bookmarkedCount} سؤال</span>
              </div>

              {isFiltered && (
                <div className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3 flex-1">
                    <RadioGroupItem value="current-filter" id="filter-current" />
                    <Label htmlFor="filter-current" className="cursor-pointer">
                      الفلتر الحالي
                    </Label>
                  </div>
                  <span className="text-sm text-gray-500">{filteredCount} سؤال</span>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">خيارات إضافية</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox
                  id="include-explanations"
                  checked={options.includeExplanations}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeExplanations: Boolean(checked) })
                  }
                />
                <Label htmlFor="include-explanations" className="cursor-pointer flex-1">
                  تضمين التفسيرات واستراتيجيات الحل
                </Label>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox
                  id="include-notes"
                  checked={options.includeNotes}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeNotes: Boolean(checked) })
                  }
                />
                <Label htmlFor="include-notes" className="cursor-pointer flex-1">
                  تضمين الملاحظات الشخصية
                </Label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 leading-relaxed">
                  {getExportPreviewText(currentQuestionCount, options)}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900">{error}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
            className="flex-1"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || currentQuestionCount === 0}
            className="flex-1"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportOptionsModal
