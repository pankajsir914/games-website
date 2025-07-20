
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Wallet, Timer, Target } from 'lucide-react';
import { GameData } from '@/pages/Aviator';

interface GameControlsProps {
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
  onPlaceBet: () => void;
  bettingCountdown: number;
}

const GameControls = ({ gameData, setGameData, onPlaceBet, bettingCountdown }: GameControlsProps) => {
  const handleBetChange = (value: string) => {
    const betAmount = Math.max(10, Math.min(10000, Number(value) || 10));
    setGameData(prev => ({ ...prev, betAmount }));
  };

  const handleAutoCashOutChange = (value: string) => {
    const autoCashOut = value === '' ? null : Math.max(1.1, Number(value) || 1.1);
    setGameData(prev => ({ ...prev, autoCashOut }));
  };

  const quickBetAmounts = [50, 100, 500, 1000, 2000];

  const canBet = gameData.gameState === 'betting' && bettingCountdown > 0 && !gameData.hasBet;

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-gaming-gold" />
            <span>Your Wallet</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Balance:</span>
              <span className="text-2xl font-bold text-gaming-gold">₹{gameData.balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Profit:</span>
              <span className={`text-xl font-bold ${
                gameData.profit >= 0 ? 'text-gaming-success' : 'text-gaming-danger'
              }`}>
                {gameData.profit >= 0 ? '+' : ''}₹{gameData.profit.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Betting Status */}
      {gameData.gameState === 'betting' && (
        <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <Timer className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-primary mb-2">{bettingCountdown}</div>
              <p className="text-sm text-muted-foreground">seconds left to bet</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bet Controls */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
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
              disabled={!canBet}
              className="mt-2 bg-slate-700 border-slate-600 text-foreground"
            />
          </div>

          {/* Quick Bet Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickBetAmounts.map(amount => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => handleBetChange(amount.toString())}
                disabled={!canBet}
                className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600"
              >
                ₹{amount}
              </Button>
            ))}
          </div>

          {/* Auto Cash Out */}
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
              className="mt-2 bg-slate-700 border-slate-600 text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Automatically cash out at this multiplier
            </p>
          </div>

          {/* Bet Button */}
          <Button
            onClick={onPlaceBet}
            disabled={!canBet || gameData.betAmount > gameData.balance}
            className={`w-full text-lg font-bold py-6 transition-all duration-300 ${
              gameData.hasBet 
                ? 'bg-gaming-success hover:bg-gaming-success/90' 
                : 'bg-primary hover:bg-primary/90'
            }`}
            size="lg"
          >
            <Play className="mr-2 h-5 w-5" />
            {gameData.hasBet ? '✓ Bet Placed' : canBet ? 'Place Bet' : 'Betting Closed'}
          </Button>

          {gameData.hasBet && (
            <div className="bg-gaming-success/20 p-4 rounded-lg border border-gaming-success/30">
              <div className="text-center">
                <div className="text-gaming-success font-bold text-lg">
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
