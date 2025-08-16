import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  current_balance: number;
  total_winnings: number;
  games_played: number;
}

export const RouletteLeaderboard = () => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['roulette-leaderboard'],
    queryFn: async () => {
      // Get top 10 players by current balance
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          user_id,
          current_balance
        `)
        .order('current_balance', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get profile information separately
      const userIds = data.map(entry => entry.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Get additional stats for each user
      const enrichedData = await Promise.all(
        data.map(async (entry) => {
          // Get total winnings from roulette bets
          const { data: bets } = await supabase
            .from('roulette_bets')
            .select('payout_amount')
            .eq('user_id', entry.user_id)
            .not('payout_amount', 'is', null);

          const totalWinnings = bets?.reduce((sum, bet) => sum + (bet.payout_amount || 0), 0) || 0;
          const gamesPlayed = bets?.length || 0;

          const profile = profiles?.find(p => p.id === entry.user_id);

          return {
            user_id: entry.user_id,
            full_name: profile?.full_name || 'Anonymous',
            current_balance: entry.current_balance,
            total_winnings: totalWinnings,
            games_played: gamesPlayed,
          };
        })
      );

      return enrichedData as LeaderboardEntry[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700';
      default:
        return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Top Players
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top Players
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboard?.map((player, index) => (
          <div
            key={player.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg ${getRankColor(index + 1)} ${
              index < 3 ? 'text-white' : ''
            }`}
          >
            <div className="flex-shrink-0">
              {getRankIcon(index + 1)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">
                {player.full_name}
              </div>
              <div className="text-sm opacity-75">
                {player.games_played} games played
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold">
                ₹{player.current_balance.toLocaleString()}
              </div>
              <div className="text-sm opacity-75">
                +₹{player.total_winnings.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        
        {(!leaderboard || leaderboard.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No players yet. Be the first to play!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};