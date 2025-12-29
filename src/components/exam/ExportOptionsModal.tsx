'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileJson, FileText, Lock, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ExportOptionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examId: string
  isPremium: boolean
  onExport: (format: 'json' | 'pdf', includeQuestions: boolean) => Promise<void>
}

export function ExportOptionsModal({
  open,
  onOpenChange,
  examId,
  isPremium,
  onExport,
}: ExportOptionsModalProps) {
  const [format, setFormat] = useState<'json' | 'pdf'>('json')
  const [includeQuestions, setIncludeQuestions] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await onExport(format, includeQuestions)
      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            تصدير نتائج الاختبار
          </DialogTitle>
          <DialogDescription>
            اختر صيغة التصدير والخيارات المطلوبة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">صيغة الملف</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as 'json' | 'pdf')}
              className="space-y-3"
            >
              {/* JSON Option */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="json" id="json" />
                <Label
                  htmlFor="json"
                  className="flex-1 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium">JSON</p>
                      <p className="text-xs text-gray-500">بيانات منظمة يمكن معالجتها</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">مجاني</Badge>
                </Label>
              </div>

              {/* PDF Option */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="pdf" id="pdf" disabled={!isPremium} />
                <Label
                  htmlFor="pdf"
                  className={`flex-1 flex items-center justify-between ${
                    !isPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="font-medium">PDF</p>
                      <p className="text-xs text-gray-500">تقرير منسق جاهز للطباعة</p>
                    </div>
                  </div>
                  {!isPremium ? (
                    <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-700 text-xs">
                      <Lock className="w-3 h-3" />
                      مميز
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">مميز</Badge>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Include Questions Option */}
          <div className="flex items-start space-x-2 space-x-reverse">
            <Checkbox
              id="questions"
              checked={includeQuestions}
              onCheckedChange={(checked) => setIncludeQuestions(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="questions"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                تضمين تفاصيل الأسئلة
              </Label>
              <p className="text-xs text-muted-foreground">
                تضمين نص الأسئلة والإجابات في الملف المُصدّر
              </p>
            </div>
          </div>

          {/* Premium Upgrade Message */}
          {!isPremium && format === 'pdf' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    تصدير PDF متاح للمشتركين المميزين
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    قم بالترقية للحصول على تقارير PDF منسقة مع رسوم بيانية وتحليلات متقدمة
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isExporting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleExport}
              className="flex-1 gap-2"
              disabled={isExporting || (!isPremium && format === 'pdf')}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  تصدير
                </>
              )}
            </Button>
          </div>

          {/* File Info */}
          <div className="text-xs text-gray-500 text-center">
            {format === 'json' && (
              <p>سيتم تنزيل ملف JSON يحتوي على جميع بيانات الاختبار</p>
            )}
            {format === 'pdf' && isPremium && (
              <p>سيتم إنشاء تقرير PDF شامل مع رسوم بيانية وتحليلات</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
