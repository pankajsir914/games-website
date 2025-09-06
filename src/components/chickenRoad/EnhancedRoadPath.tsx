import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedChicken } from './AnimatedChicken';
import { FireTrap } from './FireTrap';
import { Shield, Zap, Heart, Star, Gem } from 'lucide-react';
import { ChickenRunTile } from '@/hooks/useChickenRun';

interface PowerUp {
  type: 'shield' | 'multiplier' | 'extraLife' | 'slowMotion';
  icon: React.ReactNode;
  color: string;
}

interface EnhancedRoadPathProps {
  currentCheckpoint: number;
  tilesRevealed: ChickenRunTile[];
  onLaneClick: (checkpoint: number, lane: number) => void;
  isDisabled: boolean;
  gameStatus: 'idle' | 'playing' | 'won' | 'lost';
  difficulty: 'easy' | 'medium' | 'hard' | 'hardcore';
  powerUps?: PowerUp[];
  onPowerUpCollect?: (type: string) => void;
}

export const EnhancedRoadPath: React.FC<EnhancedRoadPathProps> = ({
  currentCheckpoint,
  tilesRevealed,
  onLaneClick,
  isDisabled,
  gameStatus,
  difficulty,
  powerUps = [],
  onPowerUpCollect
}) => {
  const checkpoints = 5;
  const lanes = 5;
  const [chickenState, setChickenState] = useState<'idle' | 'walking' | 'jumping' | 'scared' | 'victory' | 'burning'>('idle');
  const [chickenPosition, setChickenPosition] = useState({ checkpoint: 0, lane: 3 });
  const [collectedPowerUps, setCollectedPowerUps] = useState<string[]>([]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      setChickenState('walking');
    } else if (gameStatus === 'won') {
      setChickenState('victory');
    } else if (gameStatus === 'lost') {
      setChickenState('burning');
    } else {
      setChickenState('idle');
    }
  }, [gameStatus]);

  const getTileState = (checkpoint: number, lane: number) => {
    const tile = tilesRevealed.find(t => t.row === checkpoint && t.column === lane);
    if (tile) {
      return tile.is_trap ? 'trap' : 'safe';
    }
    return 'hidden';
  };

  const isLaneClickable = (checkpoint: number) => {
    return !isDisabled && checkpoint === currentCheckpoint + 1 && gameStatus === 'playing';
  };

  const handleLaneClick = (checkpoint: number, lane: number) => {
    if (isLaneClickable(checkpoint)) {
      setChickenState('jumping');
      setTimeout(() => setChickenState('walking'), 400);
      setChickenPosition({ checkpoint, lane });
      onLaneClick(checkpoint, lane);
    }
  };

  const getDifficultyTheme = () => {
    switch(difficulty) {
      case 'easy':
        return {
          bg: 'from-green-900/20 via-green-800/10 to-green-900/20',
          border: 'border-green-500/30',
          glow: 'shadow-green-500/20'
        };
      case 'medium':
        return {
          bg: 'from-yellow-900/20 via-yellow-800/10 to-yellow-900/20',
          border: 'border-yellow-500/30',
          glow: 'shadow-yellow-500/20'
        };
      case 'hard':
        return {
          bg: 'from-red-900/20 via-red-800/10 to-red-900/20',
          border: 'border-red-500/30',
          glow: 'shadow-red-500/20'
        };
      case 'hardcore':
        return {
          bg: 'from-purple-900/20 via-purple-800/10 to-purple-900/20',
          border: 'border-purple-500/30',
          glow: 'shadow-purple-500/20'
        };
      default:
        return {
          bg: 'from-blue-900/20 via-blue-800/10 to-blue-900/20',
          border: 'border-blue-500/30',
          glow: 'shadow-blue-500/20'
        };
    }
  };

  const theme = getDifficultyTheme();

  return (
    <div className={cn(
      "relative w-full rounded-2xl overflow-hidden",
      "bg-gradient-to-b", theme.bg,
      "border-2", theme.border,
      "shadow-2xl", theme.glow
    )}>
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] animate-slide-slow" />
      </div>

      {/* Victory/Loss Overlay */}
      <AnimatePresence>
        {gameStatus === 'won' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-green-500/50 to-green-600/50 z-30 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Star className="w-24 h-24 text-yellow-300 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-5xl font-bold text-white mb-2">WINNER!</h2>
              <p className="text-2xl text-yellow-200">Chicken crossed safely!</p>
            </motion.div>
          </motion.div>
        )}

        {gameStatus === 'lost' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-red-900/70 to-orange-900/70 z-30 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <FireTrap isActive={true} />
              <h2 className="text-5xl font-bold text-white mt-4">ROASTED!</h2>
              <p className="text-2xl text-orange-200">Your chicken got cooked!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <div className="relative p-8">
        {/* Start and End Points */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-5xl">🏠</span>
          </motion.div>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            <span className="text-5xl">🏰</span>
          </motion.div>
        </div>

        {/* Chicken Character */}
        {chickenPosition.checkpoint === 0 && (
          <div className="absolute left-16 top-1/2 -translate-y-1/2 z-25">
            <AnimatedChicken state={chickenState} />
          </div>
        )}

        {/* Road Grid */}
        <div className="relative mx-24">
          <div className="grid grid-cols-5 gap-6">
            {Array.from({ length: checkpoints }, (_, checkpointIdx) => {
              const checkpoint = checkpointIdx + 1;
              const isCurrentStep = checkpoint === currentCheckpoint + 1;
              const isPassed = checkpoint <= currentCheckpoint;

              return (
                <div key={checkpoint} className="relative">
                  {/* Checkpoint Header */}
                  <div className="text-center mb-3">
                    <motion.div
                      className={cn(
                        "text-sm font-bold transition-all",
                        isPassed && "text-green-400 scale-110",
                        isCurrentStep && "text-yellow-400 text-lg",
                        !isPassed && !isCurrentStep && "text-muted-foreground/50"
                      )}
                      animate={isCurrentStep ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      Step {checkpoint}
                    </motion.div>
                  </div>

                  {/* Lanes */}
                  <div className="space-y-2">
                    {Array.from({ length: lanes }, (_, laneIdx) => {
                      const lane = laneIdx + 1;
                      const tileState = getTileState(checkpoint, lane);
                      const isClickable = isLaneClickable(checkpoint);
                      const hasChicken = chickenPosition.checkpoint === checkpoint && chickenPosition.lane === lane;

                      return (
                        <motion.button
                          key={lane}
                          onClick={() => handleLaneClick(checkpoint, lane)}
                          disabled={!isClickable}
                          whileHover={isClickable ? { scale: 1.05 } : {}}
                          whileTap={isClickable ? { scale: 0.95 } : {}}
                          className={cn(
                            "relative w-full h-16 rounded-xl border-2 transition-all",
                            "flex items-center justify-center overflow-hidden",
                            // Base states
                            tileState === 'hidden' && isClickable && [
                              "bg-gradient-to-r from-blue-600/40 to-blue-700/40",
                              "border-blue-400/60 hover:border-blue-400",
                              "hover:shadow-lg hover:shadow-blue-400/30",
                              "cursor-pointer backdrop-blur-sm"
                            ],
                            tileState === 'hidden' && !isClickable && [
                              "bg-gray-800/30 border-gray-700/30",
                              "cursor-not-allowed opacity-50"
                            ],
                            // Revealed safe
                            tileState === 'safe' && [
                              "bg-gradient-to-r from-green-600/50 to-green-700/40",
                              "border-green-400 shadow-inner"
                            ],
                            // Revealed trap
                            tileState === 'trap' && [
                              "bg-gradient-to-r from-red-900/60 to-orange-900/50",
                              "border-red-500"
                            ]
                          )}
                        >
                          {/* Hidden state */}
                          {tileState === 'hidden' && isClickable && (
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <span className="text-blue-300 text-2xl">?</span>
                            </motion.div>
                          )}

                          {/* Safe tile */}
                          {tileState === 'safe' && !hasChicken && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1, rotate: 360 }}
                              transition={{ type: "spring" }}
                              className="flex items-center gap-2"
                            >
                              <Gem className="w-6 h-6 text-green-400" />
                              <span className="text-green-400 font-bold">SAFE!</span>
                            </motion.div>
                          )}

                          {/* Trap tile */}
                          {tileState === 'trap' && (
                            <FireTrap isActive={true} />
                          )}

                          {/* Chicken on tile */}
                          {hasChicken && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                              <AnimatedChicken 
                                state={tileState === 'trap' ? 'burning' : 'walking'} 
                              />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 mx-8">
          <div className="relative">
            <div className="h-4 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-green-400"
                animate={{ width: `${(currentCheckpoint / checkpoints) * 100}%` }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <div className="h-full bg-white/20 animate-pulse" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};