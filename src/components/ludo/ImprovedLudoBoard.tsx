
import React from 'react';
import { Token, ActivePlayer } from '@/types/ludo';
import TokenComponent from './TokenComponent';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

interface ImprovedLudoBoardProps {
  tokens: Record<ActivePlayer, Token[]>;
  onTokenClick: (tokenId: string) => void;
  currentPlayer: ActivePlayer;
  diceValue: number;
  isRolling: boolean;
}

const ImprovedLudoBoard: React.FC<ImprovedLudoBoardProps> = ({ 
  tokens, 
  onTokenClick, 
  currentPlayer,
  diceValue,
  isRolling 
}) => {
  const getDiceIcon = (value: number) => {
    const icons = { 1: Dice1, 2: Dice2, 3: Dice3, 4: Dice4, 5: Dice5, 6: Dice6 };
    const Icon = icons[value as keyof typeof icons] || Dice1;
    return <Icon className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-lg" />;
  };

  const getBoardPosition = (player: ActivePlayer, tokenIndex: number): { x: number; y: number } => {
    const basePositions = {
      red: [
        { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }
      ],
      yellow: [
        { x: 12, y: 12 }, { x: 13, y: 12 }, { x: 12, y: 13 }, { x: 13, y: 13 }
      ]
    };
    
    return basePositions[player][tokenIndex] || { x: 0, y: 0 };
  };

  const getTokenPositionOnBoard = (token: Token): { x: number; y: number } => {
    if (token.position === 'base') {
      const tokenIndex = parseInt(token.id.split('-')[1]);
      return getBoardPosition(token.player as ActivePlayer, tokenIndex);
    }
    
    if (token.position === 'home') {
      const homePositions = {
        red: { x: 6, y: 6 },
        yellow: { x: 8, y: 8 }
      };
      return homePositions[token.player as ActivePlayer];
    }
    
    if (token.boardPosition !== null) {
      return calculateBoardPosition(token.player as ActivePlayer, token.boardPosition);
    }
    
    return { x: 0, y: 0 };
  };

  const calculateBoardPosition = (player: ActivePlayer, position: number): { x: number; y: number } => {
    const pathPositions = {
      red: [
        { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 },
        { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 },
        { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 1 }, { x: 8, y: 2 }
      ],
      yellow: [
        { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 }, { x: 8, y: 10 }, { x: 8, y: 9 },
        { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 },
        { x: 14, y: 8 }, { x: 14, y: 7 }, { x: 14, y: 6 }, { x: 13, y: 6 }, { x: 12, y: 6 }
      ]
    };
    
    const positions = pathPositions[player];
    return positions[Math.min(position - 1, positions.length - 1)] || { x: 7, y: 7 };
  };

  const renderBoardCell = (x: number, y: number) => {
    const isCenter = x === 7 && y === 7;
    const isRedBase = x >= 0 && x <= 5 && y >= 0 && y <= 5;
    const isYellowBase = x >= 9 && x <= 14 && y >= 9 && y <= 14;
    const isRedHome = x >= 6 && x <= 8 && y >= 1 && y <= 6 && x === 7;
    const isYellowHome = x >= 6 && x <= 8 && y >= 8 && y <= 13 && x === 7;
    const isPath = (x === 6 || x === 7 || x === 8) || (y === 6 || y === 7 || y === 8);
    const isSafeSpot = (x === 1 && y === 8) || (x === 6 && y === 2) || (x === 8 && y === 12) || (x === 13 && y === 6);
    const isStartSpot = (x === 1 && y === 6) || (x === 8 && y === 1) || (x === 13 && y === 8) || (x === 6 && y === 13);
    
    let cellClass = "w-6 h-6 md:w-10 md:h-10 flex items-center justify-center text-xs relative transition-all duration-300 hover:scale-105 ";
    
    if (isCenter) {
      return (
        <div key={`${x}-${y}`} className={cellClass + "bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 rounded-full shadow-xl backdrop-blur-md border border-white/20"}>
          <div className={`bg-black/10 backdrop-blur-sm rounded-xl p-1 md:p-2 border border-white/30 shadow-inner ${isRolling ? 'animate-spin' : ''}`}>
            {getDiceIcon(diceValue)}
          </div>
        </div>
      );
    }
    
    if (isRedBase) cellClass += "bg-gradient-to-br from-red-200/80 to-red-300/80 backdrop-blur-sm border border-red-300/50 rounded-lg shadow-md ";
    else if (isYellowBase) cellClass += "bg-gradient-to-br from-yellow-200/80 to-yellow-300/80 backdrop-blur-sm border border-yellow-300/50 rounded-lg shadow-md ";
    else if (isRedHome) cellClass += "bg-gradient-to-br from-red-300/70 to-red-400/70 backdrop-blur-sm border border-red-400/50 rounded-md shadow-lg ";
    else if (isYellowHome) cellClass += "bg-gradient-to-br from-yellow-300/70 to-yellow-400/70 backdrop-blur-sm border border-yellow-400/50 rounded-md shadow-lg ";
    else if (isPath) cellClass += "bg-gradient-to-br from-white/80 to-gray-100/80 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-md ";
    else cellClass += "bg-gradient-to-br from-green-200/60 to-green-300/60 backdrop-blur-sm border border-green-300/40 rounded-lg shadow-sm ";
    
    // Add special styling for safe and start spots
    if (isSafeSpot) {
      cellClass += "ring-2 ring-blue-400/60 ring-offset-1 ring-offset-white/20 ";
    }
    
    if (isStartSpot) {
      cellClass += "ring-2 ring-yellow-400/60 ring-offset-1 ring-offset-white/20 ";
    }
    
    // Add tokens that are on this position
    const tokensHere: Token[] = [];
    Object.values(tokens).flat().forEach(token => {
      const pos = getTokenPositionOnBoard(token);
      if (pos.x === x && pos.y === y) {
        tokensHere.push(token);
      }
    });
    
    return (
      <div key={`${x}-${y}`} className={cellClass}>
        {tokensHere.map((token, index) => (
          <TokenComponent
            key={token.id}
            token={token}
            onClick={() => onTokenClick(token.id)}
            isCurrentPlayer={token.player === currentPlayer}
            style={{
              position: 'absolute',
              zIndex: index + 10,
              transform: `translate(${index * 2}px, ${index * 2}px)`
            }}
          />
        ))}
        
        {/* Safe spot markers */}
        {isSafeSpot && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full shadow-lg animate-pulse"></div>
          </div>
        )}
        
        {/* Start spot markers */}
        {isStartSpot && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full shadow-lg"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex justify-center p-2 md:p-4">
      <div className="relative">
        {/* Glassmorphic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-blue-50/30 to-purple-50/20 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/30"></div>
        
        {/* Game Board */}
        <div className="relative grid grid-cols-15 gap-0.5 md:gap-1 bg-gradient-to-br from-white/10 to-transparent p-3 md:p-6 rounded-3xl backdrop-blur-lg border border-white/20 shadow-2xl">
          {Array.from({ length: 15 }, (_, y) =>
            Array.from({ length: 15 }, (_, x) => renderBoardCell(x, y))
          )}
        </div>
        
        {/* Corner Player Indicators */}
        <div className="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-xl border-2 border-white/50 backdrop-blur-sm"></div>
        <div className="absolute -top-3 -right-3 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-xl border-2 border-white/50 backdrop-blur-sm"></div>
        
        {/* Floating Elements */}
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full shadow-lg animate-bounce delay-100"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full shadow-lg animate-bounce delay-300"></div>
      </div>
    </div>
  );
};

export default ImprovedLudoBoard;
