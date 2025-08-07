import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Gamepad2, 
  Settings, 
  Play, 
  Pause, 
  Clock,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react';

export const GameManagement = () => {
  const [games, setGames] = useState([
    { id: 1, name: 'Color Prediction', status: 'active', players: 1247, earnings: '₹45.2K', winRate: '45%', enabled: true },
    { id: 2, name: 'Aviator', status: 'active', players: 892, earnings: '₹32.8K', winRate: '52%', enabled: true },
    { id: 3, name: 'Andar Bahar', status: 'active', players: 634, earnings: '₹28.4K', winRate: '48%', enabled: true },
    { id: 4, name: 'Roulette', status: 'paused', players: 0, earnings: '₹0', winRate: '50%', enabled: false },
    { id: 5, name: 'Jackpot', status: 'active', players: 445, earnings: '₹15.6K', winRate: '40%', enabled: true },
    { id: 6, name: 'Ludo', status: 'active', players: 223, earnings: '₹8.2K', winRate: '25%', enabled: true },
    { id: 7, name: 'Poker', status: 'scheduled', players: 0, earnings: '₹0', winRate: '35%', enabled: false },
    { id: 8, name: 'Rummy', status: 'active', players: 156, earnings: '₹4.8K', winRate: '30%', enabled: true },
  ]);

  const toggleGameStatus = (gameId: number) => {
    setGames(games.map(game => 
      game.id === gameId 
        ? { ...game, enabled: !game.enabled, status: !game.enabled ? 'active' : 'paused' }
        : game
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gaming-success text-gaming-success-foreground';
      case 'paused': return 'bg-orange-500 text-white';
      case 'scheduled': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Game Management</h2>
          <p className="text-muted-foreground">Control all games, settings, and configurations</p>
        </div>
        <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
          <Settings className="h-4 w-4 mr-2" />
          Global Settings
        </Button>
      </div>

      {/* Game Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="bg-gradient-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{game.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(game.status)}>
                  {game.status}
                </Badge>
              </div>
              <CardDescription>Live game status and controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Players</div>
                  <div className="text-lg font-bold text-primary">{game.players}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Earnings</div>
                  <div className="text-lg font-bold text-gaming-gold">{game.earnings}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Win Rate</span>
                <Badge variant="outline" className="text-xs">
                  {game.winRate}
                </Badge>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={game.enabled} 
                    onCheckedChange={() => toggleGameStatus(game.id)}
                  />
                  <Label className="text-sm">Enable Game</Label>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Config
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game Configuration Panel */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-gaming-gold" />
            Dynamic Game Controls
          </CardTitle>
          <CardDescription>Adjust win rates, odds, and game parameters in real-time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="house-edge">House Edge (%)</Label>
              <Input id="house-edge" type="number" placeholder="5" className="bg-background" />
              <p className="text-xs text-muted-foreground">Platform profit margin</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-bet">Max Bet Amount</Label>
              <Input id="max-bet" type="number" placeholder="50000" className="bg-background" />
              <p className="text-xs text-muted-foreground">Maximum single bet</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min-bet">Min Bet Amount</Label>
              <Input id="min-bet" type="number" placeholder="10" className="bg-background" />
              <p className="text-xs text-muted-foreground">Minimum single bet</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button className="bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90">
              Apply Changes
            </Button>
            <Button variant="outline">
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Game Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Live Performance
            </CardTitle>
            <CardDescription>Real-time game metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Active Players</span>
                <span className="text-lg font-bold text-primary">3,597</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Games This Hour</span>
                <span className="text-lg font-bold text-gaming-gold">1,284</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Platform Revenue</span>
                <span className="text-lg font-bold text-gaming-success">₹134.8K</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-500" />
              Scheduled Events
            </CardTitle>
            <CardDescription>Upcoming game events and maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <div>
                  <p className="text-sm font-medium">Jackpot Round #247</p>
                  <p className="text-xs text-muted-foreground">Starting in 5 minutes</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Scheduled
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <div>
                  <p className="text-sm font-medium">Server Maintenance</p>
                  <p className="text-xs text-muted-foreground">Tomorrow 3:00 AM</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Planned
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};