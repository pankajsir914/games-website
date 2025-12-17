import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';
import { AndarBaharRound, AndarBaharBet } from '@/types/andarBahar';
import { toast } from './use-toast';

export const useAndarBahar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Fetch current round
  const {
    data: currentRound,
    isLoading: roundLoading,
  } = useQuery({
    queryKey: ['andar-bahar-current-round'],
    queryFn: async (): Promise<AndarBaharRound | null> => {
      const { data, error } = await supabase
        .from('andar_bahar_rounds')
        .select('*')
        .in('status', ['betting', 'dealing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current round:', error);
        return null; // Return null instead of throwing to prevent UI breaks
      }

      return data as unknown as AndarBaharRound;
    },
    refetchInterval: 2000, // Reduced frequency
  });

  // Fetch user's current bet
  const { data: userBet } = useQuery({
    queryKey: ['andar-bahar-user-bet', currentRound?.id],
    queryFn: async (): Promise<AndarBaharBet | null> => {
      if (!user || !currentRound) return null;

      const { data, error } = await supabase
        .from('andar_bahar_bets')
        .select('*')
        .eq('user_id', user.id)
        .eq('round_id', currentRound.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user bet:', error);
        return null; // Return null instead of throwing to prevent UI breaks
      }

      return data as unknown as AndarBaharBet;
    },
    enabled: !!user && !!currentRound,
  });

  // Fetch game history
  const { data: gameHistory = [] } = useQuery({
    queryKey: ['andar-bahar-history'],
    queryFn: async (): Promise<AndarBaharRound[]> => {
      const { data, error } = await supabase
        .from('andar_bahar_rounds')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data as unknown as AndarBaharRound[]) || [];
    },
  });

  // Fetch user's bet history
  const { data: userBetHistory = [] } = useQuery({
    queryKey: ['andar-bahar-user-bets'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('andar_bahar_bets')
        .select(`
          *,
          andar_bahar_rounds!inner(round_number, winning_side, status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Place bet mutation
  const { mutate: placeBet, isPending: isPlacingBet } = useMutation({
    mutationFn: async ({ roundId, betSide, amount }: { 
      roundId: string; 
      betSide: 'andar' | 'bahar'; 
      amount: number;
    }) => {
      const { data, error } = await supabase.rpc('place_andar_bahar_bet', {
        p_round_id: roundId,
        p_bet_side: betSide,
        p_bet_amount: amount
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['andar-bahar-user-bet'] });
      queryClient.invalidateQueries({ queryKey: ['andar-bahar-user-bets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast({
        title: "Bet Placed Successfully",
        description: "Your bet has been placed. Good luck!",
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

  // Timer logic
  useEffect(() => {
    if (!currentRound || currentRound.status !== 'betting') {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const endTime = new Date(currentRound.bet_end_time).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentRound]);

  // Auto-manage rounds
  useEffect(() => {
    const manageRounds = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        await fetch('https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/andar-bahar-game-manager?action=auto_manage', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW9qaWhncGVlaHZwd2VqZXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0NTEsImV4cCI6MjA2ODU5OTQ1MX0.izGAao4U7k8gn4UIb7kgPs-w1ZEg0GzmAhkZ_Ff_Oxk',
          }
        });
      } catch (error) {
        console.error('Auto-manage error:', error);
      }
    };

    // Run immediately and then every 15 seconds (reduced frequency)
    manageRounds();
    const interval = setInterval(manageRounds, 15000);

    return () => clearInterval(interval);
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const roundsChannel = supabase
      .channel('andar-bahar-rounds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'andar_bahar_rounds',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['andar-bahar-current-round'] });
          queryClient.invalidateQueries({ queryKey: ['andar-bahar-history'] });
        }
      )
      .subscribe();

    const betsChannel = supabase
      .channel('andar-bahar-bets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'andar_bahar_bets',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['andar-bahar-user-bet'] });
          queryClient.invalidateQueries({ queryKey: ['andar-bahar-user-bets'] });
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
    userBet,
    gameHistory,
    userBetHistory,
    timeRemaining,
    roundLoading,
    placeBet,
    isPlacingBet,
  };
};