'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  CheckCircle2,
  FileText,
  Loader2,
} from 'lucide-react'
import type { Question } from '@/types/question'
import { SECTION_LABELS, CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/question'
import type { AdminContentUploadData } from './AdminContentUploader'

interface AdminContentPreviewProps {
  data: AdminContentUploadData
  onSave: () => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function AdminContentPreview({
  data,
  onSave,
  onCancel,
  isSaving = false,
}: AdminContentPreviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const { questions, title, description, section } = data

  const currentQuestion = questions[currentQuestionIndex]

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  // Calculate statistics
  const stats = {
    total: questions.length,
    byDifficulty: {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length,
    },
    byCategory: questions.reduce((acc, q) => {
      acc[q.topic] = (acc[q.topic] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            معاينة المحتوى
          </CardTitle>
          <CardDescription>
            تأكد من صحة المحتوى قبل الحفظ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">العنوان</p>
              <p className="font-medium">{title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">القسم</p>
              <Badge variant="secondary">{SECTION_LABELS[section]}</Badge>
            </div>
            {description && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">الوصف</p>
                <p className="text-sm">{description}</p>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">إحصائيات المحتوى</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {stats.total.toLocaleString('ar-SA')}
                </p>
                <p className="text-sm text-muted-foreground">إجمالي الأسئلة</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex gap-2 mb-1">
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    سهل: {stats.byDifficulty.easy}
                  </Badge>
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    متوسط: {stats.byDifficulty.medium}
                  </Badge>
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                    صعب: {stats.byDifficulty.hard}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">حسب الصعوبة</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">
                  {Object.keys(stats.byCategory).length.toLocaleString('ar-SA')} فئات
                </p>
                <p className="text-sm text-muted-foreground">تصنيفات مختلفة</p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">توزيع الفئات</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <Badge key={category} variant="secondary">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Preview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>معاينة الأسئلة</CardTitle>
            <CardDescription>
              السؤال {(currentQuestionIndex + 1).toLocaleString('ar-SA')} من {questions.length.toLocaleString('ar-SA')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrev}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion && (
            <>
              {/* Question Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {CATEGORY_LABELS[currentQuestion.topic as keyof typeof CATEGORY_LABELS] || currentQuestion.topic}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    currentQuestion.difficulty === 'easy'
                      ? 'text-green-600 border-green-200'
                      : currentQuestion.difficulty === 'medium'
                      ? 'text-amber-600 border-amber-200'
                      : 'text-red-600 border-red-200'
                  }
                >
                  {DIFFICULTY_LABELS[currentQuestion.difficulty]}
                </Badge>
              </div>

              {/* Reading Passage (if exists) */}
              {currentQuestion.passage && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">نص القراءة:</p>
                  <p className="text-sm whitespace-pre-wrap">{currentQuestion.passage}</p>
                </div>
              )}

              {/* Question Text */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{currentQuestion.stem}</p>
              </div>

              {/* Choices */}
              <div className="space-y-2">
                {currentQuestion.choices.map((choice, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-colors ${
                      index === currentQuestion.answerIndex
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === currentQuestion.answerIndex
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {String.fromCharCode(1571 + index)}
                      </span>
                      <span className="flex-1">{choice}</span>
                      {index === currentQuestion.answerIndex && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {currentQuestion.explanation && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">الشرح:</p>
                  <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
                </div>
              )}
            </>
          )}

          {/* Quick Navigation */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">انتقال سريع:</p>
            <div className="flex flex-wrap gap-1">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {(index + 1).toLocaleString('ar-SA')}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 ml-2" />
          إلغاء
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              حفظ في المكتبة
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
