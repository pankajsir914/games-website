
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayingCard } from './PlayingCard';
import { GameTimer } from './GameTimer';
import { PlayerInfo } from './PlayerInfo';
import { RummyGameLogic } from '@/utils/rummyGameLogic';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Users, ArrowLeft, Flag } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface RummyGameTableProps {
  sessionId: string;
  onLeaveGame: () => void;
}

interface Player {
  id: string;
  name: string;
  cards: any[];
  hasDropped: boolean;
  hasDeclared: boolean;
}

interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: any[];
  discardPile: any[];
  gamePhase: 'waiting' | 'playing' | 'finished';
  turnTimeLeft: number;
}

export const RummyGameTable: React.FC<RummyGameTableProps> = ({ sessionId, onLeaveGame }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [session, setSession] = useState<any>(null);
  const [playerCards, setPlayerCards] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [gameLogic] = useState(() => new RummyGameLogic());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionData();
    
    // Subscribe to real-time game updates
    const channel = supabase
      .channel(`game-${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rummy_sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        handleGameUpdate(payload.new);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rummy_moves'
      }, (payload) => {
        handleMoveUpdate(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const { data, error } = await supabase
        .from('rummy_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);

      // Initialize game if it's active and has game state
      if (data.status === 'active' && data.game_state) {
        const typedGameState = data.game_state as GameState;
        setGameState(typedGameState);
        // Find current player's cards
        const currentPlayer = typedGameState.players.find((p: Player) => p.id === user?.id);
        if (currentPlayer) {
          setPlayerCards(currentPlayer.cards);
        }
      } else if (data.status === 'waiting') {
        // Initialize game for first time
        initializeGame(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading game",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeGame = async (sessionData: any) => {
    if (sessionData.current_players < 2) return;

    try {
      // Initialize deck and deal cards
      const deck = gameLogic.createDeck();
      const shuffledDeck = gameLogic.shuffleDeck(deck);
      
      const playersData = sessionData.players as { user_data: Array<{ id: string; name: string }> };
      const players = playersData.user_data.map((player: any, index: number) => ({
        id: player.id,
        name: player.name,
        cards: gameLogic.dealCards(shuffledDeck, 13),
        hasDropped: false,
        hasDeclared: false
      }));

      const remainingDeck = shuffledDeck.slice(players.length * 13);
      const discardPile = [remainingDeck.pop()];

      const initialGameState: GameState = {
        players,
        currentPlayerIndex: 0,
        deck: remainingDeck,
        discardPile,
        gamePhase: 'playing',
        turnTimeLeft: 45
      };

      // Update session with game state
      const { error } = await supabase
        .from('rummy_sessions')
        .update({
          game_state: initialGameState as unknown as Json,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      setGameState(initialGameState);
      const currentPlayer = players.find((p: Player) => p.id === user?.id);
      if (currentPlayer) {
        setPlayerCards(currentPlayer.cards);
      }
    } catch (error: any) {
      toast({
        title: "Error starting game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGameUpdate = (updatedSession: any) => {
    setSession(updatedSession);
    if (updatedSession.game_state) {
      const typedGameState = updatedSession.game_state as GameState;
      setGameState(typedGameState);
      const currentPlayer = typedGameState.players.find((p: Player) => p.id === user?.id);
      if (currentPlayer) {
        setPlayerCards(currentPlayer.cards);
      }
    }
  };

  const handleMoveUpdate = (move: any) => {
    // Handle real-time move updates
    console.log('Move update:', move);
  };

  const handleCardClick = (cardId: string) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  };

  const handlePickFromDeck = async () => {
    if (!gameState || !user) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== user.id) {
      toast({
        title: "Not your turn",
        description: "Please wait for your turn",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('rummy_moves')
        .insert([{
          session_id: sessionId,
          player_id: user.id,
          move_type: 'pick_from_deck',
          card_data: { cardId: gameState.deck[0]?.id }
        }]);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error making move",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePickFromDiscard = async () => {
    if (!gameState || !user) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== user.id) {
      toast({
        title: "Not your turn",
        description: "Please wait for your turn",
        variant: "destructive",
      });
      return;
    }

    try {
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      const { error } = await supabase
        .from('rummy_moves')
        .insert([{
          session_id: sessionId,
          player_id: user.id,
          move_type: 'pick_from_discard',
          card_data: { cardId: topCard.id }
        }]);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error making move",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDiscard = async (cardId: string) => {
    if (!gameState || !user) return;

    try {
      const { error } = await supabase
        .from('rummy_moves')
        .insert([{
          session_id: sessionId,
          player_id: user.id,
          move_type: 'discard',
          card_data: { cardId }
        }]);

      if (error) throw error;
      setSelectedCards([]);
    } catch (error: any) {
      toast({
        title: "Error discarding card",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeclare = async () => {
    if (!gameState || !user) return;

    const isValidDeclare = gameLogic.validateHand(playerCards);
    if (!isValidDeclare) {
      toast({
        title: "Invalid declaration",
        description: "You need at least 2 sequences with one pure sequence",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('rummy_moves')
        .insert([{
          session_id: sessionId,
          player_id: user.id,
          move_type: 'declare',
          card_data: { cards: playerCards }
        }]);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error declaring",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session || !gameState) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="py-12 text-center">
          <p className="text-white">Waiting for game to start...</p>
          <Button onClick={onLeaveGame} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lobby
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === user?.id;

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={onLeaveGame} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Leave Game
              </Button>
              <Badge className="bg-green-600">
                {session.game_type.charAt(0).toUpperCase() + session.game_type.slice(1)} Rummy
              </Badge>
              <div className="text-white">
                Prize Pool: ₹{session.prize_pool}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <GameTimer timeLeft={gameState.turnTimeLeft} isActive={isMyTurn} />
              {isMyTurn && (
                <Badge className="bg-blue-600 animate-pulse">Your Turn</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {gameState.players.map((player, index) => (
          <PlayerInfo
            key={player.id}
            player={player}
            isCurrentPlayer={index === gameState.currentPlayerIndex}
            isMe={player.id === user?.id}
          />
        ))}
      </div>

      {/* Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draw and Discard Piles */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4">Draw Cards</h3>
            <div className="flex space-x-4">
              <div className="text-center">
                <div 
                  className="w-16 h-24 bg-blue-900 border-2 border-white/20 rounded-lg cursor-pointer hover:bg-blue-800 flex items-center justify-center"
                  onClick={handlePickFromDeck}
                >
                  <span className="text-white text-xs">DECK</span>
                </div>
                <p className="text-white/80 text-xs mt-2">Draw from deck</p>
              </div>
              
              <div className="text-center">
                {gameState.discardPile.length > 0 && (
                  <div onClick={handlePickFromDiscard} className="cursor-pointer">
                    <PlayingCard 
                      card={gameState.discardPile[gameState.discardPile.length - 1]} 
                      isSelected={false}
                      onClick={() => {}}
                    />
                  </div>
                )}
                <p className="text-white/80 text-xs mt-2">Pick from discard</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player's Hand */}
        <div className="lg:col-span-2">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Your Cards</h3>
                <div className="flex space-x-2">
                  {selectedCards.length > 0 && (
                    <Button
                      onClick={() => handleDiscard(selectedCards[0])}
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-400"
                    >
                      Discard Selected
                    </Button>
                  )}
                  <Button
                    onClick={handleDeclare}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Declare
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {playerCards.map((card) => (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    isSelected={selectedCards.includes(card.id)}
                    onClick={() => handleCardClick(card.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
