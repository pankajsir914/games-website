
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface GameSession {
  id: string;
  game_type: 'ludo' | 'aviator' | 'casino' | 'color_prediction';
  players: any;
  entry_fee: number;
  total_pool: number;
  result?: any;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  max_players: number;
  current_players: number;
  created_by: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export const useGameSessions = (gameType?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch game sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['game-sessions', gameType],
    queryFn: async () => {
      let query = supabase
        .from('game_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GameSession[];
    },
    enabled: !!user,
  });

  // Create game session
  const createSession = useMutation({
    mutationFn: async ({
      gameType,
      entryFee,
      maxPlayers = 4
    }: {
      gameType: 'ludo' | 'aviator' | 'casino' | 'color_prediction';
      entryFee: number;
      maxPlayers?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          game_type: gameType,
          entry_fee: entryFee,
          max_players: maxPlayers,
          current_players: 1,
          created_by: user.id,
          players: {
            user_ids: [user.id],
            user_data: [{
              id: user.id,
              name: user.user_metadata?.full_name || 'Player',
              joined_at: new Date().toISOString()
            }]
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-sessions'] });
      toast({
        title: "Game Created",
        description: "Your game session has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Join game session
  const joinSession = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First get the current session data
      const { data: session, error: fetchError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Check if user is already in the game
      const userIds = session.players?.user_ids || [];
      if (userIds.includes(user.id)) {
        throw new Error('You are already in this game');
      }

      // Check if game is full
      if (session.current_players >= session.max_players) {
        throw new Error('Game is full');
      }

      // Update players and current_players
      const updatedPlayers = {
        user_ids: [...userIds, user.id],
        user_data: [
          ...(session.players?.user_data || []),
          {
            id: user.id,
            name: user.user_metadata?.full_name || 'Player',
            joined_at: new Date().toISOString()
          }
        ]
      };

      const { data, error } = await supabase
        .from('game_sessions')
        .update({
          players: updatedPlayers,
          current_players: session.current_players + 1,
          total_pool: session.total_pool + session.entry_fee
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-sessions'] });
      toast({
        title: "Joined Game",
        description: "You've successfully joined the game!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join Game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update game session (for game progress)
  const updateSession = useMutation({
    mutationFn: async ({
      sessionId,
      updates
    }: {
      sessionId: string;
      updates: Partial<GameSession>;
    }) => {
      const { data, error } = await supabase
        .from('game_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-sessions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    isLoading,
    createSession: createSession.mutate,
    joinSession: joinSession.mutate,
    updateSession: updateSession.mutate,
    isCreating: createSession.isPending,
    isJoining: joinSession.isPending,
    isUpdating: updateSession.isPending,
  };
};
