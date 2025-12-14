// Notification Types for Forum & Exam Sharing Platform
// Based on data-model.md and contracts/api.md specifications

// ============================================
// Enums and Constants
// ============================================

export type NotificationType =
  | 'exam_completed'     // Someone completed user's shared exam
  | 'new_comment'        // Someone commented on user's post
  | 'comment_reply'      // Someone replied to user's comment
  | 'report_resolved'    // User's report was resolved
  | 'reward_earned';     // User earned reward credits

export type NotificationTargetType = 'post' | 'comment' | 'report' | 'reward';

// ============================================
// Database Row Types (matching Supabase schema)
// ============================================

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  target_type: NotificationTargetType | null;
  target_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ============================================
// Insert Types (for creating new records)
// ============================================

export interface NotificationInsert {
  id?: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  target_type?: NotificationTargetType | null;
  target_id?: string | null;
  is_read?: boolean;
  created_at?: string;
}

// ============================================
// Update Types (for updating existing records)
// ============================================

export interface NotificationUpdate {
  is_read?: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  target_type: NotificationTargetType | null;
  target_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unread_count: number;
  next_cursor: string | null;
  has_more: boolean;
}

export interface NotificationCountResponse {
  unread_count: number;
}

export interface MarkReadResponse {
  id: string;
  is_read: boolean;
}

export interface MarkAllReadResponse {
  updated_count: number;
}

// ============================================
// Query Parameters
// ============================================

export interface NotificationListParams {
  cursor?: string;
  limit?: number;
  unread_only?: boolean;
}

// ============================================
// Notification Creation Helpers
// ============================================

export interface ExamCompletedNotificationData {
  postId: string;
  postTitle: string;
  completedByName: string;
}

export interface NewCommentNotificationData {
  postId: string;
  postTitle: string;
  commentAuthorName: string;
}

export interface CommentReplyNotificationData {
  postId: string;
  commentId: string;
  replyAuthorName: string;
}

export interface ReportResolvedNotificationData {
  reportId: string;
  contentType: 'post' | 'comment';
  resolution: 'approved' | 'deleted' | 'dismissed';
}

export interface RewardEarnedNotificationData {
  milestone: number;
  examCredits: number;
  practiceCredits: number;
}

// ============================================
// Arabic Notification Templates
// ============================================

export const NOTIFICATION_TEMPLATES = {
  exam_completed: {
    title: 'إكمال اختبار',
    message: (name: string) => `${name} أكمل اختبارك المشارك`,
  },
  new_comment: {
    title: 'تعليق جديد',
    message: (name: string, postTitle: string) =>
      `${name} علق على منشورك "${postTitle}"`,
  },
  comment_reply: {
    title: 'رد على تعليقك',
    message: (name: string) => `${name} رد على تعليقك`,
  },
  report_resolved: {
    title: 'تم معالجة البلاغ',
    message: (resolution: string) => {
      const resolutionText = {
        approved: 'تمت الموافقة على المحتوى',
        deleted: 'تم حذف المحتوى المبلغ عنه',
        dismissed: 'تم رفض البلاغ',
      }[resolution] || 'تمت معالجة البلاغ';
      return resolutionText;
    },
  },
  reward_earned: {
    title: 'مكافأة جديدة! 🎉',
    message: (milestone: number, examCredits: number, practiceCredits: number) =>
      `تهانينا! حققت ${milestone} إكمال وحصلت على ${examCredits} رصيد اختبار و ${practiceCredits} رصيد تدريب`,
  },
} as const;

// ============================================
// Notification Preferences Extension
// ============================================

export interface ForumNotificationPreferences {
  forum_email_enabled: boolean;
  new_exam_email_enabled: boolean;
}

// ============================================
// Validation Constants
// ============================================

export const NOTIFICATION_LIMITS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
} as const;
