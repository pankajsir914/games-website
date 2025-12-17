
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { RouletteRound, RouletteBet, BetType } from '@/types/roulette';

export const useRoulette = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Fetch current active round
  const { data: currentRound, isLoading: roundLoading } = useQuery({
    queryKey: ['roulette-current-round'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roulette_rounds')
        .select('*')
        .in('status', ['betting', 'spinning'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as RouletteRound | null;
    },
    refetchInterval: 1000,
  });

  // Fetch user's bet for current round
  const { data: userBet } = useQuery({
    queryKey: ['roulette-user-bet', currentRound?.id],
    queryFn: async () => {
      if (!user?.id || !currentRound?.id) return [];

      const { data, error } = await supabase
        .from('roulette_bets')
        .select('*')
        .eq('user_id', user.id)
        .eq('round_id', currentRound.id);

      if (error) throw error;
      return data as RouletteBet[];
    },
    enabled: !!user?.id && !!currentRound?.id,
  });

  // Fetch recent rounds history
  const { data: roundHistory } = useQuery({
    queryKey: ['roulette-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roulette_rounds')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as RouletteRound[];
    },
  });

  // Fetch user's bet history
  const { data: userBetHistory } = useQuery({
    queryKey: ['roulette-user-bet-history'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('roulette_bets')
        .select(`
          *,
          roulette_rounds!inner(round_number, winning_number, winning_color, status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Place bet mutation
  const placeBet = useMutation({
    mutationFn: async (variables: {
      roundId: string;
      betType: BetType;
      betValue?: string;
      amount: number;
    }) => {
      const { data, error } = await supabase.rpc('place_roulette_bet', {
        p_round_id: variables.roundId,
        p_bet_type: variables.betType,
        p_bet_value: variables.betValue || null,
        p_bet_amount: variables.amount,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roulette-user-bet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast({
        title: "Bet Placed",
        description: "Your bet has been placed successfully!",
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

  // Spin wheel mutation
  const spinWheelMutation = useMutation({
    mutationFn: async (roundId: string) => {
      const { data, error } = await supabase.functions.invoke('roulette-game-manager', {
        body: { action: 'spin_wheel', round_id: roundId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roulette-current-round'] });
      queryClient.invalidateQueries({ queryKey: ['roulette-history'] });
      queryClient.invalidateQueries({ queryKey: ['roulette-user-bet'] });
      queryClient.invalidateQueries({ queryKey: ['roulette-user-bet-history'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      
      toast({
        title: "Round Complete!",
        description: `Winning number: ${data.winning_number}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Spin Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate time remaining for betting
  useEffect(() => {
    if (!currentRound?.bet_end_time) {
      setTimeRemaining(0);
      return;
    }

    const calculateTimeRemaining = () => {
      const endTime = new Date(currentRound.bet_end_time).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [currentRound?.bet_end_time]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!queryClient) return;

    const roundsChannel = supabase
      .channel('roulette-rounds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roulette_rounds'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['roulette-current-round'] });
          queryClient.invalidateQueries({ queryKey: ['roulette-history'] });
        }
      )
      .subscribe();

    const betsChannel = supabase
      .channel('roulette-bets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roulette_bets'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['roulette-user-bet'] });
          queryClient.invalidateQueries({ queryKey: ['roulette-user-bet-history'] });
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [queryClient]);

  const handlePlaceBet = (betType: BetType, betValue: string | undefined, amount: number) => {
    if (!currentRound?.id) {
      toast({
        title: "No Active Round",
        description: "Wait for the next round to start betting.",
        variant: "destructive",
      });
      return;
    }

    if (currentRound.status !== 'betting') {
      toast({
        title: "Cannot place bet",
        description: "Betting is not open for this round",
        variant: "destructive",
      });
      return;
    }

    // Convert undefined to empty string for the RPC call
    const formattedBetValue = betValue === undefined ? '' : betValue;

    placeBet.mutate({
      roundId: currentRound.id,
      betType,
      betValue: formattedBetValue,
      amount,
    });
  };

  const handleSpinWheel = (roundId: string) => {
    spinWheelMutation.mutate(roundId);
  };

  return {
    currentRound,
    userBets: userBet || [],
    roundHistory: roundHistory || [],
    userBetHistory: userBetHistory || [],
    timeRemaining,
    roundLoading,
    placeBet: handlePlaceBet,
    isPlacingBet: placeBet.isPending,
    spinWheel: handleSpinWheel,
    isSpinningWheel: spinWheelMutation.isPending,
  };
};
