import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Users, GamepadIcon, TrendingUp, Activity } from 'lucide-react';

export const OverviewDashboard = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data: analytics, isLoading } = useAdminAnalytics(timeframe);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Overview Dashboard</h2>
        <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Last 24 Hours</SelectItem>
            <SelectItem value="weekly">Last 7 Days</SelectItem>
            <SelectItem value="monthly">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalPlayers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <GamepadIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalGames.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Games played</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics?.totalBetAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{analytics?.totalBets} bets placed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{analytics?.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Winnings: ₹{analytics?.totalWinnings.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>


      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current system status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Total Player Balance</span>
            <span className="font-bold">₹{analytics?.totalBalance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Average Bet Size</span>
            <span className="font-bold">
              ₹{analytics?.totalBets ? Math.round(analytics.totalBetAmount / analytics.totalBets) : 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>House Edge</span>
            <span className="font-bold text-green-600">
              {analytics?.totalBetAmount ? ((analytics.netProfit / analytics.totalBetAmount) * 100).toFixed(2) : 0}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Active Games</span>
            <span className="font-bold">{Object.keys(analytics?.gameTypeStats || {}).length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};