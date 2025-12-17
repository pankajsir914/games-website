
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useColorPredictionSettings = () => {
  const queryClient = useQueryClient();

  const updateCheatMode = useMutation({
    mutationFn: async ({ enabled, forcedColor }: { enabled: boolean; forcedColor?: string }) => {
      const settings = {
        cheat_mode: enabled,
        ...(forcedColor && { forced_color: forcedColor })
      };

      const { data, error } = await supabase
        .from('game_settings')
        .update({ settings })
        .eq('game_type', 'color_prediction')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game-settings'] });
      
      toast({
        title: variables.enabled ? "Cheat Mode Enabled" : "Cheat Mode Disabled",
        description: variables.enabled 
          ? "Color prediction outcomes can now be manually controlled" 
          : "Color prediction will run with normal random outcomes",
        variant: variables.enabled ? "destructive" : "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Settings Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const forceProcessExpiredRounds = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('color-prediction-manager', {
        body: { action: 'auto_manage' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
      queryClient.invalidateQueries({ queryKey: ['color-prediction-recent-rounds'] });
      
      toast({
        title: "Rounds Processed",
        description: "All expired rounds have been processed and new round created if needed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    updateCheatMode: updateCheatMode.mutate,
    forceProcessExpiredRounds: forceProcessExpiredRounds.mutate,
    isUpdatingCheatMode: updateCheatMode.isPending,
    isProcessingRounds: forceProcessExpiredRounds.isPending,
  };
};
