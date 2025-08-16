import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, EyeOff, Coins, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TeenPattiCard } from './TeenPattiCard';
import { BettingControls } from './BettingControls';

interface TeenPattiGameState {
  playerCards: any[];
  systemCards: any[];
  currentPot: number;
  currentBet: number;
  minBet: number;
  maxBet: number;
  difficulty: string;
  phase: string;
  playerTurn: boolean;
  playerChips: number;
  systemChips: number;
  winner?: string;
  playerHandRank?: string;
  systemHandRank?: string;
}

interface TeenPattiGameProps {
  gameId: string;
  onLeaveGame: () => void;
}

export function TeenPattiGame({ gameId, onLeaveGame }: TeenPattiGameProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<TeenPattiGameState | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('active');
  const [loading, setLoading] = useState(true);
  const [showPlayerCards, setShowPlayerCards] = useState(false);
  const [showSystemCards, setShowSystemCards] = useState(false);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [gameId]);

  const fetchGameState = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager', {
        body: { action: 'get-game-state', gameId }
      });

      if (error) throw error;

      if (data.success) {
        setGameState(data.game);
        setGameStatus(data.status);
        
        // Show system cards if game is finished
        if (data.game?.phase === 'finished') {
          setShowSystemCards(true);
        }
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async (betType: string, betAmount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager', {
        body: {
          action: 'place-bet',
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
        setGameState(data.gameState);
        
        // Show system cards if game ended
        if (data.gameState?.phase === 'finished') {
          setShowSystemCards(true);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place bet",
        variant: "destructive"
      });
    }
  };

  const togglePlayerCards = () => {
    setShowPlayerCards(!showPlayerCards);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading game...</div>
      </div>
    );
  }

  if (!gameState) {
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
          <div className="text-white text-2xl font-bold">Teen Patti vs System</div>
          <Badge variant={gameState.phase === 'betting' ? 'default' : gameState.phase === 'finished' ? 'destructive' : 'secondary'}>
            {gameState.phase.toUpperCase()}
          </Badge>
        </div>

        <div className="text-right">
          <div className="text-gray-400 text-sm">Current Pot</div>
          <div className="text-yellow-400 text-xl font-bold flex items-center">
            <Coins className="mr-1 h-5 w-5" />
            ₹{gameState.currentPot}
          </div>
        </div>
      </div>

      {/* Game Table */}
      <div className="relative mx-auto max-w-6xl">
        {/* Center Pot Display */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <Card className="bg-gradient-to-br from-yellow-600 to-yellow-800 border-yellow-500">
            <CardContent className="p-4 text-center">
              <div className="text-yellow-100 text-sm font-medium">POT</div>
              <div className="text-white text-2xl font-bold">₹{gameState.currentPot}</div>
              <div className="text-yellow-200 text-xs">Min Bet: ₹{gameState.minBet}</div>
              <div className="text-yellow-200 text-xs">Max Bet: ₹{gameState.maxBet}</div>
            </CardContent>
          </Card>
        </div>

        {/* Game Board */}
        <div className="relative w-full h-96 bg-gradient-to-br from-green-800 to-green-900 rounded-lg border-8 border-yellow-600">
          {/* System Player (Top) */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <Card className={`bg-gray-800 border-gray-600 ${!gameState.playerTurn ? 'ring-4 ring-red-400 shadow-lg shadow-red-400/50' : ''}`}>
              <CardContent className="p-4 text-center min-w-[180px]">
                <div className="text-white text-lg font-bold mb-2 flex items-center justify-center">
                  <Bot className="mr-2 h-5 w-5" />
                  System ({gameState.difficulty})
                </div>
                
                <div className="text-green-400 text-sm mb-3">
                  Chips: ₹{gameState.systemChips}
                </div>

                {/* System Cards */}
                <div className="flex justify-center gap-2 mb-3">
                  {gameState.systemCards?.map((card: any, index: number) => (
                    <TeenPattiCard
                      key={index}
                      card={showSystemCards ? card : null}
                      size="medium"
                      isVisible={showSystemCards}
                    />
                  ))}
                </div>

                {/* System Status */}
                {gameState.phase === 'finished' && gameState.systemHandRank && (
                  <Badge variant="outline" className="text-xs">
                    {gameState.systemHandRank.replace('_', ' ')}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Player (Bottom) */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <Card className={`bg-gray-800 border-gray-600 ${gameState.playerTurn ? 'ring-4 ring-blue-400 shadow-lg shadow-blue-400/50' : ''}`}>
              <CardContent className="p-4 text-center min-w-[180px]">
                <div className="text-white text-lg font-bold mb-2">
                  You
                </div>
                
                <div className="text-green-400 text-sm mb-3">
                  Chips: ₹{gameState.playerChips}
                </div>

                {/* Player Cards */}
                <div className="flex justify-center gap-2 mb-3">
                  {gameState.playerCards?.map((card: any, index: number) => (
                    <TeenPattiCard
                      key={index}
                      card={showPlayerCards ? card : null}
                      size="medium"
                      isVisible={showPlayerCards}
                    />
                  ))}
                </div>

                {/* Player Status */}
                {gameState.phase === 'finished' && gameState.playerHandRank && (
                  <Badge variant="outline" className="text-xs">
                    {gameState.playerHandRank.replace('_', ' ')}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Card Controls */}
      <div className="mt-8 text-center">
        <div className="flex justify-center gap-4">
          <Button
            onClick={togglePlayerCards}
            variant="outline"
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            {showPlayerCards ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showPlayerCards ? 'Hide My Cards' : 'Show My Cards'}
          </Button>
          
          {gameState.phase === 'finished' && (
            <Button
              onClick={() => setShowSystemCards(!showSystemCards)}
              variant="outline"
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              {showSystemCards ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showSystemCards ? 'Hide System Cards' : 'Show System Cards'}
            </Button>
          )}
        </div>
      </div>

      {/* Betting Controls */}
      {gameState.phase === 'betting' && gameState.playerTurn && (
        <div className="mt-8">
          <BettingControls
            isMyTurn={true}
            currentBet={gameState.currentBet}
            isBlind={!showPlayerCards}
            isSeen={showPlayerCards}
            onPlaceBet={placeBet}
            activePlayers={2}
            minBet={gameState.minBet}
            maxBet={gameState.maxBet}
          />
        </div>
      )}

      {/* Game Status */}
      <div className="mt-6 text-center">
        {gameState.phase === 'betting' && (
          <div className="text-yellow-400 text-lg">
            {gameState.playerTurn ? "Your turn! Place your bet or fold." : "System is thinking..."}
          </div>
        )}
        {gameState.phase === 'finished' && (
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${
              gameState.winner === 'player' ? 'text-green-400' : 
              gameState.winner === 'system' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {gameState.winner === 'player' ? 'Congratulations! You Won!' : 
               gameState.winner === 'system' ? 'System Won!' : 'It\'s a Tie!'}
            </div>
            {gameState.playerHandRank && gameState.systemHandRank && (
              <div className="text-gray-300">
                Your hand: {gameState.playerHandRank.replace('_', ' ')} vs System: {gameState.systemHandRank.replace('_', ' ')}
              </div>
            )}
            <Button 
              onClick={onLeaveGame}
              className="mt-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}