// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  getExamDataForExport,
  formatExamAsJSON,
  generateExamExportFilename,
  canExportExam,
} from '@/lib/export/exam-results'

/**
 * GET /api/exams/[sessionId]/export?format=json|pdf
 * Export exam results as JSON (free) or PDF (premium)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'json') as 'json' | 'pdf'
    const includeQuestions = searchParams.get('includeQuestions') !== 'false'

    // New review export params
    const filter = searchParams.get('filter') // all, incorrect, bookmarked, current-filter
    const includeExplanations = searchParams.get('includeExplanations') === 'true'
    const includeNotes = searchParams.get('includeNotes') === 'true'

    // If review export params are present, use new export flow
    const isReviewExport = filter !== null

    // Validate format
    if (!['json', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'صيغة غير صالحة. استخدم json أو pdf' },
        { status: 400 }
      )
    }

    // Check export permission
    const permissionCheck = await canExportExam(supabase, user.id, format)
    if (!permissionCheck.canExport) {
      return NextResponse.json(
        {
          error: permissionCheck.reason || 'غير مصرح بالتصدير',
          upgradeRequired: format === 'pdf',
        },
        { status: 403 }
      )
    }

    // NEW REVIEW EXPORT FLOW
    if (isReviewExport) {
      // Fetch session data
      const { data: session, error: sessionError } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (sessionError || !session || session.status !== 'completed') {
        return NextResponse.json(
          { error: 'فشل في الحصول على بيانات الاختبار' },
          { status: 500 }
        )
      }

      // Get all questions from session
      const allQuestions = (session.questions as any[]) || []

      // Fetch bookmarks if needed
      let bookmarks: number[] = []
      if (filter === 'bookmarked' || includeNotes) {
        const { data: bookmarkData } = await supabase
          .from('question_bookmarks')
          .select('question_index')
          .eq('user_id', user.id)
          .eq('session_id', sessionId)
          .eq('session_type', 'exam')

        bookmarks = bookmarkData?.map((b) => b.question_index) || []
      }

      // Fetch notes if needed
      let notesMap: Record<number, string> = {}
      if (includeNotes) {
        const { data: notesData } = await supabase
          .from('question_notes')
          .select('question_index, note_text')
          .eq('user_id', user.id)
          .eq('session_id', sessionId)
          .eq('session_type', 'exam')

        notesMap =
          notesData?.reduce(
            (acc, note) => {
              acc[note.question_index] = note.note_text
              return acc
            },
            {} as Record<number, string>
          ) || {}
      }

      // Filter questions based on filter type
      let filteredQuestions = allQuestions
      if (filter === 'incorrect') {
        filteredQuestions = allQuestions.filter(
          (q: any) => q.selectedAnswer !== q.answerIndex && q.selectedAnswer !== null
        )
      } else if (filter === 'bookmarked') {
        const bookmarkSet = new Set(bookmarks)
        filteredQuestions = allQuestions.filter((q: any) => bookmarkSet.has(q.index))
      }
      // Note: 'current-filter' would need to be passed as additional params,
      // for now treat it as 'all'

      // Build export data
      const exportData = {
        sessionId,
        sessionType: 'exam',
        exportedAt: new Date().toISOString(),
        totalQuestions: allQuestions.length,
        exportedQuestions: filteredQuestions.length,
        filterType: filter,
        options: {
          includeExplanations,
          includeNotes,
        },
        questions: filteredQuestions.map((q: any) => {
          const baseQuestion: any = {
            questionNumber: q.index + 1,
            section: q.section,
            topic: q.topic || 'unknown',
            difficulty: q.difficulty || 'unknown',
            stem: q.stem,
            passage: q.passage,
            choices: q.choices,
            selectedAnswer: q.selectedAnswer ?? null,
            correctAnswer: q.answerIndex,
            isCorrect: q.selectedAnswer === q.answerIndex,
            timeSpentSeconds: q.timeSpentSeconds || 0,
          }

          if (includeExplanations) {
            baseQuestion.explanation = q.explanation
            baseQuestion.solvingStrategy = q.solvingStrategy
            baseQuestion.tip = q.tip
          }

          if (includeNotes && notesMap[q.index]) {
            baseQuestion.personalNote = notesMap[q.index]
          }

          return baseQuestion
        }),
      }

      // Generate filename
      const filterLabel = filter === 'incorrect' ? 'incorrect' : filter === 'bookmarked' ? 'bookmarked' : 'all'
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `tafawoq-exam-review-${filterLabel}-${timestamp}.${format}`

      if (format === 'json') {
        const jsonContent = JSON.stringify(exportData, null, 2)
        return new NextResponse(jsonContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
          },
        })
      }

      // PDF export for review (not yet implemented)
      if (format === 'pdf') {
        return NextResponse.json(
          {
            error: 'تصدير PDF للمراجعة سيتوفر قريباً',
            fallback: 'استخدم format=json للتصدير الآن',
          },
          { status: 501 }
        )
      }
    }

    // EXISTING EXPORT FLOW (fallback)
    // Get exam data for export
    const examData = await getExamDataForExport(
      supabase,
      sessionId,
      user.id,
      includeQuestions
    )

    if (!examData) {
      return NextResponse.json(
        { error: 'فشل في الحصول على بيانات الاختبار' },
        { status: 500 }
      )
    }

    // Generate filename
    const filename = generateExamExportFilename(sessionId, format)

    // Export as JSON
    if (format === 'json') {
      const jsonContent = formatExamAsJSON(examData)

      return new NextResponse(jsonContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // Export as PDF (premium feature)
    // For now, return JSON with a note that PDF is coming soon
    // In the future, this could use a library like react-pdf or puppeteer
    if (format === 'pdf') {
      return NextResponse.json(
        {
          error: 'تصدير PDF سيتوفر قريباً',
          fallback: 'استخدم format=json للتصدير الآن',
        },
        { status: 501 } // Not Implemented
      )
    }

    return NextResponse.json({ error: 'صيغة غير معروفة' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
