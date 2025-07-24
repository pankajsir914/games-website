
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RoundProcessResponse {
  success: boolean;
  round_id: string;
  winning_color: string;
  total_bets: number;
  winning_bets: number;
  total_payouts: number;
}

export const useColorPredictionAdmin = () => {
  const queryClient = useQueryClient();

  const forceResult = useMutation({
    mutationFn: async ({ roundId, color }: { roundId: string; color: 'red' | 'green' | 'violet' }) => {
      // First update the round to drawing status
      await supabase
        .from('color_prediction_rounds')
        .update({ status: 'drawing' })
        .eq('id', roundId);

      // Then process with the forced color
      const { data, error } = await supabase.rpc('process_color_prediction_round', {
        p_round_id: roundId,
        p_winning_color: color,
      });

      if (error) throw error;
      return data as unknown as RoundProcessResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
      queryClient.invalidateQueries({ queryKey: ['color-prediction-recent-rounds'] });
      
      toast({
        title: "Color Result Forced",
        description: `Round completed with winning color: ${data.winning_color}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Force Result Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createRound = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/color-prediction-manager?action=create_round`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW9qaWhncGVlaHZwd2VqZXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0NTEsImV4cCI6MjA2ODU5OTQ1MX0.izGAao4U7k8gn4UIb7kgPs-w1ZEg0GzmAhkZ_Ff_Oxk`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create round');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
      
      toast({
        title: "New Round Created",
        description: "A new color prediction round has been started",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Create Round Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    forceResult: forceResult.mutate,
    createRound: createRound.mutate,
    isForcing: forceResult.isPending,
    isCreating: createRound.isPending,
  };
};
