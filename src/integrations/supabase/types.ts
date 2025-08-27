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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ab_test_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          test_id: string | null
          user_id: string | null
          variant: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          test_id?: string | null
          user_id?: string | null
          variant: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          test_id?: string | null
          user_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          feature_key: string
          id: string
          name: string
          start_date: string | null
          target_audience: Json | null
          variants: Json
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          feature_key: string
          id?: string
          name: string
          start_date?: string | null
          target_audience?: Json | null
          variants?: Json
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          feature_key?: string
          id?: string
          name?: string
          start_date?: string | null
          target_audience?: Json | null
          variants?: Json
        }
        Relationships: []
      }
      approved_affiliates: {
        Row: {
          api_key_name: string | null
          base_url: string
          created_at: string
          custom_url: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          api_key_name?: string | null
          base_url: string
          created_at?: string
          custom_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          api_key_name?: string | null
          base_url?: string
          created_at?: string
          custom_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          email: string | null
          id: string
          ip_address: unknown
          last_attempt: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address: unknown
          last_attempt?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address?: unknown
          last_attempt?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          points_required: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points_required?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points_required?: number | null
        }
        Relationships: []
      }
      chore_analytics: {
        Row: {
          child_id: string
          chore_id: string
          completion_time: number | null
          created_at: string
          day_of_week: number | null
          difficulty_rating: number | null
          family_id: string
          id: string
          preferred_time_of_day: string | null
        }
        Insert: {
          child_id: string
          chore_id: string
          completion_time?: number | null
          created_at?: string
          day_of_week?: number | null
          difficulty_rating?: number | null
          family_id: string
          id?: string
          preferred_time_of_day?: string | null
        }
        Update: {
          child_id?: string
          chore_id?: string
          completion_time?: number | null
          created_at?: string
          day_of_week?: number | null
          difficulty_rating?: number | null
          family_id?: string
          id?: string
          preferred_time_of_day?: string | null
        }
        Relationships: []
      }
      chores: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          due_date: string | null
          estimated_time_minutes: number | null
          family_id: string | null
          id: string
          points_value: number
          status: Database["public"]["Enums"]["chore_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          due_date?: string | null
          estimated_time_minutes?: number | null
          family_id?: string | null
          id?: string
          points_value?: number
          status?: Database["public"]["Enums"]["chore_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          due_date?: string | null
          estimated_time_minutes?: number | null
          family_id?: string | null
          id?: string
          points_value?: number
          status?: Database["public"]["Enums"]["chore_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chores_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          family_code: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          family_code?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          family_code?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_ai_settings: {
        Row: {
          ai_suggestions_enabled: boolean | null
          analytics_enabled: boolean | null
          created_at: string
          data_sharing_consent: boolean | null
          family_id: string
          id: string
          updated_at: string
        }
        Insert: {
          ai_suggestions_enabled?: boolean | null
          analytics_enabled?: boolean | null
          created_at?: string
          data_sharing_consent?: boolean | null
          family_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          ai_suggestions_enabled?: boolean | null
          analytics_enabled?: boolean | null
          created_at?: string
          data_sharing_consent?: boolean | null
          family_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          family_id: string | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          family_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          family_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_messages: {
        Row: {
          chore_id: string | null
          content: string
          created_at: string
          family_id: string
          id: string
          is_encrypted: boolean | null
          message_type: string | null
          parent_message_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chore_id?: string | null
          content: string
          created_at?: string
          family_id: string
          id?: string
          is_encrypted?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chore_id?: string | null
          content?: string
          created_at?: string
          family_id?: string
          id?: string
          is_encrypted?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_reports: {
        Row: {
          created_at: string
          family_id: string
          generated_by: string
          id: string
          report_data: Json
          report_type: string | null
          report_url: string | null
        }
        Insert: {
          created_at?: string
          family_id: string
          generated_by: string
          id?: string
          report_data: Json
          report_type?: string | null
          report_url?: string | null
        }
        Update: {
          created_at?: string
          family_id?: string
          generated_by?: string
          id?: string
          report_data?: Json
          report_type?: string | null
          report_url?: string | null
        }
        Relationships: []
      }
      mfa_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      motivation_journal: {
        Row: {
          chore_id: string | null
          confidence_level: number
          created_at: string
          emotion: string
          family_id: string
          id: string
          next_time: string | null
          reflection: string
          task_name: string
          updated_at: string
          user_id: string
          what_helped: string | null
        }
        Insert: {
          chore_id?: string | null
          confidence_level: number
          created_at?: string
          emotion: string
          family_id: string
          id?: string
          next_time?: string | null
          reflection: string
          task_name: string
          updated_at?: string
          user_id: string
          what_helped?: string | null
        }
        Update: {
          chore_id?: string | null
          confidence_level?: number
          created_at?: string
          emotion?: string
          family_id?: string
          id?: string
          next_time?: string | null
          reflection?: string
          task_name?: string
          updated_at?: string
          user_id?: string
          what_helped?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          last_activity: string | null
          level: number | null
          points: number | null
          role: Database["public"]["Enums"]["user_role"]
          streak_days: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          email: string
          id: string
          last_activity?: string | null
          level?: number | null
          points?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          streak_days?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          last_activity?: string | null
          level?: number | null
          points?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          streak_days?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      progress_logs: {
        Row: {
          action: string
          chore_id: string | null
          created_at: string | null
          family_id: string | null
          id: string
          notes: string | null
          points_earned: number | null
          user_id: string | null
        }
        Insert: {
          action: string
          chore_id?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          notes?: string | null
          points_earned?: number | null
          user_id?: string | null
        }
        Update: {
          action?: string
          chore_id?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          notes?: string | null
          points_earned?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          family_id: string | null
          id: string
          points_cost: number
          redeemed_at: string | null
          redeemed_by: string | null
          status: Database["public"]["Enums"]["reward_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          family_id?: string | null
          id?: string
          points_cost: number
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: Database["public"]["Enums"]["reward_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          family_id?: string | null
          id?: string
          points_cost?: number
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: Database["public"]["Enums"]["reward_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          admin_response: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          responded_at: string | null
          responded_by: string | null
          status: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          mfa_enabled: boolean | null
          totp_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          mfa_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          mfa_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          achieved_at: string | null
          affiliate_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          family_id: string
          id: string
          item_type: string
          original_price: number | null
          points_goal: number
          product_image_url: string | null
          product_url: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          affiliate_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          family_id: string
          id?: string
          item_type?: string
          original_price?: number | null
          points_goal?: number
          product_image_url?: string | null
          product_url?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          affiliate_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          family_id?: string
          id?: string
          item_type?: string
          original_price?: number | null
          points_goal?: number
          product_image_url?: string | null
          product_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "approved_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_security_definer_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          recommendation: string
          security_level: string
        }[]
      }
      can_generate_reports: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_auth_rate_limit: {
        Args: {
          block_duration_minutes?: number
          email_addr?: string
          ip_addr: unknown
          max_attempts?: number
        }
        Returns: boolean
      }
      check_auth_rate_limit_secure: {
        Args: {
          block_duration_minutes?: number
          email_addr?: string
          ip_addr: unknown
          max_attempts?: number
        }
        Returns: boolean
      }
      decrypt_mfa_secret: {
        Args: { encoded_text: string }
        Returns: string
      }
      encrypt_mfa_secret: {
        Args: { secret_text: string }
        Returns: string
      }
      get_accessible_profiles_for_user: {
        Args: { requesting_user_id?: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
          last_activity: string
          level: number
          masked_email: string
          points: number
          role: Database["public"]["Enums"]["user_role"]
          streak_days: number
          username: string
        }[]
      }
      get_safe_family_profiles: {
        Args: { requesting_user_id?: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
          last_activity: string
          level: number
          points: number
          role: Database["public"]["Enums"]["user_role"]
          streak_days: number
          username: string
        }[]
      }
      get_safe_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          id: string
          last_activity: string
          level: number
          points: number
          role: Database["public"]["Enums"]["user_role"]
          streak_days: number
          username: string
        }[]
      }
      get_user_family_ids: {
        Args: { user_id_param?: string }
        Returns: string[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_any_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_family_member: {
        Args: { family_id_param: string; user_id_param?: string }
        Returns: boolean
      }
      is_family_parent: {
        Args: { family_id_param: string; user_id_param?: string }
        Returns: boolean
      }
      is_full_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          event_type: string
          metadata_param?: Json
          user_id_param: string
        }
        Returns: undefined
      }
      log_security_violation: {
        Args: {
          metadata_param?: Json
          table_name: string
          user_id_param?: string
          violation_type: string
        }
        Returns: undefined
      }
      monitor_security_table_integrity: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_family_access: {
        Args: {
          family_id_param: string
          required_role?: string
          user_id_param?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      chore_status: "pending" | "in_progress" | "completed" | "overdue"
      reward_status: "available" | "redeemed" | "pending_approval"
      user_role:
        | "kid"
        | "parent"
        | "admin"
        | "full_admin"
        | "read_only_admin"
        | "report_admin"
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
    Enums: {
      chore_status: ["pending", "in_progress", "completed", "overdue"],
      reward_status: ["available", "redeemed", "pending_approval"],
      user_role: [
        "kid",
        "parent",
        "admin",
        "full_admin",
        "read_only_admin",
        "report_admin",
      ],
    },
  },
} as const
