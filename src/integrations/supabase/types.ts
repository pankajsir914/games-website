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
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          is_resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title?: string
        }
        Relationships: []
      }
      admin_credit_accounts: {
        Row: {
          admin_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_credit_transactions: {
        Row: {
          admin_id: string
          amount: number
          created_at: string
          created_by: string
          id: string
          notes: string | null
          to_user_id: string | null
          tx_type: string
        }
        Insert: {
          admin_id: string
          amount: number
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          to_user_id?: string | null
          tx_type: string
        }
        Update: {
          admin_id?: string
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          to_user_id?: string | null
          tx_type?: string
        }
        Relationships: []
      }
      admin_ip_whitelist: {
        Row: {
          added_by: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address: unknown
          is_active?: boolean | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          sender_id: string | null
          target_admin_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type?: string
          sender_id?: string | null
          target_admin_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          sender_id?: string | null
          target_admin_id?: string | null
          title?: string
        }
        Relationships: []
      }
      admin_payment_methods: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          admin_id: string
          bank_name: string | null
          created_at: string
          id: string
          ifsc_code: string | null
          is_active: boolean
          is_primary: boolean
          method_type: string
          nickname: string | null
          qr_code_type: string | null
          qr_code_url: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          admin_id: string
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean
          is_primary?: boolean
          method_type: string
          nickname?: string | null
          qr_code_type?: string | null
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          admin_id?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean
          is_primary?: boolean
          method_type?: string
          nickname?: string | null
          qr_code_type?: string | null
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      admin_security_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      andar_bahar_bets: {
        Row: {
          bet_amount: number
          bet_side: string
          created_at: string
          id: string
          payout_amount: number | null
          round_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_amount: number
          bet_side: string
          created_at?: string
          id?: string
          payout_amount?: number | null
          round_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_amount?: number
          bet_side?: string
          created_at?: string
          id?: string
          payout_amount?: number | null
          round_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "andar_bahar_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "andar_bahar_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      andar_bahar_rounds: {
        Row: {
          andar_cards: Json
          bahar_cards: Json
          bet_end_time: string
          created_at: string
          game_end_time: string | null
          id: string
          joker_card: Json
          round_number: number
          status: string
          updated_at: string
          winning_card: Json | null
          winning_side: string | null
        }
        Insert: {
          andar_cards?: Json
          bahar_cards?: Json
          bet_end_time: string
          created_at?: string
          game_end_time?: string | null
          id?: string
          joker_card: Json
          round_number: number
          status?: string
          updated_at?: string
          winning_card?: Json | null
          winning_side?: string | null
        }
        Update: {
          andar_cards?: Json
          bahar_cards?: Json
          bet_end_time?: string
          created_at?: string
          game_end_time?: string | null
          id?: string
          joker_card?: Json
          round_number?: number
          status?: string
          updated_at?: string
          winning_card?: Json | null
          winning_side?: string | null
        }
        Relationships: []
      }
      aviator_bets: {
        Row: {
          auto_cashout_multiplier: number | null
          bet_amount: number
          cashout_multiplier: number | null
          cashout_time: string | null
          created_at: string
          id: string
          payout_amount: number | null
          round_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_cashout_multiplier?: number | null
          bet_amount: number
          cashout_multiplier?: number | null
          cashout_time?: string | null
          created_at?: string
          id?: string
          payout_amount?: number | null
          round_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_cashout_multiplier?: number | null
          bet_amount?: number
          cashout_multiplier?: number | null
          cashout_time?: string | null
          created_at?: string
          id?: string
          payout_amount?: number | null
          round_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aviator_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "aviator_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      aviator_chat_messages: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          message: string
          message_type: string
          multiplier: number | null
          user_id: string
          username: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          message: string
          message_type?: string
          multiplier?: number | null
          user_id: string
          username: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          multiplier?: number | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      aviator_rounds: {
        Row: {
          bet_end_time: string
          bet_start_time: string
          crash_multiplier: number
          crash_time: string | null
          created_at: string
          id: string
          round_number: number
          status: string
          updated_at: string
        }
        Insert: {
          bet_end_time: string
          bet_start_time?: string
          crash_multiplier: number
          crash_time?: string | null
          created_at?: string
          id?: string
          round_number: number
          status?: string
          updated_at?: string
        }
        Update: {
          bet_end_time?: string
          bet_start_time?: string
          crash_multiplier?: number
          crash_time?: string | null
          created_at?: string
          id?: string
          round_number?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      banner_promotions: {
        Row: {
          click_count: number | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          end_date: string | null
          id: string
          image_url: string
          impression_count: number | null
          is_active: boolean | null
          redirect_url: string | null
          start_date: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url: string
          impression_count?: number | null
          is_active?: boolean | null
          redirect_url?: string | null
          start_date?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string
          impression_count?: number | null
          is_active?: boolean | null
          redirect_url?: string | null
          start_date?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chicken_run_bets: {
        Row: {
          bet_amount: number
          cashout_multiplier: number | null
          created_at: string
          current_row: number
          difficulty: string
          id: string
          payout_amount: number | null
          round_id: string
          status: string
          tiles_revealed: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_amount: number
          cashout_multiplier?: number | null
          created_at?: string
          current_row?: number
          difficulty: string
          id?: string
          payout_amount?: number | null
          round_id: string
          status?: string
          tiles_revealed?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_amount?: number
          cashout_multiplier?: number | null
          created_at?: string
          current_row?: number
          difficulty?: string
          id?: string
          payout_amount?: number | null
          round_id?: string
          status?: string
          tiles_revealed?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chicken_run_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "chicken_run_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      chicken_run_leaderboard: {
        Row: {
          created_at: string
          highest_multiplier: number
          id: string
          total_games: number
          total_lost: number
          total_winnings: number
          total_won: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          highest_multiplier?: number
          id?: string
          total_games?: number
          total_lost?: number
          total_winnings?: number
          total_won?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          highest_multiplier?: number
          id?: string
          total_games?: number
          total_lost?: number
          total_winnings?: number
          total_won?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chicken_run_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chicken_run_rounds: {
        Row: {
          bet_end_time: string
          bet_start_time: string
          created_at: string
          difficulty_level: string
          id: string
          round_number: number
          status: string
          trap_positions: Json
          updated_at: string
        }
        Insert: {
          bet_end_time?: string
          bet_start_time?: string
          created_at?: string
          difficulty_level?: string
          id?: string
          round_number: number
          status?: string
          trap_positions?: Json
          updated_at?: string
        }
        Update: {
          bet_end_time?: string
          bet_start_time?: string
          created_at?: string
          difficulty_level?: string
          id?: string
          round_number?: number
          status?: string
          trap_positions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      color_prediction_bets: {
        Row: {
          bet_amount: number
          color: string
          created_at: string | null
          id: string
          multiplier: number | null
          payout_amount: number | null
          round_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bet_amount: number
          color: string
          created_at?: string | null
          id?: string
          multiplier?: number | null
          payout_amount?: number | null
          round_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bet_amount?: number
          color?: string
          created_at?: string | null
          id?: string
          multiplier?: number | null
          payout_amount?: number | null
          round_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "color_prediction_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "color_prediction_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      color_prediction_rounds: {
        Row: {
          bet_end_time: string
          created_at: string | null
          draw_time: string | null
          id: string
          period: string
          round_number: number
          status: string
          total_bets_amount: number | null
          total_players: number | null
          updated_at: string | null
          winning_color: string | null
        }
        Insert: {
          bet_end_time: string
          created_at?: string | null
          draw_time?: string | null
          id?: string
          period: string
          round_number: number
          status?: string
          total_bets_amount?: number | null
          total_players?: number | null
          updated_at?: string | null
          winning_color?: string | null
        }
        Update: {
          bet_end_time?: string
          created_at?: string | null
          draw_time?: string | null
          id?: string
          period?: string
          round_number?: number
          status?: string
          total_bets_amount?: number | null
          total_players?: number | null
          updated_at?: string | null
          winning_color?: string | null
        }
        Relationships: []
      }
      diamond_api_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          method: string | null
          params: Json | null
          response: Json | null
          response_time_ms: number | null
          status_code: number | null
          tested_by: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          method?: string | null
          params?: Json | null
          response?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          tested_by?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          method?: string | null
          params?: Json | null
          response?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          tested_by?: string | null
        }
        Relationships: []
      }
      diamond_casino_bets: {
        Row: {
          bet_amount: number
          bet_type: string
          created_at: string
          id: string
          odds: number | null
          payout_amount: number | null
          round_id: string | null
          status: string | null
          table_id: string
          table_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_amount: number
          bet_type: string
          created_at?: string
          id?: string
          odds?: number | null
          payout_amount?: number | null
          round_id?: string | null
          status?: string | null
          table_id: string
          table_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_amount?: number
          bet_type?: string
          created_at?: string
          id?: string
          odds?: number | null
          payout_amount?: number | null
          round_id?: string | null
          status?: string | null
          table_id?: string
          table_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diamond_casino_tables: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          player_count: number | null
          status: string | null
          table_data: Json | null
          table_id: string
          table_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          player_count?: number | null
          status?: string | null
          table_data?: Json | null
          table_id: string
          table_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          player_count?: number | null
          status?: string | null
          table_data?: Json | null
          table_id?: string
          table_name?: string | null
        }
        Relationships: []
      }
      diamond_match_results: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          market_id: string | null
          match_id: string
          posted_at: string | null
          posted_by: string | null
          result_data: Json | null
          result_status: string | null
          selection_id: string | null
          sport_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          market_id?: string | null
          match_id: string
          posted_at?: string | null
          posted_by?: string | null
          result_data?: Json | null
          result_status?: string | null
          selection_id?: string | null
          sport_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          market_id?: string | null
          match_id?: string
          posted_at?: string | null
          posted_by?: string | null
          result_data?: Json | null
          result_status?: string | null
          selection_id?: string | null
          sport_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      diamond_sports_config: {
        Row: {
          auto_sync: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          label: string | null
          last_sync_at: string | null
          sid: string | null
          sport_type: string
          sync_interval: number | null
          updated_at: string | null
        }
        Insert: {
          auto_sync?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          last_sync_at?: string | null
          sid?: string | null
          sport_type: string
          sync_interval?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_sync?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          last_sync_at?: string | null
          sid?: string | null
          sport_type?: string
          sync_interval?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      game_assets: {
        Row: {
          asset_name: string
          asset_type: string
          asset_url: string
          created_at: string | null
          dimensions: Json | null
          file_size: number | null
          game_type: string
          id: string
          is_active: boolean | null
          mime_type: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          asset_name: string
          asset_type: string
          asset_url: string
          created_at?: string | null
          dimensions?: Json | null
          file_size?: number | null
          game_type: string
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          asset_name?: string
          asset_type?: string
          asset_url?: string
          created_at?: string | null
          dimensions?: Json | null
          file_size?: number | null
          game_type?: string
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      game_content: {
        Row: {
          content: Json
          content_type: string
          created_at: string | null
          game_type: string
          id: string
          is_active: boolean | null
          language: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content: Json
          content_type: string
          created_at?: string | null
          game_type: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string | null
          game_type?: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      game_schedules: {
        Row: {
          action_config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          game_type: string
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          recurrence_pattern: Json | null
          schedule_type: string
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          game_type: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: Json | null
          schedule_type: string
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          game_type?: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: Json | null
          schedule_type?: string
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string
          current_players: number | null
          entry_fee: number
          game_type: Database["public"]["Enums"]["game_type"]
          id: string
          max_players: number | null
          players: Json
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["game_status"] | null
          total_pool: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          current_players?: number | null
          entry_fee?: number
          game_type: Database["public"]["Enums"]["game_type"]
          id?: string
          max_players?: number | null
          players?: Json
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
          total_pool?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          current_players?: number | null
          entry_fee?: number
          game_type?: Database["public"]["Enums"]["game_type"]
          id?: string
          max_players?: number | null
          players?: Json
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
          total_pool?: number
        }
        Relationships: []
      }
      game_settings: {
        Row: {
          game_type: string
          house_edge: number | null
          id: string
          is_enabled: boolean | null
          is_paused: boolean | null
          maintenance_mode: boolean | null
          max_bet_amount: number | null
          min_bet_amount: number | null
          settings: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          game_type: string
          house_edge?: number | null
          id?: string
          is_enabled?: boolean | null
          is_paused?: boolean | null
          maintenance_mode?: boolean | null
          max_bet_amount?: number | null
          min_bet_amount?: number | null
          settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          game_type?: string
          house_edge?: number | null
          id?: string
          is_enabled?: boolean | null
          is_paused?: boolean | null
          maintenance_mode?: boolean | null
          max_bet_amount?: number | null
          min_bet_amount?: number | null
          settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      global_betting_limits: {
        Row: {
          daily_limit: number | null
          id: string
          limit_type: string
          max_single_bet: number
          min_bet_amount: number | null
          monthly_limit: number | null
          updated_at: string | null
          updated_by: string | null
          weekly_limit: number | null
        }
        Insert: {
          daily_limit?: number | null
          id?: string
          limit_type: string
          max_single_bet?: number
          min_bet_amount?: number | null
          monthly_limit?: number | null
          updated_at?: string | null
          updated_by?: string | null
          weekly_limit?: number | null
        }
        Update: {
          daily_limit?: number | null
          id?: string
          limit_type?: string
          max_single_bet?: number
          min_bet_amount?: number | null
          monthly_limit?: number | null
          updated_at?: string | null
          updated_by?: string | null
          weekly_limit?: number | null
        }
        Relationships: []
      }
      jackpot_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          round_id: string
          ticket_end: number
          ticket_start: number
          user_id: string
          win_probability: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          round_id: string
          ticket_end: number
          ticket_start: number
          user_id: string
          win_probability?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          round_id?: string
          ticket_end?: number
          ticket_start?: number
          user_id?: string
          win_probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "jackpot_entries_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "jackpot_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      jackpot_games: {
        Row: {
          completed_at: string | null
          created_at: string
          ends_at: string
          id: string
          max_tickets_per_user: number
          starts_at: string
          status: string
          ticket_price: number
          tier: string
          total_participants: number
          total_pool: number
          total_tickets: number
          winner_id: string | null
          winning_ticket_number: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          ends_at: string
          id?: string
          max_tickets_per_user?: number
          starts_at?: string
          status?: string
          ticket_price?: number
          tier?: string
          total_participants?: number
          total_pool?: number
          total_tickets?: number
          winner_id?: string | null
          winning_ticket_number?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          max_tickets_per_user?: number
          starts_at?: string
          status?: string
          ticket_price?: number
          tier?: string
          total_participants?: number
          total_pool?: number
          total_tickets?: number
          winner_id?: string | null
          winning_ticket_number?: number | null
        }
        Relationships: []
      }
      jackpot_rounds: {
        Row: {
          commission_amount: number | null
          commission_rate: number
          created_at: string
          end_time: string
          id: string
          result_hash: string | null
          seed_hash: string | null
          start_time: string
          status: string
          total_amount: number
          total_players: number
          updated_at: string
          winner_amount: number | null
          winner_id: string | null
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string
          end_time: string
          id?: string
          result_hash?: string | null
          seed_hash?: string | null
          start_time?: string
          status?: string
          total_amount?: number
          total_players?: number
          updated_at?: string
          winner_amount?: number | null
          winner_id?: string | null
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string
          end_time?: string
          id?: string
          result_hash?: string | null
          seed_hash?: string | null
          start_time?: string
          status?: string
          total_amount?: number
          total_players?: number
          updated_at?: string
          winner_amount?: number | null
          winner_id?: string | null
        }
        Relationships: []
      }
      jackpot_tickets: {
        Row: {
          amount_paid: number
          game_id: string
          id: string
          purchased_at: string
          ticket_count: number
          ticket_numbers: number[]
          user_id: string
        }
        Insert: {
          amount_paid: number
          game_id: string
          id?: string
          purchased_at?: string
          ticket_count: number
          ticket_numbers: number[]
          user_id: string
        }
        Update: {
          amount_paid?: number
          game_id?: string
          id?: string
          purchased_at?: string
          ticket_count?: number
          ticket_numbers?: number[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jackpot_tickets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "jackpot_games"
            referencedColumns: ["id"]
          },
        ]
      }
      jackpot_winners: {
        Row: {
          created_at: string
          game_id: string
          id: string
          prize_amount: number
          tier: string
          user_id: string
          winning_ticket_number: number
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          prize_amount: number
          tier: string
          user_id: string
          winning_ticket_number: number
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          prize_amount?: number
          tier?: string
          user_id?: string
          winning_ticket_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "jackpot_winners_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "jackpot_games"
            referencedColumns: ["id"]
          },
        ]
      }
      ludo_match_logs: {
        Row: {
          action: string
          actor: string
          created_at: string
          id: string
          match_id: string
          payload: Json
        }
        Insert: {
          action: string
          actor: string
          created_at?: string
          id?: string
          match_id: string
          payload?: Json
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          id?: string
          match_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ludo_match_logs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "ludo_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      ludo_match_state: {
        Row: {
          board: Json
          consecutive_sixes: number
          dice_history: Json
          id: string
          last_move: Json | null
          match_id: string
          seed: string
          turn: string
          updated_at: string
        }
        Insert: {
          board?: Json
          consecutive_sixes?: number
          dice_history?: Json
          id?: string
          last_move?: Json | null
          match_id: string
          seed: string
          turn?: string
          updated_at?: string
        }
        Update: {
          board?: Json
          consecutive_sixes?: number
          dice_history?: Json
          id?: string
          last_move?: Json | null
          match_id?: string
          seed?: string
          turn?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ludo_match_state_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "ludo_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      ludo_matches: {
        Row: {
          bot_difficulty: string
          completed_at: string | null
          created_at: string
          entry_fee: number
          id: string
          mode: string
          status: string
          user_id: string
          winner: string | null
        }
        Insert: {
          bot_difficulty?: string
          completed_at?: string | null
          created_at?: string
          entry_fee: number
          id?: string
          mode: string
          status?: string
          user_id: string
          winner?: string | null
        }
        Update: {
          bot_difficulty?: string
          completed_at?: string | null
          created_at?: string
          entry_fee?: number
          id?: string
          mode?: string
          status?: string
          user_id?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ludo_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ludo_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ludo_moves: {
        Row: {
          created_at: string
          dice_value: number | null
          from_position: number | null
          id: string
          is_valid: boolean
          killed_token_id: string | null
          move_data: Json | null
          move_type: string
          player_id: string
          room_id: string
          to_position: number | null
          token_id: string | null
        }
        Insert: {
          created_at?: string
          dice_value?: number | null
          from_position?: number | null
          id?: string
          is_valid?: boolean
          killed_token_id?: string | null
          move_data?: Json | null
          move_type: string
          player_id: string
          room_id: string
          to_position?: number | null
          token_id?: string | null
        }
        Update: {
          created_at?: string
          dice_value?: number | null
          from_position?: number | null
          id?: string
          is_valid?: boolean
          killed_token_id?: string | null
          move_data?: Json | null
          move_type?: string
          player_id?: string
          room_id?: string
          to_position?: number | null
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ludo_moves_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "ludo_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      ludo_player_sessions: {
        Row: {
          id: string
          is_online: boolean
          joined_at: string
          last_heartbeat: string
          player_color: string
          player_id: string
          player_position: number
          room_id: string
          turn_timeout_at: string | null
        }
        Insert: {
          id?: string
          is_online?: boolean
          joined_at?: string
          last_heartbeat?: string
          player_color: string
          player_id: string
          player_position: number
          room_id: string
          turn_timeout_at?: string | null
        }
        Update: {
          id?: string
          is_online?: boolean
          joined_at?: string
          last_heartbeat?: string
          player_color?: string
          player_id?: string
          player_position?: number
          room_id?: string
          turn_timeout_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ludo_player_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "ludo_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      ludo_rooms: {
        Row: {
          commission_amount: number | null
          commission_rate: number
          completed_at: string | null
          created_at: string
          created_by: string
          current_players: number
          entry_fee: number
          game_state: Json | null
          id: string
          max_players: number
          players: Json
          started_at: string | null
          status: string
          total_pot: number
          updated_at: string
          winner_amount: number | null
          winner_id: string | null
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          current_players?: number
          entry_fee: number
          game_state?: Json | null
          id?: string
          max_players: number
          players?: Json
          started_at?: string | null
          status?: string
          total_pot?: number
          updated_at?: string
          winner_amount?: number | null
          winner_id?: string | null
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          current_players?: number
          entry_fee?: number
          game_state?: Json | null
          id?: string
          max_players?: number
          players?: Json
          started_at?: string | null
          status?: string
          total_pot?: number
          updated_at?: string
          winner_amount?: number | null
          winner_id?: string | null
        }
        Relationships: []
      }
      ludo_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          status: string
          username: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          status?: string
          username: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          status?: string
          username?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      ludo_wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          match_id: string | null
          meta: Json | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          match_id?: string | null
          meta?: Json | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          match_id?: string | null
          meta?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ludo_wallet_transactions_match_id"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "ludo_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ludo_wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ludo_users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          status: string | null
          team1: string
          team2: string
          type: string | null
          unique_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          status?: string | null
          team1: string
          team2: string
          type?: string | null
          unique_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          status?: string | null
          team1?: string
          team2?: string
          type?: string | null
          unique_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          id: string
          is_scheduled: boolean | null
          message: string
          notification_type: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          id?: string
          is_scheduled?: boolean | null
          message: string
          notification_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          id?: string
          is_scheduled?: boolean | null
          message?: string
          notification_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          payment_method: string | null
          payment_method_id: string | null
          processed_at: string | null
          processed_by: string | null
          receipt_url: string | null
          screenshot_url: string | null
          status: string | null
          transaction_ref: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          payment_method_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          receipt_url?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_ref?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          payment_method_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          receipt_url?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_ref?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          name: string
          pid: string
          stats: Json | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          pid: string
          stats?: Json | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          pid?: string
          stats?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      poker_actions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          game_id: string
          game_state: string
          id: string
          player_id: string
        }
        Insert: {
          action_type: string
          amount?: number
          created_at?: string
          game_id: string
          game_state: string
          id?: string
          player_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          game_id?: string
          game_state?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poker_actions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "poker_games"
            referencedColumns: ["id"]
          },
        ]
      }
      poker_game_events: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          game_id: string
          id: string
          player_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json
          event_type: string
          game_id: string
          id?: string
          player_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          game_id?: string
          id?: string
          player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poker_game_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "poker_games"
            referencedColumns: ["id"]
          },
        ]
      }
      poker_games: {
        Row: {
          betting_round: number | null
          community_cards: Json
          completed_at: string | null
          current_bet: number
          current_player_turn: string | null
          dealer_position: number
          deck: Json
          game_state: string
          hand_history: Json
          id: string
          last_action_time: string | null
          minimum_bet: number | null
          players_in_hand: Json | null
          pot_amount: number
          side_pots: Json | null
          started_at: string
          table_id: string
          turn_time_limit: number
          turn_timer_start: string | null
          winner_id: string | null
          winning_hand: Json | null
        }
        Insert: {
          betting_round?: number | null
          community_cards?: Json
          completed_at?: string | null
          current_bet?: number
          current_player_turn?: string | null
          dealer_position?: number
          deck?: Json
          game_state?: string
          hand_history?: Json
          id?: string
          last_action_time?: string | null
          minimum_bet?: number | null
          players_in_hand?: Json | null
          pot_amount?: number
          side_pots?: Json | null
          started_at?: string
          table_id: string
          turn_time_limit?: number
          turn_timer_start?: string | null
          winner_id?: string | null
          winning_hand?: Json | null
        }
        Update: {
          betting_round?: number | null
          community_cards?: Json
          completed_at?: string | null
          current_bet?: number
          current_player_turn?: string | null
          dealer_position?: number
          deck?: Json
          game_state?: string
          hand_history?: Json
          id?: string
          last_action_time?: string | null
          minimum_bet?: number | null
          players_in_hand?: Json | null
          pot_amount?: number
          side_pots?: Json | null
          started_at?: string
          table_id?: string
          turn_time_limit?: number
          turn_timer_start?: string | null
          winner_id?: string | null
          winning_hand?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "poker_games_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      poker_hand_history: {
        Row: {
          community_cards: Json
          completed_at: string
          game_id: string
          id: string
          players_data: Json
          pot_amount: number
          table_id: string
          winner_id: string
          winning_hand: Json
        }
        Insert: {
          community_cards: Json
          completed_at?: string
          game_id: string
          id?: string
          players_data: Json
          pot_amount: number
          table_id: string
          winner_id: string
          winning_hand: Json
        }
        Update: {
          community_cards?: Json
          completed_at?: string
          game_id?: string
          id?: string
          players_data?: Json
          pot_amount?: number
          table_id?: string
          winner_id?: string
          winning_hand?: Json
        }
        Relationships: [
          {
            foreignKeyName: "poker_hand_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "poker_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poker_hand_history_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      poker_player_sessions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_heartbeat: string | null
          session_token: string
          table_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_heartbeat?: string | null
          session_token: string
          table_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_heartbeat?: string | null
          session_token?: string
          table_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poker_player_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      poker_players: {
        Row: {
          chip_count: number
          connection_id: string | null
          current_bet: number | null
          has_acted_this_round: boolean | null
          hole_cards: Json | null
          id: string
          is_all_in: boolean | null
          is_big_blind: boolean
          is_dealer: boolean
          is_small_blind: boolean
          joined_at: string
          last_action: string | null
          last_heartbeat: string | null
          seat_number: number
          status: string
          table_id: string
          total_bet_this_hand: number | null
          user_id: string
        }
        Insert: {
          chip_count?: number
          connection_id?: string | null
          current_bet?: number | null
          has_acted_this_round?: boolean | null
          hole_cards?: Json | null
          id?: string
          is_all_in?: boolean | null
          is_big_blind?: boolean
          is_dealer?: boolean
          is_small_blind?: boolean
          joined_at?: string
          last_action?: string | null
          last_heartbeat?: string | null
          seat_number: number
          status?: string
          table_id: string
          total_bet_this_hand?: number | null
          user_id: string
        }
        Update: {
          chip_count?: number
          connection_id?: string | null
          current_bet?: number | null
          has_acted_this_round?: boolean | null
          hole_cards?: Json | null
          id?: string
          is_all_in?: boolean | null
          is_big_blind?: boolean
          is_dealer?: boolean
          is_small_blind?: boolean
          joined_at?: string
          last_action?: string | null
          last_heartbeat?: string | null
          seat_number?: number
          status?: string
          table_id?: string
          total_bet_this_hand?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poker_players_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "poker_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      poker_tables: {
        Row: {
          big_blind: number
          buy_in_max: number
          buy_in_min: number
          created_at: string
          created_by: string | null
          current_players: number
          id: string
          max_players: number
          name: string
          small_blind: number
          status: string
          table_type: string
          updated_at: string
        }
        Insert: {
          big_blind?: number
          buy_in_max?: number
          buy_in_min?: number
          created_at?: string
          created_by?: string | null
          current_players?: number
          id?: string
          max_players?: number
          name: string
          small_blind?: number
          status?: string
          table_type?: string
          updated_at?: string
        }
        Update: {
          big_blind?: number
          buy_in_max?: number
          buy_in_min?: number
          created_at?: string
          created_by?: string | null
          current_players?: number
          id?: string
          max_players?: number
          name?: string
          small_blind?: number
          status?: string
          table_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          full_name: string | null
          id: string
          phone: string | null
          requires_password_change: boolean | null
          tpin_failed_attempts: number | null
          tpin_hash: string | null
          tpin_locked_until: string | null
          tpin_set_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          requires_password_change?: boolean | null
          tpin_failed_attempts?: number | null
          tpin_hash?: string | null
          tpin_locked_until?: string | null
          tpin_set_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          requires_password_change?: boolean | null
          tpin_failed_attempts?: number | null
          tpin_hash?: string | null
          tpin_locked_until?: string | null
          tpin_set_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          banner_url: string | null
          created_at: string | null
          created_by: string | null
          current_usage: number | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          max_usage: number | null
          percentage: number | null
          promotion_type: string
          start_date: string
          target_audience: string | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          created_by?: string | null
          current_usage?: number | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          max_usage?: number | null
          percentage?: number | null
          promotion_type: string
          start_date: string
          target_audience?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          created_by?: string | null
          current_usage?: number | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_usage?: number | null
          percentage?: number | null
          promotion_type?: string
          start_date?: string
          target_audience?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      rate_limit_attempts: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          endpoint: string
          first_attempt_at: string | null
          id: string
          ip_address: unknown
          last_attempt_at: string | null
          user_id: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          endpoint: string
          first_attempt_at?: string | null
          id?: string
          ip_address?: unknown
          last_attempt_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          endpoint?: string
          first_attempt_at?: string | null
          id?: string
          ip_address?: unknown
          last_attempt_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown
          request_count: number | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: unknown
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      roulette_bets: {
        Row: {
          bet_amount: number
          bet_type: string
          bet_value: string | null
          created_at: string
          id: string
          payout_amount: number | null
          round_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_amount: number
          bet_type: string
          bet_value?: string | null
          created_at?: string
          id?: string
          payout_amount?: number | null
          round_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_amount?: number
          bet_type?: string
          bet_value?: string | null
          created_at?: string
          id?: string
          payout_amount?: number | null
          round_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roulette_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "roulette_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      roulette_presence: {
        Row: {
          id: string
          is_active: boolean | null
          last_seen: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          user_id?: string
        }
        Relationships: []
      }
      roulette_rounds: {
        Row: {
          bet_end_time: string
          created_at: string
          id: string
          round_number: number
          spin_end_time: string | null
          status: string
          updated_at: string
          winning_color: string | null
          winning_number: number | null
        }
        Insert: {
          bet_end_time: string
          created_at?: string
          id?: string
          round_number: number
          spin_end_time?: string | null
          status?: string
          updated_at?: string
          winning_color?: string | null
          winning_number?: number | null
        }
        Update: {
          bet_end_time?: string
          created_at?: string
          id?: string
          round_number?: number
          spin_end_time?: string | null
          status?: string
          updated_at?: string
          winning_color?: string | null
          winning_number?: number | null
        }
        Relationships: []
      }
      rummy_moves: {
        Row: {
          card_data: Json | null
          id: string
          move_type: string
          player_id: string
          session_id: string
          timestamp: string | null
        }
        Insert: {
          card_data?: Json | null
          id?: string
          move_type: string
          player_id: string
          session_id: string
          timestamp?: string | null
        }
        Update: {
          card_data?: Json | null
          id?: string
          move_type?: string
          player_id?: string
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rummy_moves_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rummy_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rummy_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string
          current_players: number
          entry_fee: number
          game_state: Json | null
          game_type: string
          id: string
          max_players: number
          players: Json
          prize_pool: number
          started_at: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          current_players?: number
          entry_fee?: number
          game_state?: Json | null
          game_type: string
          id?: string
          max_players?: number
          players?: Json
          prize_pool?: number
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          current_players?: number
          entry_fee?: number
          game_state?: Json | null
          game_type?: string
          id?: string
          max_players?: number
          players?: Json
          prize_pool?: number
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      scores: {
        Row: {
          id: string
          match_id: string
          result: string | null
          team1_score: string | null
          team2_score: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          match_id: string
          result?: string | null
          team1_score?: string | null
          team2_score?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string
          result?: string | null
          team1_score?: string | null
          team2_score?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          request_data: Json | null
          resource_id: string | null
          resource_type: string | null
          response_status: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          request_data?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          response_status?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          request_data?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          response_status?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sports_betting_odds: {
        Row: {
          bet_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          match_id: string
          odds: number
          sport_type: string
          team_name: string | null
          updated_at: string | null
        }
        Insert: {
          bet_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_id: string
          odds: number
          sport_type: string
          team_name?: string | null
          updated_at?: string | null
        }
        Update: {
          bet_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_id?: string
          odds?: number
          sport_type?: string
          team_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sports_match_settings: {
        Row: {
          betting_enabled: boolean | null
          commission_rate: number | null
          created_at: string | null
          created_by: string | null
          custom_odds: Json | null
          diamond_data: Json | null
          diamond_event_id: string | null
          diamond_market_id: string | null
          disabled_reason: string | null
          id: string
          is_featured: boolean | null
          match_data: Json
          match_id: string
          max_bet_amount: number | null
          min_bet_amount: number | null
          odds_data: Json | null
          sport_type: string
          updated_at: string | null
        }
        Insert: {
          betting_enabled?: boolean | null
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_odds?: Json | null
          diamond_data?: Json | null
          diamond_event_id?: string | null
          diamond_market_id?: string | null
          disabled_reason?: string | null
          id?: string
          is_featured?: boolean | null
          match_data: Json
          match_id: string
          max_bet_amount?: number | null
          min_bet_amount?: number | null
          odds_data?: Json | null
          sport_type: string
          updated_at?: string | null
        }
        Update: {
          betting_enabled?: boolean | null
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_odds?: Json | null
          diamond_data?: Json | null
          diamond_event_id?: string | null
          diamond_market_id?: string | null
          disabled_reason?: string | null
          id?: string
          is_featured?: boolean | null
          match_data?: Json
          match_id?: string
          max_bet_amount?: number | null
          min_bet_amount?: number | null
          odds_data?: Json | null
          sport_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sports_matches_cache: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          match_data: Json
          match_id: string
          match_kind: string
          sport_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          match_data: Json
          match_id: string
          match_kind: string
          sport_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          match_data?: Json
          match_id?: string
          match_kind?: string
          sport_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sports_mock_bets: {
        Row: {
          bet_amount: number
          bet_type: string
          created_at: string | null
          id: string
          match_id: string
          odds_at_bet: number
          potential_payout: number
          result_amount: number | null
          sport_type: string
          status: string | null
          team_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bet_amount: number
          bet_type: string
          created_at?: string | null
          id?: string
          match_id: string
          odds_at_bet: number
          potential_payout: number
          result_amount?: number | null
          sport_type: string
          status?: string | null
          team_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bet_amount?: number
          bet_type?: string
          created_at?: string | null
          id?: string
          match_id?: string
          odds_at_bet?: number
          potential_payout?: number
          result_amount?: number | null
          sport_type?: string
          status?: string | null
          team_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sports_settings: {
        Row: {
          api_endpoint: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          refresh_interval: number | null
          settings: Json | null
          show_completed: boolean | null
          show_live: boolean | null
          show_upcoming: boolean | null
          sport_type: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          refresh_interval?: number | null
          settings?: Json | null
          show_completed?: boolean | null
          show_live?: boolean | null
          show_upcoming?: boolean | null
          sport_type: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          refresh_interval?: number | null
          settings?: Json | null
          show_completed?: boolean | null
          show_live?: boolean | null
          show_upcoming?: boolean | null
          sport_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sports_sid_configs: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          label: string
          sid: string
          sport_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label: string
          sid: string
          sport_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string
          sid?: string
          sport_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teen_patti_bets: {
        Row: {
          bet_amount: number
          created_at: string
          id: string
          multiplier: number | null
          payout_amount: number | null
          round_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_amount: number
          created_at?: string
          id?: string
          multiplier?: number | null
          payout_amount?: number | null
          round_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_amount?: number
          created_at?: string
          id?: string
          multiplier?: number | null
          payout_amount?: number | null
          round_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teen_patti_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "teen_patti_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      teen_patti_results: {
        Row: {
          created_at: string
          hand_strength: number
          house_edge: number
          id: string
          player_cards: Json
          round_id: string
          total_bets: number
          total_winners: number
          winning_cards: Json
          winning_hand: string
        }
        Insert: {
          created_at?: string
          hand_strength: number
          house_edge?: number
          id?: string
          player_cards: Json
          round_id: string
          total_bets?: number
          total_winners?: number
          winning_cards: Json
          winning_hand: string
        }
        Update: {
          created_at?: string
          hand_strength?: number
          house_edge?: number
          id?: string
          player_cards?: Json
          round_id?: string
          total_bets?: number
          total_winners?: number
          winning_cards?: Json
          winning_hand?: string
        }
        Relationships: [
          {
            foreignKeyName: "teen_patti_results_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "teen_patti_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      teen_patti_rounds: {
        Row: {
          bet_end_time: string
          bet_start_time: string
          created_at: string
          id: string
          result_time: string | null
          round_number: number
          status: string
          total_players: number
          total_pot: number
          updated_at: string
          winning_cards: Json | null
          winning_hand_rank: string | null
        }
        Insert: {
          bet_end_time: string
          bet_start_time?: string
          created_at?: string
          id?: string
          result_time?: string | null
          round_number: number
          status?: string
          total_players?: number
          total_pot?: number
          updated_at?: string
          winning_cards?: Json | null
          winning_hand_rank?: string | null
        }
        Update: {
          bet_end_time?: string
          bet_start_time?: string
          created_at?: string
          id?: string
          result_time?: string | null
          round_number?: number
          status?: string
          total_players?: number
          total_pot?: number
          updated_at?: string
          winning_cards?: Json | null
          winning_hand_rank?: string | null
        }
        Relationships: []
      }
      teen_patti_tables: {
        Row: {
          created_at: string
          created_by: string
          current_players: number
          entry_fee: number
          id: string
          max_bet: number
          max_players: number
          min_bet: number
          min_players: number
          status: string
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_players?: number
          entry_fee?: number
          id?: string
          max_bet?: number
          max_players?: number
          min_bet?: number
          min_players?: number
          status?: string
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_players?: number
          entry_fee?: number
          id?: string
          max_bet?: number
          max_players?: number
          min_bet?: number
          min_players?: number
          status?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_betting_limits: {
        Row: {
          applied_by: string | null
          created_at: string | null
          daily_limit: number | null
          id: string
          is_custom: boolean | null
          max_bet_amount: number
          monthly_limit: number | null
          reason: string | null
          updated_at: string | null
          user_id: string | null
          weekly_limit: number | null
        }
        Insert: {
          applied_by?: string | null
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          is_custom?: boolean | null
          max_bet_amount?: number
          monthly_limit?: number | null
          reason?: string | null
          updated_at?: string | null
          user_id?: string | null
          weekly_limit?: number | null
        }
        Update: {
          applied_by?: string | null
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          is_custom?: boolean | null
          max_bet_amount?: number
          monthly_limit?: number | null
          reason?: string | null
          updated_at?: string | null
          user_id?: string | null
          weekly_limit?: number | null
        }
        Relationships: []
      }
      user_payment_methods: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          ifsc_code: string | null
          is_primary: boolean | null
          is_verified: boolean | null
          method_type: string
          nickname: string | null
          updated_at: string | null
          upi_id: string | null
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          ifsc_code?: string | null
          is_primary?: boolean | null
          is_verified?: boolean | null
          method_type: string
          nickname?: string | null
          updated_at?: string | null
          upi_id?: string | null
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          ifsc_code?: string | null
          is_primary?: boolean | null
          is_verified?: boolean | null
          method_type?: string
          nickname?: string | null
          updated_at?: string | null
          upi_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          game_session_id: string | null
          game_type: Database["public"]["Enums"]["game_type"] | null
          id: string
          reason: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          game_session_id?: string | null
          game_type?: Database["public"]["Enums"]["game_type"] | null
          id?: string
          reason: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          game_session_id?: string | null
          game_type?: Database["public"]["Enums"]["game_type"] | null
          id?: string
          reason?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string | null
          current_balance: number
          id: string
          locked_balance: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_balance?: number
          id?: string
          locked_balance?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_balance?: number
          id?: string
          locked_balance?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_holder_name: string | null
          admin_id: string | null
          admin_notes: string | null
          amount: number
          bank_account_number: string | null
          created_at: string | null
          id: string
          ifsc_code: string | null
          payment_method_id: string | null
          payment_method_type: string | null
          processed_at: string | null
          processed_by: string | null
          status: string | null
          updated_at: string | null
          upi_id: string | null
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          admin_id?: string | null
          admin_notes?: string | null
          amount: number
          bank_account_number?: string | null
          created_at?: string | null
          id?: string
          ifsc_code?: string | null
          payment_method_id?: string | null
          payment_method_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
          upi_id?: string | null
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          admin_id?: string | null
          admin_notes?: string | null
          amount?: number
          bank_account_number?: string | null
          created_at?: string | null
          id?: string
          ifsc_code?: string | null
          payment_method_id?: string | null
          payment_method_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
          upi_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "user_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      aviator_live_bets: {
        Row: {
          auto_cashout_multiplier: number | null
          bet_amount: number | null
          cashout_multiplier: number | null
          created_at: string | null
          id: string | null
          payout_amount: number | null
          round_number: number | null
          round_status: string | null
          status: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      roulette_live_bets: {
        Row: {
          bet_amount: number | null
          bet_type: string | null
          bet_value: string | null
          created_at: string | null
          id: string | null
          payout_amount: number | null
          round_id: string | null
          round_number: number | null
          round_status: string | null
          status: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roulette_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "roulette_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_create_admin_user: {
        Args: {
          p_email: string
          p_full_name: string
          p_password: string
          p_phone?: string
        }
        Returns: Json
      }
      admin_create_user: {
        Args: {
          p_email: string
          p_full_name: string
          p_password: string
          p_phone?: string
        }
        Returns: Json
      }
      allocate_admin_credits: {
        Args: { p_admin_id: string; p_amount: number; p_notes?: string }
        Returns: Json
      }
      auto_manage_roulette_rounds: { Args: never; Returns: Json }
      buy_jackpot_tickets: {
        Args: { p_game_id: string; p_ticket_count: number }
        Returns: Json
      }
      cashout_aviator_bet: {
        Args: { p_bet_id: string; p_current_multiplier: number }
        Returns: Json
      }
      cashout_chicken_run_bet: { Args: { p_bet_id: string }; Returns: Json }
      check_admin_ip_whitelist: { Args: never; Returns: boolean }
      check_admin_tpin_status: { Args: never; Returns: Json }
      check_chat_rate_limit: { Args: { p_user_id: string }; Returns: boolean }
      check_enhanced_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_attempts?: number
          p_progressive_penalty?: boolean
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_ip_whitelist: { Args: { p_ip_address: unknown }; Returns: boolean }
      check_rate_limit:
        | {
            Args: {
              p_endpoint: string
              p_max_attempts?: number
              p_window_minutes?: number
            }
            Returns: boolean
          }
        | {
            Args: {
              p_endpoint?: string
              p_ip_address?: unknown
              p_max_requests?: number
              p_user_id?: string
              p_window_minutes?: number
            }
            Returns: boolean
          }
      cleanup_inactive_poker_players: { Args: never; Returns: undefined }
      cleanup_old_security_data: { Args: never; Returns: undefined }
      complete_jackpot_game: { Args: { p_game_id: string }; Returns: Json }
      complete_jackpot_round: { Args: { p_round_id: string }; Returns: Json }
      complete_ludo_game: {
        Args: { p_room_id: string; p_winner_id: string }
        Returns: Json
      }
      create_admin_alert: {
        Args: {
          p_alert_type: string
          p_data?: Json
          p_description?: string
          p_severity: string
          p_title: string
        }
        Returns: string
      }
      create_aviator_chat_message:
        | {
            Args: {
              p_amount?: number
              p_message: string
              p_message_type?: string
              p_multiplier?: number
              p_user_id: string
              p_username: string
            }
            Returns: string
          }
        | {
            Args: {
              p_amount?: number
              p_message: string
              p_message_type?: string
              p_multiplier?: number
            }
            Returns: string
          }
      create_ludo_room: {
        Args: { p_entry_fee: number; p_max_players: number }
        Returns: Json
      }
      create_user_simple: {
        Args: {
          p_email: string
          p_full_name: string
          p_password: string
          p_phone?: string
          p_user_type?: string
        }
        Returns: Json
      }
      delete_diamond_sports_sid:
        | { Args: { p_id: string }; Returns: Json }
        | { Args: { p_sport_type: string }; Returns: Json }
      enforce_single_device_login: {
        Args: {
          p_device_info?: Json
          p_session_token: string
          p_user_id: string
        }
        Returns: Json
      }
      get_admin_credit_balance: {
        Args: { _admin_id?: string }
        Returns: number
      }
      get_admin_payment_methods_for_user: { Args: never; Returns: Json }
      get_all_users_for_master_admin: { Args: never; Returns: Json }
      get_current_jackpot_round: { Args: never; Returns: Json }
      get_diamond_sids: { Args: { p_sport_type?: string }; Returns: Json }
      get_financial_management_data: {
        Args: { p_timeframe?: string }
        Returns: Json
      }
      get_games_management_data: { Args: never; Returns: Json }
      get_match_betting_settings: {
        Args: { p_sport_type?: string }
        Returns: Json
      }
      get_platform_analytics: { Args: { p_timeframe?: string }; Returns: Json }
      get_poker_hand_strength: {
        Args: { community_cards: Json; hole_cards: Json }
        Returns: number
      }
      get_security_monitoring_data: { Args: never; Returns: Json }
      get_user_bet_limits: { Args: { p_user_id: string }; Returns: Json }
      get_user_details_for_admin: { Args: { p_user_id: string }; Returns: Json }
      get_user_highest_role: { Args: { _user_id: string }; Returns: string }
      get_users_management_data: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_master_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_session_valid: { Args: { p_session_token: string }; Returns: boolean }
      join_jackpot_round: { Args: { p_amount: number }; Returns: Json }
      join_ludo_room: { Args: { p_room_id: string }; Returns: Json }
      join_poker_table: {
        Args: {
          p_buy_in_amount: number
          p_seat_number: number
          p_table_id: string
        }
        Returns: Json
      }
      join_rummy_session: { Args: { p_session_id: string }; Returns: Json }
      leave_poker_table: { Args: { p_table_id: string }; Returns: Json }
      lock_wallet_balance: {
        Args: { p_amount: number; p_lock?: boolean; p_user_id: string }
        Returns: Json
      }
      log_admin_activity: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_target_id?: string
          p_target_type?: string
        }
        Returns: string
      }
      log_diamond_api_test: {
        Args: {
          p_endpoint: string
          p_method?: string
          p_params?: Json
          p_response?: Json
          p_response_time_ms?: number
          p_status_code?: number
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_action: string
          p_request_data?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_response_status?: number
        }
        Returns: undefined
      }
      manage_diamond_sports_sid:
        | {
            Args: {
              p_auto_sync?: boolean
              p_is_active?: boolean
              p_is_default?: boolean
              p_label?: string
              p_sid?: string
              p_sport_type: string
              p_sync_interval?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_auto_sync?: boolean
              p_is_active?: boolean
              p_sid?: string
              p_sport_type: string
              p_sync_interval?: number
            }
            Returns: Json
          }
      place_andar_bahar_bet: {
        Args: { p_bet_amount: number; p_bet_side: string; p_round_id: string }
        Returns: Json
      }
      place_aviator_bet: {
        Args: {
          p_auto_cashout_multiplier?: number
          p_bet_amount: number
          p_round_id: string
        }
        Returns: Json
      }
      place_chicken_run_bet: {
        Args: { p_bet_amount: number; p_difficulty: string }
        Returns: Json
      }
      place_color_prediction_bet: {
        Args: { p_bet_amount: number; p_color: string; p_round_id: string }
        Returns: Json
      }
      place_roulette_bet: {
        Args: {
          p_bet_amount: number
          p_bet_type: string
          p_bet_value: string
          p_round_id: string
        }
        Returns: Json
      }
      post_diamond_match_result: {
        Args: {
          p_event_id?: string
          p_market_id: string
          p_match_id: string
          p_result: string
          p_result_data?: Json
          p_selection_id: string
          p_sport_type: string
        }
        Returns: Json
      }
      process_andar_bahar_round: {
        Args: {
          p_round_id: string
          p_winning_card: Json
          p_winning_side: string
        }
        Returns: Json
      }
      process_aviator_crash: {
        Args: { p_crash_multiplier: number; p_round_id: string }
        Returns: Json
      }
      process_color_prediction_round: {
        Args: { p_round_id: string; p_winning_color: string }
        Returns: Json
      }
      process_payment_request: {
        Args: { p_admin_notes?: string; p_request_id: string; p_status: string }
        Returns: Json
      }
      process_roulette_round: {
        Args: { p_round_id: string; p_winning_number: number }
        Returns: Json
      }
      process_withdrawal_request: {
        Args: { p_admin_notes?: string; p_request_id: string; p_status: string }
        Returns: Json
      }
      reset_admin_tpin: { Args: { p_admin_id: string }; Returns: Json }
      reveal_chicken_run_tile: {
        Args: { p_bet_id: string; p_column: number; p_row: number }
        Returns: Json
      }
      set_admin_tpin: { Args: { p_tpin: string }; Returns: Json }
      set_user_bet_limits: {
        Args: {
          p_daily_limit?: number
          p_max_bet: number
          p_monthly_limit?: number
          p_reason?: string
          p_user_id: string
          p_weekly_limit?: number
        }
        Returns: Json
      }
      setup_admin_user: {
        Args: { full_name: string; phone?: string; user_email: string }
        Returns: Json
      }
      setup_master_admin: { Args: { user_email: string }; Returns: undefined }
      start_rummy_game: { Args: { p_session_id: string }; Returns: Json }
      toggle_match_betting: {
        Args: {
          p_enabled: boolean
          p_match_data?: Json
          p_match_id: string
          p_sport_type: string
        }
        Returns: Json
      }
      track_failed_login: {
        Args: { p_email: string; p_ip_address?: unknown; p_user_agent?: string }
        Returns: undefined
      }
      transfer_admin_credits_to_user: {
        Args: { p_amount: number; p_notes?: string; p_user_id: string }
        Returns: Json
      }
      update_platform_settings: { Args: { p_settings: Json }; Returns: Json }
      update_roulette_presence: { Args: never; Returns: undefined }
      update_user_status: {
        Args: { p_action: string; p_reason?: string; p_user_id: string }
        Returns: Json
      }
      update_wallet_balance: {
        Args: {
          p_amount: number
          p_game_session_id?: string
          p_game_type?: Database["public"]["Enums"]["game_type"]
          p_reason: string
          p_type: Database["public"]["Enums"]["transaction_type"]
          p_user_id: string
        }
        Returns: Json
      }
      validate_admin_input: {
        Args: { p_input: string; p_input_type?: string; p_max_length?: number }
        Returns: string
      }
      validate_admin_session: { Args: never; Returns: boolean }
      validate_and_sanitize_input: {
        Args: { p_allow_html?: boolean; p_input: string; p_max_length?: number }
        Returns: string
      }
      validate_input: {
        Args: { p_input: string; p_input_type?: string; p_max_length?: number }
        Returns: string
      }
      verify_admin_tpin: { Args: { p_tpin: string }; Returns: Json }
    }
    Enums: {
      admin_role: "admin" | "moderator" | "master_admin"
      game_status: "waiting" | "active" | "completed" | "cancelled"
      game_type:
        | "ludo"
        | "aviator"
        | "casino"
        | "color_prediction"
        | "chicken_run"
      transaction_type: "credit" | "debit"
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
      admin_role: ["admin", "moderator", "master_admin"],
      game_status: ["waiting", "active", "completed", "cancelled"],
      game_type: [
        "ludo",
        "aviator",
        "casino",
        "color_prediction",
        "chicken_run",
      ],
      transaction_type: ["credit", "debit"],
    },
  },
} as const
