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
import { useLudoGame } from '@/hooks/useLudoGame';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins } from 'lucide-react';
import { GameState, Token, ActivePlayer } from '@/types/ludo';

export default function LudoGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { 
    currentMatch, 
    gameState, 
    createMatch, 
    rollDice, 
    makeMove, 
    getMatchHistory,
    loading: gameLoading 
  } = useLudoGame();
  
  const [gameMode, setGameMode] = useState<'lobby' | 'game'>('lobby');
  const [showSetup, setShowSetup] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [playerCount, setPlayerCount] = useState<2 | 4>(2);
  const [entryFee, setEntryFee] = useState(100);
  const { isMuted, toggleMute, playDiceRoll, playTokenMove, playWin } = useLudoSounds();
  // Mock game state for the demo board
  const [mockGameState, setMockGameState] = useState<GameState>({
    currentPlayer: 'red' as ActivePlayer,
    diceValue: 1,
    canRoll: true,
    isRolling: false,
    consecutiveSixes: 0,
    winner: null,
    lastRoll: null,
    selectedToken: null
  });

  // Mock tokens for the demo board
  const [mockTokens, setMockTokens] = useState<Record<ActivePlayer, Token[]>>({
    red: [
      { id: 'red-1', player: 'red', position: 'base', boardPosition: null, canMove: false, isHome: false },
      { id: 'red-2', player: 'red', position: 'base', boardPosition: null, canMove: false, isHome: false },
      { id: 'red-3', player: 'red', position: 'base', boardPosition: null, canMove: false, isHome: false },
      { id: 'red-4', player: 'red', position: 'base', boardPosition: null, canMove: false, isHome: false }
    ],
    yellow: [
      { id: 'yellow-1', player: 'yellow', position: 'base', boardPosition: null, canMove: false, isHome: false },
      { id: 'yellow-2', player: 'yellow', position: 'base', boardPosition: null, canMove: false, isHome: false },
      { id: 'yellow-3', player: 'yellow', position: 'base', boardPosition: null, canMove: false, isHome: false },
      { id: 'yellow-4', player: 'yellow', position: 'base', boardPosition: null, canMove: false, isHome: false }
    ]
  });

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
  const handleStartGame = (players: 2 | 4, fee: number) => {
    setPlayerCount(players);
    setEntryFee(fee);
    setGameMode('game');
    setShowSetup(false);
  };

  // Enhanced game functions with sound
  const handleMockRollDice = () => {
    playDiceRoll();
    setMockGameState(prev => ({
      ...prev,
      isRolling: true,
      canRoll: false
    }));

    setTimeout(() => {
      const newDiceValue = Math.floor(Math.random() * 6) + 1;
      setMockGameState(prev => ({
        ...prev,
        diceValue: newDiceValue,
        isRolling: false,
        canRoll: false,
        lastRoll: newDiceValue,
        consecutiveSixes: newDiceValue === 6 ? prev.consecutiveSixes + 1 : 0
      }));

      if (newDiceValue === 6) {
        setMockTokens(prev => ({
          ...prev,
          [mockGameState.currentPlayer]: prev[mockGameState.currentPlayer].map(token => ({
            ...token,
            canMove: true
          }))
        }));
      }
    }, 1000);
  };

  const handleMockResetGame = () => {
    setMockGameState({
      currentPlayer: 'red' as ActivePlayer,
      diceValue: 1,
      canRoll: true,
      isRolling: false,
      consecutiveSixes: 0,
      winner: null,
      lastRoll: null,
      selectedToken: null
    });
    
    setMockTokens({
      red: [
        { id: 'red-1', player: 'red', position: 'base', boardPosition: null, canMove: false, isHome: false },
        { id: 'red-2', player: 'red', position: 'base', boardPosition: null, canMove: false, isHome: false },
        { id: 'red-3', player: 'red', position: 'base', boardPosition: null, canMove: false, isHome: false },
        { id: 'red-4', player: 'red', position: 'base', boardPosition: null, canMove: false, isHome: false }
      ],
      yellow: [
        { id: 'yellow-1', player: 'yellow', position: 'base', boardPosition: null, canMove: false, isHome: false },
        { id: 'yellow-2', player: 'yellow', position: 'base', boardPosition: null, canMove: false, isHome: false },
        { id: 'yellow-3', player: 'yellow', position: 'base', boardPosition: null, canMove: false, isHome: false },
        { id: 'yellow-4', player: 'yellow', position: 'base', boardPosition: null, canMove: false, isHome: false }
      ]
    });
  };

  const handleTokenClick = (tokenId: string) => {
    const token = Object.values(mockTokens).flat().find(t => t.id === tokenId);
    if (token && token.canMove) {
      // Mock token movement logic
      setMockTokens(prev => {
        const updated = { ...prev };
        const playerTokens = updated[token.player as ActivePlayer];
        const tokenIndex = playerTokens.findIndex(t => t.id === tokenId);
        
        if (tokenIndex !== -1) {
          const newToken = { ...playerTokens[tokenIndex] };
          
          if (newToken.position === 'base' && mockGameState.diceValue === 6) {
            // Move token from base to starting position
            newToken.position = 'board';
            newToken.boardPosition = 1;
          } else if (newToken.position === 'board' && newToken.boardPosition !== null) {
            // Move token forward
            const newPosition = newToken.boardPosition + mockGameState.diceValue;
            if (newPosition >= 57) {
              newToken.position = 'home';
              newToken.isHome = true;
              newToken.boardPosition = null;
            } else {
              newToken.boardPosition = newPosition;
            }
          }
          
          newToken.canMove = false;
          updated[token.player as ActivePlayer][tokenIndex] = newToken;
        }
        
        return updated;
      });

      // Switch turns (unless it was a 6)
      if (mockGameState.diceValue !== 6) {
        setMockGameState(prev => ({
          ...prev,
          currentPlayer: prev.currentPlayer === 'red' ? 'yellow' : 'red',
          canRoll: true,
          consecutiveSixes: 0
        }));
      } else {
        setMockGameState(prev => ({
          ...prev,
          canRoll: true
        }));
      }
    }
  };

  // Handle going back to lobby
  const handleBackToLobby = () => {
    setGameMode('lobby');
  };

  // Handle dice roll
  const handleRollDice = async () => {
    if (!currentMatch) return;
    
    try {
      const idempotencyKey = `roll_${Date.now()}_${Math.random()}`;
      await rollDice(currentMatch.id, idempotencyKey);
    } catch (error) {
      console.error('Failed to roll dice:', error);
    }
  };

  // Handle token move
  const handleTokenMove = async (moveId: string, stateHash: string) => {
    if (!currentMatch) return;
    
    try {
      const idempotencyKey = `move_${Date.now()}_${Math.random()}`;
      await makeMove(currentMatch.id, moveId, stateHash, idempotencyKey);
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
                  tokens={mockTokens}
                  onTokenClick={handleTokenClick}
                  currentPlayer={mockGameState.currentPlayer}
                  diceValue={mockGameState.diceValue}
                  isRolling={mockGameState.isRolling}
                  onDiceClick={handleMockRollDice}
                  canRoll={mockGameState.canRoll}
                />
              </div>
              
              <div className="lg:col-span-1">
                <GameControlPanel
                  gameState={mockGameState}
                  onResetGame={handleMockResetGame}
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
            winner={mockGameState.winner}
            winAmount={entryFee * 2}
            onPlayAgain={handleMockResetGame}
            onBackToLobby={handleBackToLobby}
            isOpen={showWinner}
          />
        </div>
      </div>
    </div>
  );
}