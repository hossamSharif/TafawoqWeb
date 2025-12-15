/**
 * Extended Supabase Types for Platform Upgrade V2
 *
 * These types extend the auto-generated types.ts with new columns and tables
 * added by the 003-platform-upgrade-v2 migrations.
 *
 * NOTE: After running migrations, regenerate types.ts using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 */

import { Database, Json } from './types'

// Extended forum_posts with library columns
export interface ForumPostWithLibrary {
  author_id: string
  body: string | null
  comment_count: number | null
  completion_count: number | null
  created_at: string | null
  id: string
  is_admin_upload: boolean | null
  is_edited: boolean | null
  is_library_visible: boolean | null
  library_access_count: number | null
  like_count: number | null
  love_count: number | null
  post_type: string
  shared_exam_id: string | null
  shared_practice_id: string | null
  status: string | null
  title: string
  updated_at: string | null
}

// Extended user_credits with sharing columns
export interface UserCreditsWithSharing {
  created_at: string | null
  credit_history: Json | null
  exam_credits: number | null
  id: string
  last_awarded_milestone: number | null
  library_access_used: number | null
  practice_credits: number | null
  share_credits_exam: number | null
  share_credits_practice: number | null
  total_completions: number | null
  updated_at: string | null
  user_id: string
}

// Extended user_subscriptions with grace period columns
export interface UserSubscriptionWithGracePeriod {
  canceled_at: string | null
  created_at: string | null
  current_period_end: string | null
  current_period_start: string | null
  downgrade_scheduled: boolean | null
  grace_period_end: string | null
  id: string
  payment_failed_at: string | null
  status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  tier: string
  trial_end_at: string | null
  updated_at: string | null
  user_id: string
}

// New library_access table
export interface LibraryAccessRow {
  id: string
  user_id: string
  post_id: string
  accessed_at: string
  exam_started: boolean | null
  exam_completed: boolean | null
}

export interface LibraryAccessInsert {
  id?: string
  user_id: string
  post_id: string
  accessed_at?: string
  exam_started?: boolean | null
  exam_completed?: boolean | null
}

export interface LibraryAccessUpdate {
  id?: string
  user_id?: string
  post_id?: string
  accessed_at?: string
  exam_started?: boolean | null
  exam_completed?: boolean | null
}

// New maintenance_log table
export interface MaintenanceLogRow {
  id: string
  admin_id: string
  action: 'enabled' | 'disabled'
  message: string | null
  created_at: string
}

export interface MaintenanceLogInsert {
  id?: string
  admin_id: string
  action: 'enabled' | 'disabled'
  message?: string | null
  created_at?: string
}

// Database functions return types
export interface LibraryExamResult {
  post_id: string
  title: string
  section: string | null
  question_count: number | null
  creator_name: string | null
  creator_id: string
  completion_count: number
  user_has_access: boolean
  user_completed: boolean
  created_at: string | null
}

// Extended Database type for use in application code
export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      library_access: {
        Row: LibraryAccessRow
        Insert: LibraryAccessInsert
        Update: LibraryAccessUpdate
        Relationships: [
          {
            foreignKeyName: "library_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_access_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_log: {
        Row: MaintenanceLogRow
        Insert: MaintenanceLogInsert
        Update: never
        Relationships: [
          {
            foreignKeyName: "maintenance_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: Database['public']['Functions'] & {
      check_library_access_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      get_library_exams: {
        Args: {
          p_user_id: string
          p_limit?: number
          p_offset?: number
          p_section?: string | null
          p_sort?: string
        }
        Returns: LibraryExamResult[]
      }
    }
  }
}

// Helper type to get the extended tables
export type ExtendedTables = ExtendedDatabase['public']['Tables']

// Re-export for convenience
export type { Database, Json } from './types'
