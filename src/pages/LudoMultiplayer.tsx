import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import GameHeader from '@/components/ludo/GameHeader';
import ImprovedLudoBoard from '@/components/ludo/ImprovedLudoBoard';
import GameControls from '@/components/ludo/GameControls';
import WinnerModal from '@/components/ludo/WinnerModal';
import LudoLobby from '@/components/ludo/LudoLobby';
import { ActivePlayer, GameState, Token } from '@/types/ludo';
import { useLudoBackend } from '@/hooks/useLudoBackend';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users, Wifi, WifiOff, Clock, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LudoMultiplayer = () => {
  const { user } = useAuth();
  const { 
    currentRoom, 
    playerSession, 
    roomMoves, 
    isLoading,
    error,
    rollDice,
    moveToken,
    forfeitGame,
    clearRoom
  } = useLudoBackend();

  const [gameState, setGameState] = useState<GameState>({
    currentPlayer: 'red',
    diceValue: 1,
    isRolling: false,
    winner: null,
    canRoll: true,
    selectedToken: null,
    lastRoll: null,
    consecutiveSixes: 0
  });

  const [tokens, setTokens] = useState<Record<ActivePlayer, Token[]>>({
    red: Array.from({ length: 4 }, (_, i) => ({
      id: `red-${i}`,
      player: 'red',
      position: 'base',
      boardPosition: null,
      isHome: false,
      canMove: false
    })),
    yellow: Array.from({ length: 4 }, (_, i) => ({
      id: `yellow-${i}`,
      player: 'yellow',
      position: 'base',
      boardPosition: null,
      isHome: false,
      canMove: false
    }))
  });

  const [showLobby, setShowLobby] = useState(true);

  // Update game state from backend
  useEffect(() => {
    if (currentRoom?.game_state) {
      const backendGameState = currentRoom.game_state;
      setGameState(backendGameState);
      
      if (backendGameState.tokens) {
        setTokens(backendGameState.tokens);
      }
    }
  }, [currentRoom]);

  // Hide lobby when joining a room
  const handleJoinRoom = (roomId: string) => {
    setShowLobby(false);
  };

  // Handle dice roll
  const handleRollDice = async () => {
    if (!currentRoom || !user) return;

    try {
      setGameState(prev => ({ ...prev, isRolling: true, canRoll: false }));
      
      const result = await rollDice(currentRoom.id);
      
      if (result.success) {
        // Game state will be updated via real-time subscription
        toast({
          title: "Dice Rolled",
          description: `You rolled a ${result.diceValue}!`,
        });
      }
    } catch (error) {
      setGameState(prev => ({ ...prev, isRolling: false, canRoll: true }));
    }
  };

  // Handle token move
  const handleTokenMove = async (tokenId: string) => {
    if (!currentRoom || !user || !gameState.diceValue) return;

    const token = tokens[gameState.currentPlayer].find(t => t.id === tokenId);
    if (!token?.canMove) return;

    try {
      const targetPosition = calculateTargetPosition(token, gameState.diceValue);
      if (targetPosition === null) return;

      const result = await moveToken(currentRoom.id, tokenId, targetPosition);
      
      if (result.success) {
        if (result.killedToken) {
          toast({
            title: "Token Killed!",
            description: "You sent an opponent's token back to base!",
          });
        }
        
        if (result.hasWon) {
          toast({
            title: "🎉 Congratulations!",
            description: "You won the game!",
          });
        }
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  // Calculate target position for a token move
  const calculateTargetPosition = (token: Token, diceValue: number): number | null => {
    if (token.position === 'base') {
      const startPositions = { red: 1, yellow: 14, blue: 27, green: 40 };
      return startPositions[token.player as keyof typeof startPositions] || 1;
    }
    
    if (token.boardPosition !== null) {
      return token.boardPosition + diceValue;
    }
    
    return null;
  };

  // Handle forfeit
  const handleForfeit = async () => {
    if (!currentRoom) return;

    try {
      await forfeitGame(currentRoom.id);
      handleBackToLobby();
    } catch (error) {
      // Error handled in hook
    }
  };

  // Back to lobby
  const handleBackToLobby = () => {
    clearRoom();
    setShowLobby(true);
  };

  // Get player color for current user
  const getMyPlayerColor = (): ActivePlayer => {
    if (!playerSession) return 'red';
    return playerSession.player_color as ActivePlayer;
  };

  // Check if it's current user's turn
  const isMyTurn = (): boolean => {
    if (!playerSession || !currentRoom?.game_state) return false;
    return playerSession.player_position === currentRoom.game_state.currentPlayer;
  };

  // Get connection status badge
  const getConnectionStatus = () => {
    if (!currentRoom) return null;
    
    const onlinePlayers = currentRoom.ludo_player_sessions?.filter(p => p.is_online).length || 0;
    const totalPlayers = currentRoom.current_players;
    
    return (
      <Badge variant={onlinePlayers === totalPlayers ? "default" : "destructive"} className="flex items-center gap-1">
        {onlinePlayers === totalPlayers ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {onlinePlayers}/{totalPlayers} Online
      </Badge>
    );
  };

  // Show authentication required message
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to play multiplayer Ludo with real money.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show lobby
  if (showLobby || !currentRoom) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16">
          <LudoLobby onJoinRoom={handleJoinRoom} />
        </div>
      </div>
    );
  }

  // Show game
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-blue-300/20 to-indigo-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>

      <Navigation />
      
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-8 pt-16 md:pt-8 relative z-10">
        {/* Game Header with Room Info */}
        <div className="mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBackToLobby}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lobby
            </Button>
            
            {getConnectionStatus()}
          </div>
          
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Room ID</div>
                  <div className="font-mono text-sm">#{currentRoom.id.slice(-8)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Entry Fee</div>
                  <div className="font-bold text-primary">₹{currentRoom.entry_fee}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Pot</div>
                  <div className="font-bold text-green-500">₹{currentRoom.total_pot}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Your Color</div>
                  <div className={`font-bold ${getMyPlayerColor() === 'red' ? 'text-red-500' : 'text-yellow-500'}`}>
                    {getMyPlayerColor().toUpperCase()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <GameHeader gameState={gameState} />
        
        <div className="max-w-6xl mx-auto">
          <ImprovedLudoBoard 
            tokens={tokens} 
            onTokenClick={handleTokenMove}
            currentPlayer={gameState.currentPlayer}
            diceValue={gameState.diceValue}
            isRolling={gameState.isRolling}
          />
          
          <div className="mt-6 space-y-4">
            {/* Turn Indicator */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4 text-center">
                {isMyTurn() ? (
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-primary">Your Turn!</div>
                    {gameState.canRoll ? (
                      <Button 
                        onClick={handleRollDice}
                        disabled={isLoading || gameState.isRolling}
                        size="lg"
                        className="w-full max-w-xs"
                      >
                        {gameState.isRolling ? 'Rolling...' : 'Roll Dice'}
                      </Button>
                    ) : (
                      <div className="text-muted-foreground">
                        Choose a token to move (Dice: {gameState.diceValue})
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-lg text-muted-foreground">
                      Waiting for other players...
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Current player: Player {gameState.currentPlayer}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Actions */}
            <div className="flex justify-center gap-4">
              <Button
                variant="destructive"
                onClick={handleForfeit}
                disabled={isLoading}
              >
                Forfeit Game
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white/95 via-white/90 to-transparent backdrop-blur-lg border-t border-white/30 p-4 md:hidden shadow-2xl">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Current Player</div>
            <div className={`text-sm font-bold ${isMyTurn() ? 'text-primary' : 'text-muted-foreground'}`}>
              {isMyTurn() ? 'YOUR TURN' : `PLAYER ${gameState.currentPlayer}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Dice</div>
              <div className="text-lg font-bold text-primary">{gameState.diceValue}</div>
            </div>
          </div>
        </div>
      </div>

      {gameState.winner && (
        <WinnerModal 
          winner={gameState.winner}
          onPlayAgain={handleBackToLobby}
        />
      )}
    </div>
  );
};

export default LudoMultiplayer;