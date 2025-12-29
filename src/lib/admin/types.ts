// Admin Types for Forum & Exam Sharing Platform
// Based on data-model.md and contracts/api.md specifications

// ============================================
// Enums and Constants
// ============================================

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'misinformation'
  | 'other';
export type ReportContentType = 'post' | 'comment';
export type ModerationAction = 'approve' | 'delete_content' | 'dismiss';

export type AdminActionType =
  | 'user_disabled'
  | 'user_enabled'
  | 'user_deleted'
  | 'user_banned'
  | 'user_unbanned'
  | 'password_reset'
  | 'post_deleted'
  | 'post_edited'
  | 'comment_deleted'
  | 'comment_edited'
  | 'report_resolved'
  | 'report_dismissed'
  | 'subscription_modified'
  | 'credits_added'
  | 'feature_toggled'
  | 'review_featured'
  | 'review_unfeatured'
  | 'review_deleted';

export type AdminTargetType =
  | 'user'
  | 'post'
  | 'comment'
  | 'report'
  | 'subscription'
  | 'feature'
  | 'review';

export type UserStatus = 'active' | 'disabled' | 'banned';

export type SubscriptionAction =
  | 'upgrade'
  | 'downgrade'
  | 'add_credits'
  | 'extend_trial'
  | 'cancel';

// ============================================
// Database Row Types (matching Supabase schema)
// ============================================

export interface ReportRow {
  id: string;
  reporter_id: string;
  content_type: ReportContentType;
  content_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AdminAuditLogRow {
  id: string;
  admin_id: string;
  action_type: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface FeatureToggleRow {
  id: string;
  feature_name: string;
  is_enabled: boolean;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

// ============================================
// User Profile Extensions for Admin
// ============================================

export interface UserProfileAdminExtension {
  is_admin: boolean;
  is_banned: boolean;
  is_disabled: boolean;
}

// ============================================
// Insert Types (for creating new records)
// ============================================

export interface ReportInsert {
  id?: string;
  reporter_id: string;
  content_type: ReportContentType;
  content_id: string;
  reason: ReportReason;
  details?: string | null;
  status?: ReportStatus;
  resolution_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at?: string;
}

export interface AdminAuditLogInsert {
  id?: string;
  admin_id: string;
  action_type: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  details?: Record<string, unknown>;
  created_at?: string;
}

export interface FeatureToggleInsert {
  id?: string;
  feature_name: string;
  is_enabled?: boolean;
  description?: string | null;
  updated_by?: string | null;
  updated_at?: string;
}

// ============================================
// Update Types (for updating existing records)
// ============================================

export interface ReportUpdate {
  status?: ReportStatus;
  resolution_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
}

export interface FeatureToggleUpdate {
  is_enabled?: boolean;
  description?: string | null;
  updated_by?: string | null;
  updated_at?: string;
}

// ============================================
// API Request Types
// ============================================

export interface CreateReportRequest {
  content_type: ReportContentType;
  content_id: string;
  reason: ReportReason;
  details?: string;
}

export interface ResolveReportRequest {
  action: ModerationAction;
  notes?: string;
}

export interface UpdateUserStatusRequest {
  is_disabled?: boolean;
  is_banned?: boolean;
}

export interface UpdateSubscriptionRequest {
  action: SubscriptionAction;
  tier?: 'free' | 'premium';
  credits?: {
    exam: number;
    practice: number;
  };
  days?: number; // For extend_trial
}

export interface UpdateFeatureToggleRequest {
  is_enabled: boolean;
}

// ============================================
// API Response Types
// ============================================

// Dashboard Metrics
export interface DashboardMetrics {
  daily_active_users: number;
  new_registrations_today: number;
  exams_taken_today: number;
  posts_created_today: number;
  pending_reports: number;
  revenue_this_month: number;
}

export interface DashboardTrends {
  dau_change: number;
  registrations_change: number;
}

export interface DashboardResponse {
  metrics: DashboardMetrics;
  trends: DashboardTrends;
}

// User Management
export interface AdminUserInfo {
  id: string;
  email: string;
  display_name: string;
  academic_track: string;
  subscription_tier: string;
  is_admin: boolean;
  is_banned: boolean;
  is_disabled: boolean;
  created_at: string;
  last_active_at: string | null;
}

export interface UserListResponse {
  users: AdminUserInfo[];
  next_cursor: string | null;
  has_more: boolean;
}

// Moderation
export interface ReportContentPreview {
  id: string;
  preview: string;
  author: {
    id: string;
    display_name: string;
  };
}

export interface ReportWithContent {
  id: string;
  content_type: ReportContentType;
  content_id: string;
  content_preview: string;
  content_author: {
    id: string;
    display_name: string;
  };
  reporter: {
    id: string;
    display_name: string;
  };
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface ModerationQueueResponse {
  reports: ReportWithContent[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface ResolveReportResponse {
  id: string;
  status: ReportStatus;
  resolved_at: string;
}

// Feature Toggles
export interface FeatureToggle {
  feature_name: string;
  is_enabled: boolean;
  description: string | null;
}

export interface FeatureTogglesResponse {
  features: FeatureToggle[];
}

// Create Report Response
export interface CreateReportResponse {
  id: string;
  status: ReportStatus;
  created_at: string;
}

// Password Reset
export interface PasswordResetResponse {
  message: string;
}

// ============================================
// Query Parameters
// ============================================

export interface UserListParams {
  cursor?: string;
  limit?: number;
  search?: string;
  status?: UserStatus;
}

export interface ModerationQueueParams {
  cursor?: string;
  limit?: number;
  status?: ReportStatus;
}

// ============================================
// Default Feature Toggles
// ============================================

export const DEFAULT_FEATURE_TOGGLES = [
  {
    feature_name: 'forum_enabled',
    is_enabled: true,
    description: 'Enable/disable forum access',
  },
  {
    feature_name: 'forum_posting_enabled',
    is_enabled: true,
    description: 'Enable/disable new posts',
  },
  {
    feature_name: 'forum_sharing_enabled',
    is_enabled: true,
    description: 'Enable/disable exam sharing',
  },
  {
    feature_name: 'rewards_enabled',
    is_enabled: true,
    description: 'Enable/disable reward system',
  },
  {
    feature_name: 'notifications_enabled',
    is_enabled: true,
    description: 'Enable/disable notifications',
  },
] as const;

// ============================================
// Validation Constants
// ============================================

export const ADMIN_LIMITS = {
  REPORT_DETAILS_MAX_LENGTH: 500,
  RESOLUTION_NOTES_MAX_LENGTH: 500,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
} as const;

// ============================================
// Report Reason Labels (Arabic)
// ============================================

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'محتوى غير مرغوب فيه',
  harassment: 'تحرش أو إساءة',
  inappropriate_content: 'محتوى غير لائق',
  misinformation: 'معلومات مضللة',
  other: 'سبب آخر',
};
