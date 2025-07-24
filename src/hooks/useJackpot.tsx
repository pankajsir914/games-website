
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface JackpotGame {
  id: string;
  tier: string;
  ticket_price: number;
  max_tickets_per_user: number;
  total_pool: number;
  total_tickets: number;
  total_participants: number;
  status: string;
  starts_at: string;
  ends_at: string;
  winner_id?: string;
  winning_ticket_number?: number;
  completed_at?: string;
}

interface JackpotTicket {
  id: string;
  game_id: string;
  user_id: string;
  ticket_numbers: number[];
  ticket_count: number;
  amount_paid: number;
  purchased_at: string;
}

interface JackpotWinner {
  id: string;
  game_id: string;
  user_id: string;
  prize_amount: number;
  winning_ticket_number: number;
  tier: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const useJackpot = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch active jackpot games
  const { data: activeGames, isLoading: gamesLoading } = useQuery({
    queryKey: ['jackpot-games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jackpot_games')
        .select('*')
        .eq('status', 'active')
        .gte('ends_at', new Date().toISOString())
        .order('tier', { ascending: true });

      if (error) throw error;
      return data as JackpotGame[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch user's tickets for active games
  const { data: userTickets } = useQuery({
    queryKey: ['user-jackpot-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('jackpot_tickets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as JackpotTicket[];
    },
    enabled: !!user?.id,
  });

  // Fetch jackpot winners history
  const { data: winnersHistory, isLoading: winnersLoading } = useQuery({
    queryKey: ['jackpot-winners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jackpot_winners')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as JackpotWinner[];
    },
  });

  // Buy tickets mutation
  const buyTickets = useMutation({
    mutationFn: async ({ gameId, ticketCount }: { gameId: string; ticketCount: number }) => {
      const { data, error } = await supabase.rpc('buy_jackpot_tickets', {
        p_game_id: gameId,
        p_ticket_count: ticketCount,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jackpot-games'] });
      queryClient.invalidateQueries({ queryKey: ['user-jackpot-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast({
        title: "Tickets Purchased!",
        description: "Your tickets have been added to the jackpot pool.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!activeGames) return;

    const channels = activeGames.map(game => {
      const channel = supabase
        .channel(`jackpot-game-${game.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'jackpot_games',
            filter: `id=eq.${game.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['jackpot-games'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'jackpot_tickets',
            filter: `game_id=eq.${game.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['jackpot-games'] });
            queryClient.invalidateQueries({ queryKey: ['user-jackpot-tickets'] });
          }
        )
        .subscribe();

      return channel;
    });

    // Subscribe to winners
    const winnersChannel = supabase
      .channel('jackpot-winners')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jackpot_winners',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['jackpot-winners'] });
          queryClient.invalidateQueries({ queryKey: ['jackpot-games'] });
        }
      )
      .subscribe();

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
      supabase.removeChannel(winnersChannel);
    };
  }, [activeGames, queryClient]);

  return {
    activeGames,
    userTickets,
    winnersHistory,
    gamesLoading,
    winnersLoading,
    buyTickets: buyTickets.mutate,
    isBuying: buyTickets.isPending,
  };
};
