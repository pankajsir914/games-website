import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { RoadPath } from './RoadPath';
import { ControlPanel } from './ControlPanel';
import { MultiplierDisplay } from './MultiplierDisplay';
import { useChickenRun } from '@/hooks/useChickenRun';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';
import { HelpCircle, Settings, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const ChickenRoadGame: React.FC = () => {
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
  const [chickenPosition, setChickenPosition] = useState<{ checkpoint: number; lane: number } | null>(null);

  const handlePlaceBet = () => {
    const difficultyMap = {
      easy: 'easy' as const,
      medium: 'medium' as const,
      hard: 'hard' as const,
      hardcore: 'hard' as const, // Map hardcore to hard for backend
    };

    placeBet({ 
      amount: betAmount, 
      difficulty: difficultyMap[difficulty]
    });
  };

  const handleLaneClick = (checkpoint: number, lane: number) => {
    if (!activeBet) return;

    setChickenPosition({ checkpoint, lane });
    revealTile({
      betId: activeBet.id,
      row: checkpoint,
      column: lane,
    });
  };

  const handleCashOut = () => {
    if (!activeBet) return;
    cashOut(activeBet.id);
    setChickenPosition(null);
  };

  const getPotentialPayout = () => {
    if (!activeBet) return 0;
    return activeBet.bet_amount * (activeBet.cashout_multiplier || 1);
  };

  const isLoading = betLoading || isPlacingBet || isRevealingTile || isCashingOut;

  return (
    <div className="min-h-screen bg-gradient-to-b from-chicken-dark to-background">
      {/* Top Bar */}
      <div className="bg-chicken-dark/50 backdrop-blur-lg border-b border-chicken-lane/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-chicken-gold">
                🐓 Chicken Road India
              </h1>
              <div className="flex items-center space-x-2 bg-chicken-road/50 px-3 py-1 rounded-lg">
                <span className="text-sm text-muted-foreground">Balance:</span>
                <span className="text-lg font-bold text-chicken-gold">
                  ₹{wallet?.current_balance || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
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
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <Card className="bg-chicken-road/30 border-chicken-lane/30 backdrop-blur-sm">
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-2 text-chicken-gold">
                <TrendingUp className="h-5 w-5" />
                <h3 className="font-bold">Your Stats</h3>
              </div>

              {userStats ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Games</span>
                    <span className="font-semibold">{userStats.total_games}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Wins</span>
                    <span className="font-semibold text-chicken-success">{userStats.total_won}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Best Multiplier</span>
                    <span className="font-semibold text-chicken-gold">
                      {userStats.highest_multiplier?.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Winnings</span>
                    <span className="font-semibold text-chicken-gold">
                      ₹{userStats.total_winnings?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Multiplier Display */}
            <div className="relative">
              <MultiplierDisplay
                multiplier={activeBet?.cashout_multiplier || 1}
                potentialPayout={getPotentialPayout()}
                isVisible={!!activeBet && activeBet.status === 'active'}
              />

              {/* Road Path */}
              <RoadPath
                currentCheckpoint={activeBet?.current_row || 0}
                tilesRevealed={activeBet?.tiles_revealed || []}
                onLaneClick={handleLaneClick}
                isDisabled={!activeBet || isLoading}
                chickenPosition={chickenPosition}
              />
            </div>

            {/* Control Panel */}
            <ControlPanel
              betAmount={betAmount}
              onBetAmountChange={setBetAmount}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              balance={wallet?.balance || 0}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
              isPlaying={!!activeBet && activeBet.status === 'active'}
              isDisabled={isLoading}
              multiplier={activeBet?.cashout_multiplier || 1}
            />
          </div>
        </div>

        {/* Leaderboard */}
        <Card className="mt-6 bg-chicken-road/30 border-chicken-lane/30 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center space-x-2 text-chicken-gold mb-4">
              <Trophy className="h-5 w-5" />
              <h3 className="font-bold text-lg">Top Players</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-chicken-lane/30">
                    <th className="text-left py-2 text-sm text-muted-foreground">Rank</th>
                    <th className="text-left py-2 text-sm text-muted-foreground">Player</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Best Multiplier</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Total Winnings</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard?.slice(0, 5).map((player, index) => (
                    <tr key={player.id} className="border-b border-chicken-lane/10">
                      <td className="py-3">
                        <span className={cn(
                          "font-bold",
                          index === 0 && "text-chicken-gold",
                          index === 1 && "text-gray-400",
                          index === 2 && "text-orange-600"
                        )}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-medium">
                          {player.profiles?.full_name || 'Anonymous'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-semibold text-chicken-gold">
                          {player.highest_multiplier?.toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-semibold">
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