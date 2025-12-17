import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { useGameManagement } from '@/hooks/useGameManagement';
import { 
  Bird, 
  Flame, 
  TrendingUp, 
  Target, 
  DollarSign,
  Activity,
  Shield,
  Settings,
  RefreshCw,
  Zap
} from 'lucide-react';

export const ChickenRoadGameControl = () => {
  const { pauseGame, resumeGame, isGamePaused, gameSettings } = useGameManagement();
  const gameData = gameSettings?.find(g => g.game_type === 'chicken_road');
  
  const [config, setConfig] = useState({
    trapDensity: gameData?.settings?.trap_density || 0.3,
    maxMultiplier: gameData?.settings?.max_multiplier || 100,
    baseMultiplier: gameData?.settings?.base_multiplier || 1.2,
    autoPlayEnabled: gameData?.settings?.auto_play_enabled || false,
    difficultyModifier: gameData?.settings?.difficulty_modifier || 1.0,
    burnAnimationDuration: gameData?.settings?.burn_animation_duration || 3,
    revealDelay: gameData?.settings?.reveal_delay || 500,
  });

  const handleUpdateConfig = () => {
    toast({
      title: "Chicken Road Settings Updated",
      description: "Game configuration has been successfully updated.",
    });
  };

  const handleTogglePause = () => {
    if (isGamePaused('chicken_road')) {
      resumeGame('chicken_road');
    } else {
      pauseGame('chicken_road');
    }
  };

  const difficultyLevels = [
    { name: 'Easy', multiplier: 0.8, color: 'text-green-500' },
    { name: 'Medium', multiplier: 1.0, color: 'text-yellow-500' },
    { name: 'Hard', multiplier: 1.2, color: 'text-orange-500' },
    { name: 'Hardcore', multiplier: 1.5, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bird className="h-6 w-6 text-chicken-gold" />
              <div>
                <CardTitle>Chicken Road Control Panel</CardTitle>
                <CardDescription>Manage Chicken Road game settings and mechanics</CardDescription>
              </div>
            </div>
            <Badge 
              variant={isGamePaused('chicken_road') ? 'destructive' : 'default'}
              className="text-sm"
            >
              {isGamePaused('chicken_road') ? 'PAUSED' : 'ACTIVE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Status Control */}
          <div className="flex items-center justify-between p-4 bg-background rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={!isGamePaused('chicken_road')}
                onCheckedChange={handleTogglePause}
              />
              <Label>Game Active</Label>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleTogglePause}
            >
              {isGamePaused('chicken_road') ? (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Resume Game
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Pause Game
                </>
              )}
            </Button>
          </div>

          {/* Trap Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              Fire Trap Settings
            </h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Trap Density ({(config.trapDensity * 100).toFixed(0)}%)</Label>
                <Slider
                  value={[config.trapDensity * 100]}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, trapDensity: value[0] / 100 }))}
                  max={50}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of tiles containing fire traps
                </p>
              </div>

              <div className="space-y-2">
                <Label>Burn Animation Duration (seconds)</Label>
                <Input
                  type="number"
                  value={config.burnAnimationDuration}
                  onChange={(e) => setConfig(prev => ({ ...prev, burnAnimationDuration: Number(e.target.value) }))}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>
            </div>
          </div>

          {/* Multiplier Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gaming-success" />
              Multiplier Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Multiplier</Label>
                <Input
                  type="number"
                  value={config.baseMultiplier}
                  onChange={(e) => setConfig(prev => ({ ...prev, baseMultiplier: Number(e.target.value) }))}
                  min={1.1}
                  max={2.0}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Starting multiplier value
                </p>
              </div>
              <div className="space-y-2">
                <Label>Max Multiplier</Label>
                <Input
                  type="number"
                  value={config.maxMultiplier}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxMultiplier: Number(e.target.value) }))}
                  min={10}
                  max={1000}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum achievable multiplier
                </p>
              </div>
            </div>
          </div>

          {/* Difficulty Levels */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Difficulty Settings
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {difficultyLevels.map((level) => (
                <div key={level.name} className="p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${level.color}`}>
                      {level.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {level.multiplier}x
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trap multiplier: {(config.trapDensity * level.multiplier * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Game Mechanics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Game Mechanics
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={config.autoPlayEnabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoPlayEnabled: checked }))}
                  />
                  <Label>Enable Auto-Play</Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {config.autoPlayEnabled ? 'ON' : 'OFF'}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Reveal Delay (ms)</Label>
                <Input
                  type="number"
                  value={config.revealDelay}
                  onChange={(e) => setConfig(prev => ({ ...prev, revealDelay: Number(e.target.value) }))}
                  min={100}
                  max={2000}
                  step={100}
                />
                <p className="text-xs text-muted-foreground">
                  Delay between tile reveals for suspense
                </p>
              </div>
            </div>
          </div>

          {/* Live Statistics */}
          <div className="p-4 bg-background rounded-lg space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-gaming-gold" />
              Live Game Statistics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground">Active Players</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gaming-success">₹0</p>
                <p className="text-xs text-muted-foreground">Total Wagered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-chicken-gold">0%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90"
              onClick={handleUpdateConfig}
            >
              <Zap className="h-4 w-4 mr-2" />
              Apply Settings
            </Button>
            <Button 
              variant="outline"
              onClick={() => setConfig({
                trapDensity: 0.3,
                maxMultiplier: 100,
                baseMultiplier: 1.2,
                autoPlayEnabled: false,
                difficultyModifier: 1.0,
                burnAnimationDuration: 3,
                revealDelay: 500,
              })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};