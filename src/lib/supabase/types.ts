export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answers: {
        Row: {
          id: string
          user_id: string
          session_id: string
          session_type: string
          question_id: string
          question_index: number
          selected_answer: number | null
          is_correct: boolean
          time_spent_seconds: number
          explanation_viewed: boolean
          explanation_viewed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          session_type: string
          question_id: string
          question_index: number
          selected_answer?: number | null
          is_correct: boolean
          time_spent_seconds: number
          explanation_viewed?: boolean
          explanation_viewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          session_type?: string
          question_id?: string
          question_index?: number
          selected_answer?: number | null
          is_correct?: boolean
          time_spent_seconds?: number
          explanation_viewed?: boolean
          explanation_viewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
          end_time: string | null
          id: string
          overall_score: number | null
          quantitative_score: number | null
          questions: Json | null
          questions_answered: number | null
          start_time: string | null
          started_at: string | null
          status: string
          time_paused_seconds: number | null
          time_spent_seconds: number | null
          total_questions: number
          track: string | null
          user_id: string
          verbal_score: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          overall_score?: number | null
          quantitative_score?: number | null
          questions?: Json | null
          questions_answered?: number | null
          start_time?: string | null
          started_at?: string | null
          status?: string
          time_paused_seconds?: number | null
          time_spent_seconds?: number | null
          total_questions?: number
          track?: string | null
          user_id: string
          verbal_score?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          overall_score?: number | null
          quantitative_score?: number | null
          questions?: Json | null
          questions_answered?: number | null
          start_time?: string | null
          started_at?: string | null
          status?: string
          time_paused_seconds?: number | null
          time_spent_seconds?: number | null
          total_questions?: number
          track?: string | null
          user_id?: string
          verbal_score?: number | null
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
      get_practice_history: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          section: string
          categories: string[]
          difficulty: string
          question_count: number
          status: string
          started_at: string
          completed_at: string | null
          time_spent_seconds: number | null
          practice_results: Json | null
        }[]
      }
      has_premium_access: { Args: { check_user_id: string }; Returns: boolean }
      increment_practice_hours: { Args: { p_user_id: string; p_hours: number }; Returns: void }
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

type DefaultSchema = Database["public"]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
