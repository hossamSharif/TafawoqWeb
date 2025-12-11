/**
 * Exam-related type definitions
 */

import type { Question } from './question'

export type AcademicTrack = 'scientific' | 'literary'

export type ExamSessionStatus = 'in_progress' | 'completed' | 'abandoned'

export interface ExamSession {
  id: string
  userId: string
  track: AcademicTrack
  status: ExamSessionStatus
  questions: Question[]
  startTime: string
  endTime?: string
  timePausedSeconds: number
  verbalScore?: number
  quantitativeScore?: number
  overallScore?: number
  strengths?: CategoryScore[]
  weaknesses?: CategoryScore[]
  createdAt: string
  updatedAt: string
}

export interface CategoryScore {
  category: string
  score: number
  totalQuestions: number
  correctAnswers: number
}

export interface ExamResults {
  sessionId: string
  verbalScore: number
  quantitativeScore: number
  overallScore: number
  strengths: CategoryScore[]
  weaknesses: CategoryScore[]
  totalQuestions: number
  correctAnswers: number
  timeTaken: number // in seconds
  completedAt: string
}

export interface ExamConfig {
  totalQuestions: number
  durationMinutes: number
  verbalRatio: number // percentage for verbal questions
  quantitativeRatio: number // percentage for quantitative questions
}

export const EXAM_CONFIG: Record<AcademicTrack, ExamConfig> = {
  scientific: {
    totalQuestions: 96,
    durationMinutes: 120,
    verbalRatio: 40, // ~39 questions
    quantitativeRatio: 60, // ~57 questions
  },
  literary: {
    totalQuestions: 96,
    durationMinutes: 120,
    verbalRatio: 70, // ~67 questions
    quantitativeRatio: 30, // ~29 questions
  },
}

export interface ExamProgress {
  currentQuestionIndex: number
  answeredCount: number
  remainingTime: number // in seconds
  isPaused: boolean
}
