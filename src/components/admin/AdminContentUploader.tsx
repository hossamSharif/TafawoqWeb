'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react'
import type { Question } from '@/types/question'

export interface AdminContentUploadData {
  title: string
  description: string
  section: 'quantitative' | 'verbal'
  questions: Question[]
}

interface AdminContentUploaderProps {
  onValidate: (data: AdminContentUploadData) => Promise<{ valid: boolean; errors?: string[] }>
  onPreview: (data: AdminContentUploadData) => void
  isValidating?: boolean
}

export function AdminContentUploader({
  onValidate,
  onPreview,
  isValidating = false,
}: AdminContentUploaderProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [section, setSection] = useState<'quantitative' | 'verbal'>('quantitative')
  const [jsonContent, setJsonContent] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setErrors(['يجب أن يكون الملف بصيغة JSON'])
      setIsValid(false)
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonContent(content)
      setErrors([])
      setIsValid(null)
    }
    reader.onerror = () => {
      setErrors(['فشل في قراءة الملف'])
      setIsValid(false)
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setErrors(['يجب أن يكون الملف بصيغة JSON'])
      setIsValid(false)
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonContent(content)
      setErrors([])
      setIsValid(null)
    }
    reader.onerror = () => {
      setErrors(['فشل في قراءة الملف'])
      setIsValid(false)
    }
    reader.readAsText(file)
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const clearFile = useCallback(() => {
    setFileName(null)
    setJsonContent('')
    setErrors([])
    setIsValid(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleValidate = async () => {
    if (!title.trim()) {
      setErrors(['يرجى إدخال عنوان للمحتوى'])
      setIsValid(false)
      return
    }

    if (!jsonContent.trim()) {
      setErrors(['يرجى رفع ملف JSON أو إدخال المحتوى'])
      setIsValid(false)
      return
    }

    let questions: Question[]
    try {
      const parsed = JSON.parse(jsonContent)
      questions = Array.isArray(parsed) ? parsed : parsed.questions
      if (!Array.isArray(questions)) {
        throw new Error('Invalid format')
      }
    } catch {
      setErrors(['صيغة JSON غير صالحة. تأكد من أن الملف يحتوي على مصفوفة من الأسئلة.'])
      setIsValid(false)
      return
    }

    const data: AdminContentUploadData = {
      title: title.trim(),
      description: description.trim(),
      section,
      questions,
    }

    const result = await onValidate(data)
    setIsValid(result.valid)
    setErrors(result.errors || [])

    if (result.valid) {
      onPreview(data)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>رفع محتوى جديد</CardTitle>
        <CardDescription>
          قم برفع ملف JSON يحتوي على أسئلة الاختبار أو التمارين
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title">عنوان المحتوى *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: اختبار الجبر المتقدم"
            dir="rtl"
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <Label htmlFor="description">الوصف</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف اختياري للمحتوى..."
            rows={2}
            dir="rtl"
          />
        </div>

        {/* Section Select */}
        <div className="space-y-2">
          <Label htmlFor="section">القسم *</Label>
          <select
            id="section"
            value={section}
            onChange={(e) => setSection(e.target.value as 'quantitative' | 'verbal')}
            className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="quantitative">القسم الكمي</option>
            <option value="verbal">القسم اللفظي</option>
          </select>
        </div>

        {/* File Upload Area */}
        <div className="space-y-2">
          <Label>ملف JSON *</Label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${fileName ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-3">
                <FileJson className="h-8 w-8 text-primary" />
                <div className="text-right">
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {jsonContent.length.toLocaleString('ar-SA')} حرف
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearFile()
                  }}
                  className="mr-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  اسحب وأفلت ملف JSON هنا، أو انقر للاختيار
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Manual JSON Input */}
        <div className="space-y-2">
          <Label htmlFor="jsonContent">أو أدخل محتوى JSON يدوياً</Label>
          <Textarea
            id="jsonContent"
            value={jsonContent}
            onChange={(e) => {
              setJsonContent(e.target.value)
              setFileName(null)
              setErrors([])
              setIsValid(null)
            }}
            placeholder='[{"id": "q1", "section": "quantitative", ...}]'
            rows={6}
            className="font-mono text-sm"
            dir="ltr"
          />
        </div>

        {/* Validation Status */}
        {isValid !== null && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg ${
              isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              {isValid ? (
                <p className="font-medium">تم التحقق بنجاح</p>
              ) : (
                <>
                  <p className="font-medium">فشل التحقق</p>
                  <ul className="text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleValidate}
            disabled={isValidating || !jsonContent.trim() || !title.trim()}
            className="flex-1"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              'التحقق ومعاينة'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
