
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';
import { toast } from '@/hooks/use-toast';

interface AviatorRound {
  id: string;
  round_number: number;
  crash_multiplier: number;
  status: 'betting' | 'flying' | 'crashed';
  bet_start_time: string;
  bet_end_time: string;
  crash_time?: string;
  created_at: string;
  updated_at: string;
}

interface AviatorBet {
  id: string;
  user_id: string;
  round_id: string;
  bet_amount: number;
  auto_cashout_multiplier?: number;
  cashout_multiplier?: number;
  cashout_time?: string;
  payout_amount: number;
  status: 'active' | 'cashed_out' | 'crashed';
  created_at: string;
  updated_at: string;
}

interface BetPlaceResponse {
  success: boolean;
  bet_id: string;
  bet_amount: number;
  auto_cashout_multiplier?: number;
}

interface CashoutResponse {
  success: boolean;
  payout_amount: number;
  cashout_multiplier: number;
}

export const useAviator = () => {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const queryClient = useQueryClient();
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);

  // Fetch current round
  const { data: currentRound, isLoading: roundLoading } = useQuery({
    queryKey: ['aviator-current-round'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aviator_rounds')
        .select('*')
        .in('status', ['betting', 'flying'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AviatorRound | null;
    },
    refetchInterval: 1000,
  });

  // Fetch user's current bet for the round
  const { data: userBet, isLoading: betLoading } = useQuery({
    queryKey: ['aviator-user-bet', currentRound?.id],
    queryFn: async () => {
      if (!user?.id || !currentRound?.id) return null;
      
      const { data, error } = await supabase
        .from('aviator_bets')
        .select('*')
        .eq('user_id', user.id)
        .eq('round_id', currentRound.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AviatorBet | null;
    },
    enabled: !!user?.id && !!currentRound?.id,
  });

  // Fetch recent rounds for history
  const { data: recentRounds } = useQuery({
    queryKey: ['aviator-recent-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aviator_rounds')
        .select('*')
        .eq('status', 'crashed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as AviatorRound[];
    },
  });

  // Place bet mutation
  const placeBet = useMutation({
    mutationFn: async ({
      roundId,
      betAmount,
      autoCashoutMultiplier
    }: {
      roundId: string;
      betAmount: number;
      autoCashoutMultiplier?: number;
    }) => {
      const { data, error } = await supabase.rpc('place_aviator_bet', {
        p_round_id: roundId,
        p_bet_amount: betAmount,
        p_auto_cashout_multiplier: autoCashoutMultiplier || null,
      });

      if (error) throw error;
      return data as unknown as BetPlaceResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['aviator-user-bet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      
      toast({
        title: "Bet Placed",
        description: `₹${data.bet_amount} bet placed successfully!`,
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

  // Cash out mutation
  const cashOut = useMutation({
    mutationFn: async ({
      betId,
      currentMultiplier
    }: {
      betId: string;
      currentMultiplier: number;
    }) => {
      const { data, error } = await supabase.rpc('cashout_aviator_bet', {
        p_bet_id: betId,
        p_current_multiplier: currentMultiplier,
      });

      if (error) throw error;
      return data as unknown as CashoutResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['aviator-user-bet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      
      toast({
        title: "Cash Out Successful!",
        description: `You won ₹${data.payout_amount.toFixed(2)} at ${data.cashout_multiplier.toFixed(2)}x`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cash Out Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to round updates
    const roundChannel = supabase
      .channel('aviator-rounds')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aviator_rounds'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['aviator-current-round'] });
          queryClient.invalidateQueries({ queryKey: ['aviator-recent-rounds'] });
        }
      )
      .subscribe();

    // Subscribe to bet updates
    const betChannel = supabase
      .channel('aviator-bets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aviator_bets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['aviator-user-bet'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundChannel);
      supabase.removeChannel(betChannel);
    };
  }, [user, queryClient]);

  return {
    currentRound,
    userBet,
    recentRounds,
    currentMultiplier,
    setCurrentMultiplier,
    placeBet: placeBet.mutate,
    cashOut: cashOut.mutate,
    isPlacingBet: placeBet.isPending,
    isCashingOut: cashOut.isPending,
    roundLoading,
    betLoading,
    balance: wallet?.current_balance || 0,
  };
};
