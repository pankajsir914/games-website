import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useNavigate } from 'react-router-dom';
import { 
  GamepadIcon, 
  Settings, 
  Pause, 
  Play, 
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

export const GameManagementPanel = () => {
  const { data: gameSettings, isLoading, updateGameSetting } = useGameSettings();
  const navigate = useNavigate();

  const handleToggleGame = (gameType: string, enabled: boolean) => {
    updateGameSetting({
      gameType,
      updates: { is_enabled: enabled }
    });
  };

  const handleToggleMaintenance = (gameType: string, maintenance: boolean) => {
    updateGameSetting({
      gameType,
      updates: { maintenance_mode: maintenance }
    });
  };

  const handleGameDashboard = (gameType: string) => {
    navigate(`/admin/game-dashboard/${gameType}`);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Game Management</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600">
            {gameSettings?.filter(g => g.is_enabled).length} Active
          </Badge>
          <Badge variant="outline" className="text-orange-600">
            {gameSettings?.filter(g => g.maintenance_mode).length} Maintenance
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {gameSettings?.map((game) => (
          <Card key={game.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GamepadIcon className="h-5 w-5" />
                  <CardTitle className="capitalize">
                    {game.game_type.replace('_', ' ')}
                  </CardTitle>
                </div>
                <div className="flex flex-col gap-2">
                  {game.is_enabled ? (
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                  {game.maintenance_mode && (
                    <Badge variant="destructive">Maintenance</Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                Min: ₹{game.min_bet_amount} - Max: ₹{game.max_bet_amount}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Game Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`enable-${game.game_type}`}>Enable Game</Label>
                  <Switch
                    id={`enable-${game.game_type}`}
                    checked={game.is_enabled}
                    onCheckedChange={(checked) => handleToggleGame(game.game_type, checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`maintenance-${game.game_type}`}>Maintenance Mode</Label>
                  <Switch
                    id={`maintenance-${game.game_type}`}
                    checked={game.maintenance_mode}
                    onCheckedChange={(checked) => handleToggleMaintenance(game.game_type, checked)}
                  />
                </div>
              </div>

              {/* Bet Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`min-bet-${game.game_type}`} className="text-xs">Min Bet</Label>
                  <Input
                    id={`min-bet-${game.game_type}`}
                    type="number"
                    value={game.min_bet_amount}
                    onChange={(e) => updateGameSetting({
                      gameType: game.game_type,
                      updates: { min_bet_amount: parseFloat(e.target.value) }
                    })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor={`max-bet-${game.game_type}`} className="text-xs">Max Bet</Label>
                  <Input
                    id={`max-bet-${game.game_type}`}
                    type="number"
                    value={game.max_bet_amount}
                    onChange={(e) => updateGameSetting({
                      gameType: game.game_type,
                      updates: { max_bet_amount: parseFloat(e.target.value) }
                    })}
                    className="h-8"
                  />
                </div>
              </div>

              {/* House Edge */}
              <div>
                <Label htmlFor={`house-edge-${game.game_type}`} className="text-xs">House Edge (%)</Label>
                <Input
                  id={`house-edge-${game.game_type}`}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={game.house_edge * 100}
                  onChange={(e) => updateGameSetting({
                    gameType: game.game_type,
                    updates: { house_edge: parseFloat(e.target.value) / 100 }
                  })}
                  className="h-8"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGameDashboard(game.game_type)}
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Control
                </Button>
                
                {game.is_enabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleGame(game.game_type, false)}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleGame(game.game_type, true)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>

            {/* Status Indicator */}
            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
              game.maintenance_mode 
                ? 'bg-orange-500' 
                : game.is_enabled 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
            }`} />
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Game Stats</CardTitle>
          <CardDescription>Real-time game statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {gameSettings?.filter(g => g.is_enabled).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {gameSettings?.filter(g => g.maintenance_mode).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">In Maintenance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ₹{gameSettings?.reduce((sum, g) => sum + g.min_bet_amount, 0).toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Min Bets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {gameSettings?.length ? (gameSettings.reduce((sum, g) => sum + g.house_edge, 0) / gameSettings.length * 100).toFixed(2) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg House Edge</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};