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
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_adjustment_templates: {
        Row: {
          adjustment_type: string
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lock_duration_days: number | null
          name: string
          notification_enabled: boolean | null
          notification_message: string | null
          notification_title: string | null
        }
        Insert: {
          adjustment_type: string
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lock_duration_days?: number | null
          name: string
          notification_enabled?: boolean | null
          notification_message?: string | null
          notification_title?: string | null
        }
        Update: {
          adjustment_type?: string
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lock_duration_days?: number | null
          name?: string
          notification_enabled?: boolean | null
          notification_message?: string | null
          notification_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_adjustment_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_nctr_adjustments: {
        Row: {
          adjustment_type: string
          admin_id: string
          admin_note: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          lock_duration: number | null
          lock_expires_at: string | null
          new_balance: number
          new_tier: string | null
          notification_sent: boolean | null
          previous_balance: number
          previous_tier: string | null
          reason: string
          requires_approval: boolean | null
          scheduled_for: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          adjustment_type: string
          admin_id: string
          admin_note?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          lock_duration?: number | null
          lock_expires_at?: string | null
          new_balance: number
          new_tier?: string | null
          notification_sent?: boolean | null
          previous_balance: number
          previous_tier?: string | null
          reason: string
          requires_approval?: boolean | null
          scheduled_for?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          adjustment_type?: string
          admin_id?: string
          admin_note?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          lock_duration?: number | null
          lock_expires_at?: string | null
          new_balance?: number
          new_tier?: string | null
          notification_sent?: boolean | null
          previous_balance?: number
          previous_tier?: string | null
          reason?: string
          requires_approval?: boolean | null
          scheduled_for?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_nctr_adjustments_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_nctr_adjustments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_nctr_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_user_notifications: {
        Row: {
          admin_id: string
          created_at: string | null
          id: string
          message: string
          notification_type: string
          read_at: string | null
          related_adjustment_id: string | null
          sent_via: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          id?: string
          message: string
          notification_type: string
          read_at?: string | null
          related_adjustment_id?: string | null
          sent_via?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          id?: string
          message?: string
          notification_type?: string
          read_at?: string | null
          related_adjustment_id?: string | null
          sent_via?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_notifications_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_notifications_related_adjustment_id_fkey"
            columns: ["related_adjustment_id"]
            isOneToOne: false
            referencedRelation: "admin_nctr_adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          last_login: string | null
          notes: string | null
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_login?: string | null
          notes?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_login?: string | null
          notes?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alliance_partners: {
        Row: {
          activation_instructions: string | null
          activation_type: string
          activation_url: string | null
          benefit_description: string
          benefit_title: string
          category: string
          created_at: string | null
          creator_channel_url: string | null
          creator_platform: string | null
          description: string | null
          display_order: number | null
          hide_value: boolean | null
          id: string
          is_active: boolean | null
          is_creator_subscription: boolean | null
          is_diamond_exclusive: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          min_tier: string
          monthly_value: number
          name: string
          short_description: string | null
          slot_cost: number | null
          slug: string
          total_activations: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          activation_instructions?: string | null
          activation_type?: string
          activation_url?: string | null
          benefit_description: string
          benefit_title: string
          category: string
          created_at?: string | null
          creator_channel_url?: string | null
          creator_platform?: string | null
          description?: string | null
          display_order?: number | null
          hide_value?: boolean | null
          id?: string
          is_active?: boolean | null
          is_creator_subscription?: boolean | null
          is_diamond_exclusive?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          min_tier?: string
          monthly_value: number
          name: string
          short_description?: string | null
          slot_cost?: number | null
          slug: string
          total_activations?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          activation_instructions?: string | null
          activation_type?: string
          activation_url?: string | null
          benefit_description?: string
          benefit_title?: string
          category?: string
          created_at?: string | null
          creator_channel_url?: string | null
          creator_platform?: string | null
          description?: string | null
          display_order?: number | null
          hide_value?: boolean | null
          id?: string
          is_active?: boolean | null
          is_creator_subscription?: boolean | null
          is_diamond_exclusive?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          min_tier?: string
          monthly_value?: number
          name?: string
          short_description?: string | null
          slot_cost?: number | null
          slug?: string
          total_activations?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      auth_nonces: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nonce: string
          used: boolean
          wallet_address: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce: string
          used?: boolean
          wallet_address: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string
          used?: boolean
          wallet_address?: string
        }
        Relationships: []
      }
      benefit_activation_history: {
        Row: {
          action: string
          created_at: string | null
          id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          partner_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_activation_history_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "alliance_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_activation_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_type_settings: {
        Row: {
          benefit_key: string
          category: string | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          benefit_key: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          benefit_key?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bounties: {
        Row: {
          bounty_tier: string | null
          category: string
          completion_message: string | null
          created_at: string | null
          cta_text: string | null
          description: string | null
          difficulty: string | null
          display_order: number | null
          expires_at: string | null
          id: string
          image_emoji: string | null
          image_url: string | null
          instructions: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_recurring: boolean | null
          lock_multiplier: number | null
          max_completions: number | null
          min_status_required: string | null
          nctr_reward: number
          purchase_product_type: string | null
          recurrence_period: string | null
          requires_360lock: boolean | null
          requires_purchase: boolean | null
          title: string
          total_completions: number | null
          updated_at: string | null
          validation_config: Json
          validation_type: string
          xp_reward: number | null
        }
        Insert: {
          bounty_tier?: string | null
          category?: string
          completion_message?: string | null
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          difficulty?: string | null
          display_order?: number | null
          expires_at?: string | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          lock_multiplier?: number | null
          max_completions?: number | null
          min_status_required?: string | null
          nctr_reward?: number
          purchase_product_type?: string | null
          recurrence_period?: string | null
          requires_360lock?: boolean | null
          requires_purchase?: boolean | null
          title: string
          total_completions?: number | null
          updated_at?: string | null
          validation_config?: Json
          validation_type?: string
          xp_reward?: number | null
        }
        Update: {
          bounty_tier?: string | null
          category?: string
          completion_message?: string | null
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          difficulty?: string | null
          display_order?: number | null
          expires_at?: string | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          lock_multiplier?: number | null
          max_completions?: number | null
          min_status_required?: string | null
          nctr_reward?: number
          purchase_product_type?: string | null
          recurrence_period?: string | null
          requires_360lock?: boolean | null
          requires_purchase?: boolean | null
          title?: string
          total_completions?: number | null
          updated_at?: string | null
          validation_config?: Json
          validation_type?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      bounty_claims: {
        Row: {
          admin_notes: string | null
          bounty_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          locked_to_360: boolean | null
          multiplier_applied: number | null
          nctr_earned: number
          status: string
          submission_notes: string | null
          submission_url: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          bounty_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          locked_to_360?: boolean | null
          multiplier_applied?: number | null
          nctr_earned?: number
          status?: string
          submission_notes?: string | null
          submission_url?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          bounty_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          locked_to_360?: boolean | null
          multiplier_applied?: number | null
          nctr_earned?: number
          status?: string
          submission_notes?: string | null
          submission_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounty_claims_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          base_earning_rate: number
          category: string
          created_at: string
          description: string
          earn_opportunities: Json | null
          hero_video_url: string | null
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
          hero_video_url?: string | null
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
          hero_video_url?: string | null
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
      check_ins: {
        Row: {
          checked_in_at: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      claim_gifts: {
        Row: {
          admin_notes: string | null
          claimed_at: string | null
          claims_amount: number
          created_at: string | null
          expires_at: string | null
          gift_code: string | null
          id: string
          is_admin_gift: boolean | null
          is_purchased: boolean | null
          message: string | null
          purchased_package_id: string | null
          recipient_email: string | null
          recipient_id: string | null
          sender_id: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          claimed_at?: string | null
          claims_amount: number
          created_at?: string | null
          expires_at?: string | null
          gift_code?: string | null
          id?: string
          is_admin_gift?: boolean | null
          is_purchased?: boolean | null
          message?: string | null
          purchased_package_id?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          claimed_at?: string | null
          claims_amount?: number
          created_at?: string | null
          expires_at?: string | null
          gift_code?: string | null
          id?: string
          is_admin_gift?: boolean | null
          is_purchased?: boolean | null
          message?: string | null
          purchased_package_id?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_gifts_purchased_package_id_fkey"
            columns: ["purchased_package_id"]
            isOneToOne: false
            referencedRelation: "claim_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_gifts_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_gifts_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_packages: {
        Row: {
          bonus_nctr: number
          claims_amount: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price_cents: number
          sort_order: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          bonus_nctr?: number
          claims_amount: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price_cents: number
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          bonus_nctr?: number
          claims_amount?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_submissions: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          helpful_count: number
          id: string
          is_featured: boolean
          media_url: string | null
          rating: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reward_id: string | null
          source_avatar_url: string | null
          source_id: string | null
          source_name: string | null
          source_type: string
          status: string
          submitted_at: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          content_type?: string
          created_at?: string
          description?: string | null
          helpful_count?: number
          id?: string
          is_featured?: boolean
          media_url?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_id?: string | null
          source_avatar_url?: string | null
          source_id?: string | null
          source_name?: string | null
          source_type?: string
          status?: string
          submitted_at?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          helpful_count?: number
          id?: string
          is_featured?: boolean
          media_url?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_id?: string | null
          source_avatar_url?: string | null
          source_id?: string | null
          source_name?: string | null
          source_type?: string
          status?: string
          submitted_at?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_submissions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      contributed_reward_earnings: {
        Row: {
          base_nctr_earned: number
          claimer_id: string | null
          contributor_id: string
          created_at: string | null
          final_nctr_earned: number
          id: string
          reward_id: string
          status_multiplier_applied: number | null
        }
        Insert: {
          base_nctr_earned: number
          claimer_id?: string | null
          contributor_id: string
          created_at?: string | null
          final_nctr_earned: number
          id?: string
          reward_id: string
          status_multiplier_applied?: number | null
        }
        Update: {
          base_nctr_earned?: number
          claimer_id?: string | null
          contributor_id?: string
          created_at?: string | null
          final_nctr_earned?: number
          id?: string
          reward_id?: string
          status_multiplier_applied?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contributed_reward_earnings_claimer_id_fkey"
            columns: ["claimer_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributed_reward_earnings_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributed_reward_earnings_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_platform_activity_log: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string | null
          id: string
          platform: string
          user_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          platform: string
          user_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          platform?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_platform_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      earning_opportunities: {
        Row: {
          background_color: string | null
          category: string
          coming_soon_text: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string
          earn_potential: string | null
          earn_type: string
          icon_name: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_coming_soon: boolean | null
          is_featured: boolean | null
          name: string
          opens_in_new_tab: boolean | null
          requirements: Json | null
          short_description: string | null
          slug: string
          sort_order: number | null
          stats: Json | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          category: string
          coming_soon_text?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description: string
          earn_potential?: string | null
          earn_type: string
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          is_featured?: boolean | null
          name: string
          opens_in_new_tab?: boolean | null
          requirements?: Json | null
          short_description?: string | null
          slug: string
          sort_order?: number | null
          stats?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          category?: string
          coming_soon_text?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string
          earn_potential?: string | null
          earn_type?: string
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          is_featured?: boolean | null
          name?: string
          opens_in_new_tab?: boolean | null
          requirements?: Json | null
          short_description?: string | null
          slug?: string
          sort_order?: number | null
          stats?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      featured_creators: {
        Row: {
          bio: string | null
          category: string | null
          created_at: string
          display_priority: number
          follower_count: number | null
          handle: string | null
          id: string
          image_url: string
          is_active: boolean
          is_verified: boolean
          name: string
          platform: string
          profile_url: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          category?: string | null
          created_at?: string
          display_priority?: number
          follower_count?: number | null
          handle?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          is_verified?: boolean
          name: string
          platform: string
          profile_url?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          category?: string | null
          created_at?: string
          display_priority?: number
          follower_count?: number | null
          handle?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          is_verified?: boolean
          name?: string
          platform?: string
          profile_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          page_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
          whats_broken: string | null
          whats_working: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          page_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
          whats_broken?: string | null
          whats_working?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          page_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
          whats_broken?: string | null
          whats_working?: string | null
        }
        Relationships: []
      }
      gear_vault_config: {
        Row: {
          contributor_groundball: number | null
          contributor_nctr: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          item_type: string
          updated_at: string | null
        }
        Insert: {
          contributor_groundball?: number | null
          contributor_nctr?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_type: string
          updated_at?: string | null
        }
        Update: {
          contributor_groundball?: number | null
          contributor_nctr?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gear_vault_items: {
        Row: {
          brand: string
          claimed_at: string | null
          claimer_id: string | null
          completed_at: string | null
          condition: string | null
          contributor_id: string | null
          contributor_reward_groundball: number | null
          contributor_reward_nctr: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          item_type: string
          location_city: string | null
          location_state: string | null
          model: string | null
          shipped_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          brand: string
          claimed_at?: string | null
          claimer_id?: string | null
          completed_at?: string | null
          condition?: string | null
          contributor_id?: string | null
          contributor_reward_groundball?: number | null
          contributor_reward_nctr?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          item_type: string
          location_city?: string | null
          location_state?: string | null
          model?: string | null
          shipped_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string
          claimed_at?: string | null
          claimer_id?: string | null
          completed_at?: string | null
          condition?: string | null
          contributor_id?: string | null
          contributor_reward_groundball?: number | null
          contributor_reward_nctr?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          item_type?: string
          location_city?: string | null
          location_state?: string | null
          model?: string | null
          shipped_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gear_vault_items_claimer_id_fkey"
            columns: ["claimer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gear_vault_items_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          long_definition: string | null
          short_definition: string
          term: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          long_definition?: string | null
          short_definition: string
          term: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          long_definition?: string | null
          short_definition?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      groundball_rewards: {
        Row: {
          cadence: string | null
          cadence_description: string | null
          category: string | null
          claims_cost: number | null
          created_at: string | null
          description: string | null
          id: string
          image_emoji: string | null
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_giveback: boolean | null
          is_limited: boolean | null
          multiplier_text: string | null
          quantity_available: number | null
          quantity_claimed: number | null
          required_status: string | null
          sponsor: string | null
          sponsor_logo_url: string | null
          sponsor_name: string | null
          tier: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cadence?: string | null
          cadence_description?: string | null
          category?: string | null
          claims_cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_giveback?: boolean | null
          is_limited?: boolean | null
          multiplier_text?: string | null
          quantity_available?: number | null
          quantity_claimed?: number | null
          required_status?: string | null
          sponsor?: string | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          tier?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cadence?: string | null
          cadence_description?: string | null
          category?: string | null
          claims_cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_giveback?: boolean | null
          is_limited?: boolean | null
          multiplier_text?: string | null
          quantity_available?: number | null
          quantity_claimed?: number | null
          required_status?: string | null
          sponsor?: string | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          tier?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      handle_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          target_handle: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          target_handle: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          target_handle?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handle_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_active_benefits: {
        Row: {
          activated_at: string | null
          can_swap_after: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          partner_id: string
          redemption_code: string | null
          selected_creator_name: string | null
          selected_creator_platform: string | null
          selected_creator_url: string | null
          slots_used: number | null
          status: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          can_swap_after?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          partner_id: string
          redemption_code?: string | null
          selected_creator_name?: string | null
          selected_creator_platform?: string | null
          selected_creator_url?: string | null
          slots_used?: number | null
          status?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          can_swap_after?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          partner_id?: string
          redemption_code?: string | null
          selected_creator_name?: string | null
          selected_creator_platform?: string | null
          selected_creator_url?: string | null
          slots_used?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_active_benefits_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "alliance_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_active_benefits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_groundball_status: {
        Row: {
          bonus_selections: number | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          free_swaps_remaining: number | null
          groundball_locked: number | null
          id: string
          member_id: string
          selections_max: number | null
          selections_used: number | null
          status_tier: string | null
          updated_at: string | null
        }
        Insert: {
          bonus_selections?: number | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          free_swaps_remaining?: number | null
          groundball_locked?: number | null
          id?: string
          member_id: string
          selections_max?: number | null
          selections_used?: number | null
          status_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          bonus_selections?: number | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          free_swaps_remaining?: number | null
          groundball_locked?: number | null
          id?: string
          member_id?: string
          selections_max?: number | null
          selections_used?: number | null
          status_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_groundball_status_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_reward_selections: {
        Row: {
          id: string
          is_active: boolean | null
          last_redeemed_at: string | null
          member_id: string | null
          redemption_count: number | null
          reward_id: string | null
          selected_at: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          last_redeemed_at?: string | null
          member_id?: string | null
          redemption_count?: number | null
          reward_id?: string | null
          selected_at?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          last_redeemed_at?: string | null
          member_id?: string | null
          redemption_count?: number | null
          reward_id?: string | null
          selected_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_reward_selections_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_reward_selections_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "groundball_rewards"
            referencedColumns: ["id"]
          },
        ]
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
      merch_milestones: {
        Row: {
          awarded_at: string
          id: string
          milestone_key: string
          nctr_awarded: number
          user_id: string
        }
        Insert: {
          awarded_at?: string
          id?: string
          milestone_key: string
          nctr_awarded?: number
          user_id: string
        }
        Update: {
          awarded_at?: string
          id?: string
          milestone_key?: string
          nctr_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merch_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_purchase_bounty_eligibility: {
        Row: {
          bounties_completed: number | null
          bounties_unlocked: number | null
          created_at: string | null
          id: string
          product_name: string | null
          purchase_amount: number | null
          shop_transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          bounties_completed?: number | null
          bounties_unlocked?: number | null
          created_at?: string | null
          id?: string
          product_name?: string | null
          purchase_amount?: number | null
          shop_transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          bounties_completed?: number | null
          bounties_unlocked?: number | null
          created_at?: string | null
          id?: string
          product_name?: string | null
          purchase_amount?: number | null
          shop_transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merch_purchase_bounty_eligibility_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nctr_transactions: {
        Row: {
          base_amount: number
          created_at: string
          final_amount: number
          id: string
          lock_multiplier_applied: number | null
          lock_type: string | null
          merch_lock_multiplier: number
          notes: string | null
          source: string
          source_id: string | null
          status_multiplier: number
          tier_at_time: string | null
          user_id: string
        }
        Insert: {
          base_amount: number
          created_at?: string
          final_amount: number
          id?: string
          lock_multiplier_applied?: number | null
          lock_type?: string | null
          merch_lock_multiplier?: number
          notes?: string | null
          source: string
          source_id?: string | null
          status_multiplier?: number
          tier_at_time?: string | null
          user_id: string
        }
        Update: {
          base_amount?: number
          created_at?: string
          final_amount?: number
          id?: string
          lock_multiplier_applied?: number | null
          lock_type?: string | null
          merch_lock_multiplier?: number
          notes?: string | null
          source?: string
          source_id?: string | null
          status_multiplier?: number
          tier_at_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nctr_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_nctr_credited: boolean
          email_rewards_claimed: boolean
          email_shop_purchases: boolean
          email_tier_changes: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_nctr_credited?: boolean
          email_rewards_claimed?: boolean
          email_shop_purchases?: boolean
          email_tier_changes?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_nctr_credited?: boolean
          email_rewards_claimed?: boolean
          email_shop_purchases?: boolean
          email_tier_changes?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_nctr: number
          avatar_url: string | null
          bio: string | null
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
          referral_count: number | null
          referral_milestones_claimed: Json | null
          referral_slug: string | null
          referred_by: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          available_nctr?: number
          avatar_url?: string | null
          bio?: string | null
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
          referral_count?: number | null
          referral_milestones_claimed?: Json | null
          referral_slug?: string | null
          referred_by?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          available_nctr?: number
          avatar_url?: string | null
          bio?: string | null
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
          referral_count?: number | null
          referral_milestones_claimed?: Json | null
          referral_slug?: string | null
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
      purchase_milestones: {
        Row: {
          awarded_at: string
          id: string
          milestone_count: number
          nctr_awarded: number
          user_id: string
        }
        Insert: {
          awarded_at?: string
          id?: string
          milestone_count: number
          nctr_awarded?: number
          user_id: string
        }
        Update: {
          awarded_at?: string
          id?: string
          milestone_count?: number
          nctr_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
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
      referral_milestones: {
        Row: {
          badge_emoji: string | null
          badge_name: string | null
          claims_reward: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          nctr_reward: number | null
          referral_count: number
          title_unlock: string | null
        }
        Insert: {
          badge_emoji?: string | null
          badge_name?: string | null
          claims_reward?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          nctr_reward?: number | null
          referral_count: number
          title_unlock?: string | null
        }
        Update: {
          badge_emoji?: string | null
          badge_name?: string | null
          claims_reward?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          nctr_reward?: number | null
          referral_count?: number
          title_unlock?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          is_paid: boolean
          link_type: string | null
          referral_bonus: number
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_paid?: boolean
          link_type?: string | null
          referral_bonus?: number
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_paid?: boolean
          link_type?: string | null
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
      reserved_handles: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          handle: string
          id: string
          reason: string | null
          reserved_for: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          handle: string
          id?: string
          reason?: string | null
          reserved_for?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          handle?: string
          id?: string
          reason?: string | null
          reserved_for?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reserved_handles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_featured_creators: {
        Row: {
          created_at: string
          creator_id: string
          display_order: number
          id: string
          reward_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          display_order?: number
          id?: string
          reward_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          display_order?: number
          id?: string
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_featured_creators_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "featured_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_featured_creators_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          reward_id: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          reward_id: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          reward_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_images_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          id: string
          member_id: string | null
          notes: string | null
          period: string | null
          redeemed_at: string | null
          reward_id: string | null
          selection_id: string | null
        }
        Insert: {
          id?: string
          member_id?: string | null
          notes?: string | null
          period?: string | null
          redeemed_at?: string | null
          reward_id?: string | null
          selection_id?: string | null
        }
        Update: {
          id?: string
          member_id?: string | null
          notes?: string | null
          period?: string | null
          redeemed_at?: string | null
          reward_id?: string | null
          selection_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "groundball_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "member_reward_selections"
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
      reward_social_posts: {
        Row: {
          auto_post: boolean | null
          created_at: string | null
          error_message: string | null
          hashtags: Json | null
          id: string
          mentions: Json | null
          platform: string
          post_content: string
          post_url: string | null
          posted_at: string | null
          reach_metrics: Json | null
          reward_id: string | null
          scheduled_for: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auto_post?: boolean | null
          created_at?: string | null
          error_message?: string | null
          hashtags?: Json | null
          id?: string
          mentions?: Json | null
          platform?: string
          post_content: string
          post_url?: string | null
          posted_at?: string | null
          reach_metrics?: Json | null
          reward_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_post?: boolean | null
          created_at?: string | null
          error_message?: string | null
          hashtags?: Json | null
          id?: string
          mentions?: Json | null
          platform?: string
          post_content?: string
          post_url?: string | null
          posted_at?: string | null
          reach_metrics?: Json | null
          reward_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_social_posts_reward_id_fkey"
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
          claim_value_at_submission: number | null
          claims_required: number | null
          created_at: string
          description: string
          floor_usd_amount: number | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_latest_version: boolean
          lock_option: string | null
          lock_rate: string
          min_status_tier: string | null
          nctr_rate_at_submission: number | null
          nctr_value: number
          parent_submission_id: string | null
          reward_type: string
          status: string
          status_tier_claims_cost: Json | null
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
          claim_value_at_submission?: number | null
          claims_required?: number | null
          created_at?: string
          description: string
          floor_usd_amount?: number | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_latest_version?: boolean
          lock_option?: string | null
          lock_rate: string
          min_status_tier?: string | null
          nctr_rate_at_submission?: number | null
          nctr_value: number
          parent_submission_id?: string | null
          reward_type: string
          status?: string
          status_tier_claims_cost?: Json | null
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
          claim_value_at_submission?: number | null
          claims_required?: number | null
          created_at?: string
          description?: string
          floor_usd_amount?: number | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_latest_version?: boolean
          lock_option?: string | null
          lock_rate?: string
          min_status_tier?: string | null
          nctr_rate_at_submission?: number | null
          nctr_value?: number
          parent_submission_id?: string | null
          reward_type?: string
          status?: string
          status_tier_claims_cost?: Json | null
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
      reward_watchlist: {
        Row: {
          created_at: string
          id: string
          notified: boolean
          reward_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified?: boolean
          reward_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notified?: boolean
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_watchlist_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
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
          auto_post_to_twitter: boolean | null
          brand_id: string | null
          campaign_id: string | null
          category: string
          claim_limit: number | null
          contributed_by: string | null
          contribution_category: string | null
          contribution_model: string | null
          contribution_status: string | null
          contributor_nctr_per_claim: number | null
          cost: number
          cost_per_claim: number | null
          created_at: string
          delivery_instructions: string | null
          delivery_location: string | null
          delivery_method: string | null
          description: string
          display_order: number | null
          id: string
          image_quality_approved: boolean | null
          image_source_url: string | null
          image_url: string | null
          is_active: boolean
          is_contributed: boolean | null
          is_featured: boolean
          is_sponsored: boolean | null
          linked_sponsor_id: string | null
          min_status_tier: string | null
          minimum_token_balance: number | null
          publish_at: string | null
          rejection_reason: string | null
          required_user_data: Json | null
          revenue_share_percent: number | null
          showcase_mode: string | null
          sponsor_cta_text: string | null
          sponsor_cta_url: string | null
          sponsor_enabled: boolean
          sponsor_end_date: string | null
          sponsor_link: string | null
          sponsor_logo: string | null
          sponsor_logo_url: string | null
          sponsor_message: string | null
          sponsor_name: string | null
          sponsor_start_date: string | null
          status_tier_claims_cost: Json | null
          stock_quantity: number | null
          title: string
          token_contract_address: string | null
          token_gated: boolean | null
          token_name: string | null
          token_symbol: string | null
          total_claims: number | null
          twitter_post_id: string | null
          unpublish_at: string | null
          updated_at: string
        }
        Insert: {
          auto_post_to_twitter?: boolean | null
          brand_id?: string | null
          campaign_id?: string | null
          category: string
          claim_limit?: number | null
          contributed_by?: string | null
          contribution_category?: string | null
          contribution_model?: string | null
          contribution_status?: string | null
          contributor_nctr_per_claim?: number | null
          cost: number
          cost_per_claim?: number | null
          created_at?: string
          delivery_instructions?: string | null
          delivery_location?: string | null
          delivery_method?: string | null
          description: string
          display_order?: number | null
          id?: string
          image_quality_approved?: boolean | null
          image_source_url?: string | null
          image_url?: string | null
          is_active?: boolean
          is_contributed?: boolean | null
          is_featured?: boolean
          is_sponsored?: boolean | null
          linked_sponsor_id?: string | null
          min_status_tier?: string | null
          minimum_token_balance?: number | null
          publish_at?: string | null
          rejection_reason?: string | null
          required_user_data?: Json | null
          revenue_share_percent?: number | null
          showcase_mode?: string | null
          sponsor_cta_text?: string | null
          sponsor_cta_url?: string | null
          sponsor_enabled?: boolean
          sponsor_end_date?: string | null
          sponsor_link?: string | null
          sponsor_logo?: string | null
          sponsor_logo_url?: string | null
          sponsor_message?: string | null
          sponsor_name?: string | null
          sponsor_start_date?: string | null
          status_tier_claims_cost?: Json | null
          stock_quantity?: number | null
          title: string
          token_contract_address?: string | null
          token_gated?: boolean | null
          token_name?: string | null
          token_symbol?: string | null
          total_claims?: number | null
          twitter_post_id?: string | null
          unpublish_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_post_to_twitter?: boolean | null
          brand_id?: string | null
          campaign_id?: string | null
          category?: string
          claim_limit?: number | null
          contributed_by?: string | null
          contribution_category?: string | null
          contribution_model?: string | null
          contribution_status?: string | null
          contributor_nctr_per_claim?: number | null
          cost?: number
          cost_per_claim?: number | null
          created_at?: string
          delivery_instructions?: string | null
          delivery_location?: string | null
          delivery_method?: string | null
          description?: string
          display_order?: number | null
          id?: string
          image_quality_approved?: boolean | null
          image_source_url?: string | null
          image_url?: string | null
          is_active?: boolean
          is_contributed?: boolean | null
          is_featured?: boolean
          is_sponsored?: boolean | null
          linked_sponsor_id?: string | null
          min_status_tier?: string | null
          minimum_token_balance?: number | null
          publish_at?: string | null
          rejection_reason?: string | null
          required_user_data?: Json | null
          revenue_share_percent?: number | null
          showcase_mode?: string | null
          sponsor_cta_text?: string | null
          sponsor_cta_url?: string | null
          sponsor_enabled?: boolean
          sponsor_end_date?: string | null
          sponsor_link?: string | null
          sponsor_logo?: string | null
          sponsor_logo_url?: string | null
          sponsor_message?: string | null
          sponsor_name?: string | null
          sponsor_start_date?: string | null
          status_tier_claims_cost?: Json | null
          stock_quantity?: number | null
          title?: string
          token_contract_address?: string | null
          token_gated?: boolean | null
          token_name?: string | null
          token_symbol?: string | null
          total_claims?: number | null
          twitter_post_id?: string | null
          unpublish_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sponsored_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_contributed_by_fkey"
            columns: ["contributed_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_linked_sponsor_id_fkey"
            columns: ["linked_sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_twitter_post_id_fkey"
            columns: ["twitter_post_id"]
            isOneToOne: false
            referencedRelation: "reward_social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_claims: {
        Row: {
          claimed_at: string
          delivered_at: string | null
          delivery_data: Json | null
          delivery_method: string | null
          delivery_status: string | null
          id: string
          reward_id: string
          shipping_info: Json | null
          status: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          delivered_at?: string | null
          delivery_data?: Json | null
          delivery_method?: string | null
          delivery_status?: string | null
          id?: string
          reward_id: string
          shipping_info?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          delivered_at?: string | null
          delivery_data?: Json | null
          delivery_method?: string | null
          delivery_status?: string | null
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
      shop_settings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_nctr_per_order: number | null
          min_purchase_for_reward: number | null
          minimum_purchase: number | null
          nctr_per_dollar: number | null
          store_identifier: string
          store_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_nctr_per_order?: number | null
          min_purchase_for_reward?: number | null
          minimum_purchase?: number | null
          nctr_per_dollar?: number | null
          store_identifier: string
          store_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_nctr_per_order?: number | null
          min_purchase_for_reward?: number | null
          minimum_purchase?: number | null
          nctr_per_dollar?: number | null
          store_identifier?: string
          store_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_transactions: {
        Row: {
          celebrated: boolean
          created_at: string | null
          credited_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          id: string
          metadata: Json | null
          nctr_earned: number
          nctr_per_dollar_at_time: number
          order_id: string | null
          order_number: string | null
          order_total: number
          shopify_data: Json | null
          status: string | null
          store_identifier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          celebrated?: boolean
          created_at?: string | null
          credited_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          metadata?: Json | null
          nctr_earned: number
          nctr_per_dollar_at_time?: number
          order_id?: string | null
          order_number?: string | null
          order_total: number
          shopify_data?: Json | null
          status?: string | null
          store_identifier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          celebrated?: boolean
          created_at?: string | null
          credited_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          metadata?: Json | null
          nctr_earned?: number
          nctr_per_dollar_at_time?: number
          order_id?: string | null
          order_number?: string | null
          order_total?: number
          shopify_data?: Json | null
          status?: string | null
          store_identifier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_mention_defaults: {
        Row: {
          category: string
          created_at: string | null
          default_hashtags: Json | null
          default_mentions: Json | null
          id: string
          subcategory: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          default_hashtags?: Json | null
          default_mentions?: Json | null
          id?: string
          subcategory?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          default_hashtags?: Json | null
          default_mentions?: Json | null
          id?: string
          subcategory?: string | null
        }
        Relationships: []
      }
      social_shares: {
        Row: {
          created_at: string
          id: string
          month_year: string
          platform: string
          shared_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_year?: string
          platform: string
          shared_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          platform?: string
          shared_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsor_applications: {
        Row: {
          admin_notes: string | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at: string | null
          description: string | null
          id: string
          intended_contribution: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          type: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          intended_contribution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          type: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          intended_contribution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsored_campaigns: {
        Row: {
          campaign_name: string
          created_at: string | null
          display_priority: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          sponsor_logo_url: string | null
          sponsor_name: string
          start_date: string | null
        }
        Insert: {
          campaign_name: string
          created_at?: string | null
          display_priority?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          sponsor_logo_url?: string | null
          sponsor_name: string
          start_date?: string | null
        }
        Update: {
          campaign_name?: string
          created_at?: string | null
          display_priority?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          sponsor_logo_url?: string | null
          sponsor_name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          contact_email: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_verified: boolean | null
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string | null
          social_links: Json | null
          tier: string | null
          total_claims: number | null
          total_sponsored_value: number | null
          type: string | null
          updated_at: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug?: string | null
          social_links?: Json | null
          tier?: string | null
          total_claims?: number | null
          total_sponsored_value?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string | null
          social_links?: Json | null
          tier?: string | null
          total_claims?: number | null
          total_sponsored_value?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_campaigns: {
        Row: {
          budget_spent: number | null
          budget_total: number | null
          campaign_type: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          sponsor_id: string
          start_date: string | null
          target_mission_engine: string | null
          target_tiers: string[] | null
        }
        Insert: {
          budget_spent?: number | null
          budget_total?: number | null
          campaign_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sponsor_id: string
          start_date?: string | null
          target_mission_engine?: string | null
          target_tiers?: string[] | null
        }
        Update: {
          budget_spent?: number | null
          budget_total?: number | null
          campaign_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sponsor_id?: string
          start_date?: string | null
          target_mission_engine?: string | null
          target_tiers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_campaigns_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          member_id: string | null
          member_tier: string | null
          reward_id: string | null
          sponsor_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          member_id?: string | null
          member_tier?: string | null
          reward_id?: string | null
          sponsor_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          member_id?: string | null
          member_tier?: string | null
          reward_id?: string | null
          sponsor_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_transactions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_transactions_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      status_tiers: {
        Row: {
          badge_color: string | null
          badge_emoji: string | null
          benefit_slots: number | null
          benefits: Json | null
          claims_per_month: number | null
          claims_per_year: number | null
          concierge_service: boolean | null
          created_at: string | null
          custom_benefits: Json | null
          description: string | null
          discount_percent: number | null
          display_name: string
          early_access: boolean | null
          earning_multiplier: number | null
          free_shipping: boolean | null
          id: string
          is_active: boolean | null
          max_nctr_360_locked: number | null
          min_nctr_360_locked: number
          priority_support: boolean | null
          sort_order: number
          tier_name: string
          unlimited_claims: boolean | null
          updated_at: string | null
          vip_events: boolean | null
        }
        Insert: {
          badge_color?: string | null
          badge_emoji?: string | null
          benefit_slots?: number | null
          benefits?: Json | null
          claims_per_month?: number | null
          claims_per_year?: number | null
          concierge_service?: boolean | null
          created_at?: string | null
          custom_benefits?: Json | null
          description?: string | null
          discount_percent?: number | null
          display_name: string
          early_access?: boolean | null
          earning_multiplier?: number | null
          free_shipping?: boolean | null
          id?: string
          is_active?: boolean | null
          max_nctr_360_locked?: number | null
          min_nctr_360_locked?: number
          priority_support?: boolean | null
          sort_order?: number
          tier_name: string
          unlimited_claims?: boolean | null
          updated_at?: string | null
          vip_events?: boolean | null
        }
        Update: {
          badge_color?: string | null
          badge_emoji?: string | null
          benefit_slots?: number | null
          benefits?: Json | null
          claims_per_month?: number | null
          claims_per_year?: number | null
          concierge_service?: boolean | null
          created_at?: string | null
          custom_benefits?: Json | null
          description?: string | null
          discount_percent?: number | null
          display_name?: string
          early_access?: boolean | null
          earning_multiplier?: number | null
          free_shipping?: boolean | null
          id?: string
          is_active?: boolean | null
          max_nctr_360_locked?: number | null
          min_nctr_360_locked?: number
          priority_support?: boolean | null
          sort_order?: number
          tier_name?: string
          unlimited_claims?: boolean | null
          updated_at?: string | null
          vip_events?: boolean | null
        }
        Relationships: []
      }
      tier_changes_log: {
        Row: {
          change_summary: string | null
          changed_at: string
          changed_by: string | null
          id: string
          new_values: Json
          old_values: Json
          tier_id: string
        }
        Insert: {
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values: Json
          old_values: Json
          tier_id: string
        }
        Update: {
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json
          old_values?: Json
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_changes_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_changes_log_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "status_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_promotions: {
        Row: {
          applies_to_tiers: string[] | null
          claims_bonus: number | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_bonus: number | null
          end_date: string
          id: string
          is_active: boolean | null
          multiplier_bonus: number | null
          promo_name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          applies_to_tiers?: string[] | null
          claims_bonus?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_bonus?: number | null
          end_date: string
          id?: string
          is_active?: boolean | null
          multiplier_bonus?: number | null
          promo_name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          applies_to_tiers?: string[] | null
          claims_bonus?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_bonus?: number | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          multiplier_bonus?: number | null
          promo_name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string | null
          crescendo_data: Json | null
          current_tier_id: string | null
          display_name: string | null
          email: string | null
          founding_111: boolean
          founding_111_approved: boolean
          founding_111_approved_at: string | null
          founding_111_candidate: boolean
          founding_111_number: number | null
          founding_111_qualified: boolean
          founding_111_qualified_at: string | null
          garden_data: Json | null
          handle: string | null
          has_completed_onboarding: boolean | null
          id: string
          last_active_crescendo: string | null
          last_active_garden: string | null
          leaderboard_opt_in: boolean
          nctr_lock_duration_days: number | null
          nctr_lock_expires_at: string | null
          onchain_vesting_contract: string | null
          onchain_vesting_synced: boolean | null
          primary_wallet_address: string | null
          signup_bonus_awarded: boolean | null
          tier_calculated_at: string | null
          tier_override: string | null
          tier_override_at: string | null
          tier_override_by: string | null
          tier_override_reason: string | null
          updated_at: string | null
          wallet_address: string | null
          wallet_addresses: Json | null
          wallet_verified: boolean | null
          wallet_verified_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          crescendo_data?: Json | null
          current_tier_id?: string | null
          display_name?: string | null
          email?: string | null
          founding_111?: boolean
          founding_111_approved?: boolean
          founding_111_approved_at?: string | null
          founding_111_candidate?: boolean
          founding_111_number?: number | null
          founding_111_qualified?: boolean
          founding_111_qualified_at?: string | null
          garden_data?: Json | null
          handle?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          last_active_crescendo?: string | null
          last_active_garden?: string | null
          leaderboard_opt_in?: boolean
          nctr_lock_duration_days?: number | null
          nctr_lock_expires_at?: string | null
          onchain_vesting_contract?: string | null
          onchain_vesting_synced?: boolean | null
          primary_wallet_address?: string | null
          signup_bonus_awarded?: boolean | null
          tier_calculated_at?: string | null
          tier_override?: string | null
          tier_override_at?: string | null
          tier_override_by?: string | null
          tier_override_reason?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_addresses?: Json | null
          wallet_verified?: boolean | null
          wallet_verified_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          crescendo_data?: Json | null
          current_tier_id?: string | null
          display_name?: string | null
          email?: string | null
          founding_111?: boolean
          founding_111_approved?: boolean
          founding_111_approved_at?: string | null
          founding_111_candidate?: boolean
          founding_111_number?: number | null
          founding_111_qualified?: boolean
          founding_111_qualified_at?: string | null
          garden_data?: Json | null
          handle?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          last_active_crescendo?: string | null
          last_active_garden?: string | null
          leaderboard_opt_in?: boolean
          nctr_lock_duration_days?: number | null
          nctr_lock_expires_at?: string | null
          onchain_vesting_contract?: string | null
          onchain_vesting_synced?: boolean | null
          primary_wallet_address?: string | null
          signup_bonus_awarded?: boolean | null
          tier_calculated_at?: string | null
          tier_override?: string | null
          tier_override_at?: string | null
          tier_override_by?: string | null
          tier_override_reason?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_addresses?: Json | null
          wallet_verified?: boolean | null
          wallet_verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_profiles_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "status_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_profiles_tier_override_by_fkey"
            columns: ["tier_override_by"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          browser: string | null
          created_at: string | null
          device_type: string | null
          element_id: string | null
          element_text: string | null
          event_name: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          page_title: string | null
          referrer: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          element_id?: string | null
          element_text?: string | null
          event_name?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          page_title?: string | null
          referrer?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          element_id?: string | null
          element_text?: string | null
          event_name?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          page_title?: string | null
          referrer?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_delivery_profiles: {
        Row: {
          created_at: string | null
          discord_username: string | null
          email: string | null
          id: string
          instagram_handle: string | null
          phone: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_name: string | null
          shipping_state: string | null
          shipping_zip: string | null
          telegram_handle: string | null
          tiktok_handle: string | null
          twitch_username: string | null
          twitter_handle: string | null
          updated_at: string | null
          user_id: string
          wallet_address: string | null
          youtube_channel: string | null
        }
        Insert: {
          created_at?: string | null
          discord_username?: string | null
          email?: string | null
          id?: string
          instagram_handle?: string | null
          phone?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_name?: string | null
          shipping_state?: string | null
          shipping_zip?: string | null
          telegram_handle?: string | null
          tiktok_handle?: string | null
          twitch_username?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
          youtube_channel?: string | null
        }
        Update: {
          created_at?: string | null
          discord_username?: string | null
          email?: string | null
          id?: string
          instagram_handle?: string | null
          phone?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_name?: string | null
          shipping_state?: string | null
          shipping_zip?: string | null
          telegram_handle?: string | null
          tiktok_handle?: string | null
          twitch_username?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
          youtube_channel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_delivery_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          created_at: string | null
          first_referral: boolean | null
          first_referral_at: string | null
          first_wishlist_item: boolean | null
          first_wishlist_item_at: string | null
          garden_visited: boolean | null
          garden_visited_at: string | null
          how_it_works_viewed: boolean | null
          how_it_works_viewed_at: string | null
          id: string
          is_dismissed: boolean | null
          onboarding_nctr_awarded: number | null
          profile_completed: boolean | null
          profile_completed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          first_referral?: boolean | null
          first_referral_at?: string | null
          first_wishlist_item?: boolean | null
          first_wishlist_item_at?: string | null
          garden_visited?: boolean | null
          garden_visited_at?: string | null
          how_it_works_viewed?: boolean | null
          how_it_works_viewed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          onboarding_nctr_awarded?: number | null
          profile_completed?: boolean | null
          profile_completed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_referral?: boolean | null
          first_referral_at?: string | null
          first_wishlist_item?: boolean | null
          first_wishlist_item_at?: string | null
          garden_visited?: boolean | null
          garden_visited_at?: string | null
          how_it_works_viewed?: boolean | null
          how_it_works_viewed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          onboarding_nctr_awarded?: number | null
          profile_completed?: boolean | null
          profile_completed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "unified_profiles"
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
      user_sessions: {
        Row: {
          actions: number | null
          browser: string | null
          clicks: number | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          entry_page: string | null
          exit_page: string | null
          id: string
          page_views: number | null
          session_id: string
          started_at: string
          user_id: string | null
        }
        Insert: {
          actions?: number | null
          browser?: string | null
          clicks?: number | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          page_views?: number | null
          session_id: string
          started_at: string
          user_id?: string | null
        }
        Update: {
          actions?: number | null
          browser?: string | null
          clicks?: number | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          page_views?: number | null
          session_id?: string
          started_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_portfolio: {
        Row: {
          created_at: string | null
          id: string
          last_synced_at: string | null
          locks: Json | null
          nctr_360_locked: number | null
          nctr_90_locked: number | null
          nctr_balance: number | null
          nctr_unlocked: number | null
          sync_source: string | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          locks?: Json | null
          nctr_360_locked?: number | null
          nctr_90_locked?: number | null
          nctr_balance?: number | null
          nctr_unlocked?: number | null
          sync_source?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          locks?: Json | null
          nctr_360_locked?: number | null
          nctr_90_locked?: number | null
          nctr_balance?: number | null
          nctr_unlocked?: number | null
          sync_source?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_portfolio_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_credit_claims: {
        Args: {
          p_admin_id: string
          p_admin_notes?: string
          p_claims_amount: number
          p_message?: string
          p_recipient_id: string
        }
        Returns: Json
      }
      admin_gift_reward: {
        Args: { p_admin_notes?: string; p_reward_id: string; p_user_id: string }
        Returns: Json
      }
      approve_founding_111: { Args: { p_user_id: string }; Returns: Json }
      assign_founding_111_candidate: {
        Args: { p_user_id: string }
        Returns: Json
      }
      calculate_nctr_reward: {
        Args: {
          p_base_amount: number
          p_is_merch_360lock?: boolean
          p_user_id: string
        }
        Returns: {
          base_amount: number
          final_amount: number
          merch_lock_multiplier: number
          status_multiplier: number
          user_tier: string
        }[]
      }
      calculate_user_tier: { Args: { p_user_id: string }; Returns: string }
      cancel_gift: {
        Args: { p_gift_id: string; p_user_id: string }
        Returns: Json
      }
      check_founding_111_qualification: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_handle_available: { Args: { p_handle: string }; Returns: Json }
      check_merch_milestones: { Args: { p_user_id: string }; Returns: Json }
      check_purchase_milestones: { Args: { p_user_id: string }; Returns: Json }
      check_referral_milestones: { Args: { p_user_id: string }; Returns: Json }
      check_slug_availability: {
        Args: { p_slug: string; p_user_id?: string }
        Returns: Json
      }
      claim_gift: {
        Args: { p_gift_code: string; p_user_id: string }
        Returns: Json
      }
      claim_handle: {
        Args: { p_handle: string; p_user_id: string }
        Returns: Json
      }
      claim_reward: {
        Args: { p_reward_id: string; p_shipping_info?: Json }
        Returns: Json
      }
      cleanup_expired_nonces: { Args: never; Returns: undefined }
      generate_gift_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_admin_stats: { Args: never; Returns: Json }
      get_all_claims: {
        Args: never
        Returns: {
          claim_id: string
          claimed_at: string
          delivered_at: string
          delivery_data: Json
          delivery_method: string
          delivery_status: string
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
      get_bounty_earnings_history: {
        Args: { p_user_id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          source: string
          status: string
          title: string
        }[]
      }
      get_checkin_streak: { Args: { p_user_id: string }; Returns: Json }
      get_founding_111_candidates: {
        Args: never
        Returns: {
          auth_user_id: string
          created_at: string
          display_name: string
          email: string
          founding_111_approved: boolean
          founding_111_approved_at: string
          founding_111_candidate: boolean
          founding_111_number: number
          founding_111_qualified: boolean
          founding_111_qualified_at: string
          id: string
          purchase_count: number
          referral_count: number
          referral_purchases: number
          total_spend: number
        }[]
      }
      get_founding_111_count: { Args: never; Returns: number }
      get_gift_stats: { Args: never; Returns: Json }
      get_member_reward_price: {
        Args: { p_member_tier: string; p_reward_id: string }
        Returns: Json
      }
      get_merch_milestones: { Args: { p_user_id: string }; Returns: Json }
      get_my_founding_111_status: { Args: { p_user_id: string }; Returns: Json }
      get_public_stats: { Args: never; Returns: Json }
      get_purchase_milestones: { Args: { p_user_id: string }; Returns: Json }
      get_recent_admin_activity: {
        Args: { p_limit?: number }
        Returns: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json
          title: string
        }[]
      }
      get_referral_code_by_handle: { Args: { p_handle: string }; Returns: Json }
      get_referral_code_by_slug: { Args: { p_slug: string }; Returns: Json }
      get_referral_leaderboard: { Args: { p_user_id?: string }; Returns: Json }
      get_reward_watch_count: { Args: { p_reward_id: string }; Returns: number }
      get_share_status: { Args: { p_user_id: string }; Returns: Json }
      get_sponsor_stats: { Args: { p_sponsor_id: string }; Returns: Json }
      get_tier_user_counts: {
        Args: never
        Returns: {
          tier_id: string
          tier_name: string
          user_count: number
        }[]
      }
      get_unified_user_profile: {
        Args: { p_auth_user_id: string }
        Returns: Json
      }
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
      get_user_journey_stats: { Args: { p_user_id: string }; Returns: Json }
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
      get_user_with_tier: { Args: { p_user_id: string }; Returns: Json }
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
      has_admin_permission: {
        Args: { check_user_id: string; required_permission: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_reserved_slug: { Args: { slug: string }; Returns: boolean }
      is_valid_slug: { Args: { slug: string }; Returns: boolean }
      perform_daily_checkin: { Args: { p_user_id: string }; Returns: Json }
      perform_social_share: {
        Args: { p_platform: string; p_user_id: string }
        Returns: Json
      }
      process_referral: {
        Args: { p_referred_id: string; p_referrer_code: string }
        Returns: Json
      }
      reject_founding_111: { Args: { p_user_id: string }; Returns: Json }
      save_referral_slug: { Args: { p_slug: string }; Returns: Json }
      send_gift_from_balance: {
        Args: {
          p_claims_amount: number
          p_message?: string
          p_recipient_email: string
          p_sender_id: string
        }
        Returns: Json
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
      toggle_leaderboard_opt_in: {
        Args: { p_opt_in: boolean; p_user_id: string }
        Returns: Json
      }
      track_reward_conversion: {
        Args: { p_referral_code: string; p_reward_id: string }
        Returns: Json
      }
      update_claim_delivery_status: {
        Args: { p_claim_id: string; p_delivery_status: string }
        Returns: Json
      }
      update_claim_status: {
        Args: { p_claim_id: string; p_status: string }
        Returns: Json
      }
      validate_and_claim_bounty: {
        Args: {
          p_bounty_id: string
          p_submission_notes?: string
          p_submission_url?: string
          p_user_id: string
        }
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
