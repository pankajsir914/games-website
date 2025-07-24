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
      join_rummy_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      lock_wallet_balance: {
        Args: { p_user_id: string; p_amount: number; p_lock?: boolean }
        Returns: Json
      }
      process_payment_request: {
        Args: { p_request_id: string; p_status: string; p_admin_notes?: string }
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
