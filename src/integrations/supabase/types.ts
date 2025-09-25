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
      admin_role_permissions: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          metadata: Json | null
          permission: Database["public"]["Enums"]["admin_permission"]
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permission: Database["public"]["Enums"]["admin_permission"]
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permission?: Database["public"]["Enums"]["admin_permission"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_role_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      age_profiles: {
        Row: {
          age_group: string
          birth_date: string | null
          created_at: string
          enabled_features: Json
          id: string
          parent_restrictions: Json | null
          point_limits: Json
          ui_complexity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group: string
          birth_date?: string | null
          created_at?: string
          enabled_features?: Json
          id?: string
          parent_restrictions?: Json | null
          point_limits?: Json
          ui_complexity?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string
          birth_date?: string | null
          created_at?: string
          enabled_features?: Json
          id?: string
          parent_restrictions?: Json | null
          point_limits?: Json
          ui_complexity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "age_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      bonus_rewards: {
        Row: {
          achievement_date: string
          bonus_type: string
          created_at: string
          family_id: string
          id: string
          metadata: Json | null
          points_awarded: number
          streak_count: number | null
          user_id: string
        }
        Insert: {
          achievement_date?: string
          bonus_type: string
          created_at?: string
          family_id: string
          id?: string
          metadata?: Json | null
          points_awarded: number
          streak_count?: number | null
          user_id: string
        }
        Update: {
          achievement_date?: string
          bonus_type?: string
          created_at?: string
          family_id?: string
          id?: string
          metadata?: Json | null
          points_awarded?: number
          streak_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_rewards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: string[] | null
          failed_items: number | null
          id: string
          initiated_by: string
          operation_data: Json
          operation_type: string
          processed_items: number | null
          results: Json | null
          started_at: string | null
          status: string | null
          total_items: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: string[] | null
          failed_items?: number | null
          id?: string
          initiated_by: string
          operation_data: Json
          operation_type: string
          processed_items?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: string[] | null
          failed_items?: number | null
          id?: string
          initiated_by?: string
          operation_data?: Json
          operation_type?: string
          processed_items?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_operations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      child_account_settings: {
        Row: {
          child_id: string
          communication_settings: Json | null
          content_restrictions: Json | null
          created_at: string | null
          family_id: string
          id: string
          parent_id: string
          password_policy: Json | null
          safety_settings: Json | null
          screen_time_limits: Json | null
          updated_at: string | null
        }
        Insert: {
          child_id: string
          communication_settings?: Json | null
          content_restrictions?: Json | null
          created_at?: string | null
          family_id: string
          id?: string
          parent_id: string
          password_policy?: Json | null
          safety_settings?: Json | null
          screen_time_limits?: Json | null
          updated_at?: string | null
        }
        Update: {
          child_id?: string
          communication_settings?: Json | null
          content_restrictions?: Json | null
          created_at?: string | null
          family_id?: string
          id?: string
          parent_id?: string
          password_policy?: Json | null
          safety_settings?: Json | null
          screen_time_limits?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_account_settings_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_account_settings_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_account_settings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      child_goal_proposals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          child_id: string
          created_at: string
          description: string | null
          family_id: string
          id: string
          parent_feedback: string | null
          proposed_points: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          child_id: string
          created_at?: string
          description?: string | null
          family_id: string
          id?: string
          parent_feedback?: string | null
          proposed_points: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          child_id?: string
          created_at?: string
          description?: string | null
          family_id?: string
          id?: string
          parent_feedback?: string | null
          proposed_points?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_goal_proposals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_goal_proposals_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_goal_proposals_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
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
      chore_calendar: {
        Row: {
          chore_id: string
          completed: boolean
          created_at: string
          family_id: string
          id: string
          scheduled_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chore_id: string
          completed?: boolean
          created_at?: string
          family_id: string
          id?: string
          scheduled_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chore_id?: string
          completed?: boolean
          created_at?: string
          family_id?: string
          id?: string
          scheduled_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chore_challenges: {
        Row: {
          challenge_type: string
          chore_id: string
          completion_time_seconds: number | null
          created_at: string
          end_time: string | null
          family_id: string
          id: string
          participant_id: string
          points_earned: number
          rank_in_family: number | null
          start_time: string
        }
        Insert: {
          challenge_type?: string
          chore_id: string
          completion_time_seconds?: number | null
          created_at?: string
          end_time?: string | null
          family_id: string
          id?: string
          participant_id: string
          points_earned?: number
          rank_in_family?: number | null
          start_time?: string
        }
        Update: {
          challenge_type?: string
          chore_id?: string
          completion_time_seconds?: number | null
          created_at?: string
          end_time?: string | null
          family_id?: string
          id?: string
          participant_id?: string
          points_earned?: number
          rank_in_family?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "chore_challenges_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_challenges_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_challenges_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chores: {
        Row: {
          assigned_to: string | null
          challenge_mode: boolean | null
          completed_at: string | null
          completion_time_seconds: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          due_date: string | null
          early_completion_bonus: number | null
          estimated_time_minutes: number | null
          family_id: string | null
          fastest_completion_time: number | null
          id: string
          points_value: number
          speed_bonus: number | null
          status: Database["public"]["Enums"]["chore_status"] | null
          streak_bonus: number | null
          team_bonus: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          challenge_mode?: boolean | null
          completed_at?: string | null
          completion_time_seconds?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          due_date?: string | null
          early_completion_bonus?: number | null
          estimated_time_minutes?: number | null
          family_id?: string | null
          fastest_completion_time?: number | null
          id?: string
          points_value?: number
          speed_bonus?: number | null
          status?: Database["public"]["Enums"]["chore_status"] | null
          streak_bonus?: number | null
          team_bonus?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          challenge_mode?: boolean | null
          completed_at?: string | null
          completion_time_seconds?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          due_date?: string | null
          early_completion_bonus?: number | null
          estimated_time_minutes?: number | null
          family_id?: string | null
          fastest_completion_time?: number | null
          id?: string
          points_value?: number
          speed_bonus?: number | null
          status?: Database["public"]["Enums"]["chore_status"] | null
          streak_bonus?: number | null
          team_bonus?: number | null
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
      email_aliases: {
        Row: {
          alias_email: string
          created_at: string | null
          family_id: string
          id: string
          is_active: boolean | null
          primary_email: string
          role: Database["public"]["Enums"]["family_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alias_email: string
          created_at?: string | null
          family_id: string
          id?: string
          is_active?: boolean | null
          primary_email: string
          role?: Database["public"]["Enums"]["family_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alias_email?: string
          created_at?: string | null
          family_id?: string
          id?: string
          is_active?: boolean | null
          primary_email?: string
          role?: Database["public"]["Enums"]["family_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_aliases_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      email_conflicts: {
        Row: {
          conflicting_request_data: Json
          created_at: string | null
          email: string
          existing_user_id: string | null
          id: string
          resolution_strategy: string | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          conflicting_request_data: Json
          created_at?: string | null
          email: string
          existing_user_id?: string | null
          id?: string
          resolution_strategy?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          conflicting_request_data?: Json
          created_at?: string | null
          email?: string
          existing_user_id?: string | null
          id?: string
          resolution_strategy?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      families: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string | null
          created_by_primary_email: boolean | null
          description: string | null
          email_domain: string | null
          family_code: string
          id: string
          name: string
          parent_id: string | null
          primary_email_designator: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by_primary_email?: boolean | null
          description?: string | null
          email_domain?: string | null
          family_code?: string
          id?: string
          name: string
          parent_id?: string | null
          primary_email_designator?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by_primary_email?: boolean | null
          description?: string | null
          email_domain?: string | null
          family_code?: string
          id?: string
          name?: string
          parent_id?: string | null
          primary_email_designator?: string | null
          settings?: Json | null
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
      families_backup: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string | null
          created_by_primary_email: boolean | null
          description: string | null
          email_domain: string | null
          family_code: string | null
          id: string | null
          name: string | null
          parent_id: string | null
          primary_email_designator: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by_primary_email?: boolean | null
          description?: string | null
          email_domain?: string | null
          family_code?: string | null
          id?: string | null
          name?: string | null
          parent_id?: string | null
          primary_email_designator?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by_primary_email?: boolean | null
          description?: string | null
          email_domain?: string | null
          family_code?: string | null
          id?: string | null
          name?: string | null
          parent_id?: string | null
          primary_email_designator?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
      family_invitations: {
        Row: {
          created_at: string | null
          expires_at: string
          family_id: string
          id: string
          invitation_code: string | null
          invited_by: string
          invitee_email: string
          invitee_name: string | null
          metadata: Json | null
          permissions: Json | null
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          family_id: string
          id?: string
          invitation_code?: string | null
          invited_by: string
          invitee_email: string
          invitee_name?: string | null
          metadata?: Json | null
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          family_id?: string
          id?: string
          invitation_code?: string | null
          invited_by?: string
          invitee_email?: string
          invitee_name?: string | null
          metadata?: Json | null
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_join_requests: {
        Row: {
          approved_by: string | null
          created_at: string | null
          expires_at: string | null
          family_id: string
          id: string
          message: string | null
          metadata: Json | null
          processed_at: string | null
          requester_id: string
          status: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          family_id: string
          id?: string
          message?: string | null
          metadata?: Json | null
          processed_at?: string | null
          requester_id: string
          status?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          family_id?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          processed_at?: string | null
          requester_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_join_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_join_requests_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_join_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_leaderboards: {
        Row: {
          age_group: string
          created_at: string
          family_id: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          rankings: Json
          updated_at: string
        }
        Insert: {
          age_group: string
          created_at?: string
          family_id: string
          id?: string
          period_end: string
          period_start: string
          period_type?: string
          rankings?: Json
          updated_at?: string
        }
        Update: {
          age_group?: string
          created_at?: string
          family_id?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          rankings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_leaderboards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
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
      family_permissions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
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
      family_roles: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          family_id: string
          id: string
          invited_at: string | null
          invited_by: string | null
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          family_id: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          family_id?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_roles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          bonus_type: string | null
          chore_id: string | null
          created_at: string
          description: string
          family_id: string
          goal_id: string | null
          id: string
          metadata: Json | null
          points_amount: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          bonus_type?: string | null
          chore_id?: string | null
          created_at?: string
          description: string
          family_id: string
          goal_id?: string | null
          id?: string
          metadata?: Json | null
          points_amount: number
          transaction_type: string
          user_id: string
        }
        Update: {
          bonus_type?: string | null
          chore_id?: string | null
          created_at?: string
          description?: string
          family_id?: string
          goal_id?: string | null
          id?: string
          metadata?: Json | null
          points_amount?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "child_goal_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alternative_emails: Json | null
          avatar_url: string | null
          created_at: string | null
          display_name: string
          email: string
          email_verified: boolean | null
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
          alternative_emails?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          email: string
          email_verified?: boolean | null
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
          alternative_emails?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          email_verified?: boolean | null
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
      profiles_backup: {
        Row: {
          alternative_emails: Json | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          id: string | null
          last_activity: string | null
          level: number | null
          points: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          streak_days: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          alternative_emails?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string | null
          last_activity?: string | null
          level?: number | null
          points?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          streak_days?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          alternative_emails?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string | null
          last_activity?: string | null
          level?: number | null
          points?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          streak_days?: number | null
          updated_at?: string | null
          username?: string | null
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
      scheduled_notifications: {
        Row: {
          chore_id: string | null
          content: Json
          created_at: string
          id: string
          notification_type: string
          scheduled_for: string
          sent: boolean
          sent_at: string | null
          user_id: string
        }
        Insert: {
          chore_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          notification_type: string
          scheduled_for: string
          sent?: boolean
          sent_at?: string | null
          user_id: string
        }
        Update: {
          chore_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          notification_type?: string
          scheduled_for?: string
          sent?: boolean
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_notifications_user_id_fkey"
            columns: ["user_id"]
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
      security_audit_trail: {
        Row: {
          action_type: string
          created_at: string | null
          family_context: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          family_context?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          family_context?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_trail_family_context_fkey"
            columns: ["family_context"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_test_results: {
        Row: {
          created_at: string | null
          findings: Json | null
          id: string
          recommendations: string[] | null
          status: string | null
          summary: Json | null
          test_id: string
          test_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          findings?: Json | null
          id?: string
          recommendations?: string[] | null
          status?: string | null
          summary?: Json | null
          test_id: string
          test_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          findings?: Json | null
          id?: string
          recommendations?: string[] | null
          status?: string | null
          summary?: Json | null
          test_id?: string
          test_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_encrypted: boolean
          last_modified_by: string | null
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean
          last_modified_by?: string | null
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean
          last_modified_by?: string | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string
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
      accept_family_invitation_secure: {
        Args: { invitation_code_param: string }
        Returns: Json
      }
      audit_security_definer_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          recommendation: string
          security_level: string
        }[]
      }
      calculate_age_group: {
        Args: { birth_date: string }
        Returns: string
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
      check_rate_limit_enhanced: {
        Args: {
          action_type: string
          max_per_day?: number
          max_per_hour?: number
        }
        Returns: boolean
      }
      cleanup_invalid_profiles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_mfa_data: {
        Args: { days_old?: number }
        Returns: number
      }
      cleanup_old_rate_limit_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_security_test_results: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_point_transaction: {
        Args: {
          p_bonus_type?: string
          p_chore_id?: string
          p_description: string
          p_family_id: string
          p_goal_id?: string
          p_metadata?: Json
          p_points_amount: number
          p_transaction_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_system_notification_secure: {
        Args: {
          notification_data?: Json
          notification_message: string
          notification_title: string
          notification_type?: string
          target_user_id: string
        }
        Returns: string
      }
      decrypt_mfa_secret: {
        Args: { encoded_text: string }
        Returns: string
      }
      decrypt_mfa_secret_secure: {
        Args: { encrypted_data: string }
        Returns: string
      }
      detect_security_violations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      encrypt_mfa_secret: {
        Args: { secret_text: string }
        Returns: string
      }
      encrypt_mfa_secret_secure: {
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
      get_client_ip_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_family_by_email: {
        Args: { input_email: string }
        Returns: string
      }
      get_family_data_secure: {
        Args: { family_id_param: string; requesting_user_id?: string }
        Returns: {
          created_at: string
          family_code: string
          id: string
          name: string
          parent_id: string
          updated_at: string
        }[]
      }
      get_mfa_backup_codes_secure: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_mfa_settings_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          backup_codes_count: number
          created_at: string
          has_totp_secret: boolean
          mfa_enabled: boolean
          updated_at: string
        }[]
      }
      get_mfa_status_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          backup_codes_count: number
          created_at: string
          has_totp_secret: boolean
          mfa_enabled: boolean
          updated_at: string
        }[]
      }
      get_profile_by_id_secure: {
        Args: { requesting_user_id: string; target_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          id: string
          last_activity: string
          level: number
          points: number
          role: string
          streak_days: number
          updated_at: string
          username: string
        }[]
      }
      get_profiles_secure: {
        Args: { requesting_user_id?: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email_masked: string
          id: string
          last_activity: string
          level: number
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
      get_safe_profiles_limited: {
        Args: Record<PropertyKey, never>
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
      get_security_recommendations: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_required: string
          priority: string
          recommendation: string
        }[]
      }
      get_system_setting: {
        Args: { key_name: string }
        Returns: Json
      }
      get_system_setting_secure: {
        Args: { key_name: string }
        Returns: Json
      }
      get_user_family_ids: {
        Args: { user_id_param?: string }
        Returns: string[]
      }
      has_admin_permission: {
        Args: {
          p_permission: Database["public"]["Enums"]["admin_permission"]
          p_user_id: string
        }
        Returns: boolean
      }
      has_family_permission: {
        Args: {
          family_id_param: string
          permission_name: string
          user_id_param: string
        }
        Returns: boolean
      }
      has_parental_authority: {
        Args: { child_user_id: string; requesting_user_id?: string }
        Returns: boolean
      }
      invite_family_member_secure: {
        Args: {
          family_id_param: string
          invitee_email_param: string
          invitee_name_param?: string
          permissions_param?: Json
          role_param?: string
        }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_like_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_any_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_any_admin_secure: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
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
      join_family_with_code_secure: {
        Args: { family_code_input: string }
        Returns: Json
      }
      log_mfa_access_secure: {
        Args: { access_type: string; metadata_param?: Json }
        Returns: undefined
      }
      log_security_audit: {
        Args: {
          p_action_type: string
          p_family_context?: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_risk_level?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          event_type: string
          metadata_param?: Json
          user_id_param: string
        }
        Returns: undefined
      }
      log_security_event_with_rate_limit: {
        Args:
          | {
              event_type: string
              max_events_per_window?: number
              metadata_param?: Json
              rate_limit_window_seconds?: number
              user_id_param?: string
            }
          | { event_type: string; metadata_param?: Json; user_id_param: string }
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
      monitor_email_routing_security: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      monitor_security_table_integrity: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      notify_child_chore_approved: {
        Args: { chore_id_param: string }
        Returns: undefined
      }
      notify_parents_chore_approval: {
        Args: { chore_id_param: string }
        Returns: undefined
      }
      resolve_to_primary_email: {
        Args: { input_email: string }
        Returns: string
      }
      run_security_monitoring: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_mfa_settings_secure: {
        Args: {
          p_backup_codes?: string[]
          p_mfa_enabled: boolean
          p_totp_secret?: string
        }
        Returns: undefined
      }
      update_profile_email_secure: {
        Args: { new_email: string }
        Returns: undefined
      }
      update_system_setting: {
        Args: {
          key_name: string
          new_value: Json
          setting_description?: string
        }
        Returns: boolean
      }
      validate_child_data_access_secure: {
        Args: {
          access_type: string
          child_user_id: string
          requesting_user_id?: string
        }
        Returns: boolean
      }
      validate_family_access: {
        Args: {
          family_id_param: string
          required_role?: string
          user_id_param?: string
        }
        Returns: boolean
      }
      validate_family_code_secure: {
        Args: { code_input: string }
        Returns: boolean
      }
      validate_password_security_enhanced: {
        Args: { password_text: string }
        Returns: Json
      }
    }
    Enums: {
      admin_permission:
        | "manage_users"
        | "manage_families"
        | "view_security_logs"
        | "manage_system_settings"
        | "generate_reports"
        | "bulk_operations"
      chore_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "overdue"
        | "pending_approval"
      family_role: "primary_parent" | "co_parent" | "child" | "guardian"
      reward_status: "available" | "redeemed" | "pending_approval"
      user_role:
        | "kid"
        | "parent"
        | "admin"
        | "full_admin"
        | "read_only_admin"
        | "report_admin"
        | "unknown"
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
      admin_permission: [
        "manage_users",
        "manage_families",
        "view_security_logs",
        "manage_system_settings",
        "generate_reports",
        "bulk_operations",
      ],
      chore_status: [
        "pending",
        "in_progress",
        "completed",
        "overdue",
        "pending_approval",
      ],
      family_role: ["primary_parent", "co_parent", "child", "guardian"],
      reward_status: ["available", "redeemed", "pending_approval"],
      user_role: [
        "kid",
        "parent",
        "admin",
        "full_admin",
        "read_only_admin",
        "report_admin",
        "unknown",
      ],
    },
  },
} as const
