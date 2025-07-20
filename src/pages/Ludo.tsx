import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import ImprovedLudoBoard from '@/components/ludo/ImprovedLudoBoard';
import GameHeader from '@/components/ludo/GameHeader';
import GameControls from '@/components/ludo/GameControls';
import WinnerModal from '@/components/ludo/WinnerModal';
import GameSetup from '@/components/ludo/GameSetup';
import { GameState, ActivePlayer, Token, Position } from '@/types/ludo';

const Ludo = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [withAI, setWithAI] = useState(false);
  
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

  const handleStartGame = (selectedPlayerCount: number, selectedWithAI: boolean) => {
    setPlayerCount(selectedPlayerCount);
    setWithAI(selectedWithAI);
    setGameStarted(true);
  };

  const rollDice = () => {
    if (!gameState.canRoll || gameState.isRolling) return;

    setGameState(prev => ({ ...prev, isRolling: true, canRoll: false }));

    // Simulate dice animation
    const rollAnimation = setInterval(() => {
      setGameState(prev => ({ ...prev, diceValue: Math.floor(Math.random() * 6) + 1 }));
    }, 100);

    setTimeout(() => {
      clearInterval(rollAnimation);
      const finalValue = Math.floor(Math.random() * 6) + 1;
      
      setGameState(prev => ({
        ...prev,
        diceValue: finalValue,
        isRolling: false,
        lastRoll: finalValue,
        consecutiveSixes: finalValue === 6 ? prev.consecutiveSixes + 1 : 0
      }));

      updateTokensAfterRoll(finalValue);
    }, 1000);
  };

  const updateTokensAfterRoll = (diceValue: number) => {
    const currentPlayerTokens = tokens[gameState.currentPlayer];
    const updatedTokens = { ...tokens };

    // Update which tokens can move
    updatedTokens[gameState.currentPlayer] = currentPlayerTokens.map(token => ({
      ...token,
      canMove: canTokenMove(token, diceValue)
    }));

    setTokens(updatedTokens);

    const movableTokens = updatedTokens[gameState.currentPlayer].filter(token => token.canMove);
    
    if (movableTokens.length === 0) {
      // No movable tokens, switch turn
      setTimeout(() => switchTurn(diceValue === 6), 1000);
    } else if (movableTokens.length === 1) {
      // Only one token can move, move it automatically
      setTimeout(() => moveToken(movableTokens[0].id, diceValue), 500);
    } else {
      // Multiple tokens can move, let player choose
      setGameState(prev => ({ ...prev, canRoll: false }));
    }
  };

  const canTokenMove = (token: Token, diceValue: number): boolean => {
    if (token.isHome) return false;
    
    if (token.position === 'base') {
      return diceValue === 6;
    }
    
    if (token.boardPosition !== null) {
      const newPosition = calculateNewPosition(token, diceValue);
      return newPosition !== null && newPosition <= getHomePosition(token.player as ActivePlayer);
    }
    
    return false;
  };

  const calculateNewPosition = (token: Token, diceValue: number): number | null => {
    if (token.boardPosition === null) return null;
    
    const homePosition = getHomePosition(token.player as ActivePlayer);
    const newPosition = token.boardPosition + diceValue;
    
    return newPosition <= homePosition ? newPosition : null;
  };

  const getHomePosition = (player: ActivePlayer): number => {
    // Each player has 51 positions to reach home (simplified)
    return 51;
  };

  const getStartPosition = (player: ActivePlayer): number => {
    const startPositions = { red: 1, yellow: 14 };
    return startPositions[player];
  };

  const moveToken = (tokenId: string, steps: number) => {
    const updatedTokens = { ...tokens };
    const player = gameState.currentPlayer;
    const tokenIndex = updatedTokens[player].findIndex(t => t.id === tokenId);
    const token = updatedTokens[player][tokenIndex];

    if (!token.canMove) return;

    if (token.position === 'base' && steps === 6) {
      // Move token from base to starting position
      updatedTokens[player][tokenIndex] = {
        ...token,
        position: 'board',
        boardPosition: getStartPosition(player),
        canMove: false
      };
    } else if (token.boardPosition !== null) {
      const newPosition = token.boardPosition + steps;
      const homePosition = getHomePosition(player);

      if (newPosition === homePosition) {
        // Token reaches home
        updatedTokens[player][tokenIndex] = {
          ...token,
          position: 'home',
          boardPosition: null,
          isHome: true,
          canMove: false
        };
      } else if (newPosition < homePosition) {
        // Normal move
        updatedTokens[player][tokenIndex] = {
          ...token,
          boardPosition: newPosition,
          canMove: false
        };

        // Check for kills
        checkForKills(updatedTokens, player, newPosition);
      }
    }

    // Clear all canMove flags
    Object.keys(updatedTokens).forEach(p => {
      updatedTokens[p as ActivePlayer] = updatedTokens[p as ActivePlayer].map(t => ({ ...t, canMove: false }));
    });

    setTokens(updatedTokens);

    // Check for winner
    const homeTokens = updatedTokens[player].filter(t => t.isHome).length;
    if (homeTokens === 4) {
      setGameState(prev => ({ ...prev, winner: player }));
      return;
    }

    // Switch turn or give another turn for 6
    const shouldGetAnotherTurn = gameState.lastRoll === 6 && gameState.consecutiveSixes < 3;
    setTimeout(() => switchTurn(shouldGetAnotherTurn), 500);
  };

  const checkForKills = (updatedTokens: Record<ActivePlayer, Token[]>, currentPlayer: ActivePlayer, position: number) => {
    const opponent: ActivePlayer = currentPlayer === 'red' ? 'yellow' : 'red';
    
    updatedTokens[opponent].forEach((token, index) => {
      if (token.boardPosition === position) {
        // Kill the opponent's token
        updatedTokens[opponent][index] = {
          ...token,
          position: 'base',
          boardPosition: null,
          canMove: false
        };
      }
    });
  };

  const switchTurn = (stayWithCurrentPlayer: boolean = false) => {
    if (!stayWithCurrentPlayer) {
      setGameState(prev => ({
        ...prev,
        currentPlayer: prev.currentPlayer === 'red' ? 'yellow' : 'red',
        canRoll: true,
        selectedToken: null,
        consecutiveSixes: 0
      }));
    } else {
      setGameState(prev => ({ ...prev, canRoll: true, selectedToken: null }));
    }
  };

  const resetGame = () => {
    setGameState({
      currentPlayer: 'red',
      diceValue: 1,
      isRolling: false,
      winner: null,
      canRoll: true,
      selectedToken: null,
      lastRoll: null,
      consecutiveSixes: 0
    });

    setTokens({
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
  };

  const selectToken = (tokenId: string) => {
    if (gameState.canRoll) return;
    
    const token = tokens[gameState.currentPlayer].find(t => t.id === tokenId);
    if (!token?.canMove) return;

    moveToken(tokenId, gameState.diceValue);
  };

  const handleBackToSetup = () => {
    setGameStarted(false);
    resetGame();
  };

  if (!gameStarted) {
    return <GameSetup onStartGame={handleStartGame} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-blue-300/20 to-indigo-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>

      <Navigation />
      
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-8 pt-16 md:pt-8 relative z-10">
        <GameHeader gameState={gameState} />
        
        <div className="max-w-6xl mx-auto">
          <ImprovedLudoBoard 
            tokens={tokens} 
            onTokenClick={selectToken}
            currentPlayer={gameState.currentPlayer}
            diceValue={gameState.diceValue}
            isRolling={gameState.isRolling}
          />
          
          <GameControls 
            gameState={gameState}
            onRollDice={rollDice}
            onResetGame={handleBackToSetup}
          />
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white/95 via-white/90 to-transparent backdrop-blur-lg border-t border-white/30 p-4 md:hidden shadow-2xl">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Current Player</div>
            <div className={`text-sm font-bold bg-gradient-to-r ${gameState.currentPlayer === 'red' ? 'from-red-500 to-red-600' : 'from-yellow-500 to-yellow-600'} bg-clip-text text-transparent`}>
              {gameState.currentPlayer.toUpperCase()}
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
          onPlayAgain={resetGame}
        />
      )}
    </div>
  );
};

export default Ludo;
