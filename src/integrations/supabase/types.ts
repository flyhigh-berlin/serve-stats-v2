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
      custom_game_types: {
        Row: {
          abbreviation: string
          created_at: string | null
          id: string
          name: string
          team_id: string
        }
        Insert: {
          abbreviation: string
          created_at?: string | null
          id?: string
          name: string
          team_id: string
        }
        Update: {
          abbreviation?: string
          created_at?: string | null
          id?: string
          name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_game_types_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_days: {
        Row: {
          created_at: string | null
          date: string
          game_type: string
          id: string
          notes: string | null
          team_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          game_type: string
          id?: string
          notes?: string | null
          team_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          game_type?: string
          id?: string
          notes?: string | null
          team_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_days_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string | null
          id: string
          name: string
          tags: Json | null
          team_id: string
          total_aces: number | null
          total_fails: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          tags?: Json | null
          team_id: string
          total_aces?: number | null
          total_fails?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          tags?: Json | null
          team_id?: string
          total_aces?: number | null
          total_fails?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      serves: {
        Row: {
          game_id: string
          id: string
          player_id: string
          quality: Database["public"]["Enums"]["serve_quality"]
          recorded_by: string | null
          team_id: string
          timestamp: string | null
          type: Database["public"]["Enums"]["serve_type"]
        }
        Insert: {
          game_id: string
          id?: string
          player_id: string
          quality: Database["public"]["Enums"]["serve_quality"]
          recorded_by?: string | null
          team_id: string
          timestamp?: string | null
          type: Database["public"]["Enums"]["serve_type"]
        }
        Update: {
          game_id?: string
          id?: string
          player_id?: string
          quality?: Database["public"]["Enums"]["serve_quality"]
          recorded_by?: string | null
          team_id?: string
          timestamp?: string | null
          type?: Database["public"]["Enums"]["serve_type"]
        }
        Relationships: [
          {
            foreignKeyName: "serves_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serves_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serves_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_audit: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_value: boolean | null
          old_value: boolean | null
          reason: string | null
          target_user_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_value?: boolean | null
          old_value?: boolean | null
          reason?: string | null
          target_user_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_value?: boolean | null
          old_value?: boolean | null
          reason?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      team_activity_audit: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          performed_by: string | null
          team_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by?: string | null
          team_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_audit_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          admin_role: boolean | null
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          invite_code: string
          invited_email: string | null
          is_active: boolean | null
          last_used_at: string | null
          max_uses: number | null
          team_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          admin_role?: boolean | null
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invite_code: string
          invited_email?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          max_uses?: number | null
          team_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          admin_role?: boolean | null
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          invited_email?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          max_uses?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["team_member_role"] | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["team_member_role"] | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["team_member_role"] | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_settings: {
        Row: {
          allow_public_invites: boolean | null
          created_at: string | null
          default_member_role:
            | Database["public"]["Enums"]["team_member_role"]
            | null
          id: string
          max_members: number | null
          require_approval: boolean | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          allow_public_invites?: boolean | null
          created_at?: string | null
          default_member_role?:
            | Database["public"]["Enums"]["team_member_role"]
            | null
          id?: string
          max_members?: number | null
          require_approval?: boolean | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          allow_public_invites?: boolean | null
          created_at?: string | null
          default_member_role?:
            | Database["public"]["Enums"]["team_member_role"]
            | null
          id?: string
          max_members?: number | null
          require_approval?: boolean | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_super_admin: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
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
      accept_invitation_signup: {
        Args: {
          invitation_code: string
          user_email: string
          user_id_param: string
        }
        Returns: Json
      }
      assign_team_admin_by_email: {
        Args: { team_id_param: string; admin_email: string }
        Returns: Json
      }
      change_member_role: {
        Args: {
          member_id_param: string
          new_role: Database["public"]["Enums"]["team_member_role"]
        }
        Returns: boolean
      }
      check_user_exists_by_email: {
        Args: { email_param: string }
        Returns: Json
      }
      create_admin_invitation: {
        Args: { team_id_param: string; admin_email: string }
        Returns: Json
      }
      create_admin_invitation_for_team: {
        Args: { team_id_param: string; admin_email: string }
        Returns: Json
      }
      create_team_with_admin_invites: {
        Args: { team_name_param: string; team_description_param?: string }
        Returns: Json
      }
      delete_team_and_data: {
        Args: { team_id_param: string }
        Returns: boolean
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_teams: {
        Args: { check_user_id: string }
        Returns: {
          team_id: string
          role: Database["public"]["Enums"]["team_member_role"]
        }[]
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_team_admin: {
        Args: { check_user_id: string; check_team_id: string }
        Returns: boolean
      }
      mark_invitation_accepted: {
        Args: { invitation_code: string; user_id_param: string }
        Returns: Json
      }
      remove_team_member: {
        Args: { member_id_param: string }
        Returns: boolean
      }
      reset_team_data: {
        Args: { team_id_param: string; preserve_players?: boolean }
        Returns: boolean
      }
      validate_invite_code: {
        Args: { code: string }
        Returns: {
          invitation_id: string
          team_id: string
          team_name: string
          is_valid: boolean
          error_message: string
          admin_role: boolean
          invited_email: string
        }[]
      }
    }
    Enums: {
      serve_quality: "good" | "neutral" | "bad"
      serve_type: "fail" | "ace"
      team_member_role: "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
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
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      serve_quality: ["good", "neutral", "bad"],
      serve_type: ["fail", "ace"],
      team_member_role: ["admin", "member"],
    },
  },
} as const
