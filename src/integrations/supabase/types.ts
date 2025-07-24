export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
      poker_games: {
        Row: {
          community_cards: Json
          completed_at: string | null
          current_bet: number
          current_player_turn: string | null
          dealer_position: number
          deck: Json
          game_state: string
          hand_history: Json
          id: string
          pot_amount: number
          started_at: string
          table_id: string
          turn_time_limit: number
          turn_timer_start: string | null
          winner_id: string | null
          winning_hand: Json | null
        }
        Insert: {
          community_cards?: Json
          completed_at?: string | null
          current_bet?: number
          current_player_turn?: string | null
          dealer_position?: number
          deck?: Json
          game_state?: string
          hand_history?: Json
          id?: string
          pot_amount?: number
          started_at?: string
          table_id: string
          turn_time_limit?: number
          turn_timer_start?: string | null
          winner_id?: string | null
          winning_hand?: Json | null
        }
        Update: {
          community_cards?: Json
          completed_at?: string | null
          current_bet?: number
          current_player_turn?: string | null
          dealer_position?: number
          deck?: Json
          game_state?: string
          hand_history?: Json
          id?: string
          pot_amount?: number
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
      poker_players: {
        Row: {
          chip_count: number
          hole_cards: Json | null
          id: string
          is_big_blind: boolean
          is_dealer: boolean
          is_small_blind: boolean
          joined_at: string
          seat_number: number
          status: string
          table_id: string
          user_id: string
        }
        Insert: {
          chip_count?: number
          hole_cards?: Json | null
          id?: string
          is_big_blind?: boolean
          is_dealer?: boolean
          is_small_blind?: boolean
          joined_at?: string
          seat_number: number
          status?: string
          table_id: string
          user_id: string
        }
        Update: {
          chip_count?: number
          hole_cards?: Json | null
          id?: string
          is_big_blind?: boolean
          is_dealer?: boolean
          is_small_blind?: boolean
          joined_at?: string
          seat_number?: number
          status?: string
          table_id?: string
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
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
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
      [_ in never]: never
    }
    Functions: {
      buy_jackpot_tickets: {
        Args: { p_game_id: string; p_ticket_count: number }
        Returns: Json
      }
      complete_jackpot_game: {
        Args: { p_game_id: string }
        Returns: Json
      }
      join_poker_table: {
        Args: {
          p_table_id: string
          p_seat_number: number
          p_buy_in_amount: number
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
        Args: { p_user_id: string; p_amount: number; p_lock?: boolean }
        Returns: Json
      }
      place_andar_bahar_bet: {
        Args: { p_round_id: string; p_bet_side: string; p_bet_amount: number }
        Returns: Json
      }
      place_roulette_bet: {
        Args: {
          p_round_id: string
          p_bet_type: string
          p_bet_value: string
          p_bet_amount: number
        }
        Returns: Json
      }
      process_andar_bahar_round: {
        Args: {
          p_round_id: string
          p_winning_side: string
          p_winning_card: Json
        }
        Returns: Json
      }
      process_payment_request: {
        Args: { p_request_id: string; p_status: string; p_admin_notes?: string }
        Returns: Json
      }
      process_roulette_round: {
        Args: { p_round_id: string; p_winning_number: number }
        Returns: Json
      }
      process_withdrawal_request: {
        Args: { p_request_id: string; p_status: string; p_admin_notes?: string }
        Returns: Json
      }
      start_rummy_game: {
        Args: { p_session_id: string }
        Returns: Json
      }
      update_wallet_balance: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: Database["public"]["Enums"]["transaction_type"]
          p_reason: string
          p_game_type?: Database["public"]["Enums"]["game_type"]
          p_game_session_id?: string
        }
        Returns: Json
      }
    }
    Enums: {
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
      game_status: ["waiting", "active", "completed", "cancelled"],
      game_type: ["ludo", "aviator", "casino", "color_prediction"],
      transaction_type: ["credit", "debit"],
    },
  },
} as const
