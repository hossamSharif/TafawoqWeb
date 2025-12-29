'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  FileText,
  BookOpen,
} from 'lucide-react'
import type { Question } from '@/types/question'

export type ContentType = 'exam' | 'practice'

export interface AdminContentUploadData {
  title: string
  description: string
  contentType: ContentType
  section: 'quantitative' | 'verbal'
  difficulty?: 'easy' | 'medium' | 'hard'
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
  const [contentType, setContentType] = useState<ContentType>('exam')
  const [section, setSection] = useState<'quantitative' | 'verbal'>('quantitative')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
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
      contentType,
      section,
      difficulty: contentType === 'practice' ? difficulty : undefined,
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
        {/* Content Type Selector */}
        <div className="space-y-3">
          <Label>نوع المحتوى *</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setContentType('exam')}
              className={`
                relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${contentType === 'exam'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <FileText className={`h-8 w-8 ${contentType === 'exam' ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="text-center">
                <p className={`font-semibold ${contentType === 'exam' ? 'text-primary' : ''}`}>اختبار</p>
                <p className="text-xs text-muted-foreground mt-1">اختبار شامل مع وقت محدد</p>
              </div>
              {contentType === 'exam' && (
                <Badge className="absolute -top-2 -right-2 bg-primary">محدد</Badge>
              )}
            </button>
            <button
              type="button"
              onClick={() => setContentType('practice')}
              className={`
                relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${contentType === 'practice'
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                  : 'border-border hover:border-emerald-500/50 hover:bg-muted/50'
                }
              `}
            >
              <BookOpen className={`h-8 w-8 ${contentType === 'practice' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              <div className="text-center">
                <p className={`font-semibold ${contentType === 'practice' ? 'text-emerald-600' : ''}`}>تمرين</p>
                <p className="text-xs text-muted-foreground mt-1">تدريب على مهارات محددة</p>
              </div>
              {contentType === 'practice' && (
                <Badge className="absolute -top-2 -right-2 bg-emerald-500">محدد</Badge>
              )}
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title">عنوان المحتوى *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={contentType === 'exam' ? 'مثال: اختبار الجبر المتقدم' : 'مثال: تمرين على التناسب'}
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

        {/* Difficulty Select (Practice Only) */}
        {contentType === 'practice' && (
          <div className="space-y-2">
            <Label htmlFor="difficulty">مستوى الصعوبة *</Label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </div>
        )}

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
