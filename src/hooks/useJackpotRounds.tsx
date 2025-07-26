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

  // Fetch current round
  const { data: currentRound, isLoading: currentRoundLoading, refetch: refetchCurrentRound } = useQuery({
    queryKey: ['current-jackpot-round'],
    queryFn: async (): Promise<CurrentRoundData> => {
      const { data, error } = await supabase.functions.invoke('jackpot-manager', {
        body: {},
        headers: { 'Content-Type': 'application/json' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  // Fetch jackpot history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['jackpot-history'],
    queryFn: async () => {
      const response = await fetch('/jackpot/history', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      return data.data;
    },
  });

  // Fetch wallet balance
  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      if (!user) return null;
      
      const response = await fetch('/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch wallet balance');
      const data = await response.json();
      return data.data;
    },
    enabled: !!user,
  });

  // Join round mutation
  const joinRound = useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await supabase.functions.invoke('jackpot-manager', {
        body: { amount },
        headers: { 'Content-Type': 'application/json' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
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
      const response = await fetch('/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ amount }),
      });
      
      if (!response.ok) throw new Error('Failed to deposit');
      return response.json();
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
  };
};