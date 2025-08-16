import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useMasterAdminGames } from '@/hooks/useMasterAdminGames';
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
  BarChart3,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export const GameManagement = () => {
  const { games: gamesData, isLoading, error, refetch, updateGameSettings, toggleGameStatus, isUpdating } = useMasterAdminGames();
  const [globalSettings, setGlobalSettings] = useState({
    houseEdge: 5,
    maxBet: 50000,
    minBet: 10
  });

  const games = gamesData?.games || [];
  const stats = gamesData || { total_active_players: 0, total_revenue_today: 0, platform_profit_today: 0 };

  const handleToggleGame = (gameType: string, currentEnabled: boolean) => {
    toggleGameStatus({ gameType, enabled: !currentEnabled });
  };

  const handleUpdateGameSettings = (gameType: string, settings: any) => {
    updateGameSettings({ gameType, settings });
  };

  const handleApplyGlobalSettings = () => {
    // Apply global settings to all games
    games.forEach(game => {
      updateGameSettings({ 
        gameType: game.game_type, 
        settings: {
          house_edge: globalSettings.houseEdge / 100,
          max_bet_amount: globalSettings.maxBet,
          min_bet_amount: globalSettings.minBet
        }
      });
    });
  };

  const getStatusColor = (game: any) => {
    if (game.maintenance_mode) return 'bg-red-500 text-white';
    if (!game.is_enabled || game.is_paused) return 'bg-orange-500 text-white';
    return 'bg-gaming-success text-gaming-success-foreground';
  };

  const getGameStatus = (game: any) => {
    if (game.maintenance_mode) return 'maintenance';
    if (!game.is_enabled) return 'disabled';
    if (game.is_paused) return 'paused';
    return 'active';
  };

  const formatGameName = (gameType: string) => {
    return gameType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Game Management</h2>
            <p className="text-muted-foreground">Control all games, settings, and configurations</p>
          </div>
        </div>
        <Card className="bg-gradient-card">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold">Error Loading Games</h3>
              <p className="text-muted-foreground">{error.message}</p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Game Management</h2>
          <p className="text-muted-foreground">Control all games, settings, and configurations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
            <Settings className="h-4 w-4 mr-2" />
            Global Settings
          </Button>
        </div>
      </div>

      {/* Game Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="bg-gradient-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Skeleton className="h-4 w-12 mx-auto mb-1" />
                    <Skeleton className="h-6 w-8 mx-auto" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-4 w-12 mx-auto mb-1" />
                    <Skeleton className="h-6 w-12 mx-auto" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          games.map((game) => (
            <Card key={game.game_type} className="bg-gradient-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{formatGameName(game.game_type)}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(game)}>
                    {getGameStatus(game)}
                  </Badge>
                </div>
                <CardDescription>Live game status and controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Game Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Players</div>
                    <div className="text-lg font-bold text-primary">{game.active_players}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Today Revenue</div>
                    <div className="text-lg font-bold text-gaming-gold">{formatCurrency(game.today_revenue)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">House Edge</span>
                    <Badge variant="outline" className="text-xs">
                      {(game.house_edge * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bet Range</span>
                    <Badge variant="outline" className="text-xs">
                      ₹{game.min_bet_amount} - ₹{game.max_bet_amount}
                    </Badge>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={game.is_enabled && !game.is_paused} 
                        onCheckedChange={() => handleToggleGame(game.game_type, game.is_enabled)}
                        disabled={isUpdating}
                      />
                      <Label className="text-sm">Enable Game</Label>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleUpdateGameSettings(game.game_type, { maintenance_mode: !game.maintenance_mode })}
                        disabled={isUpdating}
                      >
                        {game.maintenance_mode ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs"
                        disabled={isUpdating}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Config
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
              <Input 
                id="house-edge" 
                type="number" 
                value={globalSettings.houseEdge}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, houseEdge: Number(e.target.value) }))}
                className="bg-background" 
              />
              <p className="text-xs text-muted-foreground">Platform profit margin</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-bet">Max Bet Amount</Label>
              <Input 
                id="max-bet" 
                type="number" 
                value={globalSettings.maxBet}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, maxBet: Number(e.target.value) }))}
                className="bg-background" 
              />
              <p className="text-xs text-muted-foreground">Maximum single bet</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min-bet">Min Bet Amount</Label>
              <Input 
                id="min-bet" 
                type="number" 
                value={globalSettings.minBet}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, minBet: Number(e.target.value) }))}
                className="bg-background" 
              />
              <p className="text-xs text-muted-foreground">Minimum single bet</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              className="bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90"
              onClick={handleApplyGlobalSettings}
              disabled={isUpdating}
            >
              {isUpdating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Apply Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setGlobalSettings({ houseEdge: 5, maxBet: 50000, minBet: 10 })}
            >
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
              {isLoading ? (
                <>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Active Players</span>
                    <span className="text-lg font-bold text-primary">{stats.total_active_players.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Games</span>
                    <span className="text-lg font-bold text-gaming-gold">{games.filter(g => g.is_enabled && !g.is_paused).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Platform Revenue Today</span>
                    <span className="text-lg font-bold text-gaming-success">{formatCurrency(stats.total_revenue_today)}</span>
                  </div>
                </>
              )}
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