
export interface RouletteRound {
  id: string;
  round_number: number;
  winning_number?: number;
  winning_color?: 'red' | 'black' | 'green';
  status: 'betting' | 'spinning' | 'completed';
  bet_end_time: string;
  spin_end_time?: string;
  created_at: string;
  updated_at: string;
}

export interface RouletteBet {
  id: string;
  user_id: string;
  round_id: string;
  bet_type: BetType;
  bet_value?: string;
  bet_amount: number;
  payout_amount?: number;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
}

export type BetType = 
  | 'straight'     // Single number (0-36) - 35:1
  | 'red'          // Red numbers - 1:1
  | 'black'        // Black numbers - 1:1
  | 'even'         // Even numbers - 1:1
  | 'odd'          // Odd numbers - 1:1
  | 'low'          // 1-18 - 1:1
  | 'high'         // 19-36 - 1:1
  | 'dozen_1'      // 1-12 - 2:1
  | 'dozen_2'      // 13-24 - 2:1
  | 'dozen_3'      // 25-36 - 2:1
  | 'column_1'     // Column 1 - 2:1
  | 'column_2'     // Column 2 - 2:1
  | 'column_3';    // Column 3 - 2:1

export interface BetOption {
  type: BetType;
  label: string;
  value?: string;
  payout: string;
  className?: string;
}

export interface PlacedBet {
  type: BetType;
  value?: string;
  amount: number;
  payout: string;
}
