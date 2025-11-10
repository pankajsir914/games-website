import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserCompleteDetails {
  profile: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    avatar_url?: string;
    created_at: string;
    status: string;
    created_by?: string;
    created_by_name?: string;
  };
  wallet: {
    balance: number;
  };
  stats: {
    total_bets: number;
    total_won: number;
    total_lost: number;
    total_deposits: number;
    total_withdrawals: number;
  };
  recentTransactions: any[];
  bettingHistory: {
    aviator: any[];
    roulette: any[];
    teenPatti: any[];
    andarBahar: any[];
    colorPrediction: any[];
    casino: any[];
    jackpot: any[];
  };
  gameSessions: any[];
}

export const useUserCompleteDetails = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-complete-details', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch all data in parallel
      const [
        profileData,
        userData,
        transactionsData,
        aviatorBets,
        rouletteBets,
        teenPattiBets,
        andarBaharBets,
        colorBets,
        casinoBets,
        gameSessions,
      ] = await Promise.all([
        // Profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),

        // Get user data from RPC as fallback
        supabase.rpc('get_users_management_data', {
          p_limit: 1,
          p_offset: 0,
          p_search: userId,
          p_status: 'all'
        }),

        // Recent Transactions
        supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),

        // Aviator Bets
        supabase
          .from('aviator_bets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),

        // Roulette Bets
        supabase
          .from('roulette_bets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),

        // Teen Patti Bets
        supabase
          .from('teen_patti_bets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),

        // Andar Bahar Bets
        supabase
          .from('andar_bahar_bets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),

        // Color Prediction Bets
        supabase
          .from('color_prediction_bets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),

        // Casino Bets
        supabase
          .from('diamond_casino_bets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),

        // Game Sessions
        supabase
          .from('game_sessions')
          .select('*')
          .or(`created_by.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      // Use profile data if available, otherwise use data from RPC
      const userFromRpc = (userData.data as any)?.users?.[0];
      if (!profileData.data && !userFromRpc) throw new Error('User not found');

      // Calculate stats
      const calculateBetStats = (bets: any[]) => {
        return bets.reduce(
          (acc, bet) => {
            acc.total++;
            if (bet.status === 'won') {
              acc.won++;
              acc.totalWon += Number(bet.payout_amount || 0);
            } else if (bet.status === 'lost') {
              acc.lost++;
              acc.totalLost += Number(bet.bet_amount || 0);
            }
            return acc;
          },
          { total: 0, won: 0, lost: 0, totalWon: 0, totalLost: 0 }
        );
      };

      const allBets = [
        ...(aviatorBets.data || []),
        ...(rouletteBets.data || []),
        ...(teenPattiBets.data || []),
        ...(andarBaharBets.data || []),
        ...(colorBets.data || []),
        ...(casinoBets.data || []),
      ];

      const betStats = calculateBetStats(allBets);

      const transactions = transactionsData.data || [];
      const deposits = transactions.filter((t) => t.type === 'credit');
      const withdrawals = transactions.filter((t) => t.type === 'debit');

      const profileInfo = profileData.data as any;
      
      return {
        profile: {
          id: userId,
          email: userFromRpc?.email || 'N/A',
          full_name: profileInfo?.full_name || userFromRpc?.full_name || '',
          phone: profileInfo?.phone || userFromRpc?.phone || '',
          avatar_url: profileInfo?.avatar_url,
          created_at: profileInfo?.created_at || userFromRpc?.created_at || new Date().toISOString(),
          status: userFromRpc?.status || 'offline',
          created_by: profileInfo?.created_by || userFromRpc?.created_by,
          created_by_name: userFromRpc?.creator_name,
        },
        wallet: { balance: userFromRpc?.current_balance || 0 },
        stats: {
          total_bets: betStats.total,
          total_won: betStats.totalWon,
          total_lost: betStats.totalLost,
          total_deposits: deposits.reduce((sum, t) => sum + Number(t.amount), 0),
          total_withdrawals: withdrawals.reduce((sum, t) => sum + Number(t.amount), 0),
        },
        recentTransactions: transactions,
        bettingHistory: {
          aviator: aviatorBets.data || [],
          roulette: rouletteBets.data || [],
          teenPatti: teenPattiBets.data || [],
          andarBahar: andarBaharBets.data || [],
          colorPrediction: colorBets.data || [],
          casino: casinoBets.data || [],
          jackpot: [],
        },
        gameSessions: gameSessions.data || [],
      } as UserCompleteDetails;
    },
    enabled: !!userId,
  });
};
