import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface LudoRoom {
  id: string;
  created_by: string;
  max_players: number;
  entry_fee: number;
  status: string;
  current_players: number;
  players: any;
  game_state: any;
  winner_id?: string;
  total_pot: number;
  commission_rate?: number;
  commission_amount?: number;
  winner_amount?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
  ludo_player_sessions?: LudoPlayerSession[];
}

interface LudoPlayerSession {
  id: string;
  room_id: string;
  player_id: string;
  player_position: number;
  player_color: string;
  is_online: boolean;
  last_heartbeat: string;
  joined_at: string;
}

interface LudoMove {
  id: string;
  room_id: string;
  player_id: string;
  move_type: string;
  dice_value?: number;
  token_id?: string;
  from_position?: number;
  to_position?: number;
  killed_token_id?: string;
  move_data?: any;
  created_at: string;
}

export const useLudoBackend = () => {
  const { user } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<LudoRoom | null>(null);
  const [playerSession, setPlayerSession] = useState<LudoPlayerSession | null>(null);
  const [roomMoves, setRoomMoves] = useState<LudoMove[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new Ludo room
  const createRoom = useCallback(async (maxPlayers: number, entryFee: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ludo-game-manager', {
        body: {
          action: 'create_room',
          moveData: { maxPlayers, entryFee }
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message || error.error || 'Failed to create room');
      }

      // Check if data has error property
      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.room_id) {
        throw new Error('Room creation failed - no room ID returned');
      }

      toast({
        title: "Room Created",
        description: `Room created with entry fee ₹${entryFee}`,
      });

      // Room will be fetched separately by the component to avoid circular dependency
      
      return data;
    } catch (err: any) {
      console.error('Create room error:', err);
      const errorMessage = err?.message || err?.error || 'Failed to create room. Please check your balance.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Join an existing room
  const joinRoom = useCallback(async (roomId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ludo-game-manager', {
        body: {
          action: 'join_room',
          roomId,
          playerId: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Joined Room",
        description: `You are player ${data.player_position} (${data.player_color})`,
      });

      // Fetch updated room state directly to avoid circular dependency
      try {
        const { data: room, error: roomError } = await supabase
          .from('ludo_rooms')
          .select(`
            *,
            ludo_player_sessions(*)
          `)
          .eq('id', roomId)
          .single();

        if (!roomError && room) {
          setCurrentRoom(room);
          const userSession = room.ludo_player_sessions?.find(
            (session: any) => session.player_id === user?.id
          );
          setPlayerSession(userSession || null);
        }
      } catch (err) {
        console.error('Error fetching room after join:', err);
      }
      
      if (data.room_full) {
        toast({
          title: "Game Starting",
          description: "Room is full! Game is starting...",
        });
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Roll dice
  const rollDice = useCallback(async (roomId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ludo-game-manager', {
        body: {
          action: 'roll_dice',
          roomId,
          playerId: user.id
        }
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Move token
  const moveToken = useCallback(async (roomId: string, tokenId: string, targetPosition: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ludo-game-manager', {
        body: {
          action: 'move_token',
          roomId,
          playerId: user.id,
          moveData: { tokenId, targetPosition }
        }
      });

      if (error) throw error;

      if (data.killedToken) {
        toast({
          title: "Token Killed!",
          description: `You killed an opponent's token!`,
        });
      }

      if (data.hasWon) {
        toast({
          title: "Congratulations!",
          description: "You won the game!",
        });
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async (roomId: string) => {
    if (!user) return;

    try {
      await supabase.functions.invoke('ludo-game-manager', {
        body: {
          action: 'heartbeat',
          roomId,
          playerId: user.id
        }
      });
    } catch (err) {
      console.error('Heartbeat error:', err);
    }
  }, [user]);

  // Forfeit game
  const forfeitGame = useCallback(async (roomId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.functions.invoke('ludo-game-manager', {
        body: {
          action: 'forfeit',
          roomId,
          playerId: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Game Forfeited",
        description: "You have left the game",
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  }, [user]);

  // Get room by ID
  const getRoomById = useCallback(async (roomId: string) => {
    try {
      const { data: room, error } = await supabase
        .from('ludo_rooms')
        .select(`
          *,
          ludo_player_sessions(*)
        `)
        .eq('id', roomId)
        .single();

      if (error) throw error;

      setCurrentRoom(room);

      // Find current user's session
      const userSession = room.ludo_player_sessions?.find(
        (session: any) => session.player_id === user?.id
      );
      setPlayerSession(userSession || null);

      return room;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  // Get available rooms
  const getAvailableRooms = useCallback(async () => {
    try {
      const { data: rooms, error } = await supabase
        .from('ludo_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return rooms;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get user's game history
  const getGameHistory = useCallback(async () => {
    if (!user) return [];

    try {
      const { data: rooms, error } = await supabase
        .from('ludo_rooms')
        .select('*')
        .contains('players->user_ids', [user.id])
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return rooms;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentRoom) return;

    console.log('Setting up real-time subscriptions for room:', currentRoom.id);

    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`room_${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ludo_rooms',
          filter: `id=eq.${currentRoom.id}`
        },
        (payload) => {
          console.log('Room update:', payload);
          if (payload.new) {
            setCurrentRoom(payload.new as LudoRoom);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ludo_player_sessions',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          console.log('Player session update:', payload);
          // Refresh room data directly to avoid circular dependency
          supabase
            .from('ludo_rooms')
            .select(`
              *,
              ludo_player_sessions(*)
            `)
            .eq('id', currentRoom.id)
            .single()
            .then(({ data: room, error: roomError }) => {
              if (!roomError && room) {
                setCurrentRoom(room);
                const userSession = room.ludo_player_sessions?.find(
                  (session: any) => session.player_id === user?.id
                );
                setPlayerSession(userSession || null);
              }
            })
            .catch((err) => {
              console.error('Error refreshing room:', err);
            });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ludo_moves',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          console.log('New move:', payload);
          if (payload.new) {
            setRoomMoves(prev => [...prev, payload.new as LudoMove]);
          }
        }
      )
      .subscribe();

    // Heartbeat interval
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat(currentRoom.id);
    }, 10000); // Every 10 seconds

    return () => {
      supabase.removeChannel(roomChannel);
      clearInterval(heartbeatInterval);
    };
  }, [currentRoom, sendHeartbeat, user]);

  // Load moves for current room
  useEffect(() => {
    if (!currentRoom) return;

    const loadMoves = async () => {
      try {
        const { data: moves, error } = await supabase
          .from('ludo_moves')
          .select('*')
          .eq('room_id', currentRoom.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setRoomMoves(moves || []);
      } catch (err) {
        console.error('Error loading moves:', err);
      }
    };

    loadMoves();
  }, [currentRoom]);

  return {
    // State
    currentRoom,
    playerSession,
    roomMoves,
    isLoading,
    error,

    // Actions
    createRoom,
    joinRoom,
    rollDice,
    moveToken,
    sendHeartbeat,
    forfeitGame,
    getRoomById,
    getAvailableRooms,
    getGameHistory,

    // Utilities
    clearError: () => setError(null),
    clearRoom: () => {
      setCurrentRoom(null);
      setPlayerSession(null);
      setRoomMoves([]);
    }
  };
};
