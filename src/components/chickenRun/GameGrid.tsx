import React from 'react';
import { cn } from '@/lib/utils';
import { ChickenRunTile } from '@/hooks/useChickenRun';
import { DollarSign, Flame } from 'lucide-react';

interface GameGridProps {
  currentRow: number;
  tilesRevealed: ChickenRunTile[];
  onTileClick: (row: number, column: number) => void;
  isDisabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const GameGrid: React.FC<GameGridProps> = ({
  currentRow,
  tilesRevealed,
  onTileClick,
  isDisabled,
  difficulty
}) => {
  const rows = 5;
  const columns = 5;

  const getTileState = (row: number, column: number) => {
    const revealedTile = tilesRevealed.find(t => t.row === row && t.column === column);
    if (revealedTile) {
      return revealedTile.is_trap ? 'trap' : 'safe';
    }
    return 'hidden';
  };

  const isTileClickable = (row: number) => {
    return !isDisabled && row === currentRow + 1;
  };

  const getDifficultyColor = () => {
    switch(difficulty) {
      case 'easy': return 'border-green-500/30';
      case 'medium': return 'border-yellow-500/30';
      case 'hard': return 'border-red-500/30';
      default: return 'border-primary/30';
    }
  };

  return (
    <div className={cn("bg-card/50 backdrop-blur-sm rounded-xl p-6 border-2", getDifficultyColor())}>
      <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
        {Array.from({ length: rows }).map((_, rowIndex) => {
          const row = rows - rowIndex; // Start from bottom (row 1)
          return Array.from({ length: columns }).map((_, colIndex) => {
            const column = colIndex + 1;
            const tileState = getTileState(row, column);
            const isClickable = isTileClickable(row);
            
            return (
              <button
                key={`${row}-${column}`}
                onClick={() => isClickable && onTileClick(row, column)}
                disabled={!isClickable || tileState !== 'hidden'}
                className={cn(
                  "aspect-square rounded-lg transition-all duration-300 relative",
                  "flex items-center justify-center text-2xl font-bold",
                  "transform hover:scale-105",
                  tileState === 'hidden' && isClickable && "bg-gradient-to-br from-primary/80 to-primary hover:from-primary hover:to-primary/90 cursor-pointer shadow-lg hover:shadow-xl",
                  tileState === 'hidden' && !isClickable && "bg-muted/50 cursor-not-allowed",
                  tileState === 'safe' && "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/50 shadow-lg animate-pulse",
                  tileState === 'trap' && "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50 shadow-lg",
                  row <= currentRow && tileState === 'hidden' && "opacity-50"
                )}
              >
                {tileState === 'safe' && (
                  <div className="animate-spin-slow">
                    <DollarSign className="w-8 h-8 text-yellow-300" />
                  </div>
                )}
                {tileState === 'trap' && (
                  <div className="animate-pulse">
                    <Flame className="w-8 h-8 text-orange-300" />
                  </div>
                )}
                {tileState === 'hidden' && isClickable && (
                  <span className="text-white/70 text-sm">?</span>
                )}
                
                {/* Row indicator */}
                {colIndex === 0 && (
                  <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    R{row}
                  </div>
                )}
              </button>
            );
          });
        })}
      </div>
      
      {/* Progress indicator */}
      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{currentRow} / {rows} rows</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
            style={{ width: `${(currentRow / rows) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};