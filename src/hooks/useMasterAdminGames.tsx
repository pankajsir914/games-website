import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GameData {
  game_type: string;
  is_enabled: boolean;
  is_paused: boolean;
  maintenance_mode: boolean;
  min_bet_amount: number;
  max_bet_amount: number;
  house_edge: number;
  active_players: number;
  today_revenue: number;
  win_rate: number;
  total_bets_today: number;
}

interface GamesResponse {
  games: GameData[];
  total_active_players: number;
  total_revenue_today: number;
  platform_profit_today: number;
}

export const useMasterAdminGames = () => {
  const queryClient = useQueryClient();

  const getGames = useQuery({
    queryKey: ['master-admin-games'],
    queryFn: async () => {
      // Mock data for now
      const mockData: GamesResponse = {
        games: [
          {
            game_type: 'color_prediction',
            is_enabled: true,
            is_paused: false,
            maintenance_mode: false,
            min_bet_amount: 10,
            max_bet_amount: 50000,
            house_edge: 0.05,
            active_players: 1247,
            today_revenue: 45200,
            win_rate: 45,
            total_bets_today: 2847
          },
          {
            game_type: 'aviator',
            is_enabled: true,
            is_paused: false,
            maintenance_mode: false,
            min_bet_amount: 10,
            max_bet_amount: 50000,
            house_edge: 0.04,
            active_players: 892,
            today_revenue: 32800,
            win_rate: 52,
            total_bets_today: 1932
          }
        ],
        total_active_players: 3597,
        total_revenue_today: 134800,
        platform_profit_today: 84700
      };
      
      return mockData;
    },
    refetchInterval: 15000, // Refresh every 15 seconds for live data
  });

  const updateGameSettings = useMutation({
    mutationFn: async ({ 
      gameType, 
      settings 
    }: { 
      gameType: string; 
      settings: Partial<GameData>
    }) => {
      const { data, error } = await supabase
        .from('game_settings')
        .update(settings)
        .eq('game_type', gameType)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-games'] });
      queryClient.invalidateQueries({ queryKey: ['game-settings'] });
      toast({
        title: "Game settings updated",
        description: "Changes have been applied successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleGameStatus = useMutation({
    mutationFn: async ({ gameType, enabled }: { gameType: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('game_settings')
        .update({ is_enabled: enabled, is_paused: !enabled })
        .eq('game_type', gameType)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-games'] });
      toast({
        title: "Game status updated",
        description: "Game availability has been changed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    games: getGames.data,
    isLoading: getGames.isLoading,
    error: getGames.error,
    refetch: getGames.refetch,
    updateGameSettings: updateGameSettings.mutate,
    toggleGameStatus: toggleGameStatus.mutate,
    isUpdating: updateGameSettings.isPending || toggleGameStatus.isPending,
  };
};