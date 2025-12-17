import { AndarBaharRound } from '@/types/andarBahar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface GameStatisticsProps {
  gameHistory: AndarBaharRound[];
}

export const GameStatistics = ({ gameHistory }: GameStatisticsProps) => {
  const last10Rounds = gameHistory.slice(0, 10);
  
  // Calculate statistics
  const andarWins = last10Rounds.filter(r => r.winning_side === 'andar').length;
  const baharWins = last10Rounds.filter(r => r.winning_side === 'bahar').length;
  const andarPercentage = last10Rounds.length > 0 ? (andarWins / last10Rounds.length) * 100 : 0;
  const baharPercentage = last10Rounds.length > 0 ? (baharWins / last10Rounds.length) * 100 : 0;

  // Find streaks
  let currentStreak = 0;
  let currentStreakSide: 'andar' | 'bahar' | null = null;
  for (const round of last10Rounds) {
    if (round.winning_side === currentStreakSide) {
      currentStreak++;
    } else {
      currentStreak = 1;
      currentStreakSide = round.winning_side;
    }
    if (currentStreak >= 3) break;
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Game Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win Percentages */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-yellow-600/20 rounded-lg p-3 border border-yellow-600/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400 font-semibold">ANDAR</span>
              {andarPercentage > 50 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
            </div>
            <div className="text-2xl font-bold text-white">{andarPercentage.toFixed(0)}%</div>
            <div className="text-sm text-gray-400">{andarWins} wins</div>
          </div>
          
          <div className="bg-blue-600/20 rounded-lg p-3 border border-blue-600/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 font-semibold">BAHAR</span>
              {baharPercentage > 50 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
            </div>
            <div className="text-2xl font-bold text-white">{baharPercentage.toFixed(0)}%</div>
            <div className="text-sm text-gray-400">{baharWins} wins</div>
          </div>
        </div>

        {/* Streak Indicator */}
        {currentStreak >= 3 && currentStreakSide && (
          <div className="bg-purple-600/20 rounded-lg p-3 border border-purple-600/50">
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-semibold">HOT STREAK</span>
              <Badge className={`${
                currentStreakSide === 'andar' ? 'bg-yellow-600' : 'bg-blue-600'
              } text-white`}>
                {currentStreakSide.toUpperCase()} x{currentStreak}
              </Badge>
            </div>
          </div>
        )}

        {/* Last 10 Results */}
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Last 10 Results</h4>
          <div className="flex gap-1 flex-wrap">
            {last10Rounds.map((round, index) => (
              <Badge
                key={round.id}
                className={`${
                  round.winning_side === 'andar'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : round.winning_side === 'bahar'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600'
                } text-white transition-all hover:scale-110`}
              >
                {round.winning_side ? round.winning_side[0].toUpperCase() : '-'}
              </Badge>
            ))}
            {last10Rounds.length === 0 && (
              <span className="text-gray-500 text-sm">No history yet</span>
            )}
          </div>
        </div>

        {/* Payout Information */}
        <div className="bg-black/30 rounded-lg p-3">
          <h4 className="text-sm text-gray-400 mb-2">Payout Rates</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-yellow-400">Andar:</span>
              <span className="text-white font-semibold">1.90x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400">Bahar:</span>
              <span className="text-white font-semibold">1.95x</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};