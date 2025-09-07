import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, DollarSign, Users } from 'lucide-react';

interface SportsAnalyticsProps {
  matches: any[];
}

export const SportsAnalytics = ({ matches }: SportsAnalyticsProps) => {
  // Mock data for charts - replace with actual data
  const revenueData = [
    { name: 'Mon', revenue: 45000, bets: 120 },
    { name: 'Tue', revenue: 52000, bets: 150 },
    { name: 'Wed', revenue: 48000, bets: 130 },
    { name: 'Thu', revenue: 61000, bets: 180 },
    { name: 'Fri', revenue: 55000, bets: 160 },
    { name: 'Sat', revenue: 72000, bets: 220 },
    { name: 'Sun', revenue: 68000, bets: 200 },
  ];

  const sportDistribution = [
    { name: 'Cricket', value: 35, color: 'hsl(var(--primary))' },
    { name: 'Football', value: 28, color: 'hsl(200, 70%, 50%)' },
    { name: 'Tennis', value: 15, color: 'hsl(120, 60%, 50%)' },
    { name: 'Basketball', value: 12, color: 'hsl(30, 70%, 50%)' },
    { name: 'Others', value: 10, color: 'hsl(280, 60%, 50%)' },
  ];

  const hourlyActivity = [
    { hour: '00:00', users: 45 },
    { hour: '04:00', users: 30 },
    { hour: '08:00', users: 85 },
    { hour: '12:00', users: 120 },
    { hour: '16:00', users: 150 },
    { hour: '20:00', users: 180 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹72,000</div>
            <p className="text-xs text-green-600">+15% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Active Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
            <p className="text-xs text-muted-foreground">Across all sports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Active Bettors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">In last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              Avg Bet Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹450</div>
            <p className="text-xs text-amber-600">+8% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Bets Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
                <Line 
                  type="monotone" 
                  dataKey="bets" 
                  stroke="hsl(200, 70%, 50%)" 
                  strokeWidth={2}
                  name="Total Bets"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sport Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Betting by Sport</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sportDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sportDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="users" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Matches */}
        <Card>
          <CardHeader>
            <CardTitle>Top Matches by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { match: 'India vs Australia', sport: 'Cricket', volume: '₹45,000', bets: 320 },
                { match: 'Man United vs Liverpool', sport: 'Football', volume: '₹38,000', bets: 280 },
                { match: 'Lakers vs Celtics', sport: 'Basketball', volume: '₹25,000', bets: 150 },
                { match: 'Federer vs Nadal', sport: 'Tennis', volume: '₹18,000', bets: 120 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{item.match}</div>
                    <div className="text-sm text-muted-foreground">{item.sport}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.volume}</div>
                    <div className="text-xs text-muted-foreground">{item.bets} bets</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};