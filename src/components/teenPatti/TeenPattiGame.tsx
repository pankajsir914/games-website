import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, EyeOff, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TeenPattiCard } from './TeenPattiCard';
import { BettingControls } from './BettingControls';

interface GamePlayer {
  id: string;
  user_id: string;
  seat_number: number;
  chips_in_game: number;
  cards: any[];
  is_blind: boolean;
  is_folded: boolean;
  is_seen: boolean;
  current_bet: number;
  total_bet_this_round: number;
  last_action: string;
  status: string;
  profiles: {
    full_name: string;
  };
}

interface TeenPattiGameData {
  id: string;
  current_pot: number;
  current_bet: number;
  current_player_turn: string;
  game_state: string;
  winner_id: string;
}

interface TeenPattiGameProps {
  gameId: string;
  onLeaveGame: () => void;
}

export function TeenPattiGame({ gameId, onLeaveGame }: TeenPattiGameProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [game, setGame] = useState<TeenPattiGameData | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCards, setShowCards] = useState(false);

  const currentPlayer = players.find(p => p.user_id === user?.id);
  const isMyTurn = game?.current_player_turn === user?.id;

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [gameId]);

  const fetchGameState = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager/game-state', {
        body: { gameId }
      });

      if (error) throw error;

      if (data.success) {
        setGame(data.game);
        setPlayers(data.players || []);
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async (betType: string, betAmount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager/place-bet', {
        body: {
          gameId,
          betType,
          betAmount
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        });
        fetchGameState();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place bet",
        variant: "destructive"
      });
    }
  };

  const toggleCardVisibility = () => {
    if (!showCards && currentPlayer && currentPlayer.is_blind) {
      // First time seeing cards
      setShowCards(true);
    } else {
      setShowCards(!showCards);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-4">Game not found</div>
          <Button onClick={onLeaveGame}>Back to Lobby</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={onLeaveGame}
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Leave Game
        </Button>

        <div className="text-center">
          <div className="text-white text-2xl font-bold">Teen Patti</div>
          <Badge variant={game.game_state === 'betting' ? 'default' : 'secondary'}>
            {game.game_state.toUpperCase()}
          </Badge>
        </div>

        <div className="text-right">
          <div className="text-gray-400 text-sm">Current Pot</div>
          <div className="text-yellow-400 text-xl font-bold flex items-center">
            <Coins className="mr-1 h-5 w-5" />
            ₹{game.current_pot}
          </div>
        </div>
      </div>

      {/* Game Table */}
      <div className="relative mx-auto max-w-4xl">
        {/* Center Pot Display */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <Card className="bg-gradient-to-br from-yellow-600 to-yellow-800 border-yellow-500">
            <CardContent className="p-4 text-center">
              <div className="text-yellow-100 text-sm font-medium">POT</div>
              <div className="text-white text-2xl font-bold">₹{game.current_pot}</div>
              {game.current_bet > 0 && (
                <div className="text-yellow-200 text-xs">Min Bet: ₹{game.current_bet}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Player Seats */}
        <div className="relative w-full h-96 bg-gradient-to-br from-green-800 to-green-900 rounded-full border-8 border-yellow-600">
          {players.map((player, index) => {
            const angle = (index * 360) / players.length;
            const x = 50 + 35 * Math.cos((angle - 90) * Math.PI / 180);
            const y = 50 + 35 * Math.sin((angle - 90) * Math.PI / 180);
            
            const isCurrentTurn = game.current_player_turn === player.user_id;
            const isMe = player.user_id === user?.id;

            return (
              <div
                key={player.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                  isCurrentTurn ? 'z-20' : 'z-10'
                }`}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <Card className={`bg-gray-800 border-gray-600 ${
                  isCurrentTurn ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/50' : ''
                } ${player.is_folded ? 'opacity-50' : ''}`}>
                  <CardContent className="p-3 text-center min-w-[120px]">
                    <div className="text-white text-sm font-medium mb-1">
                      {isMe ? 'You' : player.profiles?.full_name || 'Player'}
                    </div>
                    
                    <div className="text-green-400 text-xs mb-2">
                      ₹{player.chips_in_game}
                    </div>

                    {/* Player Cards */}
                    <div className="flex justify-center gap-1 mb-2">
                      {player.cards && player.cards.length > 0 ? (
                        isMe ? (
                          showCards ? (
                            player.cards.map((card: any, cardIndex: number) => (
                              <TeenPattiCard
                                key={cardIndex}
                                card={card}
                                size="small"
                                isVisible={true}
                              />
                            ))
                          ) : (
                            // Show card backs for own cards when not revealed
                            [...Array(3)].map((_, cardIndex) => (
                              <TeenPattiCard
                                key={cardIndex}
                                card={null}
                                size="small"
                                isVisible={false}
                              />
                            ))
                          )
                        ) : (
                          // Show card backs for other players
                          [...Array(3)].map((_, cardIndex) => (
                            <TeenPattiCard
                              key={cardIndex}
                              card={null}
                              size="small"
                              isVisible={false}
                            />
                          ))
                        )
                      ) : (
                        <div className="text-gray-500 text-xs">Waiting...</div>
                      )}
                    </div>

                    {/* Player Status */}
                    <div className="space-y-1">
                      {player.is_folded && (
                        <Badge variant="destructive" className="text-xs">Folded</Badge>
                      )}
                      {!player.is_folded && (
                        <>
                          <Badge variant={player.is_blind ? 'secondary' : 'default'} className="text-xs">
                            {player.is_blind ? 'Blind' : 'Seen'}
                          </Badge>
                          {player.current_bet > 0 && (
                            <div className="text-yellow-400 text-xs">
                              Bet: ₹{player.current_bet}
                            </div>
                          )}
                          {player.last_action && (
                            <div className="text-blue-400 text-xs capitalize">
                              {player.last_action}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Cards Section */}
      {currentPlayer && currentPlayer.cards && (
        <div className="mt-8 text-center">
          <div className="mb-4">
            <Button
              onClick={toggleCardVisibility}
              variant="outline"
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              {showCards ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showCards ? 'Hide Cards' : 'Show Cards'}
            </Button>
          </div>
          
          <div className="flex justify-center gap-4">
            {currentPlayer.cards.map((card: any, index: number) => (
              <TeenPattiCard
                key={index}
                card={showCards ? card : null}
                size="large"
                isVisible={showCards}
              />
            ))}
          </div>
        </div>
      )}

      {/* Betting Controls */}
      {game.game_state === 'betting' && !currentPlayer?.is_folded && (
        <div className="mt-8">
          <BettingControls
            isMyTurn={isMyTurn}
            currentBet={game.current_bet}
            isBlind={currentPlayer?.is_blind || false}
            isSeen={currentPlayer?.is_seen || false}
            onPlaceBet={placeBet}
            activePlayers={players.filter(p => !p.is_folded).length}
          />
        </div>
      )}

      {/* Game Status */}
      <div className="mt-6 text-center">
        {game.game_state === 'waiting' && (
          <div className="text-gray-400">Waiting for more players...</div>
        )}
        {game.game_state === 'dealing' && (
          <div className="text-blue-400">Dealing cards...</div>
        )}
        {game.game_state === 'betting' && (
          <div className="text-yellow-400">
            {isMyTurn ? "It's your turn!" : `Waiting for ${players.find(p => p.user_id === game.current_player_turn)?.profiles?.full_name || 'player'}`}
          </div>
        )}
        {game.game_state === 'showdown' && (
          <div className="text-purple-400">Showdown in progress...</div>
        )}
        {game.game_state === 'finished' && game.winner_id && (
          <div className="text-green-400">
            {game.winner_id === user?.id ? 'Congratulations! You won!' : 
             `${players.find(p => p.user_id === game.winner_id)?.profiles?.full_name || 'Player'} won the game!`}
          </div>
        )}
      </div>
    </div>
  );
}