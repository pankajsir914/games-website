
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AndarBaharRound } from '@/types/andarBahar';
import { CardComponent } from './CardComponent';
import { Clock } from 'lucide-react';

interface GameHistoryProps {
  gameHistory: AndarBaharRound[];
  userBetHistory: any[];
}

export const GameHistory = ({ gameHistory, userBetHistory }: GameHistoryProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Game Results History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {gameHistory.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CardComponent card={round.joker_card} size="small" />
                    <div>
                      <p className="font-semibold">Round #{round.round_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(round.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={round.winning_side === 'andar' ? 'default' : 'secondary'}
                      className={round.winning_side === 'andar' ? 'bg-blue-600' : 'bg-red-600'}
                    >
                      {round.winning_side?.toUpperCase()}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {round.andar_cards.length + round.bahar_cards.length} cards
                    </p>
                  </div>
                </div>
              ))}
              {gameHistory.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No game history yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User Betting History */}
      <Card>
        <CardHeader>
          <CardTitle>My Betting History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {userBetHistory.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      Round #{bet.andar_bahar_rounds.round_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Bet on {bet.bet_side.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(bet.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        bet.status === 'won' 
                          ? 'default' 
                          : bet.status === 'lost' 
                          ? 'destructive' 
                          : 'secondary'
                      }
                    >
                      {bet.status.toUpperCase()}
                    </Badge>
                    <p className="text-sm font-semibold">
                      ₹{bet.bet_amount}
                    </p>
                    {bet.payout_amount > 0 && (
                      <p className="text-sm text-green-600">
                        Won: ₹{bet.payout_amount}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {userBetHistory.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No betting history yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
