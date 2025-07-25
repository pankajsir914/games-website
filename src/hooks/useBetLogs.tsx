import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BetLog {
  id: string;
  player_id: string;
  player_name: string;
  game: string;
  bet_amount: number;
  chosen_value: string;
  result: 'won' | 'lost' | 'pending';
  payout: number;
  timestamp: string;
}

export const useBetLogs = (filters?: {
  game?: string;
  player?: string;
  dateFrom?: string;
  dateTo?: string;
  result?: string;
}) => {
  return useQuery({
    queryKey: ['bet-logs', filters],
    queryFn: async () => {
      // Fetch from multiple game bet tables
      const [
        colorPredictionBets,
        aviatorBets,
        andarBaharBets,
        rouletteBets
      ] = await Promise.all([
        supabase.from('color_prediction_bets')
          .select(`
            id, user_id, bet_amount, color, status, payout_amount, created_at
          `)
          .order('created_at', { ascending: false })
          .limit(1000),
        
        supabase.from('aviator_bets')
          .select(`
            id, user_id, bet_amount, status, payout_amount, created_at
          `)
          .order('created_at', { ascending: false })
          .limit(1000),
        
        supabase.from('andar_bahar_bets')
          .select(`
            id, user_id, bet_amount, bet_side, status, payout_amount, created_at
          `)
          .order('created_at', { ascending: false })
          .limit(1000),
        
        supabase.from('roulette_bets')
          .select(`
            id, user_id, bet_amount, bet_type, bet_value, status, payout_amount, created_at
          `)
          .order('created_at', { ascending: false })
          .limit(1000)
      ]);

      const allBets: BetLog[] = [];

      // Get user profiles separately
      const userIds = [
        ...(colorPredictionBets.data?.map(bet => bet.user_id) || []),
        ...(aviatorBets.data?.map(bet => bet.user_id) || []),
        ...(andarBaharBets.data?.map(bet => bet.user_id) || []),
        ...(rouletteBets.data?.map(bet => bet.user_id) || [])
      ];
      
      const uniqueUserIds = [...new Set(userIds)];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueUserIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Process color prediction bets
      colorPredictionBets.data?.forEach(bet => {
        allBets.push({
          id: bet.id,
          player_id: bet.user_id,
          player_name: profileMap.get(bet.user_id)?.full_name || 'Unknown',
          game: 'Color Prediction',
          bet_amount: Number(bet.bet_amount),
          chosen_value: bet.color,
          result: bet.status === 'won' ? 'won' : bet.status === 'lost' ? 'lost' : 'pending',
          payout: Number(bet.payout_amount) || 0,
          timestamp: bet.created_at
        });
      });

      // Process aviator bets
      aviatorBets.data?.forEach(bet => {
        allBets.push({
          id: bet.id,
          player_id: bet.user_id,
          player_name: profileMap.get(bet.user_id)?.full_name || 'Unknown',
          game: 'Aviator',
          bet_amount: Number(bet.bet_amount),
          chosen_value: 'Fly',
          result: bet.status === 'cashed_out' ? 'won' : bet.status === 'crashed' ? 'lost' : 'pending',
          payout: Number(bet.payout_amount) || 0,
          timestamp: bet.created_at
        });
      });

      // Process andar bahar bets
      andarBaharBets.data?.forEach(bet => {
        allBets.push({
          id: bet.id,
          player_id: bet.user_id,
          player_name: profileMap.get(bet.user_id)?.full_name || 'Unknown',
          game: 'Andar Bahar',
          bet_amount: Number(bet.bet_amount),
          chosen_value: bet.bet_side,
          result: bet.status === 'won' ? 'won' : bet.status === 'lost' ? 'lost' : 'pending',
          payout: Number(bet.payout_amount) || 0,
          timestamp: bet.created_at
        });
      });

      // Process roulette bets
      rouletteBets.data?.forEach(bet => {
        allBets.push({
          id: bet.id,
          player_id: bet.user_id,
          player_name: profileMap.get(bet.user_id)?.full_name || 'Unknown',
          game: 'Roulette',
          bet_amount: Number(bet.bet_amount),
          chosen_value: `${bet.bet_type}: ${bet.bet_value || 'N/A'}`,
          result: bet.status === 'won' ? 'won' : bet.status === 'lost' ? 'lost' : 'pending',
          payout: Number(bet.payout_amount) || 0,
          timestamp: bet.created_at
        });
      });

      // Sort by timestamp descending
      allBets.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply filters
      let filteredBets = allBets;

      if (filters?.game) {
        filteredBets = filteredBets.filter(bet => bet.game.toLowerCase().includes(filters.game!.toLowerCase()));
      }

      if (filters?.player) {
        filteredBets = filteredBets.filter(bet => 
          bet.player_name.toLowerCase().includes(filters.player!.toLowerCase()) ||
          bet.player_id.includes(filters.player!)
        );
      }

      if (filters?.result) {
        filteredBets = filteredBets.filter(bet => bet.result === filters.result);
      }

      if (filters?.dateFrom) {
        filteredBets = filteredBets.filter(bet => bet.timestamp >= filters.dateFrom!);
      }

      if (filters?.dateTo) {
        filteredBets = filteredBets.filter(bet => bet.timestamp <= filters.dateTo!);
      }

      return filteredBets;
    },
  });
};