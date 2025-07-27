
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { ColorPredictionRound, ColorPredictionBet, BetPlaceResponse } from '@/types/colorPrediction';

export const useColorPrediction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState(30);

  // Fetch current active round
  const { data: currentRound, isLoading: roundLoading } = useQuery({
    queryKey: ['color-prediction-current-round'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('color_prediction_rounds')
        .select('*')
        .in('status', ['betting', 'drawing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ColorPredictionRound | null;
    },
    refetchInterval: 1000, // Refetch every second
  });

  // Fetch recent rounds for history
  const { data: recentRounds } = useQuery({
    queryKey: ['color-prediction-recent-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('color_prediction_rounds')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as ColorPredictionRound[];
    },
  });

  // Fetch user's bet for current round
  const { data: userBet } = useQuery({
    queryKey: ['color-prediction-user-bet', currentRound?.id],
    queryFn: async () => {
      if (!user?.id || !currentRound?.id) return null;

      const { data, error } = await supabase
        .from('color_prediction_bets')
        .select('*')
        .eq('round_id', currentRound.id)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ColorPredictionBet | null;
    },
    enabled: !!user?.id && !!currentRound?.id,
  });

  // Fetch user's bet history
  const { data: userBetHistory } = useQuery({
    queryKey: ['color-prediction-user-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('color_prediction_bets')
        .select(`
          *,
          color_prediction_rounds!inner(period, winning_color, draw_time)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Place bet mutation
  const placeBet = useMutation({
    mutationFn: async ({
      roundId,
      color,
      amount
    }: {
      roundId: string;
      color: 'red' | 'green' | 'violet';
      amount: number;
    }) => {
      const { data, error } = await supabase.rpc('place_color_prediction_bet', {
        p_round_id: roundId,
        p_color: color,
        p_bet_amount: amount,
      });

      if (error) throw error;
      return data as unknown as BetPlaceResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['color-prediction-user-bet'] });
      queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      
      toast({
        title: "Bet Placed Successfully!",
        description: `₹${data.bet_amount} bet placed on ${data.color} with ${data.multiplier}x multiplier`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bet Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (!currentRound) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(currentRound.bet_end_time).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;
      
      if (difference > 0) {
        setTimeLeft(Math.ceil(difference / 1000));
      } else {
        setTimeLeft(0);
        // If round is expired and still in betting state, invalidate queries to fetch fresh data
        if (currentRound.status === 'betting') {
          queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
        }
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [currentRound, queryClient]);

  // Set up realtime subscriptions
  useEffect(() => {
    const roundsChannel = supabase
      .channel('color-prediction-rounds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'color_prediction_rounds',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
          queryClient.invalidateQueries({ queryKey: ['color-prediction-recent-rounds'] });
        }
      )
      .subscribe();

    const betsChannel = supabase
      .channel('color-prediction-bets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'color_prediction_bets',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['color-prediction-user-bet'] });
          queryClient.invalidateQueries({ queryKey: ['color-prediction-user-history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [queryClient]);

  return {
    currentRound,
    recentRounds: recentRounds || [],
    userBet,
    userBetHistory: userBetHistory || [],
    timeLeft,
    roundLoading,
    placeBet: placeBet.mutate,
    isPlacingBet: placeBet.isPending,
  };
};
