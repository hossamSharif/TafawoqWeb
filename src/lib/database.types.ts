/**
 * database.types.ts
 * TypeScript types for Supabase database schema
 *
 * Generated manually from base schema migration
 * @see supabase/migrations/00000000000000_base_schema_v3.sql
 *
 * TODO: Regenerate using Supabase CLI after authentication:
 * npx supabase gen types typescript --project-id fvstedbsjiqvryqpnmzl > src/lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          // Base fields (v2.x)
          id: string
          created_at: string
          version: string
          section: 'quantitative' | 'verbal'
          topic: string
          subtopic: string | null
          difficulty: number
          question_type: 'mcq' | 'comparison' | 'diagram' | 'word-problem' | 'analogy' | 'sentence-completion' | 'error-identification' | 'reading-comprehension' | 'vocab-in-context'
          question_text: string
          question_text_en: string | null
          options: Json
          correct_answer: string
          explanation: string
          explanation_en: string | null
          time_estimate: number
          tags: string[]
          metadata: Json
          is_verified: boolean
          verified_by: string | null
          verified_at: string | null
          is_active: boolean

          // v3.0 new fields
          comparison_values: Json | null
          shape_type: string | null
          pattern_id: string | null
          diagram_config: Json | null
          relationship_type: string | null
          generation_metadata: Json
          quality_flags: Json
          corrected_at: string | null
          error_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          version?: string
          section: 'quantitative' | 'verbal'
          topic: string
          subtopic?: string | null
          difficulty: number
          question_type: 'mcq' | 'comparison' | 'diagram' | 'word-problem' | 'analogy' | 'sentence-completion' | 'error-identification' | 'reading-comprehension' | 'vocab-in-context'
          question_text: string
          question_text_en?: string | null
          options: Json
          correct_answer: string
          explanation: string
          explanation_en?: string | null
          time_estimate?: number
          tags?: string[]
          metadata?: Json
          is_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          is_active?: boolean
          comparison_values?: Json | null
          shape_type?: string | null
          pattern_id?: string | null
          diagram_config?: Json | null
          relationship_type?: string | null
          generation_metadata?: Json
          quality_flags?: Json
          corrected_at?: string | null
          error_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          version?: string
          section?: 'quantitative' | 'verbal'
          topic?: string
          subtopic?: string | null
          difficulty?: number
          question_type?: 'mcq' | 'comparison' | 'diagram' | 'word-problem' | 'analogy' | 'sentence-completion' | 'error-identification' | 'reading-comprehension' | 'vocab-in-context'
          question_text?: string
          question_text_en?: string | null
          options?: Json
          correct_answer?: string
          explanation?: string
          explanation_en?: string | null
          time_estimate?: number
          tags?: string[]
          metadata?: Json
          is_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          is_active?: boolean
          comparison_values?: Json | null
          shape_type?: string | null
          pattern_id?: string | null
          diagram_config?: Json | null
          relationship_type?: string | null
          generation_metadata?: Json
          quality_flags?: Json
          corrected_at?: string | null
          error_count?: number
        }
      }

      question_errors: {
        Row: {
          id: string
          created_at: string
          question_id: string
          error_type: 'incorrect_answer' | 'typo' | 'unclear_wording' | 'missing_diagram' | 'incorrect_diagram' | 'wrong_difficulty' | 'wrong_topic' | 'duplicate' | 'other'
          description: string
          reported_by: string | null
          status: 'pending' | 'under_review' | 'resolved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          resolution_notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          question_id: string
          error_type: 'incorrect_answer' | 'typo' | 'unclear_wording' | 'missing_diagram' | 'incorrect_diagram' | 'wrong_difficulty' | 'wrong_topic' | 'duplicate' | 'other'
          description: string
          reported_by?: string | null
          status?: 'pending' | 'under_review' | 'resolved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          resolution_notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          question_id?: string
          error_type?: 'incorrect_answer' | 'typo' | 'unclear_wording' | 'missing_diagram' | 'incorrect_diagram' | 'wrong_difficulty' | 'wrong_topic' | 'duplicate' | 'other'
          description?: string
          reported_by?: string | null
          status?: 'pending' | 'under_review' | 'resolved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          resolution_notes?: string | null
        }
      }

      review_queue: {
        Row: {
          id: string
          created_at: string
          question_id: string
          queue_type: 'new_question' | 'error_report' | 'quality_check' | 'batch_review'
          priority: number
          assigned_to: string | null
          status: 'pending' | 'in_review' | 'completed' | 'rejected'
          reviewed_at: string | null
          review_notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          question_id: string
          queue_type: 'new_question' | 'error_report' | 'quality_check' | 'batch_review'
          priority?: number
          assigned_to?: string | null
          status?: 'pending' | 'in_review' | 'completed' | 'rejected'
          reviewed_at?: string | null
          review_notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          question_id?: string
          queue_type?: 'new_question' | 'error_report' | 'quality_check' | 'batch_review'
          priority?: number
          assigned_to?: string | null
          status?: 'pending' | 'in_review' | 'completed' | 'rejected'
          reviewed_at?: string | null
          review_notes?: string | null
        }
      }

      exam_configs: {
        Row: {
          id: string
          created_at: string
          config_name: string
          section: 'quantitative' | 'verbal'
          total_questions: number
          time_limit: number
          topic_distribution: Json
          difficulty_distribution: Json
          is_active: boolean
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          config_name: string
          section: 'quantitative' | 'verbal'
          total_questions?: number
          time_limit?: number
          topic_distribution?: Json
          difficulty_distribution?: Json
          is_active?: boolean
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          config_name?: string
          section?: 'quantitative' | 'verbal'
          total_questions?: number
          time_limit?: number
          topic_distribution?: Json
          difficulty_distribution?: Json
          is_active?: boolean
          metadata?: Json
        }
      }

      practice_sessions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          session_type: 'practice' | 'exam' | 'review'
          section: 'quantitative' | 'verbal'
          questions: string[]
          answers: Json
          score: number | null
          time_taken: number | null
          completed_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          session_type: 'practice' | 'exam' | 'review'
          section: 'quantitative' | 'verbal'
          questions?: string[]
          answers?: Json
          score?: number | null
          time_taken?: number | null
          completed_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          session_type?: 'practice' | 'exam' | 'review'
          section?: 'quantitative' | 'verbal'
          questions?: string[]
          answers?: Json
          score?: number | null
          time_taken?: number | null
          completed_at?: string | null
          metadata?: Json
        }
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_reviewer: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_system: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }

    Enums: {
      [_ in never]: never
    }
  }
}
