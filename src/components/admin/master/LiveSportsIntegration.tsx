import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  PlayCircle, 
  PauseCircle, 
  Settings, 
  Wifi,
  WifiOff,
  Calendar,
  Clock,
  Users,
  Target,
  TrendingUp,
  Globe
} from 'lucide-react';

export const LiveSportsIntegration = () => {
  const [sportsProviders] = useState([
    {
      id: 1,
      name: 'Cricket API Pro',
      sport: 'Cricket',
      status: 'connected',
      events: 15,
      lastSync: '2 mins ago',
      reliability: 99.8,
      cost: '$299/month'
    },
    {
      id: 2,
      name: 'Football Live Data',
      sport: 'Football',
      status: 'connected',
      events: 23,
      lastSync: '1 min ago',
      reliability: 99.5,
      cost: '$199/month'
    },
    {
      id: 3,
      name: 'Basketball Central',
      sport: 'Basketball',
      status: 'disconnected',
      events: 0,
      lastSync: '2 hours ago',
      reliability: 98.2,
      cost: '$149/month'
    },
    {
      id: 4,
      name: 'Tennis World Feed',
      sport: 'Tennis',
      status: 'maintenance',
      events: 8,
      lastSync: '30 mins ago',
      reliability: 99.1,
      cost: '$179/month'
    }
  ]);

  const [liveEvents] = useState([
    {
      id: 1,
      title: 'India vs Australia',
      sport: 'Cricket',
      league: 'Test Series',
      status: 'live',
      viewers: 15247,
      bets: 3892,
      startTime: '2024-01-15 09:30',
      odds: { home: 2.45, away: 1.85 }
    },
    {
      id: 2,
      title: 'Manchester United vs Chelsea',
      sport: 'Football',
      league: 'Premier League',
      status: 'live',
      viewers: 8934,
      bets: 2156,
      startTime: '2024-01-15 14:00',
      odds: { home: 1.95, away: 2.20 }
    },
    {
      id: 3,
      title: 'Lakers vs Warriors',
      sport: 'Basketball',
      league: 'NBA',
      status: 'upcoming',
      viewers: 0,
      bets: 0,
      startTime: '2024-01-15 20:00',
      odds: { home: 1.78, away: 2.05 }
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-gaming-success text-gaming-success-foreground">Connected</Badge>;
      case 'disconnected': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Disconnected</Badge>;
      case 'maintenance': return <Badge className="bg-orange-500 text-white">Maintenance</Badge>;
      case 'live': return <Badge className="bg-gaming-success text-gaming-success-foreground">Live</Badge>;
      case 'upcoming': return <Badge className="bg-primary text-primary-foreground">Upcoming</Badge>;
      case 'ended': return <Badge className="bg-muted text-muted-foreground">Ended</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="h-4 w-4 text-gaming-success" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-gaming-danger" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-orange-500" />;
      default: return <Globe className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Live Sports Integration</h2>
          <p className="text-muted-foreground">Manage sports data providers and live events</p>
        </div>
        <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
          <Trophy className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Provider Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-gaming-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <Wifi className="h-4 w-4 text-gaming-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">3</div>
            <p className="text-xs text-muted-foreground">2 connected, 1 maintenance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Events</CardTitle>
            <PlayCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">46</div>
            <p className="text-xs text-muted-foreground">Across all sports</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
            <Users className="h-4 w-4 text-gaming-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-gold">24.2K</div>
            <p className="text-xs text-muted-foreground">Watching live events</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bets</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">6.05K</div>
            <p className="text-xs text-muted-foreground">On live events</p>
          </CardContent>
        </Card>
      </div>

      {/* Sports Providers */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Sports Data Providers
          </CardTitle>
          <CardDescription>Manage API connections and data sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sportsProviders.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    {getStatusIcon(provider.status)}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">{provider.name}</h4>
                    <p className="text-sm text-muted-foreground">{provider.sport} • {provider.cost}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {provider.events} events • Last sync: {provider.lastSync}
                      </span>
                      <span className="text-xs text-gaming-success">
                        {provider.reliability}% uptime
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{provider.events}</div>
                    <div className="text-xs text-muted-foreground">Live Events</div>
                  </div>
                  
                  {getStatusBadge(provider.status)}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                    {provider.status === 'connected' ? (
                      <Button size="sm" variant="outline" className="text-gaming-danger">
                        <PauseCircle className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-gaming-success">
                        <PlayCircle className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Events */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gaming-gold" />
            Live Sports Events
          </CardTitle>
          <CardDescription>Monitor and manage live sporting events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {liveEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gaming-gold/10 rounded-lg flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-gaming-gold" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.league} • {event.sport}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{event.startTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{event.viewers.toLocaleString()} viewers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{event.bets.toLocaleString()} bets</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {event.odds.home} / {event.odds.away}
                    </div>
                    <div className="text-xs text-muted-foreground">Current Odds</div>
                  </div>
                  
                  {getStatusBadge(event.status)}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-500" />
              Add New Provider
            </CardTitle>
            <CardDescription>Connect new sports data provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">Provider Name</Label>
              <Input id="provider-name" placeholder="Enter provider name" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sport-type">Sport Type</Label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cricket">Cricket</SelectItem>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="hockey">Hockey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-endpoint">API Endpoint</Label>
              <Input id="api-endpoint" placeholder="https://api.provider.com" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" type="password" placeholder="Enter API key" className="bg-background" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="auto-sync" />
              <Label htmlFor="auto-sync">Enable auto-sync</Label>
            </div>
            
            <Button className="w-full bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90">
              <Wifi className="h-4 w-4 mr-2" />
              Connect Provider
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sports Analytics
            </CardTitle>
            <CardDescription>Performance metrics and insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Cricket</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gaming-gold">₹89.2K</div>
                  <div className="text-xs text-muted-foreground">Total bets</div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Football</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-primary">₹67.8K</div>
                  <div className="text-xs text-muted-foreground">Total bets</div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Basketball</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gaming-success">₹34.5K</div>
                  <div className="text-xs text-muted-foreground">Total bets</div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Tennis</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-orange-500">₹23.1K</div>
                  <div className="text-xs text-muted-foreground">Total bets</div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-lg font-bold text-gaming-gold">₹214.6K</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Today</span>
                <span className="text-xs text-gaming-success">+12% vs yesterday</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};