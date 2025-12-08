// src/components/live-casino/BetHistory.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface BetHistoryProps {
  bets: any[];
}

export const BetHistory = ({ bets }: BetHistoryProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "default";
      case "lost":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Your Bets</CardTitle>
      </CardHeader>
      <CardContent>
        {bets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No bets yet. Place your first bet!
          </p>
        ) : (
          <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
            <div className="space-y-2 sm:space-y-3">
              {bets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold">
                        {bet.table_name}
                      </span>
                      <Badge
                        variant={getStatusColor(bet.status)}
                        className="text-xs"
                      >
                        {bet.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bet.bet_type} • {bet.odds}x
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bet.created_at &&
                        formatDistanceToNow(new Date(bet.created_at), {
                          addSuffix: true,
                        })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      ₹{Number(bet.bet_amount || 0).toFixed(2)}
                    </div>
                    {bet.status === "won" && bet.payout_amount && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        +₹{Number(bet.payout_amount).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
