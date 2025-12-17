import React from 'react';
import { Token, ActivePlayer } from '@/types/ludo';
import PremiumTokenComponent from './PremiumTokenComponent';
import PremiumDiceComponent from './PremiumDiceComponent';

interface PremiumLudoBoardProps {
  tokens: Record<ActivePlayer, Token[]>;
  onTokenClick: (tokenId: string) => void;
  currentPlayer: ActivePlayer;
  diceValue: number;
  isRolling: boolean;
  onDiceClick: () => void;
  canRoll: boolean;
}

const PremiumLudoBoard: React.FC<PremiumLudoBoardProps> = ({ 
  tokens, 
  onTokenClick, 
  currentPlayer,
  diceValue,
  isRolling,
  onDiceClick,
  canRoll
}) => {
  // Board positions for different player colors
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
      const tokenIndex = parseInt(token.id.split('-')[1]) - 1;
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
    // Simplified path positions for demonstration
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
    const isRedHome = x >= 1 && x <= 5 && y >= 6 && y <= 8 && x === (6 + (y - 6));
    const isYellowHome = x >= 9 && x <= 13 && y >= 6 && y <= 8 && x === (8 + (8 - y));
    const isPath = (x === 6 || x === 7 || x === 8) || (y === 6 || y === 7 || y === 8);
    const isSafeSpot = (x === 1 && y === 8) || (x === 6 && y === 2) || (x === 8 && y === 12) || (x === 13 && y === 6);
    const isStartSpot = (x === 1 && y === 6) || (x === 8 && y === 1) || (x === 13 && y === 8) || (x === 6 && y === 13);
    
    let cellClass = "w-8 h-8 md:w-12 md:h-12 flex items-center justify-center relative transition-all duration-300 hover:scale-105 ";
    
    if (isCenter) {
      return (
        <div key={`${x}-${y}`} className={cellClass + "bg-gradient-to-br from-yellow-200 via-orange-200 to-red-200 rounded-2xl shadow-ludo-board border-4 border-white/50"}>
          <PremiumDiceComponent
            value={diceValue}
            isRolling={isRolling}
            onClick={onDiceClick}
            canRoll={canRoll && currentPlayer === 'red'} // Assuming red is the human player
          />
        </div>
      );
    }
    
    // Base areas with player colors
    if (isRedBase) cellClass += "bg-gradient-ludo-red rounded-xl shadow-ludo-token border-2 border-red-300/70 ";
    else if (isYellowBase) cellClass += "bg-gradient-ludo-yellow rounded-xl shadow-ludo-token border-2 border-yellow-300/70 ";
    else if (isRedHome) cellClass += "bg-gradient-to-br from-red-100 to-red-200 rounded-lg shadow-md border border-red-300/50 ";
    else if (isYellowHome) cellClass += "bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg shadow-md border border-yellow-300/50 ";
    else if (isPath) cellClass += "bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md border border-gray-200/70 ";
    else cellClass += "bg-gradient-ludo-board rounded-xl shadow-sm border border-green-200/50 ";
    
    // Special spot styling
    if (isSafeSpot) {
      cellClass += "ring-3 ring-blue-400/80 ring-offset-2 ring-offset-white ";
    }
    
    if (isStartSpot) {
      cellClass += "ring-3 ring-yellow-500/80 ring-offset-2 ring-offset-white ";
    }
    
    // Get tokens at this position
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
          <PremiumTokenComponent
            key={token.id}
            token={token}
            onClick={() => onTokenClick(token.id)}
            isCurrentPlayer={token.player === currentPlayer}
            style={{
              position: 'absolute',
              zIndex: index + 10,
              transform: `translate(${index * 3}px, ${index * 3}px)`
            }}
          />
        ))}
        
        {/* Safe spot indicator */}
        {isSafeSpot && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg animate-glow-pulse"></div>
          </div>
        )}
        
        {/* Start spot indicator */}
        {isStartSpot && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg animate-pulse"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex justify-center p-4">
      <div className="relative">
        {/* Main board container with premium styling */}
        <div className="relative grid grid-cols-15 gap-1 bg-gradient-ludo-board p-8 rounded-3xl shadow-ludo-board border-4 border-white/30 backdrop-blur-sm">
          {Array.from({ length: 15 }, (_, y) =>
            Array.from({ length: 15 }, (_, x) => renderBoardCell(x, y))
          )}
        </div>
        
        {/* Corner player indicators with glow effect */}
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-ludo-red rounded-full shadow-ludo-token border-3 border-white animate-float"></div>
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-ludo-yellow rounded-full shadow-ludo-token border-3 border-white animate-float delay-1000"></div>
        
        {/* Decorative floating elements */}
        <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full shadow-lg animate-float delay-500"></div>
        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full shadow-lg animate-float delay-1500"></div>
        
        {/* Board glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default PremiumLudoBoard;