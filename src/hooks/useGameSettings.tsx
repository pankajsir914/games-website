import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GameSetting {
  id: string;
  game_type: string;
  is_enabled: boolean;
  maintenance_mode: boolean;
  min_bet_amount: number;
  max_bet_amount: number;
  house_edge: number;
  is_paused: boolean;
  settings: any;
}

export const useGameSettings = () => {
  const queryClient = useQueryClient();

  const getGameSettings = useQuery({
    queryKey: ['game-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .order('game_type');

      if (error) throw error;
      return data as GameSetting[];
    },
  });

  const updateGameSetting = useMutation({
    mutationFn: async ({ gameType, updates }: { gameType: string; updates: Partial<GameSetting> }) => {
      const { data, error } = await supabase
        .from('game_settings')
        .update(updates)
        .eq('game_type', gameType)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-settings'] });
      toast({
        title: "Game Settings Updated",
        description: "The game settings have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    ...getGameSettings,
    updateGameSetting: updateGameSetting.mutate,
    isUpdating: updateGameSetting.isPending,
  };
};