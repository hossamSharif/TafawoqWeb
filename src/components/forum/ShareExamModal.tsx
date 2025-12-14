'use client'

import { useState, useEffect } from 'react'
import { Share2, FileText, BarChart3, Loader2, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { generateExamDescription } from '@/lib/forum/description-generator'

interface ExamSession {
  id: string
  track: 'scientific' | 'literary'
  total_questions: number
  verbal_score?: number
  quantitative_score?: number
  overall_score?: number
  questions?: Array<{
    section?: string
    difficulty?: string
    topic?: string
  }>
}

interface PracticeSession {
  id: string
  section: 'verbal' | 'quantitative'
  category?: string
  difficulty?: string
  total_questions: number
  correct_answers?: number
  score?: number
}

interface ShareExamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examSession?: ExamSession | null
  practiceSession?: PracticeSession | null
  onShare: (data: { title: string; body: string }) => Promise<void>
}

export function ShareExamModal({
  open,
  onOpenChange,
  examSession,
  practiceSession,
  onShare,
}: ShareExamModalProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const isExam = !!examSession
  const session = examSession || practiceSession

  // Auto-generate description when modal opens
  useEffect(() => {
    if (open && session) {
      setIsSuccess(false)
      setIsGenerating(true)

      // Generate auto-description
      if (examSession) {
        const { title: generatedTitle, body: generatedBody } =
          generateExamDescription(examSession)
        setTitle(generatedTitle)
        setBody(generatedBody)
      } else if (practiceSession) {
        const sectionName =
          practiceSession.section === 'verbal' ? 'لفظي' : 'كمي'
        const difficultyName =
          {
            easy: 'سهل',
            medium: 'متوسط',
            hard: 'صعب',
          }[practiceSession.difficulty || 'medium'] || 'متوسط'

        setTitle(
          `تدريب ${sectionName} - ${practiceSession.total_questions} سؤال`
        )
        setBody(
          `تدريب على القسم ال${sectionName} بمستوى ${difficultyName}. يحتوي على ${practiceSession.total_questions} سؤال${practiceSession.category ? ` في ${practiceSession.category}` : ''}.`
        )
      }

      setIsGenerating(false)
    }
  }, [open, session, examSession, practiceSession])

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onShare({ title: title.trim(), body: body.trim() })
      setIsSuccess(true)

      // Close modal after short delay to show success
      setTimeout(() => {
        onOpenChange(false)
        setIsSuccess(false)
        setTitle('')
        setBody('')
      }, 1500)
    } catch (error) {
      console.error('Failed to share:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSessionStats = () => {
    if (examSession) {
      const sections = { verbal: 0, quantitative: 0 }
      const difficulties = { easy: 0, medium: 0, hard: 0 }

      examSession.questions?.forEach((q) => {
        if (q.section === 'verbal') sections.verbal++
        else if (q.section === 'quantitative') sections.quantitative++

        if (q.difficulty === 'easy') difficulties.easy++
        else if (q.difficulty === 'medium') difficulties.medium++
        else if (q.difficulty === 'hard') difficulties.hard++
      })

      return {
        questionCount: examSession.total_questions,
        sections,
        difficulties,
        track: examSession.track,
      }
    }

    if (practiceSession) {
      return {
        questionCount: practiceSession.total_questions,
        section: practiceSession.section,
        difficulty: practiceSession.difficulty,
        category: practiceSession.category,
      }
    }

    return null
  }

  const stats = getSessionStats()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            مشاركة {isExam ? 'الاختبار' : 'التدريب'} مع المجتمع
          </DialogTitle>
          <DialogDescription>
            شارك {isExam ? 'اختبارك' : 'تدريبك'} ليتمكن الآخرون من حله والاستفادة
            منه
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <p className="text-lg font-semibold text-green-600">
              تم مشاركة {isExam ? 'الاختبار' : 'التدريب'} بنجاح!
            </p>
          </div>
        ) : (
          <>
            {/* Stats Preview */}
            {stats && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{stats.questionCount} سؤال</span>
                </div>

                {isExam && 'sections' in stats && stats.sections && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-blue-600">
                      لفظي: {stats.sections.verbal}
                    </span>
                    <span className="text-purple-600">
                      كمي: {stats.sections.quantitative}
                    </span>
                  </div>
                )}

                {isExam && 'difficulties' in stats && stats.difficulties && (
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-green-600">
                      سهل: {stats.difficulties.easy}
                    </span>
                    <span className="text-yellow-600">
                      متوسط: {stats.difficulties.medium}
                    </span>
                    <span className="text-red-600">
                      صعب: {stats.difficulties.hard}
                    </span>
                  </div>
                )}

                {!isExam && 'section' in stats && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-blue-600">
                      القسم: {stats.section === 'verbal' ? 'لفظي' : 'كمي'}
                    </span>
                    {stats.difficulty && (
                      <span className="text-purple-600">
                        المستوى:{' '}
                        {
                          { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }[
                            stats.difficulty
                          ]
                        }
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">العنوان *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان المشاركة..."
                  maxLength={200}
                  disabled={isGenerating}
                  className={cn(isGenerating && 'animate-pulse')}
                />
                <p className="text-xs text-gray-500 text-left">
                  {title.length}/200
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">الوصف (اختياري)</Label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="أضف وصفاً أو ملاحظات..."
                  maxLength={5000}
                  rows={4}
                  disabled={isGenerating}
                  className={cn(
                    'w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'resize-none',
                    isGenerating && 'animate-pulse'
                  )}
                />
                <p className="text-xs text-gray-500 text-left">
                  {body.length}/5000
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || isSubmitting || isGenerating}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري المشاركة...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 ml-2" />
                    مشاركة
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
