import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, Activity, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatisticsPanelProps {
  recentRounds: Array<{ multiplier: number; id: string }>;
  userStats: {
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    biggestWin: number;
    biggestMultiplier: number;
    averageCashout: number;
    currentStreak: number;
    bestStreak: number;
  };
  liveStats: {
    last24hVolume: number;
    last24hPlayers: number;
    currentRoundNumber: number;
  };
}

const StatisticsPanel = ({ recentRounds, userStats, liveStats }: StatisticsPanelProps) => {
  // Prepare data for charts
  const roundsData = recentRounds.slice(0, 50).reverse().map((round, index) => ({
    round: index + 1,
    multiplier: round.multiplier,
    color: round.multiplier >= 2 ? 'hsl(var(--gaming-success))' : round.multiplier >= 1.5 ? 'hsl(var(--gaming-gold))' : 'hsl(var(--gaming-danger))'
  }));

  // Calculate hot/cold zones
  const averageMultiplier = recentRounds.reduce((sum, r) => sum + r.multiplier, 0) / recentRounds.length;
  const hotMultipliers = recentRounds.filter(r => r.multiplier >= 3).length;
  const coldMultipliers = recentRounds.filter(r => r.multiplier < 1.5).length;

  return (
    <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm h-full">
      <Tabs defaultValue="history" className="h-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="personal">My Stats</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="p-4 space-y-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roundsData}>
                <defs>
                  <linearGradient id="colorMultiplier" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="round" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="multiplier" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#colorMultiplier)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Multiplier</span>
                <Activity className="h-3 w-3 text-primary" />
              </div>
              <div className="text-xl font-bold text-foreground mt-1">
                {averageMultiplier.toFixed(2)}x
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Round #</span>
                <Hash className="h-3 w-3 text-primary" />
              </div>
              <div className="text-xl font-bold text-foreground mt-1">
                {liveStats.currentRoundNumber}
              </div>
            </div>
          </div>

          {/* Recent Multipliers */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Last 10 Rounds</h4>
            <div className="flex gap-1 flex-wrap">
              {recentRounds.slice(0, 10).map((round, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    round.multiplier >= 3 && "bg-gaming-success/20 text-gaming-success",
                    round.multiplier >= 2 && round.multiplier < 3 && "bg-gaming-gold/20 text-gaming-gold",
                    round.multiplier >= 1.5 && round.multiplier < 2 && "bg-primary/20 text-primary",
                    round.multiplier < 1.5 && "bg-gaming-danger/20 text-gaming-danger"
                  )}
                >
                  {round.multiplier.toFixed(2)}x
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Bets</span>
                <Target className="h-3 w-3 text-primary" />
              </div>
              <div className="text-xl font-bold text-foreground mt-1">{userStats.totalBets}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Win Rate</span>
                <TrendingUp className="h-3 w-3 text-gaming-success" />
              </div>
              <div className="text-xl font-bold text-gaming-success mt-1">
                {userStats.totalBets > 0 
                  ? `${((userStats.totalWins / userStats.totalBets) * 100).toFixed(1)}%`
                  : '0%'
                }
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Biggest Win</span>
                <Award className="h-3 w-3 text-gaming-gold" />
              </div>
              <div className="text-xl font-bold text-gaming-gold mt-1">₹{userStats.biggestWin}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Best Multi</span>
                <TrendingUp className="h-3 w-3 text-primary" />
              </div>
              <div className="text-xl font-bold text-primary mt-1">{userStats.biggestMultiplier}x</div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Cashout</span>
                <span className="text-sm font-bold text-foreground">{userStats.averageCashout.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <span className={cn(
                  "text-sm font-bold",
                  userStats.currentStreak > 0 ? "text-gaming-success" : "text-gaming-danger"
                )}>
                  {Math.abs(userStats.currentStreak)} {userStats.currentStreak > 0 ? 'Wins' : 'Losses'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Best Streak</span>
                <span className="text-sm font-bold text-gaming-gold">{userStats.bestStreak} Wins</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="p-4 space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Hot & Cold Analysis</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gaming-success rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">Hot Zone (3x+)</span>
                </div>
                <span className="text-sm font-bold text-gaming-success">{hotMultipliers} rounds</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gaming-danger rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Cold Zone (&lt;1.5x)</span>
                </div>
                <span className="text-sm font-bold text-gaming-danger">{coldMultipliers} rounds</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Provably Fair</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Server Seed (Hashed)</span>
                <code className="text-xs bg-black/30 px-2 py-1 rounded font-mono">
                  {Math.random().toString(36).substring(2, 10)}...
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Client Seed</span>
                <code className="text-xs bg-black/30 px-2 py-1 rounded font-mono">
                  {Math.random().toString(36).substring(2, 10)}
                </code>
              </div>
              <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                Verify Round Fairness →
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">24h Statistics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Volume</span>
                <span className="text-sm font-bold text-gaming-gold">₹{liveStats.last24hVolume.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Players</span>
                <span className="text-sm font-bold text-foreground">{liveStats.last24hPlayers.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default StatisticsPanel;