import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number;
}

interface TeenPattiRound {
  id: string;
  round_number: number;
  bet_start_time: string;
  bet_end_time: string;
  result_time?: string;
  winning_cards?: Card[];
  winning_hand_rank?: string;
  total_pot: number;
  total_players: number;
  status: 'betting' | 'processing' | 'completed';
}

interface TeenPattiBet {
  id: string;
  user_id: string;
  round_id: string;
  bet_amount: number;
  payout_amount?: number;
  multiplier?: number;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
}

interface RoundResult {
  winningCards: Card[];
  handRank: string;
  multiplier: number;
  totalWinners: number;
  totalPayouts: number;
}

export const useTeenPatti = () => {
  const [currentRound, setCurrentRound] = useState<TeenPattiRound | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [userBets, setUserBets] = useState<TeenPattiBet[]>([]);
  const [roundHistory, setRoundHistory] = useState<TeenPattiRound[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const { toast } = useToast();

  const fetchCurrentRound = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-round-manager', {
        body: { action: 'get-current-round' }
      });

      if (error) throw error;

      if (data.success) {
        setCurrentRound(data.round);
        setTimeRemaining(data.timeRemaining);
      }
    } catch (error) {
      console.error('Error fetching current round:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch current round',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const placeBet = useCallback(async (betAmount: number) => {
    if (!currentRound) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-round-manager', {
        body: {
          action: 'place-bet',
          roundId: currentRound.id,
          betAmount
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Bet Placed!',
          description: `₹${betAmount} bet placed successfully`,
        });
        
        // Refresh round data
        await fetchCurrentRound();
        await fetchUserBets();
        return true;
      }
    } catch (error: any) {
      toast({
        title: 'Bet Failed',
        description: error.message || 'Failed to place bet',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
    return false;
  }, [currentRound, toast, fetchCurrentRound]);

  const fetchUserBets = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-round-manager', {
        body: { action: 'get-user-bets' }
      });

      if (error) throw error;

      if (data.success) {
        setUserBets(data.bets);
      }
    } catch (error) {
      console.error('Error fetching user bets:', error);
    }
  }, []);

  const fetchRoundHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-round-manager', {
        body: { action: 'get-round-history' }
      });

      if (error) throw error;

      if (data.success) {
        setRoundHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching round history:', error);
    }
  }, []);

  const completeRound = useCallback(async (roundId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-round-manager', {
        body: {
          action: 'complete-round',
          roundId
        }
      });

      if (error) throw error;

      if (data.success) {
        setLastResult(data.result);
        await fetchCurrentRound();
        await fetchUserBets();
        await fetchRoundHistory();
      }
    } catch (error) {
      console.error('Error completing round:', error);
    }
  }, [fetchCurrentRound, fetchUserBets, fetchRoundHistory]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0 && currentRound) {
            // Round ended, complete it
            completeRound(currentRound.id);
          }
          return newTime;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeRemaining, currentRound, completeRound]);

  // Real-time subscriptions
  useEffect(() => {
    fetchCurrentRound();
    fetchUserBets();
    fetchRoundHistory();

    // Subscribe to round updates
    const roundChannel = supabase
      .channel('teen-patti-rounds')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teen_patti_rounds'
        },
        () => {
          fetchCurrentRound();
          fetchRoundHistory();
        }
      )
      .subscribe();

    // Subscribe to bet updates
    const betChannel = supabase
      .channel('teen-patti-bets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teen_patti_bets'
        },
        () => {
          fetchUserBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundChannel);
      supabase.removeChannel(betChannel);
    };
  }, [fetchCurrentRound, fetchUserBets, fetchRoundHistory]);

  const hasUserBetInCurrentRound = currentRound ? 
    userBets.some(bet => bet.round_id === currentRound.id) : false;

  return {
    currentRound,
    timeRemaining,
    loading,
    userBets,
    roundHistory,
    lastResult,
    hasUserBetInCurrentRound,
    placeBet,
    fetchCurrentRound,
    fetchUserBets,
    fetchRoundHistory
  };
};