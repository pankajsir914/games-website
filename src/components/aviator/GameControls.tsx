
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Play, RotateCcw, Wallet } from 'lucide-react';
import { GameData } from '@/pages/Aviator';

interface GameControlsProps {
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
  onStartGame: () => void;
  onResetGame: () => void;
}

const GameControls = ({ gameData, setGameData, onStartGame, onResetGame }: GameControlsProps) => {
  const handleBetChange = (value: string) => {
    const betAmount = Math.max(10, Math.min(10000, Number(value) || 10));
    setGameData(prev => ({ ...prev, betAmount }));
  };

  const handleAutoCashOutChange = (value: string) => {
    const autoCashOut = value === '' ? null : Math.max(1.1, Number(value) || 1.1);
    setGameData(prev => ({ ...prev, autoCashOut }));
  };

  const quickBetAmounts = [50, 100, 500, 1000];

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span>Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-semibold">₹{gameData.balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit:</span>
              <span className={`font-semibold ${
                gameData.profit >= 0 ? 'text-gaming-success' : 'text-gaming-danger'
              }`}>
                ₹{gameData.profit.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bet Controls */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle>Bet Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bet-amount">Bet Amount (₹)</Label>
            <Input
              id="bet-amount"
              type="number"
              value={gameData.betAmount}
              onChange={(e) => handleBetChange(e.target.value)}
              min="10"
              max="10000"
              step="10"
              disabled={gameData.isPlaying}
              className="mt-1"
            />
          </div>

          {/* Quick Bet Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {quickBetAmounts.map(amount => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => handleBetChange(amount.toString())}
                disabled={gameData.isPlaying}
                className="text-xs"
              >
                ₹{amount}
              </Button>
            ))}
          </div>

          {/* Auto Cash Out */}
          <div>
            <Label htmlFor="auto-cashout">Auto Cash Out (x)</Label>
            <Input
              id="auto-cashout"
              type="number"
              value={gameData.autoCashOut || ''}
              onChange={(e) => handleAutoCashOutChange(e.target.value)}
              min="1.1"
              max="100"
              step="0.1"
              placeholder="Disabled"
              disabled={gameData.isPlaying}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Automatically cash out at this multiplier
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={onStartGame}
              disabled={gameData.isPlaying || gameData.betAmount > gameData.balance}
              className="w-full"
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              {gameData.isPlaying ? 'Game in Progress' : 'Start Game'}
            </Button>

            {gameData.gameState !== 'waiting' && gameData.gameState !== 'playing' && (
              <Button
                onClick={onResetGame}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                New Round
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameControls;
