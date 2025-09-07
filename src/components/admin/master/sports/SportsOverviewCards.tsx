import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Users, DollarSign, Trophy, Clock } from 'lucide-react';

interface SportsOverviewCardsProps {
  stats: {
    totalMatches: number;
    liveMatches: number;
    totalBets: number;
    revenue: number;
    activeUsers: number;
    upcomingMatches: number;
  };
}

export const SportsOverviewCards = ({ stats }: SportsOverviewCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card className="border-primary/20 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Total Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMatches}</div>
          <p className="text-xs text-muted-foreground">All sports combined</p>
        </CardContent>
      </Card>

      <Card className="border-green-500/20 bg-green-50/5 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            Live Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.liveMatches}</div>
          <Badge variant="secondary" className="mt-1 bg-green-100/10 text-green-600">
            Active
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-blue-500/20 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingMatches}</div>
          <p className="text-xs text-muted-foreground">Next 24 hours</p>
        </CardContent>
      </Card>

      <Card className="border-purple-500/20 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            Total Bets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBets}</div>
          <p className="text-xs text-muted-foreground">Today</p>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-500" />
            Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Today's earnings</p>
        </CardContent>
      </Card>

      <Card className="border-indigo-500/20 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">Currently betting</p>
        </CardContent>
      </Card>
    </div>
  );
};