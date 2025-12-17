import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Card {
  suit: string;
  rank: number;
  name: string;
}

interface PokerPlayer {
  id: string;
  user_id: string;
  seat_number: number;
  chip_count: number;
  hole_cards?: Card[];
  current_bet: number;
  total_bet_this_hand: number;
  status: string;
  is_all_in: boolean;
  has_acted_this_round: boolean;
  last_action?: string;
  profiles?: { full_name: string };
}

interface PokerTable {
  id: string;
  name: string;
  max_players: number;
  current_players: number;
  small_blind: number;
  big_blind: number;
  buy_in_min: number;
  buy_in_max: number;
  status: string;
  players: PokerPlayer[];
  is_full: boolean;
  can_join: boolean;
}

interface PokerGame {
  id: string;
  table_id: string;
  game_state: string;
  community_cards: Card[];
  pot_amount: number;
  current_bet: number;
  current_player_turn?: string;
  dealer_position: number;
  betting_round: number;
  minimum_bet: number;
}

interface GameEvent {
  id: string;
  event_type: string;
  event_data: any;
  player_id?: string;
  created_at: string;
}

export const usePokerGame = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState<PokerTable[]>([]);
  const [currentTable, setCurrentTable] = useState<PokerTable | null>(null);
  const [currentGame, setCurrentGame] = useState<PokerGame | null>(null);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Fetch available tables
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const response = await supabase.functions.invoke('poker-table-manager', {
        body: { action: 'get_tables' }
      });

      if (response.data?.success) {
        setTables(response.data.tables);
      } else {
        throw new Error(response.data?.error || 'Failed to fetch tables');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load poker tables');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new table
  const createTable = useCallback(async (tableData: {
    name: string;
    small_blind: number;
    big_blind: number;
    buy_in_min: number;
    buy_in_max: number;
    max_players?: number;
  }) => {
    if (!user) {
      toast.error('Please log in to create a table');
      return false;
    }

    try {
      setLoading(true);
      const response = await supabase.functions.invoke('poker-table-manager', {
        body: { action: 'create_table', ...tableData }
      });

      if (response.data?.success) {
        toast.success('Table created successfully');
        await fetchTables();
        return true;
      } else {
        throw new Error(response.data?.error || 'Failed to create table');
      }
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Failed to create table');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchTables]);

  // Join a table
  const joinTable = useCallback(async (tableId: string, seatNumber: number, buyInAmount: number) => {
    if (!user) {
      toast.error('Please log in to join a table');
      return false;
    }

    try {
      setLoading(true);
      const response = await supabase.functions.invoke('poker-table-manager', {
        body: {
          action: 'join_table',
          table_id: tableId,
          seat_number: seatNumber,
          buy_in_amount: buyInAmount
        }
      });

      if (response.data?.success) {
        toast.success(`Joined table with ${buyInAmount} chips`);
        await fetchTableDetails(tableId);
        
        // Create session for real-time updates
        await createPlayerSession(tableId);
        return true;
      } else {
        throw new Error(response.data?.error || 'Failed to join table');
      }
    } catch (error) {
      console.error('Error joining table:', error);
      toast.error('Failed to join table');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Leave a table
  const leaveTable = useCallback(async (tableId: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const response = await supabase.functions.invoke('poker-table-manager', {
        body: {
          action: 'leave_table',
          table_id: tableId
        }
      });

      if (response.data?.success) {
        toast.success(`Cashed out ${response.data.chips_returned} chips`);
        setCurrentTable(null);
        setCurrentGame(null);
        await fetchTables();
        return true;
      } else {
        throw new Error(response.data?.error || 'Failed to leave table');
      }
    } catch (error) {
      console.error('Error leaving table:', error);
      toast.error('Failed to leave table');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchTables]);

  // Fetch table details
  const fetchTableDetails = useCallback(async (tableId: string) => {
    try {
      const response = await supabase.functions.invoke('poker-table-manager', {
        body: { action: 'get_table_details', table_id: tableId }
      });

      if (response.data?.success) {
        setCurrentTable(response.data.table);
        setCurrentGame(response.data.table.current_game);
        setGameEvents(response.data.table.recent_events || []);
      } else {
        throw new Error(response.data?.error || 'Failed to fetch table details');
      }
    } catch (error) {
      console.error('Error fetching table details:', error);
      toast.error('Failed to load table details');
    }
  }, []);

  // Start a game
  const startGame = useCallback(async (tableId: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const response = await supabase.functions.invoke('poker-game-manager', {
        body: {
          action: 'start_game',
          table_id: tableId
        }
      });

      if (response.data?.success) {
        toast.success('Game started!');
        await fetchTableDetails(tableId);
        return true;
      } else {
        throw new Error(response.data?.error || 'Failed to start game');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchTableDetails]);

  // Make a player action
  const makeAction = useCallback(async (gameId: string, action: string, amount: number = 0) => {
    if (!user) return false;

    try {
      setLoading(true);
      const response = await supabase.functions.invoke('poker-game-manager', {
        body: {
          action: 'player_action',
          game_id: gameId,
          player_id: user.id,
          action_type: action,
          amount: amount
        }
      });

      if (response.data?.success) {
        toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} successful`);
        if (currentTable) {
          await fetchTableDetails(currentTable.id);
        }
        return true;
      } else {
        throw new Error(response.data?.error || `Failed to ${action}`);
      }
    } catch (error) {
      console.error(`Error making ${action}:`, error);
      toast.error(`Failed to ${action}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, currentTable, fetchTableDetails]);

  // Create player session for real-time updates
  const createPlayerSession = useCallback(async (tableId: string) => {
    if (!user) return;

    try {
      const response = await supabase.functions.invoke('poker-game-manager', {
        body: {
          action: 'create_session',
          user_id: user.id,
          table_id: tableId
        }
      });

      if (response.data?.success) {
        setSessionToken(response.data.session_token);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }, [user]);

  // Send heartbeat to maintain session
  const sendHeartbeat = useCallback(async () => {
    if (!sessionToken) return;

    try {
      await supabase.functions.invoke('poker-game-manager', {
        body: {
          action: 'heartbeat',
          session_token: sessionToken
        }
      });
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }, [sessionToken]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentTable) return;

    // Subscribe to table changes
    const tableSubscription = supabase
      .channel(`poker_table_${currentTable.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poker_players',
          filter: `table_id=eq.${currentTable.id}`
        },
        () => {
          fetchTableDetails(currentTable.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poker_games',
          filter: `table_id=eq.${currentTable.id}`
        },
        () => {
          fetchTableDetails(currentTable.id);
        }
      )
      .subscribe();

    // Subscribe to game events
    const eventsSubscription = supabase
      .channel(`poker_events_${currentTable.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'poker_game_events'
        },
        (payload) => {
          setGameEvents(prev => [payload.new as GameEvent, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      tableSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
    };
  }, [currentTable, fetchTableDetails]);

  // Set up heartbeat interval
  useEffect(() => {
    if (!sessionToken) return;

    const interval = setInterval(sendHeartbeat, 15000); // Send heartbeat every 15 seconds
    return () => clearInterval(interval);
  }, [sessionToken, sendHeartbeat]);

  // Helper functions
  const isMyTurn = useCallback(() => {
    return currentGame?.current_player_turn === user?.id;
  }, [currentGame, user]);

  const getMyPlayer = useCallback(() => {
    return currentTable?.players.find(p => p.user_id === user?.id);
  }, [currentTable, user]);

  const canStartGame = useCallback(() => {
    const myPlayer = getMyPlayer();
    return currentTable && 
           currentTable.players.length >= 2 && 
           currentTable.status === 'waiting' &&
           myPlayer;
  }, [currentTable, getMyPlayer]);

  return {
    // State
    tables,
    currentTable,
    currentGame,
    gameEvents,
    loading,
    
    // Actions
    fetchTables,
    createTable,
    joinTable,
    leaveTable,
    fetchTableDetails,
    startGame,
    makeAction,
    
    // Helpers
    isMyTurn,
    getMyPlayer,
    canStartGame
  };
};