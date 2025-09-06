import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouletteStatisticsProps {
  roundHistory: Array<{
    id: string;
    round_number: number;
    winning_number?: number;
    winning_color?: string;
  }>;
  sessionStats?: {
    totalBets: number;
    totalWon: number;
    totalLost: number;
    profit: number;
  };
}

const RouletteStatistics: React.FC<RouletteStatisticsProps> = ({
  roundHistory,
  sessionStats
}) => {
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  
  // Calculate hot and cold numbers
  const numberFrequency = roundHistory.reduce((acc, round) => {
    if (round.winning_number !== undefined) {
      acc[round.winning_number] = (acc[round.winning_number] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const sortedNumbers = Object.entries(numberFrequency)
    .sort(([, a], [, b]) => b - a)
    .map(([num, count]) => ({ number: parseInt(num), count }));

  const hotNumbers = sortedNumbers.slice(0, 5);
  const coldNumbers = Array.from({ length: 37 }, (_, i) => i)
    .filter(num => !numberFrequency[num] || numberFrequency[num] === Math.min(...Object.values(numberFrequency)))
    .slice(0, 5)
    .map(num => ({ number: num, count: numberFrequency[num] || 0 }));

  // Calculate color statistics
  const colorStats = roundHistory.reduce((acc, round) => {
    if (round.winning_color) {
      acc[round.winning_color] = (acc[round.winning_color] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalRounds = roundHistory.length;
  const redPercentage = ((colorStats.red || 0) / totalRounds * 100) || 0;
  const blackPercentage = ((colorStats.black || 0) / totalRounds * 100) || 0;
  const greenPercentage = ((colorStats.green || 0) / totalRounds * 100) || 0;

  // Calculate streaks
  let currentStreak = { color: '', count: 0 };
  let longestStreak = { color: '', count: 0 };
  
  roundHistory.forEach(round => {
    if (round.winning_color === currentStreak.color) {
      currentStreak.count++;
      if (currentStreak.count > longestStreak.count) {
        longestStreak = { ...currentStreak };
      }
    } else {
      currentStreak = { color: round.winning_color || '', count: 1 };
    }
  });

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-green-600';
    return redNumbers.includes(num) ? 'bg-red-600' : 'bg-gray-900';
  };

  return (
    <div className="space-y-4">
      {/* Session Stats */}
      {sessionStats && (
        <Card className="bg-slate-900/95 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Session Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Total Bets</div>
              <div className="text-lg font-bold">{sessionStats.totalBets}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Profit/Loss</div>
              <div className={cn(
                "text-lg font-bold flex items-center gap-1",
                sessionStats.profit >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {sessionStats.profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                ₹{Math.abs(sessionStats.profit)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Won</div>
              <div className="text-lg font-bold text-green-500">₹{sessionStats.totalWon}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Lost</div>
              <div className="text-lg font-bold text-red-500">₹{sessionStats.totalLost}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hot & Cold Numbers */}
      <Card className="bg-slate-900/95 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Hot & Cold Numbers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-2">🔥 Hot Numbers</div>
            <div className="flex gap-2 flex-wrap">
              {hotNumbers.map(({ number, count }) => (
                <div key={number} className="relative">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                    getNumberColor(number)
                  )}>
                    {number}
                  </div>
                  <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0 bg-orange-500">
                    {count}
                  </Badge>
                </div>
              ))}
              {hotNumbers.length === 0 && (
                <div className="text-xs text-muted-foreground">No data yet</div>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-2">❄️ Cold Numbers</div>
            <div className="flex gap-2 flex-wrap">
              {coldNumbers.map(({ number, count }) => (
                <div key={number} className="relative">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm opacity-60",
                    getNumberColor(number)
                  )}>
                    {number}
                  </div>
                  <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0 bg-blue-500">
                    {count}
                  </Badge>
                </div>
              ))}
              {coldNumbers.length === 0 && (
                <div className="text-xs text-muted-foreground">No data yet</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Distribution */}
      <Card className="bg-slate-900/95 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Color Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <div className="flex-1">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all"
                  style={{ width: `${redPercentage}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs font-bold w-12 text-right">{redPercentage.toFixed(1)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-900 rounded"></div>
            <div className="flex-1">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-900 transition-all"
                  style={{ width: `${blackPercentage}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs font-bold w-12 text-right">{blackPercentage.toFixed(1)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <div className="flex-1">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${greenPercentage}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs font-bold w-12 text-right">{greenPercentage.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Results */}
      <Card className="bg-slate-900/95 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Last 20 Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-24">
            <div className="flex gap-1 flex-wrap">
              {roundHistory.slice(0, 20).map((round) => (
                <div
                  key={round.id}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs",
                    round.winning_color === 'red' ? 'bg-red-600' :
                    round.winning_color === 'black' ? 'bg-gray-900' :
                    'bg-green-600'
                  )}
                >
                  {round.winning_number}
                </div>
              ))}
              {roundHistory.length === 0 && (
                <div className="text-xs text-muted-foreground">No results yet</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouletteStatistics;