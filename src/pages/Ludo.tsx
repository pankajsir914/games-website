
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import LudoBoard from '@/components/ludo/LudoBoard';
import GameHeader from '@/components/ludo/GameHeader';
import GameControls from '@/components/ludo/GameControls';
import WinnerModal from '@/components/ludo/WinnerModal';
import { GameState, Player, Token, Position } from '@/types/ludo';

const Ludo = () => {
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

  const [tokens, setTokens] = useState<Record<Player, Token[]>>({
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
      return newPosition !== null && newPosition <= getHomePosition(token.player);
    }
    
    return false;
  };

  const calculateNewPosition = (token: Token, diceValue: number): number | null => {
    if (token.boardPosition === null) return null;
    
    const homePosition = getHomePosition(token.player);
    const newPosition = token.boardPosition + diceValue;
    
    return newPosition <= homePosition ? newPosition : null;
  };

  const getHomePosition = (player: Player): number => {
    // Each player has 51 positions to reach home (simplified)
    return 51;
  };

  const getStartPosition = (player: Player): number => {
    const startPositions = { red: 1, yellow: 14, green: 27, blue: 40 };
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
      updatedTokens[p as Player] = updatedTokens[p as Player].map(t => ({ ...t, canMove: false }));
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

  const checkForKills = (updatedTokens: Record<Player, Token[]>, currentPlayer: Player, position: number) => {
    const opponent: Player = currentPlayer === 'red' ? 'yellow' : 'red';
    
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <GameHeader gameState={gameState} />
        
        <div className="max-w-4xl mx-auto">
          <LudoBoard 
            tokens={tokens} 
            onTokenClick={selectToken}
            currentPlayer={gameState.currentPlayer}
          />
          
          <GameControls 
            gameState={gameState}
            onRollDice={rollDice}
            onResetGame={resetGame}
          />
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
