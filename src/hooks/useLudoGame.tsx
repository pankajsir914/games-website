import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
export interface LudoMatch {
  id: string;
  mode: '2p' | '4p';
  entryFee: number;
  status: 'created' | 'in_progress' | 'completed' | 'abandoned';
  winner?: string;
  botDifficulty: 'easy' | 'normal' | 'pro';
  createdAt: string;
  completedAt?: string;
}

export interface TokenData {
  id: string;
  position: number;
  isInHome: boolean;
  canMove: boolean;
}

export interface PlayerData {
  tokens: TokenData[];
  isBot: boolean;
  difficulty?: 'easy' | 'normal' | 'pro';
}

export interface GameState {
  players: Record<string, PlayerData>;
  currentPlayer: string;
  gamePhase: 'rolling' | 'moving' | 'completed';
  lastDiceRoll?: number;
  consecutiveSixes: number;
}

export interface LegalMove {
  tokenId: string;
  fromPosition: number;
  toPosition: number;
  isCapture: boolean;
  isHome: boolean;
}

export interface MatchHistory {
  id: string;
  mode: '2p' | '4p';
  entryFee: number;
  status: string;
  winner?: string;
  netTokens: number;
  createdAt: string;
  completedAt?: string;
}

export const useLudoGame = () => {
  const [currentMatch, setCurrentMatch] = useState<LudoMatch | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [lastDiceRoll, setLastDiceRoll] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('ludo_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const createMatch = useCallback(async (
    mode: '2p' | '4p', 
    entryFee: number, 
    botDifficulty: 'easy' | 'normal' | 'pro'
  ) => {
    setLoading(true);
    try {
      const maxPlayers = mode === '2p' ? 2 : 4;
      const { data, error } = await supabase.functions.invoke('ludo-game-manager', {
        body: {
          action: 'create_room',
          moveData: { maxPlayers, entryFee }
        }
      });

      if (error) throw error;
      if (!data?.room_id) throw new Error('Failed to create room');

      setCurrentMatch({
        id: data.room_id,
        mode,
        entryFee,
        status: 'created',
        botDifficulty,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Room joined',
        description: `${mode} game starting with ₹${entryFee} entry`,
      });

      return { success: true, matchId: data.room_id };
    } catch (error: any) {
      toast({
        title: 'Failed to create match',
        description: error.message ?? 'Please try again',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMatchState = useCallback(async (matchId: string) => {
    try {
      const response = await fetch(`/api/ludo/state/${matchId}`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get match state');
      }

      setGameState(data.board);
      setLastDiceRoll(data.diceHistory[data.diceHistory.length - 1] || null);
      
      // Set current match info
      setCurrentMatch(prev => ({
        ...prev!,
        status: data.status,
        winner: data.winner,
      }));

      return data;
    } catch (error: any) {
      toast({
        title: "Failed to get match state",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  const rollDice = useCallback(async (matchId: string, idempotencyKey: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ludo/roll', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ matchId, idempotencyKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to roll dice');
      }

      setLastDiceRoll(data.dice);
      setLegalMoves(data.legalMoves);

      toast({
        title: `Rolled ${data.dice}!`,
        description: data.legalMoves.length > 0 ? 'Choose a token to move' : 'No legal moves available',
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Failed to roll dice",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const makeMove = useCallback(async (
    matchId: string, 
    moveId: string, 
    stateHash: string, 
    idempotencyKey: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ludo/move', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ matchId, moveId, stateHash, idempotencyKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to make move');
      }

      setGameState(data.gameState);
      setLegalMoves([]);
      
      if (data.hasWon) {
        toast({
          title: "🎉 Congratulations!",
          description: "You won the match!",
        });
        
        setCurrentMatch(prev => ({
          ...prev!,
          status: 'completed',
          winner: 'P1',
        }));
      } else if (data.moveResult.isCapture) {
        toast({
          title: "Token Captured!",
          description: "You sent an opponent token back to base!",
        });
      }

      return data;
    } catch (error: any) {
      toast({
        title: "Failed to make move",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMatchHistory = useCallback(async (limit: number = 20): Promise<MatchHistory[]> => {
    try {
      const response = await fetch(`/api/ludo/history?limit=${limit}`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get match history');
      }

      return data;
    } catch (error: any) {
      toast({
        title: "Failed to get match history",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  }, []);

  return {
    currentMatch,
    gameState,
    legalMoves,
    lastDiceRoll,
    loading,
    createMatch,
    getMatchState,
    rollDice,
    makeMove,
    getMatchHistory,
  };
};