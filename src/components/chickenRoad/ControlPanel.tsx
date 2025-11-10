import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ChevronUp, Play, X } from 'lucide-react';

interface ControlPanelProps {
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  difficulty: 'easy' | 'medium' | 'hard' | 'hardcore';
  onDifficultyChange: (difficulty: 'easy' | 'medium' | 'hard' | 'hardcore') => void;
  balance: number;
  onPlaceBet: () => void;
  onCashOut: () => void;
  isPlaying: boolean;
  isDisabled: boolean;
  multiplier: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  betAmount,
  onBetAmountChange,
  difficulty,
  onDifficultyChange,
  balance,
  onPlaceBet,
  onCashOut,
  isPlaying,
  isDisabled,
  multiplier,
}) => {
  const quickAmounts = [10, 25, 50, 100, 200, 500];

  const getDifficultyInfo = () => {
    switch (difficulty) {
      case 'easy':
        return { multiplier: '1.5x', chance: '60%', color: 'text-chicken-success' };
      case 'medium':
        return { multiplier: '2x', chance: '40%', color: 'text-chicken-gold' };
      case 'hard':
        return { multiplier: '3x', chance: '20%', color: 'text-orange-500' };
      case 'hardcore':
        return { multiplier: '5x', chance: '10%', color: 'text-chicken-fire' };
      default:
        return { multiplier: '2x', chance: '40%', color: 'text-chicken-gold' };
    }
  };

  const difficultyInfo = getDifficultyInfo();

  return (
    <div className="bg-gradient-to-t from-chicken-dark to-chicken-road/80 backdrop-blur-lg rounded-t-3xl p-4 sm:p-5 md:p-6 border-t-2 border-chicken-gold/20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Bet Amount Section */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-medium text-muted-foreground">Bet Amount</label>
            <span className="text-base sm:text-lg font-bold text-chicken-gold">₹{betAmount}</span>
          </div>

          {/* Slider */}
          <Slider
            value={[betAmount]}
            onValueChange={([value]) => onBetAmountChange(value)}
            min={10}
            max={Math.min(1000, balance)}
            step={10}
            disabled={isPlaying}
            className="w-full"
          />

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => onBetAmountChange(Math.min(amount, balance))}
                disabled={isPlaying || amount > balance}
                className={cn(
                  "border-chicken-lane text-[10px] sm:text-xs h-8 sm:h-9",
                  betAmount === amount && "bg-chicken-gold/20 border-chicken-gold"
                )}
              >
                ₹{amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Difficulty Section */}
        <div className="space-y-3 sm:space-y-4">
          <label className="text-xs sm:text-sm font-medium text-muted-foreground">Difficulty</label>
          
          {/* Difficulty Tabs */}
          <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-1.5 sm:gap-0">
            {(['easy', 'medium', 'hard', 'hardcore'] as const).map((level) => (
              <Button
                key={level}
                variant="outline"
                size="sm"
                onClick={() => onDifficultyChange(level)}
                disabled={isPlaying}
                className={cn(
                  "flex-1 capitalize border-chicken-lane text-[10px] sm:text-xs h-8 sm:h-9",
                  difficulty === level && "bg-chicken-gold/20 border-chicken-gold",
                  level === 'hardcore' && "relative"
                )}
              >
                {level}
                {level === 'hardcore' && (
                  <span className="absolute -top-1 -right-1 bg-chicken-fire text-white text-[7px] sm:text-[8px] px-0.5 sm:px-1 rounded">
                    NEW
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Info Display */}
          <div className="bg-chicken-dark/50 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Base Multiplier</span>
              <span className={cn("font-bold text-xs sm:text-sm", difficultyInfo.color)}>
                {difficultyInfo.multiplier}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Chance of Collision</span>
              <span className="text-xs sm:text-sm font-semibold text-chicken-fire">
                {difficultyInfo.chance}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col justify-center space-y-2 sm:space-y-3">
          {isPlaying ? (
            <>
              {/* Cash Out Button */}
              <Button
                onClick={onCashOut}
                disabled={isDisabled}
                size="lg"
                className="bg-gradient-to-r from-chicken-gold to-yellow-600 hover:from-yellow-600 hover:to-chicken-gold text-chicken-dark font-bold text-base sm:text-lg h-12 sm:h-14 shadow-lg"
              >
                <ChevronUp className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                CASH OUT
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm">({multiplier.toFixed(2)}x)</span>
              </Button>

              {/* Stop Button */}
              <Button
                onClick={() => {/* Handle stop */}}
                variant="destructive"
                size="lg"
                className="h-12 sm:h-14 font-bold text-sm sm:text-base"
                disabled={isDisabled}
              >
                <X className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                STOP
              </Button>
            </>
          ) : (
            /* Play Button */
            <Button
              onClick={onPlaceBet}
              disabled={isDisabled || betAmount > balance}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-chicken-success hover:from-green-600 hover:to-green-500 text-white font-bold text-lg sm:text-xl h-14 sm:h-16 shadow-lg"
            >
              <Play className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              GO
            </Button>
          )}

          {/* Balance Warning */}
          {betAmount > balance && (
            <p className="text-[10px] sm:text-xs text-chicken-fire text-center">
              Insufficient balance
            </p>
          )}
        </div>
      </div>
    </div>
  );
};