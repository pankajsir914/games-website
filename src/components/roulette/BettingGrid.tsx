
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BetType, PlacedBet } from '@/types/roulette';

interface BettingGridProps {
  onPlaceBet: (betType: BetType, betValue: string | undefined, amount: number) => void;
  userBets: any[];
  disabled?: boolean;
  isPlacingBet?: boolean;
}

// Red numbers in roulette
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num: number) => {
  if (num === 0) return 'green';
  return redNumbers.includes(num) ? 'red' : 'black';
};

export const BettingGrid = ({ onPlaceBet, userBets, disabled, isPlacingBet }: BettingGridProps) => {
  const [betAmount, setBetAmount] = useState('10');
  const [selectedBets, setSelectedBets] = useState<PlacedBet[]>([]);

  const handleNumberBet = (number: number) => {
    const amount = parseFloat(betAmount);
    if (amount > 0) {
      onPlaceBet('straight', number.toString(), amount);
      setSelectedBets(prev => [...prev, {
        type: 'straight',
        value: number.toString(),
        amount,
        payout: '35:1'
      }]);
    }
  };

  const handleOutsideBet = (betType: BetType, payout: string) => {
    const amount = parseFloat(betAmount);
    if (amount > 0) {
      onPlaceBet(betType, undefined, amount);
      setSelectedBets(prev => [...prev, {
        type: betType,
        amount,
        payout
      }]);
    }
  };

  const getTotalBetAmount = () => {
    return userBets.reduce((total, bet) => total + bet.bet_amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Bet Amount Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Bet Amount (₹):</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              min="1"
              max="10000"
              className="w-32"
              disabled={disabled}
            />
            <div className="flex gap-2">
              {[10, 50, 100, 500].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(amount.toString())}
                  disabled={disabled}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Betting Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Numbers Grid */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Numbers (35:1)</h3>
            
            {/* Zero */}
            <div className="mb-4">
              <Button
                onClick={() => handleNumberBet(0)}
                disabled={disabled || isPlacingBet}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                0
              </Button>
            </div>

            {/* Number Grid */}
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 36 }, (_, i) => i + 1).map((number) => (
                <Button
                  key={number}
                  onClick={() => handleNumberBet(number)}
                  disabled={disabled || isPlacingBet}
                  className={cn(
                    "aspect-square text-white font-bold",
                    getNumberColor(number) === 'red' 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-gray-800 hover:bg-gray-700"
                  )}
                >
                  {number}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Outside Bets */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Outside Bets</h3>
            
            <div className="space-y-3">
              {/* Color Bets */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleOutsideBet('red', '1:1')}
                  disabled={disabled || isPlacingBet}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Red (1:1)
                </Button>
                <Button
                  onClick={() => handleOutsideBet('black', '1:1')}
                  disabled={disabled || isPlacingBet}
                  className="bg-gray-800 hover:bg-gray-700 text-white"
                >
                  Black (1:1)
                </Button>
              </div>

              {/* Even/Odd */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleOutsideBet('even', '1:1')}
                  disabled={disabled || isPlacingBet}
                  variant="outline"
                >
                  Even (1:1)
                </Button>
                <Button
                  onClick={() => handleOutsideBet('odd', '1:1')}
                  disabled={disabled || isPlacingBet}
                  variant="outline"
                >
                  Odd (1:1)
                </Button>
              </div>

              {/* High/Low */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleOutsideBet('low', '1:1')}
                  disabled={disabled || isPlacingBet}
                  variant="outline"
                >
                  1-18 (1:1)
                </Button>
                <Button
                  onClick={() => handleOutsideBet('high', '1:1')}
                  disabled={disabled || isPlacingBet}
                  variant="outline"
                >
                  19-36 (1:1)
                </Button>
              </div>

              {/* Dozens */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleOutsideBet('dozen_1', '2:1')}
                  disabled={disabled || isPlacingBet}
                  variant="secondary"
                >
                  1st 12 (2:1)
                </Button>
                <Button
                  onClick={() => handleOutsideBet('dozen_2', '2:1')}
                  disabled={disabled || isPlacingBet}
                  variant="secondary"
                >
                  2nd 12 (2:1)
                </Button>
                <Button
                  onClick={() => handleOutsideBet('dozen_3', '2:1')}
                  disabled={disabled || isPlacingBet}
                  variant="secondary"
                >
                  3rd 12 (2:1)
                </Button>
              </div>

              {/* Columns */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleOutsideBet('column_1', '2:1')}
                  disabled={disabled || isPlacingBet}
                  variant="secondary"
                >
                  Col 1 (2:1)
                </Button>
                <Button
                  onClick={() => handleOutsideBet('column_2', '2:1')}
                  disabled={disabled || isPlacingBet}
                  variant="secondary"
                >
                  Col 2 (2:1)
                </Button>
                <Button
                  onClick={() => handleOutsideBet('column_3', '2:1')}
                  disabled={disabled || isPlacingBet}
                  variant="secondary"
                >
                  Col 3 (2:1)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Bets Display */}
      {userBets.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Your Bets This Round</h3>
            <div className="space-y-2">
              {userBets.map((bet, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">
                    {bet.bet_type === 'straight' ? `Number ${bet.bet_value}` : bet.bet_type.replace('_', ' ')}
                  </span>
                  <span className="text-green-600 font-bold">₹{bet.bet_amount}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between items-center font-bold">
                <span>Total Bet:</span>
                <span className="text-green-600">₹{getTotalBetAmount()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
