import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, RotateCcw, Loader2 } from 'lucide-react';
import { GameData } from '@/pages/Aviator';

interface DualBettingControlsProps {
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
  onPlaceBet: (betIndex: number, amount: number, autoCashout?: number) => void;
  bettingCountdown: number;
  isPlacingBet?: boolean;
  disabled?: boolean;
}

const DualBettingControls = ({ 
  gameData, 
  setGameData, 
  onPlaceBet, 
  bettingCountdown, 
  isPlacingBet = false, 
  disabled = false 
}: DualBettingControlsProps) => {
  const [bet1Amount, setBet1Amount] = useState(100);
  const [bet2Amount, setBet2Amount] = useState(100);
  const [bet1AutoCashout, setBet1AutoCashout] = useState<number | null>(null);
  const [bet2AutoCashout, setBet2AutoCashout] = useState<number | null>(null);

  const quickAmounts = [100, 200, 500, 1000];
  const canBet = gameData.gameState === 'betting' && bettingCountdown > 0 && !disabled;

  const adjustAmount = (betIndex: number, increment: number) => {
    if (betIndex === 1) {
      setBet1Amount(prev => Math.max(10, Math.min(10000, prev + increment)));
    } else {
      setBet2Amount(prev => Math.max(10, Math.min(10000, prev + increment)));
    }
  };

  const setQuickAmount = (betIndex: number, amount: number) => {
    if (betIndex === 1) {
      setBet1Amount(amount);
    } else {
      setBet2Amount(amount);
    }
  };

  const handlePlaceBet = (betIndex: number) => {
    const amount = betIndex === 1 ? bet1Amount : bet2Amount;
    const autoCashout = betIndex === 1 ? bet1AutoCashout : bet2AutoCashout;
    onPlaceBet(betIndex, amount, autoCashout || undefined);
  };

  const renderBetPanel = (betIndex: number, amount: number, setAmount: (value: number) => void, autoCashout: number | null, setAutoCashout: (value: number | null) => void) => (
    <div className="flex-1 space-y-2 sm:space-y-3">
      {/* Bet Amount Input */}
      <div className="relative">
        <div className="flex items-center border border-slate-600 rounded-lg bg-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => adjustAmount(betIndex, -10)}
            disabled={!canBet || amount <= 10}
            className="h-10 sm:h-12 px-2 sm:px-3 border-0 rounded-l-lg hover:bg-slate-700"
          >
            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(10, Math.min(10000, Number(e.target.value) || 10)))}
            className="border-0 text-center bg-transparent h-10 sm:h-12 text-base sm:text-lg font-bold"
            disabled={!canBet}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => adjustAmount(betIndex, 10)}
            disabled={!canBet || amount >= 10000}
            className="h-10 sm:h-12 px-2 sm:px-3 border-0 rounded-r-lg hover:bg-slate-700"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-2 gap-1">
        {quickAmounts.map(quickAmount => (
          <Button
            key={quickAmount}
            variant="outline"
            size="sm"
            onClick={() => setQuickAmount(betIndex, quickAmount)}
            disabled={!canBet}
            className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 h-7 sm:h-8"
          >
            {quickAmount}
          </Button>
        ))}
      </div>

      {/* Auto Cashout */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={autoCashout || ''}
          onChange={(e) => setAutoCashout(e.target.value ? Number(e.target.value) : null)}
          placeholder="Auto"
          className="bg-slate-800 border-slate-600 text-sm h-8"
          step="0.1"
          min="1.1"
          disabled={!canBet}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAutoCashout(null)}
          disabled={!canBet || !autoCashout}
          className="h-8 px-2"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      {/* Bet Button */}
      <Button
        onClick={() => handlePlaceBet(betIndex)}
        disabled={!canBet || amount > gameData.balance || isPlacingBet}
        className="w-full bg-gaming-success hover:bg-gaming-success/90 text-gaming-success-foreground font-bold py-3 sm:py-4 text-sm sm:text-base"
        style={{
          boxShadow: '0 0 20px hsl(var(--gaming-success))'
        }}
      >
        {isPlacingBet ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            Betting...
          </>
        ) : (
          <>
            Bet
            <div className="ml-2 text-xs sm:text-sm">₹{amount}</div>
          </>
        )}
      </Button>

      {/* Potential Win Display */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">Potential Win</div>
        <div className="text-sm font-bold text-gaming-success">
          ₹{(amount * (autoCashout || 2)).toFixed(2)}
        </div>
      </div>
    </div>
  );

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

        {/* Dual Betting Panels */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {renderBetPanel(1, bet1Amount, setBet1Amount, bet1AutoCashout, setBet1AutoCashout)}
          {renderBetPanel(2, bet2Amount, setBet2Amount, bet2AutoCashout, setBet2AutoCashout)}
        </div>

        {/* Active Bets Display */}
        {gameData.hasBet && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-primary/20 rounded-lg border border-primary/30">
            <div className="text-center text-primary font-medium text-sm sm:text-base">
              Active Bet: ₹{gameData.currentBet}
              {gameData.autoCashOut && (
                <span className="block text-xs text-muted-foreground">
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

export default DualBettingControls;