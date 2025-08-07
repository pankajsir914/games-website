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
      // Get game settings from database
      const { data: gameSettings, error } = await supabase
        .from('game_settings')
        .select('*');

      if (error) {
        console.error('Error fetching games:', error);
        throw error;
      }

      // Transform the data to match our interface
      const games = gameSettings?.map((game: any) => ({
        game_type: game.game_type,
        is_enabled: game.is_enabled,
        is_paused: game.is_paused,
        maintenance_mode: game.maintenance_mode,
        min_bet_amount: game.min_bet_amount,
        max_bet_amount: game.max_bet_amount,
        house_edge: game.house_edge,
        active_players: 0, // Would need to calculate from active bets
        today_revenue: 0, // Would need to calculate from today's bets
        win_rate: 50, // Default
        total_bets_today: 0 // Would need to calculate from today's bets
      })) || [];

      return {
        games,
        total_active_players: 0,
        total_revenue_today: 0,
        platform_profit_today: 0
      } as GamesResponse;
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