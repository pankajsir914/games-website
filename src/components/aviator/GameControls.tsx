
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Wallet, Timer, Target, Loader2 } from 'lucide-react';
import { GameData } from '@/pages/Aviator';

interface GameControlsProps {
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
  onPlaceBet: () => void;
  bettingCountdown: number;
  isPlacingBet?: boolean;
  disabled?: boolean;
}

const GameControls = ({ gameData, setGameData, onPlaceBet, bettingCountdown, isPlacingBet = false, disabled = false }: GameControlsProps) => {
  const handleBetChange = (value: string) => {
    const betAmount = Math.max(10, Math.min(10000, Number(value) || 10));
    setGameData(prev => ({ ...prev, betAmount }));
  };

  const handleAutoCashOutChange = (value: string) => {
    const autoCashOut = value === '' ? null : Math.max(1.1, Number(value) || 1.1);
    setGameData(prev => ({ ...prev, autoCashOut }));
  };

  const quickBetAmounts = [50, 100, 500, 1000, 2000];

  const canBet = gameData.gameState === 'betting' && bettingCountdown > 0 && !gameData.hasBet && !disabled;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Balance Card */}
      <Card className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-slate-700/50 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-gaming-gold" />
            <span>Your Wallet</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm sm:text-base">Balance:</span>
            <span className="text-xl sm:text-2xl font-bold text-gaming-gold tabular-nums">₹{gameData.balance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm sm:text-base">Total Profit:</span>
            <span className={`text-lg sm:text-xl font-bold tabular-nums ${
              gameData.profit >= 0 ? 'text-gaming-success' : 'text-gaming-danger'
            }`}>
              {gameData.profit >= 0 ? '+' : ''}₹{gameData.profit.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Betting Status */}
      {gameData.gameState === 'betting' && (
        <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 shadow-xl backdrop-blur-sm">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center">
              <Timer className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2 animate-pulse" />
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2 tabular-nums">{bettingCountdown}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">seconds left to bet</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Bet Controls */}
      <Card className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-slate-700/50 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span>Place Your Bet</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bet-amount" className="text-sm font-medium">Bet Amount (₹)</Label>
            <Input
              id="bet-amount"
              type="number"
              value={gameData.betAmount}
              onChange={(e) => handleBetChange(e.target.value)}
              min="10"
              max="10000"
              step="10"
                disabled={!canBet || disabled}
              className="mt-2 bg-slate-700 border-slate-600 text-foreground focus:border-primary/50 focus:ring-primary/20 text-base"
            />
          </div>

          {/* Enhanced Quick Bet Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-2">
            {quickBetAmounts.map(amount => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => handleBetChange(amount.toString())}
                disabled={!canBet || disabled}
                className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-primary/50 transition-all duration-200"
              >
                ₹{amount}
              </Button>
            ))}
          </div>

          {/* Enhanced Auto Cash Out */}
          <div>
            <Label htmlFor="auto-cashout" className="text-sm font-medium">Auto Cash Out (x)</Label>
            <Input
              id="auto-cashout"
              type="number"
              value={gameData.autoCashOut || ''}
              onChange={(e) => handleAutoCashOutChange(e.target.value)}
              min="1.1"
              max="100"
              step="0.1"
              placeholder="Optional"
              disabled={gameData.gameState === 'flying'}
              className="mt-2 bg-slate-700 border-slate-600 text-foreground focus:border-primary/50 focus:ring-primary/20 text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Automatically cash out at this multiplier
            </p>
          </div>

          {/* Enhanced Bet Button */}
          <Button
            onClick={onPlaceBet}
            disabled={!canBet || gameData.betAmount > gameData.balance || disabled}
            className={`w-full text-base sm:text-lg font-bold py-4 sm:py-6 transition-all duration-300 shadow-lg ${
              gameData.hasBet 
                ? 'bg-gaming-success hover:bg-gaming-success/90 border-2 border-gaming-success/30' 
                : 'bg-primary hover:bg-primary/90 border-2 border-primary/30'
            }`}
            size="lg"
            style={{
              boxShadow: gameData.hasBet 
                ? '0 0 20px hsl(var(--gaming-success))' 
                : '0 0 20px hsl(var(--primary))'
            }}
          >
            {disabled ? 'Game Paused' : isPlacingBet ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Placing Bet...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {gameData.hasBet ? '✓ Bet Placed' : canBet ? 'Place Bet' : 'Betting Closed'}
              </>
            )}
          </Button>

          {/* Enhanced Bet Status */}
          {gameData.hasBet && (
            <div className="bg-gaming-success/20 p-4 rounded-lg border border-gaming-success/30 shadow-lg backdrop-blur-sm">
              <div className="text-center">
                <div className="text-gaming-success font-bold text-base sm:text-lg">
                  Bet Active: ₹{gameData.currentBet}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Good luck! 🚀
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GameControls;
