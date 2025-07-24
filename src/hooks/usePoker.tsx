
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
}

interface PokerTable {
  id: string;
  name: string;
  table_type: 'public' | 'private';
  max_players: number;
  current_players: number;
  small_blind: number;
  big_blind: number;
  buy_in_min: number;
  buy_in_max: number;
  status: 'waiting' | 'playing' | 'paused';
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PokerPlayer {
  id: string;
  table_id: string;
  user_id: string;
  seat_number: number;
  chip_count: number;
  status: 'waiting' | 'playing' | 'folded' | 'all_in' | 'sitting_out';
  is_dealer: boolean;
  is_small_blind: boolean;
  is_big_blind: boolean;
  hole_cards?: Card[];
  joined_at: string;
  profiles?: { full_name: string };
}

interface PokerGame {
  id: string;
  table_id: string;
  game_state: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'completed';
  community_cards: Card[];
  pot_amount: number;
  current_bet: number;
  current_player_turn?: string;
  dealer_position: number;
  turn_timer_start?: string;
  turn_time_limit: number;
  started_at: string;
  completed_at?: string;
  winner_id?: string;
  winning_hand?: any;
}

interface PokerAction {
  id: string;
  game_id: string;
  player_id: string;
  action_type: 'fold' | 'check' | 'call' | 'raise' | 'all_in';
  amount: number;
  game_state: string;
  created_at: string;
}

export const usePoker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all poker tables
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['poker-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poker_tables')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PokerTable[];
    },
  });

  // Create table mutation
  const createTable = useMutation({
    mutationFn: async ({
      name,
      tableType,
      maxPlayers,
      smallBlind,
      bigBlind,
      buyInMin,
      buyInMax
    }: {
      name: string;
      tableType: 'public' | 'private';
      maxPlayers: number;
      smallBlind: number;
      bigBlind: number;
      buyInMin: number;
      buyInMax: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('poker_tables')
        .insert({
          name,
          table_type: tableType,
          max_players: maxPlayers,
          small_blind: smallBlind,
          big_blind: bigBlind,
          buy_in_min: buyInMin,
          buy_in_max: buyInMax,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poker-tables'] });
      toast({
        title: "Table Created",
        description: "Your poker table has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Join table mutation
  const joinTable = useMutation({
    mutationFn: async ({
      tableId,
      seatNumber,
      buyInAmount
    }: {
      tableId: string;
      seatNumber: number;
      buyInAmount: number;
    }) => {
      const { data, error } = await supabase.rpc('join_poker_table', {
        p_table_id: tableId,
        p_seat_number: seatNumber,
        p_buy_in_amount: buyInAmount,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poker-tables'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast({
        title: "Joined Table",
        description: "You've successfully joined the poker table",
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

  // Leave table mutation
  const leaveTable = useMutation({
    mutationFn: async (tableId: string) => {
      const { data, error } = await supabase.rpc('leave_poker_table', {
        p_table_id: tableId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poker-tables'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast({
        title: "Left Table",
        description: "You've successfully left the poker table",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Leave Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tables,
    tablesLoading,
    createTable: createTable.mutate,
    joinTable: joinTable.mutate,
    leaveTable: leaveTable.mutate,
    isCreating: createTable.isPending,
    isJoining: joinTable.isPending,
    isLeaving: leaveTable.isPending,
  };
};

// Hook for managing specific table state
export const usePokerTable = (tableId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch table players
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['poker-players', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poker_players')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('table_id', tableId)
        .order('seat_number');

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedPlayers = data?.map(player => ({
        id: player.id,
        table_id: player.table_id,
        user_id: player.user_id,
        seat_number: player.seat_number,
        chip_count: player.chip_count,
        status: player.status as 'waiting' | 'playing' | 'folded' | 'all_in' | 'sitting_out',
        is_dealer: player.is_dealer,
        is_small_blind: player.is_small_blind,
        is_big_blind: player.is_big_blind,
        hole_cards: player.hole_cards ? (player.hole_cards as Card[]) : undefined,
        joined_at: player.joined_at,
        profiles: Array.isArray(player.profiles) ? undefined : player.profiles as { full_name: string }
      })) || [];

      return transformedPlayers as PokerPlayer[];
    },
    enabled: !!tableId,
  });

  // Fetch current game
  const { data: currentGame, isLoading: gameLoading } = useQuery({
    queryKey: ['poker-game', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poker_games')
        .select('*')
        .eq('table_id', tableId)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      // Transform the data to match our interface
      const transformedGame: PokerGame = {
        id: data.id,
        table_id: data.table_id,
        game_state: data.game_state as 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'completed',
        community_cards: (data.community_cards as Card[]) || [],
        pot_amount: data.pot_amount,
        current_bet: data.current_bet,
        current_player_turn: data.current_player_turn,
        dealer_position: data.dealer_position,
        turn_timer_start: data.turn_timer_start,
        turn_time_limit: data.turn_time_limit,
        started_at: data.started_at,
        completed_at: data.completed_at,
        winner_id: data.winner_id,
        winning_hand: data.winning_hand
      };

      return transformedGame;
    },
    enabled: !!tableId,
  });

  // Fetch game actions
  const { data: actions, isLoading: actionsLoading } = useQuery({
    queryKey: ['poker-actions', currentGame?.id],
    queryFn: async () => {
      if (!currentGame?.id) return [];
      
      const { data, error } = await supabase
        .from('poker_actions')
        .select('*')
        .eq('game_id', currentGame.id)
        .order('created_at');

      if (error) throw error;
      return data as PokerAction[];
    },
    enabled: !!currentGame?.id,
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!tableId) return;

    const playersChannel = supabase
      .channel(`poker-players-${tableId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poker_players',
        filter: `table_id=eq.${tableId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['poker-players', tableId] });
      })
      .subscribe();

    const gameChannel = supabase
      .channel(`poker-game-${tableId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poker_games',
        filter: `table_id=eq.${tableId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['poker-game', tableId] });
      })
      .subscribe();

    const actionsChannel = currentGame?.id ? supabase
      .channel(`poker-actions-${currentGame.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poker_actions',
        filter: `game_id=eq.${currentGame.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['poker-actions', currentGame.id] });
      })
      .subscribe() : null;

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(gameChannel);
      if (actionsChannel) supabase.removeChannel(actionsChannel);
    };
  }, [tableId, currentGame?.id, queryClient]);

  return {
    players,
    currentGame,
    actions,
    playersLoading,
    gameLoading,
    actionsLoading,
    isPlayerAtTable: players?.some(p => p.user_id === user?.id) || false,
  };
};
