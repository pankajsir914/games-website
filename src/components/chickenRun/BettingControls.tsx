import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Minus, Plus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BettingControlsProps {
  onPlaceBet: (amount: number, difficulty: 'easy' | 'medium' | 'hard') => void;
  isDisabled: boolean;
  balance: number;
}

export const BettingControls: React.FC<BettingControlsProps> = ({
  onPlaceBet,
  isDisabled,
  balance
}) => {
  const [betAmount, setBetAmount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const quickAmounts = [10, 50, 100, 500];

  const adjustBet = (delta: number) => {
    const newAmount = Math.max(10, Math.min(10000, betAmount + delta));
    setBetAmount(newAmount);
  };

  const handleQuickAmount = (amount: number) => {
    setBetAmount(amount);
  };

  const getMultiplierInfo = () => {
    switch(difficulty) {
      case 'easy':
        return { base: '1.2x', risk: 'Low Risk', color: 'text-green-500' };
      case 'medium':
        return { base: '1.5x', risk: 'Medium Risk', color: 'text-yellow-500' };
      case 'hard':
        return { base: '2.5x', risk: 'High Risk', color: 'text-red-500' };
    }
  };

  const multiplierInfo = getMultiplierInfo();

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="space-y-6">
        {/* Bet Amount Section */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Bet Amount (₹)</label>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => adjustBet(-10)}
              disabled={isDisabled || betAmount <= 10}
            >
              <Minus className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Math.min(10000, parseInt(e.target.value) || 10)))}
                className="w-full px-4 py-2 text-center text-lg font-bold bg-background border rounded-lg"
                disabled={isDisabled}
                min={10}
                max={10000}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            </div>
            
            <Button
              size="icon"
              variant="outline"
              onClick={() => adjustBet(10)}
              disabled={isDisabled || betAmount >= 10000}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Amounts */}
          <div className="flex gap-2 mt-3">
            {quickAmounts.map(amount => (
              <Button
                key={amount}
                size="sm"
                variant={betAmount === amount ? "default" : "outline"}
                onClick={() => handleQuickAmount(amount)}
                disabled={isDisabled || amount > balance}
                className="flex-1"
              >
                ₹{amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Difficulty Level</label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={difficulty === 'easy' ? 'default' : 'outline'}
              onClick={() => setDifficulty('easy')}
              disabled={isDisabled}
              className={cn(
                "relative",
                difficulty === 'easy' && "bg-green-500 hover:bg-green-600"
              )}
            >
              <div className="text-center">
                <div className="font-bold">Easy</div>
                <div className="text-xs opacity-80">1.2x</div>
                <div className="text-xs opacity-60">🌶️</div>
              </div>
            </Button>
            
            <Button
              variant={difficulty === 'medium' ? 'default' : 'outline'}
              onClick={() => setDifficulty('medium')}
              disabled={isDisabled}
              className={cn(
                "relative",
                difficulty === 'medium' && "bg-yellow-500 hover:bg-yellow-600"
              )}
            >
              <div className="text-center">
                <div className="font-bold">Medium</div>
                <div className="text-xs opacity-80">1.5x</div>
                <div className="text-xs opacity-60">🌶️🌶️</div>
              </div>
            </Button>
            
            <Button
              variant={difficulty === 'hard' ? 'default' : 'outline'}
              onClick={() => setDifficulty('hard')}
              disabled={isDisabled}
              className={cn(
                "relative",
                difficulty === 'hard' && "bg-red-500 hover:bg-red-600"
              )}
            >
              <div className="text-center">
                <div className="font-bold">Hard</div>
                <div className="text-xs opacity-80">2.5x</div>
                <div className="text-xs opacity-60">🌶️🌶️🌶️</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Multiplier Info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Base Multiplier:</span>
            <span className={cn("font-bold", multiplierInfo.color)}>{multiplierInfo.base}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-muted-foreground">Risk Level:</span>
            <span className={cn("text-sm font-medium", multiplierInfo.color)}>{multiplierInfo.risk}</span>
          </div>
        </div>

        {/* Play Button */}
        <Button
          size="lg"
          onClick={() => onPlaceBet(betAmount, difficulty)}
          disabled={isDisabled || betAmount > balance}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg py-6"
        >
          <Zap className="mr-2" />
          PLAY FOR ₹{betAmount}
        </Button>
        
        {betAmount > balance && (
          <p className="text-sm text-destructive text-center">Insufficient balance</p>
        )}
      </div>
    </Card>
  );
};