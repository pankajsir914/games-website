import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Flame, Coins, ChevronRight, AlertTriangle } from 'lucide-react';
import { ChickenRunTile } from '@/hooks/useChickenRun';

interface RoadPathProps {
  currentCheckpoint: number;
  tilesRevealed: ChickenRunTile[];
  onLaneClick: (checkpoint: number, lane: number) => void;
  isDisabled: boolean;
  chickenPosition: { checkpoint: number; lane: number } | null;
  gameStatus?: 'idle' | 'playing' | 'won' | 'lost';
}

export const RoadPath: React.FC<RoadPathProps> = ({
  currentCheckpoint,
  tilesRevealed,
  onLaneClick,
  isDisabled,
  chickenPosition,
  gameStatus = 'idle',
}) => {
  const checkpoints = 5;
  const lanes = 5;
  const [isMoving, setIsMoving] = useState(false);
  const [lastTrap, setLastTrap] = useState<{checkpoint: number, lane: number} | null>(null);

  const getTileState = (checkpoint: number, lane: number) => {
    const tile = tilesRevealed.find(t => t.row === checkpoint && t.column === lane);
    if (tile) {
      if (tile.is_trap) {
        setLastTrap({ checkpoint, lane });
        return 'trap';
      }
      return 'safe';
    }
    return 'hidden';
  };

  const isLaneClickable = (checkpoint: number) => {
    return !isDisabled && checkpoint === currentCheckpoint + 1 && gameStatus === 'playing';
  };

  useEffect(() => {
    if (chickenPosition) {
      setIsMoving(true);
      setTimeout(() => setIsMoving(false), 500);
    }
  }, [chickenPosition]);

  return (
    <div className="relative w-full bg-gradient-to-b from-chicken-dark via-chicken-road/50 to-chicken-dark rounded-xl overflow-hidden">
      {/* Game Status Overlay */}
      {gameStatus === 'lost' && (
        <div className="absolute inset-0 bg-red-900/50 z-20 flex items-center justify-center animate-fade-in">
          <div className="text-center space-y-4">
            <Flame className="w-20 h-20 text-red-500 mx-auto animate-fire-flicker" />
            <div className="text-4xl font-bold text-white">BURNED!</div>
            <div className="text-xl text-red-300">Your chicken got roasted!</div>
          </div>
        </div>
      )}

      {/* Road Container */}
      <div className="relative py-8">
        {/* Start Point */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl z-10">
          {gameStatus === 'idle' && <span className="animate-pulse">🏠</span>}
        </div>

        {/* End Point (Castle) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl z-10">
          🏰
        </div>

        {/* Main Road Path */}
        <div className="relative mx-20 px-4">
          {/* Road Background */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-64 bg-gradient-to-b from-chicken-lane/20 to-chicken-lane/10 rounded-lg" />
          
          {/* Checkpoints Grid */}
          <div className="relative grid grid-cols-5 gap-8 px-8">
            {Array.from({ length: checkpoints }, (_, checkpointIdx) => {
              const checkpoint = checkpointIdx + 1; // 1-indexed for display
              const isCurrentStep = checkpoint === currentCheckpoint + 1;
              const isPassed = checkpoint <= currentCheckpoint;
              const isFutureStep = checkpoint > currentCheckpoint + 1;

              return (
                <div key={checkpoint} className="relative">
                  {/* Checkpoint Header */}
                  <div className="text-center mb-4">
                    <div className={cn(
                      "text-sm font-bold mb-1 transition-all",
                      isPassed && "text-chicken-success scale-110",
                      isCurrentStep && "text-chicken-gold text-lg animate-pulse",
                      isFutureStep && "text-muted-foreground/50"
                    )}>
                      Step {checkpoint}
                    </div>
                    {isCurrentStep && gameStatus === 'playing' && (
                      <ChevronRight className="w-4 h-4 text-chicken-gold mx-auto animate-pulse" />
                    )}
                  </div>

                  {/* Lanes for this checkpoint */}
                  <div className="space-y-2">
                    {Array.from({ length: lanes }, (_, lane) => {
                      const tileState = getTileState(checkpoint, lane + 1);
                      const isClickable = isLaneClickable(checkpoint);
                      const hasChicken = chickenPosition?.checkpoint === checkpoint && chickenPosition?.lane === lane + 1;
                      const isLastTrap = lastTrap?.checkpoint === checkpoint && lastTrap?.lane === lane + 1;

                      return (
                        <button
                          key={lane}
                          onClick={() => isClickable && onLaneClick(checkpoint, lane + 1)}
                          disabled={!isClickable}
                          className={cn(
                            "w-full h-14 rounded-lg border-2 transition-all duration-300 relative overflow-hidden",
                            "flex items-center justify-center group",
                            // Base states
                            tileState === 'hidden' && isClickable && [
                              "bg-gradient-to-r from-chicken-lane/40 to-chicken-lane/60",
                              "border-chicken-gold/60 hover:border-chicken-gold",
                              "hover:shadow-lg hover:shadow-chicken-gold/20",
                              "cursor-pointer hover:scale-105"
                            ],
                            tileState === 'hidden' && !isClickable && [
                              "bg-chicken-dark/20 border-chicken-lane/20",
                              "cursor-not-allowed opacity-50"
                            ],
                            // Revealed safe
                            tileState === 'safe' && [
                              "bg-gradient-to-r from-green-900/30 to-green-800/20",
                              "border-chicken-success shadow-inner"
                            ],
                            // Revealed trap
                            tileState === 'trap' && [
                              "bg-gradient-to-r from-red-900/40 to-orange-900/30",
                              "border-chicken-fire animate-fire-flicker"
                            ],
                            // Has chicken
                            hasChicken && "ring-4 ring-chicken-gold ring-opacity-60 scale-105 z-10"
                          )}
                        >
                          {/* Hidden state - clickable */}
                          {tileState === 'hidden' && isClickable && (
                            <div className="flex items-center gap-2">
                              <span className="text-chicken-gold/80 text-sm font-medium">
                                Lane {lane + 1}
                              </span>
                              <AlertTriangle className="w-4 h-4 text-chicken-gold/60 group-hover:animate-pulse" />
                            </div>
                          )}

                          {/* Safe tile */}
                          {tileState === 'safe' && !hasChicken && (
                            <div className="flex items-center gap-2">
                              <Coins className="w-5 h-5 text-chicken-gold animate-coin-spin" />
                              <span className="text-chicken-success text-sm font-bold">SAFE!</span>
                            </div>
                          )}

                          {/* Trap tile */}
                          {tileState === 'trap' && (
                            <div className="flex items-center gap-2">
                              <Flame className="w-6 h-6 text-chicken-fire animate-fire-flicker" />
                              <span className="text-chicken-fire text-sm font-bold">TRAP!</span>
                            </div>
                          )}

                          {/* Chicken Avatar */}
                          {hasChicken && (
                            <div className={cn(
                              "absolute inset-0 flex items-center justify-center z-20",
                              isMoving && "animate-chicken-walk",
                              isLastTrap && gameStatus === 'lost' && "animate-chicken-burn"
                            )}>
                              <span className="text-4xl drop-shadow-lg">
                                {gameStatus === 'lost' ? '🔥' : '🐓'}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Connection Line to Next Checkpoint */}
                  {checkpointIdx < checkpoints - 1 && (
                    <div className={cn(
                      "absolute top-1/2 -right-8 w-8 h-0.5 transition-all duration-500",
                      isPassed ? "bg-chicken-success" : "bg-chicken-lane/30"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 px-8">
            <div className="relative">
              <div className="h-3 bg-chicken-dark/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-chicken-gold via-yellow-500 to-chicken-success transition-all duration-700 ease-out relative"
                  style={{ width: `${(currentCheckpoint / checkpoints) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="absolute -top-1 -bottom-1 left-0 right-0 flex justify-between items-center px-1">
                {Array.from({ length: checkpoints + 1 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition-all duration-300",
                      i <= currentCheckpoint
                        ? "bg-chicken-gold border-chicken-gold scale-110"
                        : "bg-chicken-dark border-chicken-lane/50"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-chicken-gold">Start</span>
              <span className="text-muted-foreground">Progress: {currentCheckpoint}/{checkpoints}</span>
              <span className="text-chicken-success">Finish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};