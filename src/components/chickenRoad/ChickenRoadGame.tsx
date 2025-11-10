import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { EnhancedRoadPath } from './EnhancedRoadPath';
import { ControlPanel } from './ControlPanel';
import { MultiplierDisplay } from './MultiplierDisplay';
import { useChickenRun } from '@/hooks/useChickenRun';
import { useWallet } from '@/hooks/useWallet';
import { useChickenRunSounds } from '@/hooks/useChickenRunSounds';
import { toast } from '@/hooks/use-toast';
import { HelpCircle, Settings, Trophy, TrendingUp, Volume2, VolumeX, Coins, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export const ChickenRoadGame: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { wallet } = useWallet();
  const {
    activeBet,
    leaderboard,
    userStats,
    betLoading,
    placeBet,
    revealTile,
    cashOut,
    isPlacingBet,
    isRevealingTile,
    isCashingOut,
  } = useChickenRun();

  const [betAmount, setBetAmount] = useState(50);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'hardcore'>('medium');
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [selectedLanes, setSelectedLanes] = useState<number[]>([]);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);

  const handlePlaceBet = () => {
    const difficultyMap = {
      easy: 'easy' as const,
      medium: 'medium' as const,
      hard: 'hard' as const,
      hardcore: 'hard' as const, // Map hardcore to hard for backend
    };

    if (wallet?.current_balance && wallet.current_balance >= betAmount) {
      placeBet({ 
        amount: betAmount, 
        difficulty: difficultyMap[difficulty]
      });
      setGameStatus('playing');
      setSelectedLanes([]);
    } else {
      toast({
        title: "Insufficient Balance",
        description: "Please add funds to your wallet",
        variant: "destructive",
      });
    }
  };

  const handleLaneClick = (checkpoint: number, lane: number) => {
    if (activeBet && !isRevealingTile && gameStatus === 'playing') {
      // Only allow clicking the next checkpoint
      if (checkpoint === activeBet.current_row + 1) {
        revealTile({
          betId: activeBet.id,
          row: checkpoint,
          column: lane,
        });
        setSelectedLanes([...selectedLanes, lane]);
      }
    }
  };

  const handleCashOut = () => {
    if (activeBet && !isCashingOut && gameStatus === 'playing') {
      cashOut(activeBet.id);
      setGameStatus('won');
    }
  };

  // Update game status based on activeBet
  React.useEffect(() => {
    if (activeBet) {
      if (activeBet.status === 'lost') {
        setGameStatus('lost');
        setSelectedLanes([]);
        // Start countdown for auto-reset
        setResetCountdown(5);
      } else if (activeBet.status === 'won') {
        setGameStatus('won');
        setSelectedLanes([]);
        // Start countdown for auto-reset
        setResetCountdown(5);
      } else if (activeBet.status === 'active') {
        setGameStatus('playing');
        setResetCountdown(null);
      }
    } else {
      setGameStatus('idle');
      setSelectedLanes([]);
      setResetCountdown(null);
    }
  }, [activeBet]);

  // Auto-reset countdown
  React.useEffect(() => {
    if (resetCountdown !== null && resetCountdown > 0) {
      const timer = setTimeout(() => {
        setResetCountdown(resetCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resetCountdown === 0) {
      // Reset game
      setGameStatus('idle');
      setSelectedLanes([]);
      setResetCountdown(null);
      queryClient.invalidateQueries({ queryKey: ['chicken-run-active-bet'] });
    }
  }, [resetCountdown]);

  const getPotentialPayout = () => {
    if (!activeBet) return 0;
    return activeBet.bet_amount * (activeBet.cashout_multiplier || 1);
  };

  const isLoading = betLoading || isPlacingBet || isRevealingTile || isCashingOut;

  return (
    <div className="min-h-screen bg-gradient-to-b from-chicken-dark to-background">
      {/* Top Bar */}
      <div className="bg-chicken-dark/50 backdrop-blur-lg border-b border-chicken-lane/20">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-muted-foreground hover:text-chicken-gold"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-chicken-gold">
                  🐓 Chicken Road
                </h1>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 bg-chicken-road/50 px-2 sm:px-3 py-1 rounded-lg">
                <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-chicken-gold" />
                <span className="text-sm sm:text-base md:text-lg font-bold text-chicken-gold">
                  ₹{wallet?.current_balance || 0}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-chicken-gold">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-chicken-gold">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Stats Card */}
          <Card className="bg-chicken-road/30 border-chicken-lane/30 backdrop-blur-sm">
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 text-chicken-gold">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                <h3 className="font-bold text-sm sm:text-base">Your Stats</h3>
              </div>

              {userStats ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Total Games</span>
                    <span className="font-semibold text-xs sm:text-sm">{userStats.total_games}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Wins</span>
                    <span className="font-semibold text-xs sm:text-sm text-chicken-success">{userStats.total_won}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Best Multiplier</span>
                    <span className="font-semibold text-xs sm:text-sm text-chicken-gold">
                      {userStats.highest_multiplier?.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Total Winnings</span>
                    <span className="font-semibold text-xs sm:text-sm text-chicken-gold">
                      ₹{userStats.total_winnings?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-5 sm:h-6 w-full" />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Game Area */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Multiplier Display */}
            <div className="relative">
              <MultiplierDisplay
                multiplier={activeBet?.cashout_multiplier || 1}
                potentialPayout={getPotentialPayout()}
                isVisible={!!activeBet && activeBet.status === 'active'}
              />

              {/* Enhanced Road Path */}
              <EnhancedRoadPath
                currentCheckpoint={activeBet?.current_row || 0}
                tilesRevealed={activeBet?.tiles_revealed || []}
                onLaneClick={handleLaneClick}
                isDisabled={!activeBet || isLoading || gameStatus !== 'playing'}
                gameStatus={gameStatus}
                difficulty={difficulty}
              />

              {/* Reset Countdown */}
              {resetCountdown !== null && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-background/90 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-chicken-gold/50">
                    <h3 className="text-base sm:text-xl md:text-2xl font-bold text-center mb-1 sm:mb-2">
                      New Game Starting In...
                    </h3>
                    <motion.div
                      className="text-4xl sm:text-5xl md:text-6xl font-bold text-chicken-gold text-center"
                      key={resetCountdown}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {resetCountdown}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Control Panel */}
            <ControlPanel
              betAmount={betAmount}
              onBetAmountChange={setBetAmount}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              balance={wallet?.current_balance || 0}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
              isPlaying={!!activeBet && activeBet.status === 'active'}
              isDisabled={isLoading}
              multiplier={activeBet?.cashout_multiplier || 1}
            />
          </div>
        </div>

        {/* Leaderboard */}
        <Card className="mt-3 sm:mt-4 md:mt-6 bg-chicken-road/30 border-chicken-lane/30 backdrop-blur-sm">
          <div className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center space-x-2 text-chicken-gold mb-3 sm:mb-4">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              <h3 className="font-bold text-sm sm:text-base md:text-lg">Top Players</h3>
            </div>

            <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
              <table className="w-full min-w-[500px] sm:min-w-0">
                <thead>
                  <tr className="border-b border-chicken-lane/30">
                    <th className="text-left py-2 text-xs sm:text-sm text-muted-foreground">Rank</th>
                    <th className="text-left py-2 text-xs sm:text-sm text-muted-foreground">Player</th>
                    <th className="text-right py-2 text-xs sm:text-sm text-muted-foreground">Best Multiplier</th>
                    <th className="text-right py-2 text-xs sm:text-sm text-muted-foreground">Total Winnings</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard?.slice(0, 5).map((player, index) => (
                    <tr key={player.id} className="border-b border-chicken-lane/10">
                      <td className="py-2 sm:py-3">
                        <span className={cn(
                          "font-bold text-xs sm:text-sm",
                          index === 0 && "text-chicken-gold",
                          index === 1 && "text-gray-400",
                          index === 2 && "text-orange-600"
                        )}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3">
                        <span className="font-medium text-xs sm:text-sm">
                          {player.profiles?.full_name || 'Anonymous'}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 text-right">
                        <span className="font-semibold text-xs sm:text-sm text-chicken-gold">
                          {player.highest_multiplier?.toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 text-right">
                        <span className="font-semibold text-xs sm:text-sm">
                          ₹{player.total_winnings?.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};