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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_teams: {
        Row: {
          account_id: string
          created_at: string
          id: string
          team_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          team_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_teams_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          active: boolean | null
          created_at: string
          email: string
          id: string
          name: string
          role_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          email: string
          id: string
          name: string
          role_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_name: string | null
          target_type: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["audit_action_type"]
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      course_actions: {
        Row: {
          action_id: string
          course_id: string
          created_at: string
          id: string
          intensity: number | null
          reps: number | null
          sets: number | null
          sort_order: number | null
        }
        Insert: {
          action_id: string
          course_id: string
          created_at?: string
          id?: string
          intensity?: number | null
          reps?: number | null
          sets?: number | null
          sort_order?: number | null
        }
        Update: {
          action_id?: string
          course_id?: string
          created_at?: string
          id?: string
          intensity?: number | null
          reps?: number | null
          sets?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_actions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "training_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_actions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_comments: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          user_name: string
          user_role: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          comment_preview: string | null
          commenter_id: string
          commenter_name: string
          course_id: string
          course_name: string
          created_at: string
          id: string
          read: boolean | null
          recipient_id: string
          type: string
        }
        Insert: {
          comment_preview?: string | null
          commenter_id: string
          commenter_name: string
          course_id: string
          course_name: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id: string
          type?: string
        }
        Update: {
          comment_preview?: string | null
          commenter_id?: string
          commenter_name?: string
          course_id?: string
          course_name?: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id?: string
          type?: string
        }
        Relationships: []
      }
      personal_course_actions: {
        Row: {
          action_id: string
          course_id: string
          created_at: string
          id: string
          intensity: number | null
          reps: number | null
          sets: number | null
          sort_order: number | null
        }
        Insert: {
          action_id: string
          course_id: string
          created_at?: string
          id?: string
          intensity?: number | null
          reps?: number | null
          sets?: number | null
          sort_order?: number | null
        }
        Update: {
          action_id?: string
          course_id?: string
          created_at?: string
          id?: string
          intensity?: number | null
          reps?: number | null
          sets?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_course_actions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "training_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_course_actions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "personal_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_courses: {
        Row: {
          category: string
          color: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          id: string
          name: string
          notes?: string | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      personal_template_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          password_changed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          password_changed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_changed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          audio_file_url: string | null
          chart_data: Record<string, unknown> | null
          coach_id: string | null
          created_at: string
          date: string
          id: string
          markdown_notes: string | null
          module_config: Record<string, unknown> | null
          student_id: string
          student_snapshot: Record<string, unknown> | null
          title: string | null
          type: Database["public"]["Enums"]["report_type"]
          updated_at: string
        }
        Insert: {
          audio_file_url?: string | null
          chart_data?: Record<string, unknown> | null
          coach_id?: string | null
          created_at?: string
          date: string
          id: string
          markdown_notes?: string | null
          module_config?: Record<string, unknown> | null
          student_id: string
          student_snapshot?: Record<string, unknown> | null
          title?: string | null
          type: Database["public"]["Enums"]["report_type"]
          updated_at?: string
        }
        Update: {
          audio_file_url?: string | null
          chart_data?: Record<string, unknown> | null
          coach_id?: string | null
          created_at?: string
          date?: string
          id?: string
          markdown_notes?: string | null
          module_config?: Record<string, unknown> | null
          student_id?: string
          student_snapshot?: Record<string, unknown> | null
          title?: string | null
          type?: Database["public"]["Enums"]["report_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string
          full_site: boolean | null
          id: string
          module: Database["public"]["Enums"]["permission_module"]
          role_id: string
        }
        Insert: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string
          full_site?: boolean | null
          id?: string
          module: Database["public"]["Enums"]["permission_module"]
          role_id: string
        }
        Update: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string
          full_site?: boolean | null
          id?: string
          module?: Database["public"]["Enums"]["permission_module"]
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_system?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_events: {
        Row: {
          course_id: string
          course_type: string | null
          created_at: string
          date: string
          highlight: boolean | null
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          course_type?: string | null
          created_at?: string
          date: string
          highlight?: boolean | null
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          course_type?: string | null
          created_at?: string
          date?: string
          highlight?: boolean | null
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_coaches: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          student_id: string
          team_history_id: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          student_id: string
          team_history_id?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          student_id?: string
          team_history_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_coaches_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_coaches_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_coaches_team_history_id_fkey"
            columns: ["team_history_id"]
            isOneToOne: false
            referencedRelation: "student_team_history"
            referencedColumns: ["id"]
          },
        ]
      }
      student_team_history: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean
          start_date: string | null
          student_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          start_date?: string | null
          student_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          start_date?: string | null
          student_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_team_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_team_history_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          archived: boolean
          batting_hand: string | null
          birthday: string | null
          created_at: string
          email: string
          height: string | null
          id: string
          last_test: string | null
          last_training: string | null
          name: string
          player_type: string | null
          position: string | null
          team_id: string | null
          throwing_hand: string | null
          updated_at: string
          weight: string | null
        }
        Insert: {
          archived?: boolean
          batting_hand?: string | null
          birthday?: string | null
          created_at?: string
          email: string
          height?: string | null
          id: string
          last_test?: string | null
          last_training?: string | null
          name: string
          player_type?: string | null
          position?: string | null
          team_id?: string | null
          throwing_hand?: string | null
          updated_at?: string
          weight?: string | null
        }
        Update: {
          archived?: boolean
          batting_hand?: string | null
          birthday?: string | null
          created_at?: string
          email?: string
          height?: string | null
          id?: string
          last_test?: string | null
          last_training?: string | null
          name?: string
          player_type?: string | null
          position?: string | null
          team_id?: string | null
          throwing_hand?: string | null
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          attribute: string | null
          created_at: string
          id: string
          level: string | null
          name: string
          updated_at: string
        }
        Insert: {
          attribute?: string | null
          created_at?: string
          id: string
          level?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          attribute?: string | null
          created_at?: string
          id?: string
          level?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_actions: {
        Row: {
          action_category: Database["public"]["Enums"]["action_category_type"]
          ball: string | null
          bat: string | null
          category: string
          created_at: string
          equipment: string | null
          id: string
          intensity: number | null
          name: string
          notes: string | null
          reps: number | null
          scenario: string | null
          sets: number | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          action_category: Database["public"]["Enums"]["action_category_type"]
          ball?: string | null
          bat?: string | null
          category: string
          created_at?: string
          equipment?: string | null
          id: string
          intensity?: number | null
          name: string
          notes?: string | null
          reps?: number | null
          scenario?: string | null
          sets?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          action_category?: Database["public"]["Enums"]["action_category_type"]
          ball?: string | null
          bat?: string | null
          category?: string
          created_at?: string
          equipment?: string | null
          id?: string
          intensity?: number | null
          name?: string
          notes?: string | null
          reps?: number | null
          scenario?: string | null
          sets?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          category: string
          color: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          id: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_team_assignments: {
        Row: {
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_team_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_email: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_team_ids: { Args: { _user_id: string }; Returns: string[] }
      has_full_access: { Args: { _user_id: string }; Returns: boolean }
      has_module_full_site_access: {
        Args: {
          _module: Database["public"]["Enums"]["permission_module"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_category_type: "打擊" | "投球" | "非投打"
      app_role: "admin" | "venue_coach" | "team_coach" | "student"
      audit_action_type:
        | "account_created"
        | "account_updated"
        | "account_deleted"
        | "account_activated"
        | "account_deactivated"
        | "role_changed"
        | "password_reset_requested"
        | "role_created"
        | "role_updated"
        | "role_deleted"
        | "permission_changed"
        | "team_created"
        | "team_updated"
        | "team_deleted"
        | "student_created"
        | "student_updated"
        | "student_deleted"
        | "course_created"
        | "course_updated"
        | "course_deleted"
        | "login_success"
        | "logout"
      permission_module:
        | "home"
        | "students"
        | "teams"
        | "schedule"
        | "reports"
        | "upload"
        | "comparison"
        | "templates"
        | "accounts"
      report_type: "打擊" | "投球" | "體測"
      user_role: "admin" | "venue_coach" | "team_coach" | "student"
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
      action_category_type: ["打擊", "投球", "非投打"],
      app_role: ["admin", "venue_coach", "team_coach", "student"],
      audit_action_type: [
        "account_created",
        "account_updated",
        "account_deleted",
        "account_activated",
        "account_deactivated",
        "role_changed",
        "password_reset_requested",
        "role_created",
        "role_updated",
        "role_deleted",
        "permission_changed",
        "team_created",
        "team_updated",
        "team_deleted",
        "student_created",
        "student_updated",
        "student_deleted",
        "course_created",
        "course_updated",
        "course_deleted",
        "login_success",
        "logout",
      ],
      permission_module: [
        "home",
        "students",
        "teams",
        "schedule",
        "reports",
        "upload",
        "comparison",
        "templates",
        "accounts",
      ],
      report_type: ["打擊", "投球", "體測"],
      user_role: ["admin", "venue_coach", "team_coach", "student"],
    },
  },
} as const
