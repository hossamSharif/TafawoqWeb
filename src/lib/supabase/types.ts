export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      exam_results: {
        Row: {
          created_at: string | null
          exam_session_id: string
          id: string
          improvement_advice: string | null
          overall_average: number | null
          quantitative_score: number
          strengths: Json | null
          user_id: string
          verbal_score: number
          weaknesses: Json | null
        }
        Insert: {
          created_at?: string | null
          exam_session_id: string
          id?: string
          improvement_advice?: string | null
          overall_average?: number | null
          quantitative_score: number
          strengths?: Json | null
          user_id: string
          verbal_score: number
          weaknesses?: Json | null
        }
        Update: {
          created_at?: string | null
          exam_session_id?: string
          id?: string
          improvement_advice?: string | null
          overall_average?: number | null
          quantitative_score?: number
          strengths?: Json | null
          user_id?: string
          verbal_score?: number
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: true
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          questions_answered: number | null
          started_at: string | null
          status: string
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          questions_answered?: number | null
          started_at?: string | null
          status?: string
          time_spent_seconds?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          questions_answered?: number | null
          started_at?: string | null
          status?: string
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          exam_reminders_enabled: boolean | null
          id: string
          milestone_notifications_enabled: boolean | null
          push_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_reminders_enabled?: boolean | null
          id?: string
          milestone_notifications_enabled?: boolean | null
          push_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_reminders_enabled?: boolean | null
          id?: string
          milestone_notifications_enabled?: boolean | null
          push_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      practice_results: {
        Row: {
          category_breakdown: Json
          created_at: string | null
          id: string
          improvement_advice: string | null
          overall_score: number
          practice_session_id: string
          strengths: Json | null
          user_id: string
          weaknesses: Json | null
        }
        Insert: {
          category_breakdown: Json
          created_at?: string | null
          id?: string
          improvement_advice?: string | null
          overall_score: number
          practice_session_id: string
          strengths?: Json | null
          user_id: string
          weaknesses?: Json | null
        }
        Update: {
          category_breakdown?: Json
          created_at?: string | null
          id?: string
          improvement_advice?: string | null
          overall_score?: number
          practice_session_id?: string
          strengths?: Json | null
          user_id?: string
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_results_practice_session_id_fkey"
            columns: ["practice_session_id"]
            isOneToOne: true
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          categories: string[]
          completed_at: string | null
          created_at: string | null
          difficulty: string
          id: string
          question_count: number
          section: string
          started_at: string | null
          status: string
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          categories: string[]
          completed_at?: string | null
          created_at?: string | null
          difficulty: string
          id?: string
          question_count: number
          section: string
          started_at?: string | null
          status?: string
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          categories?: string[]
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string
          id?: string
          question_count?: number
          section?: string
          started_at?: string | null
          status?: string
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: []
      }
      question_embeddings: {
        Row: {
          created_at: string | null
          embedding: string
          id: string
          metadata: Json
          prompt_context: string
          question_template_id: string | null
        }
        Insert: {
          created_at?: string | null
          embedding: string
          id?: string
          metadata: Json
          prompt_context: string
          question_template_id?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string
          id?: string
          metadata?: Json
          prompt_context?: string
          question_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_embeddings_question_template_id_fkey"
            columns: ["question_template_id"]
            isOneToOne: false
            referencedRelation: "question_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      question_templates: {
        Row: {
          category: string
          correct_answer: string
          created_at: string | null
          difficulty: string
          explanation: string
          has_image: boolean | null
          id: string
          image_prompt: string | null
          options: Json
          question_text: string
          section: string
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty: string
          explanation: string
          has_image?: boolean | null
          id?: string
          image_prompt?: string | null
          options: Json
          question_text: string
          section: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty?: string
          explanation?: string
          has_image?: boolean | null
          id?: string
          image_prompt?: string | null
          options?: Json
          question_text?: string
          section?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          id: string
          last_activity_at: string | null
          last_exam_overall_average: number | null
          last_exam_quantitative_score: number | null
          last_exam_verbal_score: number | null
          strongest_category: string | null
          total_exams_completed: number | null
          total_practice_hours: number | null
          total_practices_completed: number | null
          updated_at: string | null
          user_id: string
          weakest_category: string | null
        }
        Insert: {
          id?: string
          last_activity_at?: string | null
          last_exam_overall_average?: number | null
          last_exam_quantitative_score?: number | null
          last_exam_verbal_score?: number | null
          strongest_category?: string | null
          total_exams_completed?: number | null
          total_practice_hours?: number | null
          total_practices_completed?: number | null
          updated_at?: string | null
          user_id: string
          weakest_category?: string | null
        }
        Update: {
          id?: string
          last_activity_at?: string | null
          last_exam_overall_average?: number | null
          last_exam_quantitative_score?: number | null
          last_exam_verbal_score?: number | null
          strongest_category?: string | null
          total_exams_completed?: number | null
          total_practice_hours?: number | null
          total_practices_completed?: number | null
          updated_at?: string | null
          user_id?: string
          weakest_category?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          academic_track: string
          created_at: string | null
          id: string
          last_active_at: string | null
          onboarding_completed: boolean | null
          profile_picture_url: string | null
          total_practice_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          academic_track: string
          created_at?: string | null
          id?: string
          last_active_at?: string | null
          onboarding_completed?: boolean | null
          profile_picture_url?: string | null
          total_practice_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          academic_track?: string
          created_at?: string | null
          id?: string
          last_active_at?: string | null
          onboarding_completed?: boolean | null
          profile_picture_url?: string | null
          total_practice_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          trial_end_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          trial_end_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          trial_end_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_practice_hours: { Args: { p_user_id: string }; Returns: number }
      check_exam_eligibility: {
        Args: { p_user_id: string }
        Returns: {
          exams_taken_this_week: number
          is_eligible: boolean
          max_exams_per_week: number
          next_eligible_at: string
          reason: string
        }[]
      }
      get_category_performance: {
        Args: { p_user_id: string }
        Returns: {
          accuracy: number
          category: string
          correct_answers: number
          total_questions: number
        }[]
      }
      has_premium_access: { Args: { check_user_id: string }; Returns: boolean }
      search_similar_questions: {
        Args: {
          p_difficulty: string
          p_limit?: number
          p_query_embedding: string
          p_section: string
        }
        Returns: {
          category: string
          difficulty: string
          question_id: string
          question_text: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
