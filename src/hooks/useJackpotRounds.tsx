import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface JackpotRound {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  total_players: number;
  winner_id?: string;
  winner_amount?: number;
  commission_amount?: number;
  time_remaining?: number;
}

interface JackpotEntry {
  user_id: string;
  amount: number;
  win_probability: number;
  user_name: string;
}

interface CurrentRoundData {
  active: boolean;
  round_id?: string;
  total_amount?: number;
  total_players?: number;
  end_time?: string;
  time_remaining?: number;
  entries?: JackpotEntry[];
  user_entry?: {
    amount: number;
    win_probability: number;
  };
}

export const useJackpotRounds = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showingResult, setShowingResult] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Auto-manage rounds (creates, completes, manages result display)
  const { data: currentRound, isLoading: currentRoundLoading, refetch: refetchCurrentRound } = useQuery({
    queryKey: ['current-jackpot-round'],
    queryFn: async (): Promise<CurrentRoundData & { showing_result?: boolean; result_time_remaining?: number; last_winner_id?: string; last_winner_amount?: number; last_round_pot?: number }> => {
      const { data, error } = await supabase.functions.invoke('jackpot-live-manager', {
        body: {},
        headers: { 'Content-Type': 'application/json' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Unknown error');
      
      // Handle showing result state
      if (data.action === 'showing_result') {
        setShowingResult(true);
        setLastResult({
          winner_id: data.data.last_winner_id,
          winner_amount: data.data.last_winner_amount,
          pot: data.data.last_round_pot
        });
      } else {
        setShowingResult(false);
      }
      
      return data.data;
    },
    refetchInterval: 2000, // Auto-manage every 2 seconds
  });

  // Fetch jackpot history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['jackpot-history'],
    queryFn: async () => {
      const { data: rounds, error } = await supabase
        .from('jackpot_rounds')
        .select(`
          id,
          total_amount,
          winner_amount,
          created_at,
          updated_at,
          winner:profiles!winner_id(full_name)
        `)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return rounds || [];
    },
  });

  // Fetch wallet balance
  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return wallet?.current_balance || 0;
    },
    enabled: !!user,
  });

  // Join round mutation
  const joinRound = useMutation({
    mutationFn: async (amount: number) => {
      if (!currentRound?.round_id) {
        throw new Error('No active round');
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Check wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('current_balance')
        .eq('user_id', userData.user.id)
        .single();

      if (!wallet || wallet.current_balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from wallet
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: userData.user.id,
        p_amount: amount,
        p_type: 'debit',
        p_reason: `Jackpot entry - Round ${currentRound.round_id}`,
        p_game_type: 'casino'
      });

      if (walletError) throw walletError;

      // Create entry
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userData.user.id)
        .single();

      const { error: entryError } = await supabase
        .from('jackpot_entries')
        .insert({
          round_id: currentRound.round_id,
          user_id: userData.user.id,
          amount,
          ticket_start: Math.floor((currentRound.total_amount || 0) * 100) + 1,
          ticket_end: Math.floor(((currentRound.total_amount || 0) + amount) * 100),
          win_probability: 0 // Will be calculated after all entries are in
        });

      if (entryError) throw entryError;

      // Update round totals
      const newTotal = (currentRound.total_amount || 0) + amount;
      const newPlayers = (currentRound.total_players || 0) + 1;

      // Update win probabilities for all entries
      const { data: allEntries } = await supabase
        .from('jackpot_entries')
        .select('id, amount')
        .eq('round_id', currentRound.round_id);

      for (const entry of allEntries || []) {
        await supabase
          .from('jackpot_entries')
          .update({ win_probability: entry.amount / newTotal })
          .eq('id', entry.id);
      }

      // Update round
      await supabase
        .from('jackpot_rounds')
        .update({
          total_amount: newTotal,
          total_players: newPlayers
        })
        .eq('id', currentRound.round_id);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-jackpot-round'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast({
        title: "Joined Jackpot!",
        description: "Your entry has been added to the current round.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Join Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test deposit mutation (for development)
  const testDeposit = useMutation({
    mutationFn: async (amount: number) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Use RPC function to update wallet
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: userData.user.id,
        p_amount: amount,
        p_type: 'credit',
        p_reason: 'Test deposit',
        p_game_type: 'casino'
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast({
        title: "Deposit Successful",
        description: "Funds have been added to your wallet.",
      });
    },
  });

  // Update countdown timer
  useEffect(() => {
    if (currentRound?.active && currentRound.time_remaining) {
      setTimeLeft(Math.max(0, Math.floor(currentRound.time_remaining)));
      
      const interval = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentRound?.time_remaining]);

  // Set up real-time subscriptions
  useEffect(() => {
    const roundsChannel = supabase
      .channel('jackpot-rounds')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jackpot_rounds',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['current-jackpot-round'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jackpot_entries',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['current-jackpot-round'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundsChannel);
    };
  }, [queryClient]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    currentRound,
    history,
    walletBalance,
    timeLeft,
    formatTime,
    currentRoundLoading,
    historyLoading,
    joinRound: joinRound.mutate,
    isJoining: joinRound.isPending,
    testDeposit: testDeposit.mutate,
    isDepositing: testDeposit.isPending,
    refetchCurrentRound,
    showingResult,
    lastResult,
  };
};