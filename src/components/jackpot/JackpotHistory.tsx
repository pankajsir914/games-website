
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Hash, Coins } from 'lucide-react';

interface JackpotWinner {
  id: string;
  game_id: string;
  user_id: string;
  prize_amount: number;
  winning_ticket_number: number;
  tier: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface JackpotHistoryProps {
  winners?: JackpotWinner[];
  loading: boolean;
}

export const JackpotHistory = ({ winners, loading }: JackpotHistoryProps) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="bg-white/10 backdrop-blur-sm animate-pulse">
            <CardContent className="p-6 h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (!winners || winners.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center text-white">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Winners Yet</h3>
          <p className="text-gray-300">
            Be the first to win a jackpot prize!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
            Recent Winners
          </CardTitle>
        </CardHeader>
      </Card>

      {winners.map((winner, index) => (
        <Card 
          key={winner.id} 
          className={`bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 ${
            index === 0 ? 'ring-2 ring-yellow-400/50' : ''
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${index === 0 ? 'bg-yellow-400' : 'bg-white/20'}`}>
                  <Trophy className={`h-6 w-6 ${index === 0 ? 'text-black' : 'text-white'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {winner.profiles?.full_name || 'Anonymous Player'}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(winner.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 mr-1" />
                      Ticket #{winner.winning_ticket_number}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end space-x-2 mb-2">
                  <Badge className={`${getTierColor(winner.tier)} text-white`}>
                    {winner.tier.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center text-2xl font-bold text-yellow-400">
                  <Coins className="h-6 w-6 mr-1" />
                  ₹{winner.prize_amount.toFixed(2)}
                </div>
              </div>
            </div>

            {index === 0 && (
              <div className="mt-4 p-3 bg-yellow-400/20 rounded-lg border border-yellow-400/50">
                <p className="text-yellow-400 font-semibold text-center">
                  🎉 Latest Winner! Congratulations! 🎉
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
