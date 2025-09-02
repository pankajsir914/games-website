import React from 'react';
import { cn } from '@/lib/utils';
import { Flame, Coins } from 'lucide-react';
import { ChickenRunTile } from '@/hooks/useChickenRun';

interface RoadPathProps {
  currentCheckpoint: number;
  tilesRevealed: ChickenRunTile[];
  onLaneClick: (checkpoint: number, lane: number) => void;
  isDisabled: boolean;
  chickenPosition: { checkpoint: number; lane: number } | null;
}

export const RoadPath: React.FC<RoadPathProps> = ({
  currentCheckpoint,
  tilesRevealed,
  onLaneClick,
  isDisabled,
  chickenPosition,
}) => {
  const checkpoints = 5;
  const lanes = 5;

  const getTileState = (checkpoint: number, lane: number) => {
    const tile = tilesRevealed.find(t => t.row === checkpoint && t.column === lane);
    if (tile) {
      return tile.is_trap ? 'trap' : 'safe';
    }
    return 'hidden';
  };

  const isLaneClickable = (checkpoint: number) => {
    return !isDisabled && checkpoint === currentCheckpoint;
  };

  return (
    <div className="relative w-full h-96 bg-gradient-to-b from-chicken-dark to-chicken-road rounded-xl overflow-hidden">
      {/* Background Castle Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-20 w-24 h-32 bg-chicken-lane rounded-t-full" />
        <div className="absolute top-10 right-32 w-20 h-28 bg-chicken-lane rounded-t-full" />
        <div className="absolute top-10 right-10 w-16 h-24 bg-chicken-lane rounded-t-full" />
      </div>

      {/* Road Path */}
      <div className="relative h-full flex items-center justify-center">
        <div className="w-full max-w-4xl px-8">
          {/* Checkpoints */}
          <div className="flex justify-between items-center">
            {Array.from({ length: checkpoints }, (_, checkpoint) => (
              <div key={checkpoint} className="flex flex-col items-center space-y-1">
                {/* Checkpoint Number */}
                <div className={cn(
                  "text-xs font-bold mb-2",
                  checkpoint < currentCheckpoint 
                    ? "text-chicken-success" 
                    : checkpoint === currentCheckpoint 
                    ? "text-chicken-gold" 
                    : "text-muted-foreground"
                )}>
                  {checkpoint + 1}
                </div>

                {/* Lanes */}
                <div className="flex flex-col space-y-1">
                  {Array.from({ length: lanes }, (_, lane) => {
                    const tileState = getTileState(checkpoint, lane);
                    const isClickable = isLaneClickable(checkpoint);
                    const hasChicken = chickenPosition?.checkpoint === checkpoint && chickenPosition?.lane === lane;

                    return (
                      <button
                        key={lane}
                        onClick={() => isClickable && onLaneClick(checkpoint, lane)}
                        disabled={!isClickable}
                        className={cn(
                          "w-16 h-12 rounded-lg border-2 transition-all duration-300 relative overflow-hidden",
                          "flex items-center justify-center",
                          // Base styles
                          tileState === 'hidden' && isClickable && "bg-chicken-lane/50 border-chicken-gold hover:bg-chicken-lane hover:border-chicken-gold hover:shadow-lg cursor-pointer",
                          tileState === 'hidden' && !isClickable && "bg-chicken-dark/30 border-chicken-lane/30 cursor-not-allowed",
                          // Revealed states
                          tileState === 'safe' && "bg-gradient-to-br from-chicken-success/20 to-chicken-success/10 border-chicken-success",
                          tileState === 'trap' && "bg-gradient-to-br from-chicken-fire/30 to-chicken-fire/20 border-chicken-fire",
                          // Chicken position
                          hasChicken && "ring-4 ring-chicken-gold ring-opacity-50"
                        )}
                      >
                        {/* Lane Content */}
                        {tileState === 'hidden' && isClickable && (
                          <span className="text-chicken-gold text-lg font-bold">?</span>
                        )}
                        {tileState === 'safe' && (
                          <Coins className="w-6 h-6 text-chicken-gold animate-coin-spin" />
                        )}
                        {tileState === 'trap' && (
                          <Flame className="w-6 h-6 text-chicken-fire animate-fire-flicker" />
                        )}

                        {/* Chicken */}
                        {hasChicken && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-3xl animate-pulse">🐓</div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 w-full h-2 bg-chicken-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-chicken-gold to-chicken-success transition-all duration-500"
              style={{ width: `${(currentCheckpoint / checkpoints) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};