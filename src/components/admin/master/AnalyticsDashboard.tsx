import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Gamepad2,
  Calendar,
  Clock,
  Target
} from 'lucide-react';

export const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive platform insights and KPIs</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          <Calendar className="h-3 w-3 mr-1" />
          Last 24h
        </Badge>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
            <Users className="h-4 w-4 text-gaming-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">342</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +12% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-gaming-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-gold">₹1.2M</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +24% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <Gamepad2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">8,924</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +8% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Profit</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">₹84.7K</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +18% from yesterday
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Game Performance
            </CardTitle>
            <CardDescription>Most played games today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Color Prediction</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded">
                  <div className="w-4/5 h-2 bg-gaming-gold rounded"></div>
                </div>
                <span className="text-sm text-muted-foreground">2,847</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aviator</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded">
                  <div className="w-3/5 h-2 bg-primary rounded"></div>
                </div>
                <span className="text-sm text-muted-foreground">1,932</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Andar Bahar</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded">
                  <div className="w-2/5 h-2 bg-gaming-success rounded"></div>
                </div>
                <span className="text-sm text-muted-foreground">1,456</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Roulette</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded">
                  <div className="w-1/5 h-2 bg-orange-500 rounded"></div>
                </div>
                <span className="text-sm text-muted-foreground">892</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-500" />
              Peak Hours Analysis
            </CardTitle>
            <CardDescription>User activity by hour</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">8 PM - 10 PM</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded">
                  <div className="w-full h-2 bg-gaming-gold rounded"></div>
                </div>
                <span className="text-sm text-muted-foreground">Peak</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">6 PM - 8 PM</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded">
                  <div className="w-4/5 h-2 bg-primary rounded"></div>
                </div>
                <span className="text-sm text-muted-foreground">High</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">10 PM - 12 AM</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded">
                  <div className="w-3/5 h-2 bg-gaming-success rounded"></div>
                </div>
                <span className="text-sm text-muted-foreground">Medium</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">12 AM - 6 AM</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded">
                  <div className="w-1/5 h-2 bg-orange-500 rounded"></div>
                </div>
                <span className="text-sm text-muted-foreground">Low</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-lg">Total Revenue</CardTitle>
            <CardDescription>All-time platform earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gaming-gold">₹12.4M</div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <TrendingUp className="h-4 w-4 mr-1 text-gaming-success" />
              Growth rate: +34% this month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-lg">Player Retention</CardTitle>
            <CardDescription>7-day retention rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gaming-success">68.2%</div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <TrendingUp className="h-4 w-4 mr-1 text-gaming-success" />
              +5.2% from last week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-lg">Average Session</CardTitle>
            <CardDescription>Time per user session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">42 min</div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <TrendingUp className="h-4 w-4 mr-1 text-gaming-success" />
              +8 min from last week
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};