import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BetHistoryItem {
  id: string;
  username: string;
  bet_amount: number;
  cashout_multiplier?: number;
  payout_amount: number;
  status: 'active' | 'cashed_out' | 'crashed';
  created_at: string;
}

interface BettingHistoryProps {
  bets: BetHistoryItem[];
  currentRoundBets?: BetHistoryItem[];
}

const BettingHistory = ({ bets, currentRoundBets = [] }: BettingHistoryProps) => {
  const getPlayerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const maskUsername = (username: string) => {
    if (username.length <= 3) return username;
    return username.substring(0, 2) + '*'.repeat(username.length - 3) + username.slice(-1);
  };

  return (
    <Card className="bg-slate-900/95 border-slate-700/50 h-full">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          Live Bets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] sm:h-[400px] md:h-[500px]">
          <div className="space-y-1 px-2 sm:px-4 pb-2 sm:pb-4">
            {/* Current Round Header */}
            {currentRoundBets.length > 0 && (
              <div className="text-xs text-primary font-medium mb-2 px-2">
                Current Round ({currentRoundBets.length} bets)
              </div>
            )}

            {/* Current Round Bets */}
            {currentRoundBets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {getPlayerInitials(bet.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground truncate">
                    {maskUsername(bet.username)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">₹{formatAmount(bet.bet_amount)}</span>
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Active
                  </Badge>
                </div>
              </div>
            ))}

            {/* Previous Rounds Header */}
            <div className="text-xs text-muted-foreground font-medium mb-2 px-2 pt-2 border-t border-slate-700/50">
              Recent Results
            </div>

            {/* Previous Round Bets */}
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-slate-700">
                      {getPlayerInitials(bet.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground truncate">
                    {maskUsername(bet.username)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">₹{formatAmount(bet.bet_amount)}</span>
                  {bet.cashout_multiplier && (
                    <span className={`font-medium ${
                      bet.status === 'cashed_out' ? 'text-gaming-success' : 'text-gaming-danger'
                    }`}>
                      {bet.cashout_multiplier.toFixed(2)}x
                    </span>
                  )}
                  {bet.status === 'cashed_out' ? (
                    <TrendingUp className="w-3 h-3 text-gaming-success" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-gaming-danger" />
                  )}
                  {bet.payout_amount > 0 && (
                    <span className={`font-medium ${
                      bet.status === 'cashed_out' ? 'text-gaming-success' : 'text-gaming-danger'
                    }`}>
                      ₹{formatAmount(bet.payout_amount)}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {bets.length === 0 && currentRoundBets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-xs">No bets yet</div>
                <div className="text-xs mt-1">Be the first to place a bet!</div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BettingHistory;