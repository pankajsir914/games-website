import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveBet {
  id: string;
  username: string;
  bet_amount: number;
  cashout_multiplier?: number;
  status: 'active' | 'cashed_out' | 'crashed';
  created_at?: string;
}

interface LiveBetsPanelProps {
  liveBets: LiveBet[];
  totalPlayers: number;
  totalBetsAmount: number;
}

const LiveBetsPanel = ({ liveBets, totalPlayers, totalBetsAmount }: LiveBetsPanelProps) => {
  return (
    <Card className="bg-slate-900/90 border-slate-700/50 p-4 h-full backdrop-blur-sm">
      <div className="space-y-4">
        {/* Stats Header */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Players</span>
            </div>
            <div className="text-lg font-bold text-foreground mt-1">{totalPlayers}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gaming-gold" />
              <span className="text-xs text-muted-foreground">Total Pot</span>
            </div>
            <div className="text-lg font-bold text-gaming-gold mt-1">₹{totalBetsAmount.toFixed(0)}</div>
          </div>
        </div>

        {/* Live Bets Feed */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Bets
          </h3>
          
          <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
            {liveBets.map((bet) => (
              <div
                key={bet.id}
                className={cn(
                  "bg-slate-800/30 rounded-lg p-2 border transition-all duration-300 hover:bg-slate-800/50",
                  bet.status === 'active' && "border-primary/30 animate-pulse-subtle",
                  bet.status === 'cashed_out' && "border-gaming-success/30",
                  bet.status === 'crashed' && "border-gaming-danger/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
                        {bet.username}
                      </span>
                      {bet.status === 'cashed_out' && (
                        <TrendingUp className="h-3 w-3 text-gaming-success" />
                      )}
                      {bet.status === 'crashed' && (
                        <TrendingDown className="h-3 w-3 text-gaming-danger" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ₹{bet.bet_amount}
                      {bet.cashout_multiplier && (
                        <span className="text-gaming-success ml-1">
                          @{bet.cashout_multiplier}x
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {bet.status === 'active' && (
                    <div className="text-xs text-primary font-bold animate-pulse">
                      FLYING
                    </div>
                  )}
                  {bet.status === 'cashed_out' && bet.cashout_multiplier && (
                    <div className="text-xs text-gaming-success font-bold">
                      +₹{(bet.bet_amount * (bet.cashout_multiplier - 1)).toFixed(0)}
                    </div>
                  )}
                  {bet.status === 'crashed' && (
                    <div className="text-xs text-gaming-danger font-bold">
                      -₹{bet.bet_amount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LiveBetsPanel;