import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export interface PauseLimits {
  canPauseExam: boolean
  canPausePractice: boolean
  pausedExamCount: number
  pausedPracticeCount: number
  pausedExamId: string | null
  pausedPracticeId: string | null
}

/**
 * Check if user can pause more sessions based on limits:
 * - Max 1 exam can be paused at a time
 * - Max 1 practice can be paused at a time
 * - User can have both 1 exam + 1 practice paused simultaneously
 */
export async function checkPauseLimits(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PauseLimits> {
  // Get count of paused exam sessions
  const { data: pausedExams, error: examError } = await supabase
    .from('exam_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'paused')
    .limit(2)

  if (examError) {
    console.error('Error checking paused exams:', examError)
    throw new Error('فشل في التحقق من حالة الجلسات')
  }

  // Get count of paused practice sessions
  const { data: pausedPractices, error: practiceError } = await supabase
    .from('practice_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'paused')
    .limit(2)

  if (practiceError) {
    console.error('Error checking paused practices:', practiceError)
    throw new Error('فشل في التحقق من حالة الجلسات')
  }

  const pausedExamCount = pausedExams?.length || 0
  const pausedPracticeCount = pausedPractices?.length || 0

  return {
    canPauseExam: pausedExamCount < 1,
    canPausePractice: pausedPracticeCount < 1,
    pausedExamCount,
    pausedPracticeCount,
    pausedExamId: pausedExams?.[0]?.id || null,
    pausedPracticeId: pausedPractices?.[0]?.id || null,
  }
}

export interface ActiveSession {
  id: string
  type: 'exam' | 'practice'
  status: 'in_progress' | 'paused'
  progress: number
  totalQuestions: number
  questionsAnswered: number
  remainingTimeSeconds?: number | null
  pausedAt?: string | null
  createdAt: string
  startTime?: string | null
  // For display
  title: string
  description: string
  // Additional metadata
  track?: string | null
  section?: string | null
  categories?: string[] | null
  difficulty?: string | null
}

/**
 * Get all active (in_progress or paused) sessions for a user
 */
export async function getActiveSessions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ exams: ActiveSession[]; practices: ActiveSession[] }> {
  // Get active exam sessions
  const { data: examSessions, error: examError } = await supabase
    .from('exam_sessions')
    .select('id, status, total_questions, questions_answered, paused_at, remaining_time_seconds, created_at, start_time, track')
    .eq('user_id', userId)
    .in('status', ['in_progress', 'paused'])
    .order('created_at', { ascending: false })

  if (examError) {
    console.error('Error fetching active exam sessions:', examError)
    throw new Error('فشل في جلب الجلسات النشطة')
  }

  // Get active practice sessions
  const { data: practiceSessions, error: practiceError } = await supabase
    .from('practice_sessions')
    .select('id, status, question_count, paused_at, created_at, started_at, section, categories, difficulty')
    .eq('user_id', userId)
    .in('status', ['in_progress', 'paused'])
    .order('created_at', { ascending: false })

  if (practiceError) {
    console.error('Error fetching active practice sessions:', practiceError)
    throw new Error('فشل في جلب الجلسات النشطة')
  }

  // Get answered questions count for each practice session
  const practiceSessionIds = practiceSessions?.map(s => s.id) || []
  let practiceAnswerCounts: Record<string, number> = {}

  if (practiceSessionIds.length > 0) {
    const { data: practiceAnswers } = await supabase
      .from('answers')
      .select('session_id')
      .eq('session_type', 'practice')
      .in('session_id', practiceSessionIds)

    if (practiceAnswers) {
      practiceAnswerCounts = practiceAnswers.reduce((acc, answer) => {
        acc[answer.session_id] = (acc[answer.session_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  // Format exam sessions
  const exams: ActiveSession[] = (examSessions || []).map((session) => {
    const questionsAnswered = session.questions_answered || 0
    const progress = session.total_questions > 0
      ? Math.round((questionsAnswered / session.total_questions) * 100)
      : 0

    const trackLabel = session.track === 'scientific' ? 'علمي' : session.track === 'literary' ? 'أدبي' : ''

    return {
      id: session.id,
      type: 'exam' as const,
      status: session.status as 'in_progress' | 'paused',
      progress,
      totalQuestions: session.total_questions,
      questionsAnswered,
      remainingTimeSeconds: session.remaining_time_seconds,
      pausedAt: session.paused_at,
      createdAt: session.created_at || new Date().toISOString(),
      startTime: session.start_time,
      title: 'اختبار قدرات',
      description: trackLabel ? `المسار ${trackLabel} - ${session.total_questions} سؤال` : `${session.total_questions} سؤال`,
      track: session.track,
    }
  })

  // Format practice sessions
  const practices: ActiveSession[] = (practiceSessions || []).map((session) => {
    const questionsAnswered = practiceAnswerCounts[session.id] || 0
    const progress = session.question_count > 0
      ? Math.round((questionsAnswered / session.question_count) * 100)
      : 0

    const sectionLabel = session.section === 'quantitative' ? 'كمي' : 'لفظي'
    const difficultyLabel = session.difficulty === 'easy' ? 'سهل' : session.difficulty === 'medium' ? 'متوسط' : 'صعب'

    return {
      id: session.id,
      type: 'practice' as const,
      status: session.status as 'in_progress' | 'paused',
      progress,
      totalQuestions: session.question_count,
      questionsAnswered,
      pausedAt: session.paused_at,
      createdAt: session.created_at || new Date().toISOString(),
      startTime: session.started_at,
      title: `تدريب ${sectionLabel}`,
      description: `${session.question_count} سؤال - ${difficultyLabel}`,
      section: session.section,
      categories: session.categories,
      difficulty: session.difficulty,
    }
  })

  return { exams, practices }
}
