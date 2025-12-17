
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { AndarBaharRound, AndarBaharBet } from '@/types/andarBahar';
import { Timer, Coins } from 'lucide-react';

interface BettingInterfaceProps {
  currentRound: AndarBaharRound | null;
  userBet: AndarBaharBet | null;
  timeRemaining: number;
  onPlaceBet: (roundId: string, betSide: 'andar' | 'bahar', amount: number) => void;
  isPlacingBet: boolean;
  disabled?: boolean;
}

export const BettingInterface = ({
  currentRound,
  userBet,
  timeRemaining,
  onPlaceBet,
  isPlacingBet,
  disabled = false
}: BettingInterfaceProps) => {
  const { wallet } = useWallet();
  const [betAmount, setBetAmount] = useState<string>('50');
  const [selectedSide, setSelectedSide] = useState<'andar' | 'bahar' | null>(null);

  const quickAmounts = [10, 25, 50, 100, 250, 500];
  const canBet = currentRound?.status === 'betting' && timeRemaining > 0 && !userBet && !disabled;
  const betAmountNum = parseFloat(betAmount) || 0;

  const handlePlaceBet = () => {
    if (!currentRound || !selectedSide || betAmountNum < 10) return;
    onPlaceBet(currentRound.id, selectedSide, betAmountNum);
    setSelectedSide(null);
  };

  if (!currentRound) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Waiting for next round...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Place Your Bet</span>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <Badge variant={timeRemaining > 5 ? "default" : "destructive"}>
              {timeRemaining}s
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userBet ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">Bet Placed!</p>
                <p className="text-sm text-green-600">
                  ₹{userBet.bet_amount} on {userBet.bet_side.toUpperCase()}
                </p>
              </div>
              <Badge variant="outline" className="bg-green-100">
                {userBet.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>Available Balance: ₹{wallet?.current_balance?.toFixed(2) || '0.00'}</span>
            </div>

            {/* Side Selection */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedSide === 'andar' ? 'default' : 'outline'}
                onClick={() => setSelectedSide('andar')}
                disabled={!canBet || disabled}
                className="h-16 text-lg font-semibold"
              >
                <div className="text-center">
                  <div>ANDAR</div>
                  <div className="text-sm opacity-70">1.9x</div>
                </div>
              </Button>
              <Button
                variant={selectedSide === 'bahar' ? 'default' : 'outline'}
                onClick={() => setSelectedSide('bahar')}
                disabled={!canBet || disabled}
                className="h-16 text-lg font-semibold"
              >
                <div className="text-center">
                  <div>BAHAR</div>
                  <div className="text-sm opacity-70">2.0x</div>
                </div>
              </Button>
            </div>

            {/* Amount Selection */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={betAmount === amount.toString() ? 'default' : 'outline'}
                    onClick={() => setBetAmount(amount.toString())}
                    disabled={!canBet || disabled}
                    size="sm"
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={!canBet || disabled}
                  min="10"
                  max={wallet?.current_balance || 0}
                />
                <Button
                  onClick={handlePlaceBet}
                  disabled={
                    !canBet || 
                    !selectedSide || 
                    betAmountNum < 10 || 
                    betAmountNum > (wallet?.current_balance || 0) ||
                    isPlacingBet ||
                    disabled
                  }
                  className="px-8"
                >
                  {isPlacingBet ? 'Placing...' : 'Place Bet'}
                </Button>
              </div>
            </div>

            {betAmountNum < 10 && betAmount && (
              <p className="text-sm text-red-600">Minimum bet amount is ₹10</p>
            )}
            {betAmountNum > (wallet?.current_balance || 0) && (
              <p className="text-sm text-red-600">Insufficient balance</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
