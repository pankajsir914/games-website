import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, RotateCcw, Loader2 } from 'lucide-react';
import { GameData } from '@/pages/Aviator';

interface SingleBettingControlsProps {
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
  onPlaceBet: (amount: number, autoCashout?: number) => void;
  bettingCountdown: number;
  isPlacingBet?: boolean;
  disabled?: boolean;
}

const SingleBettingControls = ({ 
  gameData, 
  setGameData, 
  onPlaceBet, 
  bettingCountdown, 
  isPlacingBet = false, 
  disabled = false 
}: SingleBettingControlsProps) => {
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState<number | null>(null);

  const quickAmounts = [100, 200, 500, 1000];
  const canBet = gameData.gameState === 'betting' && bettingCountdown > 0 && !disabled;

  const adjustAmount = (increment: number) => {
    setBetAmount(prev => Math.max(10, Math.min(10000, prev + increment)));
  };

  const setQuickAmount = (amount: number) => {
    setBetAmount(amount);
  };

  const handlePlaceBet = () => {
    onPlaceBet(betAmount, autoCashout || undefined);
  };

  return (
    <Card className="bg-slate-900/95 border-slate-700/50">
      <CardContent className="p-3 sm:p-4">
        {/* Balance and Status */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="text-xs sm:text-sm">
            <span className="text-muted-foreground">Balance: </span>
            <span className="font-bold text-gaming-gold">₹{gameData.balance.toFixed(2)}</span>
          </div>
          {bettingCountdown > 0 && (
            <Badge variant="secondary" className="animate-pulse text-xs">
              {bettingCountdown}s left
            </Badge>
          )}
        </div>

        {/* Bet Amount Input */}
        <div className="relative mb-3 sm:mb-4">
          <div className="flex items-center border border-slate-600 rounded-lg bg-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adjustAmount(-10)}
              disabled={!canBet || betAmount <= 10}
              className="h-10 sm:h-12 px-2 sm:px-3 border-0 rounded-l-lg hover:bg-slate-700"
            >
              <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(10, Math.min(10000, Number(e.target.value) || 10)))}
              className="border-0 text-center bg-transparent h-10 sm:h-12 text-base sm:text-lg font-bold"
              disabled={!canBet}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adjustAmount(10)}
              disabled={!canBet || betAmount >= 10000}
              className="h-10 sm:h-12 px-2 sm:px-3 border-0 rounded-r-lg hover:bg-slate-700"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3 sm:mb-4">
          {quickAmounts.map(quickAmount => (
            <Button
              key={quickAmount}
              variant="outline"
              size="sm"
              onClick={() => setQuickAmount(quickAmount)}
              disabled={!canBet}
              className={`text-xs sm:text-sm bg-slate-700 border-slate-600 hover:bg-slate-600 h-8 sm:h-10 ${
                betAmount === quickAmount ? 'bg-primary border-primary' : ''
              }`}
            >
              ₹{quickAmount}
            </Button>
          ))}
        </div>

        {/* Auto Cashout */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Auto Cashout (Optional)</label>
            <Input
              type="number"
              value={autoCashout || ''}
              onChange={(e) => setAutoCashout(e.target.value ? Number(e.target.value) : null)}
              placeholder="e.g., 2.0x"
              className="bg-slate-800 border-slate-600 text-sm h-9 sm:h-10"
              step="0.1"
              min="1.1"
              disabled={!canBet}
            />
          </div>
          {autoCashout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoCashout(null)}
              disabled={!canBet}
              className="h-9 sm:h-10 px-2 sm:px-3"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Bet Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!canBet || betAmount > gameData.balance || isPlacingBet || gameData.hasBet}
          className="w-full bg-gaming-success hover:bg-gaming-success/90 text-gaming-success-foreground font-bold py-3 sm:py-4 text-base sm:text-lg mb-3 sm:mb-4"
          style={{
            boxShadow: '0 0 20px hsl(var(--gaming-success))'
          }}
        >
          {isPlacingBet ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              Placing Bet...
            </>
          ) : gameData.hasBet ? (
            'Bet Already Placed'
          ) : (
            <>
              Place Bet - ₹{betAmount}
            </>
          )}
        </Button>

        {/* Potential Win Display */}
        <div className="text-center p-2 sm:p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Potential Win</div>
          <div className="text-lg sm:text-xl font-bold text-gaming-success">
            ₹{(betAmount * (autoCashout || 2)).toFixed(2)}
          </div>
          {autoCashout && (
            <div className="text-xs text-muted-foreground mt-1">
              at {autoCashout}x multiplier
            </div>
          )}
        </div>

        {/* Active Bet Display */}
        {gameData.hasBet && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-primary/20 rounded-lg border border-primary/30">
            <div className="text-center text-primary font-medium text-sm sm:text-base">
              Active Bet: ₹{gameData.currentBet}
              {gameData.autoCashOut && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Auto cashout at {gameData.autoCashOut}x
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SingleBettingControls;

<<<<<<< HEAD







=======
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
