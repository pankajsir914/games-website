
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { AndarBaharRound, AndarBaharBet, Card } from '@/types/andarBahar';

export const useAndarBahar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Fetch current round
  const { data: currentRound, isLoading: roundLoading } = useQuery({
    queryKey: ['andar-bahar-current-round'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('andar_bahar_rounds')
        .select('*')
        .in('status', ['betting', 'dealing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? {
        ...data,
        joker_card: data.joker_card as unknown as Card,
        andar_cards: (data.andar_cards as unknown as Card[]) || [],
        bahar_cards: (data.bahar_cards as unknown as Card[]) || [],
        winning_card: data.winning_card as unknown as Card | undefined
      } as AndarBaharRound : null;
    },
    refetchInterval: 1000,
  });

  // Fetch user's bet for current round
  const { data: userBet } = useQuery({
    queryKey: ['andar-bahar-user-bet', currentRound?.id],
    queryFn: async () => {
      if (!user?.id || !currentRound?.id) return null;
      
      const { data, error } = await supabase
        .from('andar_bahar_bets')
        .select('*')
        .eq('user_id', user.id)
        .eq('round_id', currentRound.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AndarBaharBet | null;
    },
    enabled: !!user?.id && !!currentRound?.id,
  });

  // Fetch game history
  const { data: gameHistory } = useQuery({
    queryKey: ['andar-bahar-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('andar_bahar_rounds')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map(round => ({
        ...round,
        joker_card: round.joker_card as unknown as Card,
        andar_cards: (round.andar_cards as unknown as Card[]) || [],
        bahar_cards: (round.bahar_cards as unknown as Card[]) || [],
        winning_card: round.winning_card as unknown as Card | undefined
      })) as AndarBaharRound[];
    },
  });

  // Fetch user's betting history
  const { data: userBetHistory } = useQuery({
    queryKey: ['andar-bahar-user-history'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('andar_bahar_bets')
        .select(`
          *,
          andar_bahar_rounds!inner(*)
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
      betSide: 'andar' | 'bahar';
      amount: number;
    }) => {
      const { data, error } = await supabase.rpc('place_andar_bahar_bet', {
        p_round_id: variables.roundId,
        p_bet_side: variables.betSide,
        p_bet_amount: variables.amount,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['andar-bahar-user-bet'] });
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

  // Update countdown timer
  useEffect(() => {
    if (!currentRound || currentRound.status !== 'betting') {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const betEndTime = new Date(currentRound.bet_end_time).getTime();
      const remaining = Math.max(0, Math.floor((betEndTime - now) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentRound]);

  // Set up real-time subscriptions
  useEffect(() => {
    const roundsChannel = supabase
      .channel('andar-bahar-rounds')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'andar_bahar_rounds'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['andar-bahar-current-round'] });
          queryClient.invalidateQueries({ queryKey: ['andar-bahar-history'] });
        }
      )
      .subscribe();

    const betsChannel = supabase
      .channel('andar-bahar-bets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'andar_bahar_bets'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['andar-bahar-user-bet'] });
          queryClient.invalidateQueries({ queryKey: ['andar-bahar-user-history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [queryClient]);

  const handlePlaceBet = (roundId: string, betSide: 'andar' | 'bahar', amount: number) => {
    placeBet.mutate({ roundId, betSide, amount });
  };

  return {
    currentRound,
    userBet,
    gameHistory: gameHistory || [],
    userBetHistory: userBetHistory || [],
    timeRemaining,
    roundLoading,
    placeBet: handlePlaceBet,
    isPlacingBet: placeBet.isPending,
  };
};
