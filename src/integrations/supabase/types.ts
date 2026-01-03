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
      brands: {
        Row: {
          base_earning_rate: number
          category: string
          created_at: string
          description: string
          earn_opportunities: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          logo_color: string
          logo_emoji: string
          name: string
          shop_url: string
          updated_at: string
        }
        Insert: {
          base_earning_rate: number
          category: string
          created_at?: string
          description: string
          earn_opportunities?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          logo_color: string
          logo_emoji: string
          name: string
          shop_url: string
          updated_at?: string
        }
        Update: {
          base_earning_rate?: number
          category?: string
          created_at?: string
          description?: string
          earn_opportunities?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          logo_color?: string
          logo_emoji?: string
          name?: string
          shop_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      membership_history: {
        Row: {
          created_at: string
          id: string
          locked_nctr: number
          previous_tier_level: number | null
          previous_tier_name: string | null
          tier_level: number
          tier_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          locked_nctr: number
          previous_tier_level?: number | null
          previous_tier_name?: string | null
          tier_level: number
          tier_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          locked_nctr?: number
          previous_tier_level?: number | null
          previous_tier_name?: string | null
          tier_level?: number
          tier_name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_nctr: number
          avatar_url: string | null
          claim_balance: number
          created_at: string
          email: string | null
          full_name: string | null
          has_claimed_signup_bonus: boolean
          has_status_access_pass: boolean
          id: string
          level: number
          locked_nctr: number
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          available_nctr?: number
          avatar_url?: string | null
          claim_balance?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          has_claimed_signup_bonus?: boolean
          has_status_access_pass?: boolean
          id: string
          level?: number
          locked_nctr?: number
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          available_nctr?: number
          avatar_url?: string | null
          claim_balance?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          has_claimed_signup_bonus?: boolean
          has_status_access_pass?: boolean
          id?: string
          level?: number
          locked_nctr?: number
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_paid: number
          claims_amount: number
          created_at: string
          currency: string
          id: string
          package_id: string
          package_name: string
          status: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          claims_amount: number
          created_at?: string
          currency?: string
          id?: string
          package_id: string
          package_name: string
          status?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          claims_amount?: number
          created_at?: string
          currency?: string
          id?: string
          package_id?: string
          package_name?: string
          status?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          is_paid: boolean
          referral_bonus: number
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_paid?: boolean
          referral_bonus?: number
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_paid?: boolean
          referral_bonus?: number
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_shares: {
        Row: {
          bonus_earned: number
          clicks: number
          conversions: number
          id: string
          referral_code: string
          reward_id: string
          share_platform: string | null
          shared_at: string
          user_id: string
        }
        Insert: {
          bonus_earned?: number
          clicks?: number
          conversions?: number
          id?: string
          referral_code: string
          reward_id: string
          share_platform?: string | null
          shared_at?: string
          user_id: string
        }
        Update: {
          bonus_earned?: number
          clicks?: number
          conversions?: number
          id?: string
          referral_code?: string
          reward_id?: string
          share_platform?: string | null
          shared_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_shares_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_submission_changes: {
        Row: {
          change_summary: string | null
          changed_fields: Json
          created_at: string
          id: string
          new_version: number
          previous_version: number
          submission_id: string
        }
        Insert: {
          change_summary?: string | null
          changed_fields: Json
          created_at?: string
          id?: string
          new_version: number
          previous_version: number
          submission_id: string
        }
        Update: {
          change_summary?: string | null
          changed_fields?: Json
          created_at?: string
          id?: string
          new_version?: number
          previous_version?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_submission_changes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "reward_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_submissions: {
        Row: {
          admin_notes: string | null
          brand: string | null
          category: string
          claim_passes_required: number
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_latest_version: boolean
          lock_rate: string
          nctr_value: number
          parent_submission_id: string | null
          reward_type: string
          status: string
          stock_quantity: number | null
          title: string
          updated_at: string
          user_id: string
          version: number
          version_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          brand?: string | null
          category: string
          claim_passes_required?: number
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_latest_version?: boolean
          lock_rate: string
          nctr_value: number
          parent_submission_id?: string | null
          reward_type: string
          status?: string
          stock_quantity?: number | null
          title: string
          updated_at?: string
          user_id: string
          version?: number
          version_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          brand?: string | null
          category?: string
          claim_passes_required?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_latest_version?: boolean
          lock_rate?: string
          nctr_value?: number
          parent_submission_id?: string | null
          reward_type?: string
          status?: string
          stock_quantity?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
          version_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_submissions_parent_submission_id_fkey"
            columns: ["parent_submission_id"]
            isOneToOne: false
            referencedRelation: "reward_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_wishlists: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reward_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reward_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_wishlists_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          category: string
          cost: number
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          minimum_token_balance: number | null
          stock_quantity: number | null
          title: string
          token_contract_address: string | null
          token_gated: boolean | null
          token_name: string | null
          token_symbol: string | null
          updated_at: string
        }
        Insert: {
          category: string
          cost: number
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          minimum_token_balance?: number | null
          stock_quantity?: number | null
          title: string
          token_contract_address?: string | null
          token_gated?: boolean | null
          token_name?: string | null
          token_symbol?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          minimum_token_balance?: number | null
          stock_quantity?: number | null
          title?: string
          token_contract_address?: string | null
          token_gated?: boolean | null
          token_name?: string | null
          token_symbol?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rewards_claims: {
        Row: {
          claimed_at: string
          id: string
          reward_id: string
          shipping_info: Json | null
          status: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          reward_id: string
          shipping_info?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          reward_id?: string
          shipping_info?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_claims_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_gift_reward: {
        Args: { p_admin_notes?: string; p_reward_id: string; p_user_id: string }
        Returns: Json
      }
      claim_reward: {
        Args: { p_reward_id: string; p_shipping_info?: Json }
        Returns: Json
      }
      generate_referral_code: { Args: never; Returns: string }
      get_admin_stats: { Args: never; Returns: Json }
      get_all_claims: {
        Args: never
        Returns: {
          claim_id: string
          claimed_at: string
          reward_cost: number
          reward_id: string
          reward_title: string
          shipping_info: Json
          status: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_public_stats: { Args: never; Returns: Json }
      get_user_activity: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          activity_type: string
          amount: number
          created_at: string
          description: string
          id: string
          metadata: Json
          title: string
        }[]
      }
      get_user_share_analytics: {
        Args: never
        Returns: {
          conversion_rate: number
          last_shared_at: string
          reward_id: string
          reward_image: string
          reward_title: string
          total_bonus_earned: number
          total_clicks: number
          total_conversions: number
          total_shares: number
        }[]
      }
      get_user_task_progress: {
        Args: never
        Returns: {
          completed_at: string
          description: string
          icon: string
          is_completed: boolean
          link: string
          recurring: boolean
          reward_amount: number
          task_id: string
          task_type: string
          title: string
        }[]
      }
      get_user_wishlist: {
        Args: { p_user_id?: string }
        Returns: {
          added_at: string
          notes: string
          reward_category: string
          reward_cost: number
          reward_id: string
          reward_image: string
          reward_title: string
          user_email: string
          user_id: string
          user_name: string
          wishlist_id: string
        }[]
      }
      get_wishlist_analytics: {
        Args: never
        Returns: {
          avg_days_on_wishlist: number
          is_trending: boolean
          recent_adds: number
          reward_category: string
          reward_cost: number
          reward_id: string
          reward_image: string
          reward_title: string
          wishlist_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_reward_version: {
        Args: {
          p_brand: string
          p_category: string
          p_claim_passes_required: number
          p_description: string
          p_image_url: string
          p_lock_rate: string
          p_nctr_value: number
          p_parent_submission_id: string
          p_reward_type: string
          p_stock_quantity: number
          p_title: string
          p_version_notes: string
        }
        Returns: Json
      }
      track_reward_conversion: {
        Args: { p_referral_code: string; p_reward_id: string }
        Returns: Json
      }
      update_claim_status: {
        Args: { p_claim_id: string; p_status: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
