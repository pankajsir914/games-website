import { useState } from 'react';
import ChipStack from '@/components/game/ChipStack';
import { CircularTimer } from './CircularTimer';
import { useGameSounds } from '@/hooks/useGameSounds';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AndarBaharRound, AndarBaharBet } from '@/types/andarBahar';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';

interface ChipBettingInterfaceProps {
  currentRound: AndarBaharRound | null;
  userBet: AndarBaharBet | null;
  timeRemaining: number;
  onPlaceBet: (roundId: string, betSide: 'andar' | 'bahar', amount: number) => void;
  isPlacingBet: boolean;
  disabled?: boolean;
}

export const ChipBettingInterface = ({
  currentRound,
  userBet,
  timeRemaining,
  onPlaceBet,
  isPlacingBet,
  disabled
}: ChipBettingInterfaceProps) => {
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedSide, setSelectedSide] = useState<'andar' | 'bahar' | null>(null);
  const { wallet } = useWallet();
  const balance = wallet?.current_balance || 0;
  const { playChipPlace, playClick } = useGameSounds();

  const chipValues = [10, 50, 100, 500, 1000, 5000];
  
  const handleChipSelect = (value: number) => {
    if (value > balance) {
      toast.error('Insufficient balance');
      return;
    }
    setSelectedAmount(value);
    playChipPlace();
  };

  const handleSideSelect = (side: 'andar' | 'bahar') => {
    setSelectedSide(side);
    playClick();
  };

  const handlePlaceBet = () => {
    if (!currentRound || !selectedSide || selectedAmount === 0) return;
    
    if (selectedAmount < 10) {
      toast.error('Minimum bet amount is ₹10');
      return;
    }
    
    if (selectedAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    onPlaceBet(currentRound.id, selectedSide, selectedAmount);
    setSelectedAmount(0);
    setSelectedSide(null);
  };

  const handleQuickBet = (multiplier: number) => {
    if (userBet) {
      const newAmount = userBet.bet_amount * multiplier;
      if (newAmount <= balance) {
        setSelectedAmount(newAmount);
        playChipPlace();
      } else {
        toast.error('Insufficient balance');
      }
    }
  };

  if (!currentRound) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center text-gray-400">
            Waiting for next round...
          </div>
        </CardContent>
      </Card>
    );
  }

  const canBet = currentRound.status === 'betting' && !userBet && !disabled && timeRemaining > 0;

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-white">Place Your Bet</span>
          <CircularTimer timeRemaining={timeRemaining} size="sm" />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {userBet ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 rounded-lg p-4 border border-green-600">
              <div className="flex justify-between items-center">
                <span className="text-green-400">Bet Placed</span>
                <span className="text-white font-bold">₹{userBet.bet_amount}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-400">Side</span>
                <span className={cn(
                  "font-bold uppercase",
                  userBet.bet_side === 'andar' ? 'text-red-500' : 'text-blue-500'
                )}>
                  {userBet.bet_side}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickBet(2)}
                className="flex-1"
                disabled={!canBet}
              >
                Double (2x)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickBet(0.5)}
                className="flex-1"
                disabled={!canBet}
              >
                Half (0.5x)
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Chip Selection */}
            <div>
              <div className="text-sm text-gray-400 mb-3">Select Amount</div>
              <div className="grid grid-cols-3 gap-3">
                {chipValues.map((value) => (
                  <div key={value} className="flex justify-center">
                    <ChipStack
                      value={value}
                      color={value >= 1000 ? 'yellow' : value >= 500 ? 'purple' : value >= 100 ? 'blue' : value >= 50 ? 'green' : 'red'}
                      count={1}
                      selected={selectedAmount === value}
                      onClick={() => handleChipSelect(value)}
                    />
                  </div>
                ))}
              </div>
              {selectedAmount > 0 && (
                <div className="mt-3 text-center">
                  <span className="text-gray-400">Selected: </span>
                  <span className="text-white font-bold text-xl">₹{selectedAmount}</span>
                </div>
              )}
            </div>

            {/* Side Selection */}
            <div>
              <div className="text-sm text-gray-400 mb-3">Select Side</div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSideSelect('andar')}
                  disabled={!canBet || disabled}
                  className={cn(
                    "relative p-6 rounded-xl border-2 transition-all duration-300",
                    selectedSide === 'andar'
                      ? "border-red-500 bg-gradient-to-br from-red-900/50 to-red-800/50 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                      : "border-gray-600 bg-gray-800/50 hover:border-red-500/50",
                    !canBet && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="text-2xl font-bold text-red-500">ANDAR</div>
                  <div className="text-sm text-gray-400 mt-1">1.9x Payout</div>
                </button>

                <button
                  onClick={() => handleSideSelect('bahar')}
                  disabled={!canBet || disabled}
                  className={cn(
                    "relative p-6 rounded-xl border-2 transition-all duration-300",
                    selectedSide === 'bahar'
                      ? "border-blue-500 bg-gradient-to-br from-blue-900/50 to-blue-800/50 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                      : "border-gray-600 bg-gray-800/50 hover:border-blue-500/50",
                    !canBet && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="text-2xl font-bold text-blue-500">BAHAR</div>
                  <div className="text-sm text-gray-400 mt-1">2x Payout</div>
                </button>
              </div>
            </div>

            {/* Place Bet Button */}
            <Button
              onClick={handlePlaceBet}
              disabled={!canBet || !selectedSide || selectedAmount === 0 || isPlacingBet}
              className={cn(
                "w-full h-14 text-lg font-bold",
                selectedSide && selectedAmount > 0
                  ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  : ""
              )}
            >
              {isPlacingBet ? 'Placing Bet...' : 
               !canBet ? 'Betting Closed' :
               !selectedSide ? 'Select a Side' :
               selectedAmount === 0 ? 'Select Amount' :
               `Place Bet - ₹${selectedAmount} on ${selectedSide.toUpperCase()}`}
            </Button>
          </>
        )}

        {/* Balance Display */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Your Balance</span>
            <span className="text-white font-bold text-lg">₹{balance.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};