import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BetRecord {
  id: string;
  bet_amount: number;
  cashout_multiplier: number | null;
  payout_amount: number;
  status: 'active' | 'cashed_out' | 'crashed';
  created_at: string;
  round_id: string;
}

const MyBetHistory = () => {
  const { user } = useAuth();

  const { data: betHistory = [], isLoading } = useQuery({
    queryKey: ['aviator-my-bets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('aviator_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as BetRecord[];
    },
    enabled: !!user,
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getStatusBadge = (bet: BetRecord) => {
    if (bet.status === 'cashed_out') {
      return (
        <Badge className="bg-gaming-success/20 text-gaming-success border-gaming-success/30">
          Won
        </Badge>
      );
    }
    if (bet.status === 'crashed') {
      return (
        <Badge className="bg-gaming-danger/20 text-gaming-danger border-gaming-danger/30">
          Lost
        </Badge>
      );
    }
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30">
        Active
      </Badge>
    );
  };

  const calculateProfit = (bet: BetRecord) => {
    if (bet.status === 'cashed_out') {
      return bet.payout_amount - bet.bet_amount;
    }
    if (bet.status === 'crashed') {
      return -bet.bet_amount;
    }
    return 0;
  };

  return (
    <Card className="bg-slate-900/95 border-slate-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
          <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          My Bet History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] sm:h-[350px]">
          <div className="space-y-2 px-3 sm:px-4 pb-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading...
              </div>
            ) : betHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No bets yet</div>
                <div className="text-xs mt-1">Place your first bet to see history</div>
              </div>
            ) : (
              betHistory.map((bet) => {
                const profit = calculateProfit(bet);
                const isWin = profit > 0;

                return (
                  <div
                    key={bet.id}
                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(bet)}
                        <span className="text-xs text-muted-foreground">
                          {formatTime(bet.created_at)}
                        </span>
                      </div>
                      {bet.cashout_multiplier && (
                        <div className="text-sm font-bold text-gaming-gold">
                          {bet.cashout_multiplier.toFixed(2)}x
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div>
                        <div className="text-muted-foreground">Bet Amount</div>
                        <div className="font-semibold text-foreground">
                          {formatAmount(bet.bet_amount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Result</div>
                        <div className={`font-bold flex items-center justify-end gap-1 ${
                          isWin ? 'text-gaming-success' : 'text-gaming-danger'
                        }`}>
                          {isWin ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {isWin ? '+' : ''}{formatAmount(profit)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MyBetHistory;
