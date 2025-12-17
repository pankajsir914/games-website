import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveBet {
  id: string;
  username: string;
  bet_type: string;
  bet_value?: string;
  bet_amount: number;
  round_number: number;
  created_at: string;
}

interface RouletteLiveBetsPanelProps {
  liveBets: LiveBet[];
  totalPlayers: number;
  totalBetAmount: number;
}

const RouletteLiveBetsPanel: React.FC<RouletteLiveBetsPanelProps> = ({
  liveBets,
  totalPlayers,
  totalBetAmount
}) => {
  const formatBetDisplay = (bet: LiveBet) => {
    let display = bet.bet_type.replace(/_/g, ' ').toUpperCase();
    if (bet.bet_value) {
      display += ` ${bet.bet_value}`;
    }
    return display;
  };

  const getBetColor = (betType: string, betValue?: string) => {
    if (betType === 'red' || betValue === 'red') return 'text-red-500';
    if (betType === 'black' || betValue === 'black') return 'text-gray-800';
    if (betType === 'straight' && betValue === '0') return 'text-green-500';
    if (betType.includes('dozen') || betType.includes('column')) return 'text-blue-500';
    return 'text-yellow-500';
  };

  return (
    <Card className="p-4 bg-background/95 backdrop-blur">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Live Bets
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-secondary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Players
            </div>
            <div className="text-xl font-bold">{totalPlayers}</div>
          </div>
          
          <div className="bg-secondary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Bets
            </div>
            <div className="text-xl font-bold">₹{totalBetAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {liveBets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No bets placed yet</p>
            <p className="text-sm">Be the first to place a bet!</p>
          </div>
        ) : (
          liveBets.map((bet) => (
            <div
              key={bet.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                "bg-secondary/10 hover:bg-secondary/20 transition-colors",
                "border-l-4 border-primary/50"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {bet.username || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Round #{bet.round_number}
                  </span>
                </div>
                <div className={cn("text-sm mt-1", getBetColor(bet.bet_type, bet.bet_value))}>
                  {formatBetDisplay(bet)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  ₹{bet.bet_amount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(bet.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RouletteLiveBetsPanel;