
export interface ColorPredictionRound {
  id: string;
  round_number: number;
  period: string;
  status: 'betting' | 'drawing' | 'completed';
  bet_end_time: string;
  draw_time?: string;
  winning_color?: 'red' | 'green' | 'violet';
  total_bets_amount: number;
  total_players: number;
  created_at: string;
  updated_at: string;
}

export interface ColorPredictionBet {
  id: string;
  user_id: string;
  round_id: string;
  color: 'red' | 'green' | 'violet';
  bet_amount: number;
  payout_amount?: number;
  status: 'pending' | 'won' | 'lost';
  multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface BetPlaceResponse {
  success: boolean;
  bet_id: string;
  bet_amount: number;
  color: string;
  multiplier: number;
}

export interface RoundProcessResponse {
  success: boolean;
  round_id: string;
  winning_color: string;
  total_bets: number;
  winning_bets: number;
  total_payouts: number;
}
