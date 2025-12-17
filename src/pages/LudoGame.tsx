import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import LudoLobby from '@/components/ludo/LudoLobby';
import PremiumLudoBoard from '@/components/ludo/PremiumLudoBoard';
import GameControlPanel from '@/components/ludo/GameControlPanel';
import GameSetupModal from '@/components/ludo/GameSetupModal';
import WinnerCelebration from '@/components/ludo/WinnerCelebration';
import { useLudoSounds } from '@/hooks/useLudoSounds';
import { useAuth } from '@/hooks/useAuth';
import { useLudoGame, GameState } from '@/hooks/useLudoGame';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins } from 'lucide-react';
import { Token, ActivePlayer, Player, TokenPosition } from '@/types/ludo';

export default function LudoGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { 
    currentMatch, 
    gameState, 
    legalMoves,
    lastDiceRoll,
    createMatch, 
    rollDice, 
    makeMove, 
    getMatchHistory,
    getMatchState,
    loading: gameLoading 
  } = useLudoGame();
  
  const [gameMode, setGameMode] = useState<'lobby' | 'game'>('lobby');
  const [showSetup, setShowSetup] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [playerCount, setPlayerCount] = useState<2 | 4>(2);
  const [entryFee, setEntryFee] = useState(100);
  const [isRolling, setIsRolling] = useState(false);
  const { isMuted, toggleMute, playDiceRoll, playTokenMove, playWin } = useLudoSounds();

  // Handle opening setup modal
  const handleJoinGame = async (gameId: string) => {
    setShowSetup(true);
  };

  // Handle getting match history
  const handleGetHistory = async (limit?: number) => {
    try {
      return await getMatchHistory(limit);
    } catch (error) {
      console.error('Failed to get match history:', error);
      return [];
    }
  };

  // Handle starting game from setup
  const handleStartGame = async (players: 2 | 4, fee: number) => {
    setPlayerCount(players);
    setEntryFee(fee);
    
    try {
      const mode = players === 2 ? '2p' : '4p';
      const result = await createMatch(mode as '2p' | '4p', fee, 'normal');
      if (result?.success) {
        setGameMode('game');
        setShowSetup(false);
        // Start polling for game state updates
        if (result.matchId) {
          await getMatchState(result.matchId);
        }
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  // Convert game state to tokens for display
  const getTokensFromGameState = (): Record<ActivePlayer, Token[]> => {
    if (!gameState?.tokens) {
      // Initialize default tokens for 2-player mode
      return {
        red: Array.from({ length: 4 }, (_, i) => ({
          id: `red-${i + 1}`,
          player: 'red' as Player,
          position: 'base' as TokenPosition,
          boardPosition: null,
          isHome: false,
          canMove: false
        })),
        yellow: Array.from({ length: 4 }, (_, i) => ({
          id: `yellow-${i + 1}`,
          player: 'yellow' as Player,
          position: 'base' as TokenPosition,
          boardPosition: null,
          isHome: false,
          canMove: false
        }))
      };
    }

    // Convert backend format to UI format - only red and yellow for 2-player mode
    const tokens: Record<ActivePlayer, Token[]> = {
      red: [],
      yellow: []
    };

    Object.entries(gameState.tokens).forEach(([color, colorTokens]) => {
      if ((color === 'red' || color === 'yellow') && Array.isArray(colorTokens)) {
        tokens[color as ActivePlayer] = colorTokens.map((token: any) => ({
          id: token.id,
          player: color as Player,
          position: token.isInHome ? 'home' : token.position === 0 ? 'base' : 'board',
          boardPosition: token.position === 0 ? null : token.position,
          canMove: token.canMove || false,
          isHome: token.isInHome || false
        }));
      }
    });

    return tokens;
  };

  // Get current game state info
  const getCurrentGameState = () => {
    if (!gameState) {
      return {
        currentPlayer: 'red' as ActivePlayer,
        diceValue: lastDiceRoll || 1,
        canRoll: true,
        isRolling: isRolling,
        consecutiveSixes: 0,
        winner: null as ActivePlayer | null,
        lastRoll: lastDiceRoll,
        selectedToken: null
      };
    }

    // Convert player IDs to ActivePlayer colors
    const getPlayerColor = (player: string): ActivePlayer => {
      if (player === 'red' || player === 'yellow') return player as ActivePlayer;
      return player === 'P1' ? 'red' : 'yellow';
    };

    const currentPlayer = getPlayerColor(gameState.currentPlayer);
    const winner = currentMatch?.winner 
      ? getPlayerColor(currentMatch.winner) 
      : null;

    return {
      currentPlayer,
      diceValue: lastDiceRoll || 1,
      canRoll: gameState.gamePhase === 'rolling',
      isRolling: isRolling,
      consecutiveSixes: gameState.consecutiveSixes || 0,
      winner,
      lastRoll: lastDiceRoll,
      selectedToken: null
    };
  };

  const handleTokenClick = async (tokenId: string) => {
    if (!currentMatch || !legalMoves) return;
    
    // Check if this token can move
    const canMove = legalMoves.some(move => move.tokenId === tokenId);
    if (canMove) {
      playTokenMove();
      await handleTokenMove(tokenId);
    }
  };

  const handleResetGame = () => {
    setGameMode('lobby');
    setShowWinner(false);
  };

  // Handle going back to lobby
  const handleBackToLobby = () => {
    setGameMode('lobby');
  };

  // Handle dice roll
  const handleRollDice = async () => {
    if (!currentMatch) return;
    
    try {
      await rollDice(currentMatch.id);
    } catch (error) {
      console.error('Failed to roll dice:', error);
    }
  };

  // Handle token move
  const handleTokenMove = async (tokenId: string) => {
    if (!currentMatch) return;
    
    try {
      await makeMove(currentMatch.id, tokenId);
    } catch (error) {
      console.error('Failed to make move:', error);
    }
  };

  // Show authentication screen if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">🎲 Ludo Game</h1>
              <p className="text-gray-300">Please login to play Ludo with real money!</p>
            </div>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Navigation />
      
      <div className="pt-20 px-4">
        {/* Header with user info */}
        <div className="max-w-6xl mx-auto mb-6">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {gameMode === 'game' && (
                    <Button
                      variant="outline"
                      onClick={handleBackToLobby}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Lobby
                    </Button>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">Welcome, {user?.user_metadata?.full_name || 'Player'}!</h2>
                    <div className="flex items-center gap-2 text-yellow-300">
                      <Coins className="w-4 h-4" />
                      <span className="font-semibold">₹{wallet?.current_balance || 0} tokens</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="bg-red-500/20 border-red-500/30 text-white hover:bg-red-500/30"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main game content */}
        <div className="max-w-6xl mx-auto">
          {gameMode === 'lobby' ? (
            <LudoLobby
              user={user}
              onJoinGame={handleJoinGame}
              onGetHistory={handleGetHistory}
              loading={gameLoading}
            />
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <PremiumLudoBoard
                  tokens={getTokensFromGameState()}
                  onTokenClick={handleTokenClick}
                  currentPlayer={getCurrentGameState().currentPlayer}
                  diceValue={getCurrentGameState().diceValue}
                  isRolling={isRolling}
                  onDiceClick={handleRollDice}
                  canRoll={getCurrentGameState().canRoll}
                />
              </div>
              
              <div className="lg:col-span-1">
                <GameControlPanel
                  gameState={getCurrentGameState()}
                  onResetGame={handleResetGame}
                  isMuted={isMuted}
                  onToggleMute={toggleMute}
                  playerCount={playerCount}
                  entryFee={entryFee}
                  onTimeUp={() => {}}
                />
              </div>
            </div>
          )}

          <GameSetupModal
            open={showSetup}
            onClose={() => setShowSetup(false)}
            onStartGame={handleStartGame}
            walletBalance={wallet?.current_balance || 0}
          />

          <WinnerCelebration
            winner={getCurrentGameState().winner}
            winAmount={entryFee * 2}
            onPlayAgain={handleResetGame}
            onBackToLobby={handleBackToLobby}
            isOpen={showWinner}
          />
        </div>
      </div>
    </div>
  );
}