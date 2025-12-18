import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useGameSettings } from '@/hooks/useGameSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Palette, 
  Clock, 
  Target, 
  DollarSign, 
  Shield,
  Zap,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GameConfigEditorProps {
  gameType: string;
  gameName: string;
}

const gameConfigs = {
  aviator: {
    multiplier_range: { min: 1.01, max: 100.0 },
    crash_probability: 0.01,
    round_duration: 30,
    auto_cashout_enabled: true,
    max_auto_cashout: 10.0,
    animation_speed: 1.0,
    sound_effects: true,
  },
  color_prediction: {
    round_duration: 60,
    colors: ['red', 'green', 'violet'],
    multipliers: { red: 2.0, green: 2.0, violet: 2.0 },
    max_bets_per_round: 1000,
    result_display_time: 10,
  },
  andar_bahar: {
    round_duration: 45,
    max_cards_per_side: 20,
    auto_deal_speed: 2.0,
    show_card_count: true,
    enable_side_bets: false,
  },
  roulette: {
    spin_duration: 15,
    ball_animation_speed: 1.0,
    max_bets_per_number: 50,
    enable_call_bets: true,
    show_statistics: true,
    hot_cold_display: true,
  },
  teen_patti: {
    round_duration: 120,
    max_players_per_round: 100,
    show_cards_early: false,
    enable_side_bets: true,
    hand_strength_display: true,
  },
  chicken_road: {
    grid_size: { width: 5, height: 10 },
    difficulty_levels: ['easy', 'medium', 'hard'],
    max_multiplier: 50.0,
    trap_probability: { easy: 0.2, medium: 0.4, hard: 0.6 },
    auto_restart_delay: 5,
  },
};

export const GameConfigEditor: React.FC<GameConfigEditorProps> = ({ gameType, gameName }) => {
  const { data: gameSettings, updateGameSetting } = useGameSettings();
  const currentGame = gameSettings?.find(g => g.game_type === gameType);
  const [config, setConfig] = useState(currentGame?.settings || gameConfigs[gameType as keyof typeof gameConfigs] || {});
  const [hasChanges, setHasChanges] = useState(false);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleNestedConfigChange = (parentKey: string, childKey: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
    setHasChanges(true);
  };

  const saveConfig = () => {
    if (!currentGame) return;
    
    updateGameSetting({
      gameType,
      updates: { settings: config }
    });
    setHasChanges(false);
  };

  const resetConfig = () => {
    setConfig(gameConfigs[gameType as keyof typeof gameConfigs] || {});
    setHasChanges(true);
  };

  const renderBasicSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="enabled">Game Enabled</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={currentGame?.is_enabled || false}
              onCheckedChange={(checked) => 
                updateGameSetting({ gameType, updates: { is_enabled: checked } })
              }
            />
            <span className="text-sm text-muted-foreground">
              {currentGame?.is_enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance">Maintenance Mode</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="maintenance"
              checked={currentGame?.maintenance_mode || false}
              onCheckedChange={(checked) => 
                updateGameSetting({ gameType, updates: { maintenance_mode: checked } })
              }
            />
            <span className="text-sm text-muted-foreground">
              {currentGame?.maintenance_mode ? 'Under Maintenance' : 'Normal'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paused">Game Paused</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="paused"
              checked={currentGame?.is_paused || false}
              onCheckedChange={(checked) => 
                updateGameSetting({ gameType, updates: { is_paused: checked } })
              }
            />
            <span className="text-sm text-muted-foreground">
              {currentGame?.is_paused ? 'Paused' : 'Running'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="house-edge">House Edge (%)</Label>
          <Input
            id="house-edge"
            type="number"
            step="0.01"
            min="0"
            max="50"
            value={currentGame?.house_edge ? (currentGame.house_edge * 100).toFixed(2) : '5.00'}
            onChange={(e) => 
              updateGameSetting({ 
                gameType, 
                updates: { house_edge: parseFloat(e.target.value) / 100 } 
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-bet">Minimum Bet (₹)</Label>
          <Input
            id="min-bet"
            type="number"
            min="1"
            value={currentGame?.min_bet_amount || 10}
            onChange={(e) => 
              updateGameSetting({ 
                gameType, 
                updates: { min_bet_amount: parseFloat(e.target.value) } 
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-bet">Maximum Bet (₹)</Label>
          <Input
            id="max-bet"
            type="number"
            min="1"
            value={currentGame?.max_bet_amount || 10000}
            onChange={(e) => 
              updateGameSetting({ 
                gameType, 
                updates: { max_bet_amount: parseFloat(e.target.value) } 
              })
            }
          />
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      {Object.entries(config).map(([key, value]) => (
        <div key={key} className="space-y-2">
          <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
          {typeof value === 'boolean' ? (
            <div className="flex items-center space-x-2">
              <Switch
                checked={value}
                onCheckedChange={(checked) => handleConfigChange(key, checked)}
              />
              <span className="text-sm text-muted-foreground">
                {value ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ) : typeof value === 'number' ? (
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => handleConfigChange(key, parseFloat(e.target.value))}
            />
          ) : typeof value === 'string' ? (
            <Input
              value={value}
              onChange={(e) => handleConfigChange(key, e.target.value)}
            />
          ) : typeof value === 'object' && value !== null ? (
            <div className="pl-4 border-l-2 border-border space-y-2">
              {Object.entries(value).map(([nestedKey, nestedValue]) => (
                <div key={nestedKey} className="flex items-center space-x-2">
                  <Label className="min-w-[100px] capitalize">
                    {nestedKey.replace(/_/g, ' ')}:
                  </Label>
                  {typeof nestedValue === 'number' ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={nestedValue}
                      onChange={(e) => 
                        handleNestedConfigChange(key, nestedKey, parseFloat(e.target.value))
                      }
                      className="flex-1"
                    />
                  ) : (
                    <Input
                      value={String(nestedValue)}
                      onChange={(e) => 
                        handleNestedConfigChange(key, nestedKey, e.target.value)
                      }
                      className="flex-1"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Input
              value={String(value)}
              onChange={(e) => handleConfigChange(key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{gameName} Configuration</h2>
          <p className="text-muted-foreground">Configure game settings and behavior</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={resetConfig}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveConfig} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Basic Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderBasicSettings()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderAdvancedSettings()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Appearance settings will be available in a future update
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Security settings will be available in a future update
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
