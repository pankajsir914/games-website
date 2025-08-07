import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PlatformAnalytics {
  totalUsers: number;
  newUsersToday: number;
  totalDeposits: number;
  totalWithdrawals: number;
  platformProfit: number;
  activeGames: number;
  liveUsers: number;
  totalGamesPlayed: number;
  gameStatistics: {
    game_type: string;
    games_played: number;
    total_bets: number;
    revenue: number;
  }[];
  peakHours: {
    hour: number;
    active_users: number;
  }[];
  financialMetrics: {
    totalRevenue: number;
    playerRetention: number;
    avgSessionTime: number;
  };
}

export const useMasterAdminAnalytics = () => {
  const getAnalytics = useQuery({
    queryKey: ['master-admin-analytics'],
    queryFn: async () => {
      // Mock data for now since backend functions are not yet implemented
      const mockData: PlatformAnalytics = {
        totalUsers: 15247,
        newUsersToday: 342,
        totalDeposits: 1200000,
        totalWithdrawals: 450000,
        platformProfit: 84700,
        activeGames: 8,
        liveUsers: 1247,
        totalGamesPlayed: 8924,
        gameStatistics: [
          { game_type: 'color_prediction', games_played: 2847, total_bets: 15400, revenue: 45200 },
          { game_type: 'aviator', games_played: 1932, total_bets: 12800, revenue: 32800 },
          { game_type: 'andar_bahar', games_played: 1456, total_bets: 9200, revenue: 28400 },
          { game_type: 'roulette', games_played: 892, total_bets: 5600, revenue: 18200 },
        ],
        peakHours: [
          { hour: 20, active_users: 1450 },
          { hour: 21, active_users: 1320 },
          { hour: 19, active_users: 1180 },
          { hour: 22, active_users: 950 },
        ],
        financialMetrics: {
          totalRevenue: 12400000,
          playerRetention: 68.2,
          avgSessionTime: 42,
        }
      };
      
      return mockData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for live data
  });

  return {
    analytics: getAnalytics.data,
    isLoading: getAnalytics.isLoading,
    error: getAnalytics.error,
    refetch: getAnalytics.refetch,
  };
};