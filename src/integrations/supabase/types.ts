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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          receipt_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          receipt_url?: string | null
          status?: string | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
          last_attempt_at?: string | null
          user_id?: string | null
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
          account_holder_name: string
          admin_notes: string | null
          amount: number
          bank_account_number: string
          created_at: string | null
          id: string
          ifsc_code: string
          processed_at: string | null
          processed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_holder_name: string
          admin_notes?: string | null
          amount: number
          bank_account_number: string
          created_at?: string | null
          id?: string
          ifsc_code: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_holder_name?: string
          admin_notes?: string | null
          amount?: number
          bank_account_number?: string
          created_at?: string | null
          id?: string
          ifsc_code?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      buy_jackpot_tickets: {
        Args: { p_game_id: string; p_ticket_count: number }
        Returns: Json
      }
      cashout_aviator_bet: {
        Args: { p_bet_id: string; p_current_multiplier: number }
        Returns: Json
      }
      check_admin_ip_whitelist: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_chat_rate_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_enhanced_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_attempts?: number
          p_progressive_penalty?: boolean
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_inactive_poker_players: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_jackpot_game: {
        Args: { p_game_id: string }
        Returns: Json
      }
      complete_jackpot_round: {
        Args: { p_round_id: string }
        Returns: Json
      }
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
      create_aviator_chat_message: {
        Args:
          | {
              p_amount?: number
              p_message: string
              p_message_type?: string
              p_multiplier?: number
            }
          | {
              p_amount?: number
              p_message: string
              p_message_type?: string
              p_multiplier?: number
              p_user_id: string
              p_username: string
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
      get_admin_credit_balance: {
        Args: { _admin_id?: string }
        Returns: number
      }
      get_all_users_for_master_admin: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_jackpot_round: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_financial_management_data: {
        Args: { p_timeframe?: string }
        Returns: Json
      }
      get_games_management_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_platform_analytics: {
        Args: { p_timeframe?: string }
        Returns: Json
      }
      get_poker_hand_strength: {
        Args: { community_cards: Json; hole_cards: Json }
        Returns: number
      }
      get_security_monitoring_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_highest_role: {
        Args: { _user_id: string }
        Returns: string
      }
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
      is_admin_user: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_master_admin_user: {
        Args: { _user_id: string }
        Returns: boolean
      }
      join_jackpot_round: {
        Args: { p_amount: number }
        Returns: Json
      }
      join_ludo_room: {
        Args: { p_room_id: string }
        Returns: Json
      }
      join_poker_table: {
        Args: {
          p_buy_in_amount: number
          p_seat_number: number
          p_table_id: string
        }
        Returns: Json
      }
      join_rummy_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      leave_poker_table: {
        Args: { p_table_id: string }
        Returns: Json
      }
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
      setup_admin_user: {
        Args: { full_name: string; phone?: string; user_email: string }
        Returns: Json
      }
      setup_master_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      start_rummy_game: {
        Args: { p_session_id: string }
        Returns: Json
      }
      transfer_admin_credits_to_user: {
        Args: { p_amount: number; p_notes?: string; p_user_id: string }
        Returns: Json
      }
      update_platform_settings: {
        Args: { p_settings: Json }
        Returns: Json
      }
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
      validate_admin_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_and_sanitize_input: {
        Args: { p_allow_html?: boolean; p_input: string; p_max_length?: number }
        Returns: string
      }
    }
    Enums: {
      admin_role: "admin" | "moderator" | "master_admin"
      game_status: "waiting" | "active" | "completed" | "cancelled"
      game_type: "ludo" | "aviator" | "casino" | "color_prediction"
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
      game_type: ["ludo", "aviator", "casino", "color_prediction"],
      transaction_type: ["credit", "debit"],
    },
  },
} as const
