
import React from 'react';
import { Token, ActivePlayer } from '@/types/ludo';
import TokenComponent from './TokenComponent';
import DiceComponent from './DiceComponent';

interface LudoBoardProps {
  tokens: Record<ActivePlayer, Token[]>;
  onTokenClick: (tokenId: string) => void;
  currentPlayer: ActivePlayer;
}

const LudoBoard: React.FC<LudoBoardProps> = ({ tokens, onTokenClick, currentPlayer }) => {
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
        red: { x: 7, y: 6 },
        yellow: { x: 8, y: 9 }
      };
      return homePositions[token.player as ActivePlayer];
    }
    
    if (token.boardPosition !== null) {
      return calculateBoardPosition(token.player as ActivePlayer, token.boardPosition);
    }
    
    return { x: 0, y: 0 };
  };

  const calculateBoardPosition = (player: ActivePlayer, position: number): { x: number; y: number } => {
    // Simplified board position calculation
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
    
    let cellClass = "w-8 h-8 border border-border flex items-center justify-center text-xs relative ";
    
    if (isCenter) {
      return (
        <div key={`${x}-${y}`} className={cellClass + "bg-primary/20"}>
          <DiceComponent />
        </div>
      );
    }
    
    if (isRedBase) cellClass += "bg-red-100 ";
    else if (isYellowBase) cellClass += "bg-yellow-100 ";
    else if (isRedHome) cellClass += "bg-red-200 ";
    else if (isYellowHome) cellClass += "bg-yellow-200 ";
    else cellClass += "bg-secondary/30 ";
    
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
              zIndex: index + 1,
              transform: `translate(${index * 2}px, ${index * 2}px)`
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex justify-center mb-8">
      <div className="grid grid-cols-15 gap-0 bg-background p-4 rounded-lg shadow-card border border-border">
        {Array.from({ length: 15 }, (_, y) =>
          Array.from({ length: 15 }, (_, x) => renderBoardCell(x, y))
        )}
      </div>
    </div>
  );
};

export default LudoBoard;
