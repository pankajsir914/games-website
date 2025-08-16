import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Eye, EyeOff, Flag, Handshake } from 'lucide-react';

interface BettingControlsProps {
  isMyTurn: boolean;
  currentBet: number;
  isBlind: boolean;
  isSeen: boolean;
  onPlaceBet: (betType: string, amount: number) => void;
  activePlayers: number;
}

export function BettingControls({ 
  isMyTurn, 
  currentBet, 
  isBlind, 
  isSeen, 
  onPlaceBet, 
  activePlayers 
}: BettingControlsProps) {
  const [customBetAmount, setCustomBetAmount] = useState(currentBet || 10);

  const blindBetAmount = Math.max(currentBet, 10);
  const chaaalBetAmount = Math.max(currentBet * 2, 20);

  const handleBlindBet = () => {
    onPlaceBet('blind', blindBetAmount);
  };

  const handleChaalBet = () => {
    onPlaceBet('chaal', chaaalBetAmount);
  };

  const handleCustomBet = () => {
    if (customBetAmount >= currentBet) {
      onPlaceBet('chaal', customBetAmount);
    }
  };

  const handlePack = () => {
    onPlaceBet('pack', 0);
  };

  const handleShow = () => {
    onPlaceBet('show', currentBet);
  };

  const canShow = activePlayers === 2 && isSeen;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gray-800/90 border-gray-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-center flex items-center justify-center gap-2">
            <Coins className="h-5 w-5" />
            Betting Options
            {!isMyTurn && <Badge variant="secondary">Waiting for your turn</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Blind Bet */}
            {isBlind && (
              <Button
                onClick={handleBlindBet}
                disabled={!isMyTurn}
                className="h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex flex-col items-center justify-center"
              >
                <EyeOff className="h-4 w-4 mb-1" />
                <span className="text-sm">Blind</span>
                <span className="text-xs">₹{blindBetAmount}</span>
              </Button>
            )}

            {/* Chaal Bet */}
            <Button
              onClick={handleChaalBet}
              disabled={!isMyTurn}
              className="h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 flex flex-col items-center justify-center"
            >
              <Eye className="h-4 w-4 mb-1" />
              <span className="text-sm">Chaal</span>
              <span className="text-xs">₹{chaaalBetAmount}</span>
            </Button>

            {/* Pack (Fold) */}
            <Button
              onClick={handlePack}
              disabled={!isMyTurn}
              variant="destructive"
              className="h-16 hover:bg-red-700 disabled:opacity-50 flex flex-col items-center justify-center"
            >
              <Flag className="h-4 w-4 mb-1" />
              <span className="text-sm">Pack</span>
              <span className="text-xs">(Fold)</span>
            </Button>

            {/* Show */}
            {canShow && (
              <Button
                onClick={handleShow}
                disabled={!isMyTurn}
                className="h-16 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 flex flex-col items-center justify-center"
              >
                <Handshake className="h-4 w-4 mb-1" />
                <span className="text-sm">Show</span>
                <span className="text-xs">₹{currentBet}</span>
              </Button>
            )}
          </div>

          {/* Custom Bet Amount */}
          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <div className="text-white text-sm mb-2">Custom Bet Amount:</div>
            <div className="flex gap-3">
              <Input
                type="number"
                value={customBetAmount}
                onChange={(e) => setCustomBetAmount(Number(e.target.value))}
                min={currentBet}
                step="10"
                className="bg-gray-600 border-gray-500 text-white"
                placeholder="Enter amount"
              />
              <Button
                onClick={handleCustomBet}
                disabled={!isMyTurn || customBetAmount < currentBet}
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:opacity-50"
              >
                Bet ₹{customBetAmount}
              </Button>
            </div>
            {customBetAmount < currentBet && (
              <div className="text-red-400 text-xs mt-1">
                Minimum bet: ₹{currentBet}
              </div>
            )}
          </div>

          {/* Betting Rules */}
          <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
            <div className="text-gray-300 text-xs space-y-1">
              <div><strong>Blind:</strong> Bet without seeing cards (lower amount)</div>
              <div><strong>Chaal:</strong> Bet after seeing cards (higher amount)</div>
              <div><strong>Pack:</strong> Fold and exit the round</div>
              <div><strong>Show:</strong> Compare cards with opponent (only with 2 players left)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}