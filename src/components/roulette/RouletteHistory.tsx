
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RouletteRound } from '@/types/roulette';

interface RouletteHistoryProps {
  roundHistory: RouletteRound[];
  userBetHistory: any[];
}

// Red numbers in roulette
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num: number) => {
  if (num === 0) return 'green';
  return redNumbers.includes(num) ? 'red' : 'black';
};

export const RouletteHistory = ({ roundHistory, userBetHistory }: RouletteHistoryProps) => {
  return (
    <div className="space-y-6">
      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {roundHistory.slice(0, 20).map((round) => (
              <div
                key={round.id}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                  round.winning_number !== undefined && getNumberColor(round.winning_number) === 'green' && "bg-green-500",
                  round.winning_number !== undefined && getNumberColor(round.winning_number) === 'red' && "bg-red-500",
                  round.winning_number !== undefined && getNumberColor(round.winning_number) === 'black' && "bg-gray-800"
                )}
                title={`Round ${round.round_number}: ${round.winning_number}`}
              >
                {round.winning_number}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Bet History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Your Betting History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userBetHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No betting history yet. Place your first bet!
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userBetHistory.slice(0, 20).map((bet: any) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs",
                      bet.roulette_rounds.winning_number !== undefined && getNumberColor(bet.roulette_rounds.winning_number) === 'green' && "bg-green-500",
                      bet.roulette_rounds.winning_number !== undefined && getNumberColor(bet.roulette_rounds.winning_number) === 'red' && "bg-red-500",
                      bet.roulette_rounds.winning_number !== undefined && getNumberColor(bet.roulette_rounds.winning_number) === 'black' && "bg-gray-800"
                    )}>
                      {bet.roulette_rounds.winning_number}
                    </div>
                    
                    <div>
                      <div className="font-medium">
                        Round #{bet.roulette_rounds.round_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bet.bet_type === 'straight' 
                          ? `Number ${bet.bet_value}` 
                          : bet.bet_type.replace('_', ' ').toUpperCase()
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">₹{bet.bet_amount}</div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={bet.status === 'won' ? 'default' : 'destructive'}
                        className={cn(
                          bet.status === 'won' && "bg-green-500",
                          bet.status === 'lost' && "bg-red-500"
                        )}
                      >
                        {bet.status.toUpperCase()}
                      </Badge>
                      {bet.status === 'won' && bet.payout_amount && (
                        <span className="text-green-600 font-bold text-sm">
                          +₹{bet.payout_amount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
