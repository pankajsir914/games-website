import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAnalytics = (timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') => {
  return useQuery({
    queryKey: ['admin-analytics', timeframe],
    queryFn: async () => {
      const now = new Date();
      let dateFrom: Date;
      
      switch (timeframe) {
        case 'weekly':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Get total stats
      const [
        { count: totalPlayers },
        { count: totalGames },
        { data: walletData },
        { data: transactionData },
        { data: gameStats }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('game_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('wallets').select('current_balance'),
        supabase.from('wallet_transactions')
          .select('amount, type, game_type, created_at')
          .gte('created_at', dateFrom.toISOString()),
        supabase.from('game_sessions')
          .select('game_type, status, created_at, total_pool')
          .gte('created_at', dateFrom.toISOString())
      ]);

      // Calculate analytics
      const totalBalance = walletData?.reduce((sum, wallet) => sum + Number(wallet.current_balance), 0) || 0;
      
      const totalBets = transactionData?.filter(t => t.type === 'debit').length || 0;
      const totalBetAmount = transactionData?.filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const totalWinnings = transactionData?.filter(t => t.type === 'credit' && t.game_type)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const netProfit = totalBetAmount - totalWinnings;

      // Game-wise stats
      const gameTypeStats = gameStats?.reduce((acc: any, game) => {
        const type = game.game_type || 'unknown';
        if (!acc[type]) {
          acc[type] = { games: 0, revenue: 0 };
        }
        acc[type].games += 1;
        acc[type].revenue += Number(game.total_pool) || 0;
        return acc;
      }, {});

      // Daily trends for charts
      const dailyData = transactionData?.reduce((acc: any, transaction) => {
        const date = new Date(transaction.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { bets: 0, winnings: 0, profit: 0 };
        }
        if (transaction.type === 'debit') {
          acc[date].bets += Number(transaction.amount);
        } else if (transaction.type === 'credit' && transaction.game_type) {
          acc[date].winnings += Number(transaction.amount);
        }
        acc[date].profit = acc[date].bets - acc[date].winnings;
        return acc;
      }, {});

      return {
        totalPlayers: totalPlayers || 0,
        totalGames: totalGames || 0,
        totalBalance,
        totalBets,
        totalBetAmount,
        totalWinnings,
        netProfit,
        gameTypeStats: gameTypeStats || {},
        dailyTrends: Object.entries(dailyData || {}).map(([date, data]: [string, any]) => ({
          date,
          ...data
        }))
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
};