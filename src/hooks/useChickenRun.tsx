import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface ChickenRunTile {
  row: number;
  column: number;
  is_trap: boolean;
}

export interface ChickenRunBet {
  id: string;
  user_id: string;
  round_id: string;
  bet_amount: number;
  tiles_revealed: ChickenRunTile[];
  current_row: number;
  cashout_multiplier: number | null;
  payout_amount: number | null;
  status: 'active' | 'won' | 'lost';
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface ChickenRunRound {
  id: string;
  round_number: number;
  trap_positions: any[];
  difficulty_level: string;
  status: string;
  bet_start_time: string;
  bet_end_time: string;
}

export interface ChickenRunLeaderboard {
  id: string;
  user_id: string;
  total_games: number;
  total_won: number;
  total_lost: number;
  highest_multiplier: number;
  total_winnings: number;
}

export const useChickenRun = () => {
  const queryClient = useQueryClient();

  // Fetch current active bet
  const { data: activeBet, isLoading: betLoading } = useQuery({
    queryKey: ['chicken-run-active-bet'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chicken_run_bets')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        tiles_revealed: (data.tiles_revealed as unknown as ChickenRunTile[]) || [],
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
        status: data.status as 'active' | 'won' | 'lost',
      } as ChickenRunBet;
    },
    refetchInterval: 1000,
  });

  // Fetch current round
  const { data: currentRound } = useQuery({
    queryKey: ['chicken-run-current-round'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chicken_run_rounds')
        .select('*')
        .eq('status', 'betting')
        .gt('bet_end_time', new Date().toISOString())
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data as ChickenRunRound | null;
    },
    refetchInterval: 1000,
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['chicken-run-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chicken_run_leaderboard')
        .select(`
          *,
          profiles!chicken_run_leaderboard_user_id_fkey(full_name)
        `)
        .order('highest_multiplier', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 5000,
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['chicken-run-user-stats'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return null;

      const { data, error } = await supabase
        .from('chicken_run_leaderboard')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ChickenRunLeaderboard | null;
    },
  });

  // Place bet mutation
  const placeBet = useMutation({
    mutationFn: async ({ amount, difficulty }: { amount: number; difficulty: 'easy' | 'medium' | 'hard' }) => {
      const { data, error } = await supabase.rpc('place_chicken_run_bet', {
        p_bet_amount: amount,
        p_difficulty: difficulty,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chicken-run-active-bet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast({
        title: "Bet Placed!",
        description: "Start selecting tiles to win!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to place bet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reveal tile mutation
  const revealTile = useMutation({
    mutationFn: async ({ betId, row, column }: { betId: string; row: number; column: number }) => {
      const { data, error } = await supabase.rpc('reveal_chicken_run_tile', {
        p_bet_id: betId,
        p_row: row,
        p_column: column,
      });

      if (error) throw error;
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chicken-run-active-bet'] });
      
      if (data.is_trap) {
        toast({
          title: "Game Over!",
          description: "You hit a trap! Better luck next time.",
          variant: "destructive",
        });
      } else {
        toast({
          title: `Safe! ${data.multiplier}x`,
          description: `Potential payout: ₹${data.potential_payout}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reveal tile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cash out mutation
  const cashOut = useMutation({
    mutationFn: async (betId: string) => {
      const { data, error } = await supabase.rpc('cashout_chicken_run_bet', {
        p_bet_id: betId,
      });

      if (error) throw error;
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chicken-run-active-bet'] });
      queryClient.invalidateQueries({ queryKey: ['chicken-run-user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['chicken-run-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      
      toast({
        title: "Congratulations!",
        description: `You won ₹${data.payout_amount} at ${data.multiplier}x!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cash out",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('chicken-run-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chicken_run_bets' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chicken-run-active-bet'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chicken_run_leaderboard' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chicken-run-leaderboard'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    activeBet,
    currentRound,
    leaderboard,
    userStats,
    betLoading,
    placeBet: placeBet.mutate,
    revealTile: revealTile.mutate,
    cashOut: cashOut.mutate,
    isPlacingBet: placeBet.isPending,
    isRevealingTile: revealTile.isPending,
    isCashingOut: cashOut.isPending,
  };
};