
export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number;
}

export interface AndarBaharRound {
  id: string;
  round_number: number;
  joker_card: Card;
  andar_cards: Card[];
  bahar_cards: Card[];
  winning_side?: 'andar' | 'bahar';
  winning_card?: Card;
  status: 'betting' | 'dealing' | 'completed';
  bet_end_time: string;
  game_end_time?: string;
  created_at: string;
  updated_at: string;
}

export interface AndarBaharBet {
  id: string;
  user_id: string;
  round_id: string;
  bet_side: 'andar' | 'bahar';
  bet_amount: number;
  payout_amount?: number;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
}

export interface GameState {
  currentRound: AndarBaharRound | null;
  userBet: AndarBaharBet | null;
  timeRemaining: number;
  gameHistory: AndarBaharRound[];
}
