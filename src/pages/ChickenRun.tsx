import React, { useState } from 'react';
import { ChickenMascot } from '@/components/chickenRun/ChickenMascot';
import { GameGrid } from '@/components/chickenRun/GameGrid';
import { BettingControls } from '@/components/chickenRun/BettingControls';
import { useChickenRun } from '@/hooks/useChickenRun';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';

const ChickenRun = () => {
  const { wallet } = useWallet();
  const {
    activeBet,
    leaderboard,
    userStats,
    placeBet,
    revealTile,
    cashOut,
    isPlacingBet,
    isRevealingTile,
    isCashingOut,
  } = useChickenRun();

  const [chickenState, setChickenState] = useState<'idle' | 'hopping' | 'scared' | 'celebrating' | 'roasted'>('idle');

  const handlePlaceBet = (amount: number, difficulty: 'easy' | 'medium' | 'hard') => {
    placeBet({ amount, difficulty });
    setChickenState('hopping');
  };

  const handleTileClick = (row: number, column: number) => {
    if (!activeBet) return;
    setChickenState('scared');
    revealTile({ betId: activeBet.id, row, column });
    
    setTimeout(() => {
      if (activeBet.status === 'lost') {
        setChickenState('roasted');
      } else {
        setChickenState('hopping');
      }
    }, 500);
  };

  const handleCashOut = () => {
    if (!activeBet) return;
    cashOut(activeBet.id);
    setChickenState('celebrating');
    setTimeout(() => setChickenState('idle'), 3000);
  };

  const getPotentialPayout = () => {
    if (!activeBet) return 0;
    return (activeBet.bet_amount * (activeBet.cashout_multiplier || 1)).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/10">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
            🐓 Chicken Run India
          </h1>
          <p className="text-muted-foreground">Help the chicken cross the road and win big!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-4">
            {!activeBet ? (
              <BettingControls
                onPlaceBet={handlePlaceBet}
                isDisabled={isPlacingBet}
                balance={wallet?.current_balance || 0}
              />
            ) : (
              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Current Multiplier</div>
                    <div className="text-3xl font-bold text-primary">
                      {activeBet.cashout_multiplier || 1}x
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Potential Payout</div>
                    <div className="text-2xl font-bold text-green-500">
                      ₹{getPotentialPayout()}
                    </div>
                  </div>

                  {activeBet.current_row > 0 && (
                    <Button
                      size="lg"
                      onClick={handleCashOut}
                      disabled={isCashingOut}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      CASH OUT ₹{getPotentialPayout()}
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* User Stats */}
            {userStats && (
              <Card className="p-4 bg-card/50 backdrop-blur-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Your Stats
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Games Played</span>
                    <span>{userStats.total_games}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="text-green-500">
                      {userStats.total_games > 0 
                        ? `${((userStats.total_won / userStats.total_games) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Multiplier</span>
                    <span className="text-primary font-bold">{userStats.highest_multiplier}x</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Center - Game */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <ChickenMascot state={chickenState} />
            </div>
            
            <GameGrid
              currentRow={activeBet?.current_row || 0}
              tilesRevealed={activeBet?.tiles_revealed || []}
              onTileClick={handleTileClick}
              isDisabled={!activeBet || isRevealingTile || activeBet.status !== 'active'}
              difficulty={activeBet?.difficulty || 'medium'}
            />
          </div>

          {/* Right Panel - Leaderboard */}
          <div>
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Top Players
              </h3>
              <div className="space-y-2">
                {leaderboard?.map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm truncate max-w-[100px]">
                        {entry.profiles?.full_name || 'Anonymous'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {entry.highest_multiplier}x
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChickenRun;