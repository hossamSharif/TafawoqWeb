/**
 * Library-related type definitions for exam library feature
 */

import type { AcademicTrack } from './exam'

export type LibraryAccessStatus = 'not_accessed' | 'accessed' | 'started' | 'completed'

export interface LibraryExam {
  postId: string
  title: string
  section: AcademicTrack | null
  questionCount: number
  creator: {
    id: string
    displayName: string | null
  }
  completionCount: number
  userHasAccess: boolean
  userCompleted: boolean
  createdAt: string
}

export interface LibraryExamDetail extends LibraryExam {
  description: string | null
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  estimatedTime: number | null // in minutes
  body: string | null
}

export interface LibraryAccess {
  id: string
  userId: string
  postId: string
  accessedAt: string
  examStarted: boolean
  examCompleted: boolean
}

export interface UserLibraryAccess {
  tier: 'free' | 'premium'
  accessUsed: number
  accessLimit: number | null // null = unlimited for premium
  canAccessMore: boolean
}

export interface LibraryListResponse {
  exams: LibraryExam[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  userAccess: UserLibraryAccess
}

export interface LibraryExamDetailResponse extends LibraryExamDetail {
  userAccess: UserLibraryAccess
}

export interface LibraryAccessRequest {
  postId: string
}

export interface LibraryAccessResponse {
  success: boolean
  accessId: string
  message?: string
}

export interface LibraryAccessDeniedResponse {
  error: string
  upgradeRequired: boolean
  currentAccess: UserLibraryAccess
}

export interface LibraryStartExamResponse {
  sessionId: string
  examData: {
    id: string
    questions: unknown[] // Using existing Question[] type
    totalQuestions: number
    track: AcademicTrack | null
  }
}

// Filter options for library listing
export interface LibraryFilters {
  section?: 'verbal' | 'quantitative'
  sort?: 'popular' | 'recent'
  page?: number
  limit?: number
}

// Constants for library limits
export const LIBRARY_LIMITS = {
  free: {
    accessLimit: 1,
    description: 'اختبار واحد من المكتبة',
    descriptionEn: 'One library exam',
  },
  premium: {
    accessLimit: null, // unlimited
    description: 'وصول غير محدود للمكتبة',
    descriptionEn: 'Unlimited library access',
  },
} as const
