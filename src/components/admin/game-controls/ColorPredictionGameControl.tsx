
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Target, Zap, BarChart3, Clock, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useColorPrediction } from '@/hooks/useColorPrediction';
import { useColorPredictionAdmin } from '@/hooks/useColorPredictionAdmin';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useColorPredictionSettings } from '@/hooks/useColorPredictionSettings';

export const ColorPredictionGameControl = () => {
  const [forcedColor, setForcedColor] = useState<string | null>(null);
  
  const { currentRound, recentRounds, timeLeft } = useColorPrediction();
  const { forceResult, createRound, isForcing, isCreating } = useColorPredictionAdmin();
  const { data: gameSettings, updateGameSetting, isUpdating } = useGameSettings();
  const { updateCheatMode, forceProcessExpiredRounds, isUpdatingCheatMode, isProcessingRounds } = useColorPredictionSettings();

  // Get current game settings for color prediction
  const colorPredictionSettings = gameSettings?.find(g => g.game_type === 'color_prediction');
  const isPaused = colorPredictionSettings?.is_paused || false;
  const cheatMode = colorPredictionSettings?.settings?.cheat_mode || false;

  const colors = [
    { name: 'Red', value: 'red', color: 'bg-red-500' },
    { name: 'Green', value: 'green', color: 'bg-green-500' },
    { name: 'Violet', value: 'violet', color: 'bg-purple-500' },
  ];

  const handleTogglePause = async () => {
    if (!colorPredictionSettings) {
      toast({
        title: "Error",
        description: "Game settings not found",
        variant: "destructive"
      });
      return;
    }

    updateGameSetting({
      gameType: 'color_prediction',
      updates: { is_paused: !isPaused }
    });
  };

  const handleToggleCheatMode = async () => {
    if (!colorPredictionSettings) {
      toast({
        title: "Error",
        description: "Game settings not found",
        variant: "destructive"
      });
      return;
    }

    const newCheatMode = !cheatMode;
    updateCheatMode({ enabled: newCheatMode });
  };

  const handleForceColor = (color: string) => {
    if (!currentRound) {
      toast({
        title: "No Active Round",
        description: "There is no active round to manipulate",
        variant: "destructive"
      });
      return;
    }

    if (currentRound.status !== 'betting') {
      toast({
        title: "Round Not Active",
        description: "Can only force colors during betting phase",
        variant: "destructive"
      });
      return;
    }

    setForcedColor(color);
    forceResult({ roundId: currentRound.id, color: color as 'red' | 'green' | 'violet' });
  };

  const handleCreateRound = () => {
    if (isPaused) {
      toast({
        title: "Game Paused",
        description: "Cannot create new round while game is paused",
        variant: "destructive"
      });
      return;
    }
    createRound();
  };

  const handleProcessExpiredRounds = () => {
    forceProcessExpiredRounds();
  };

  return (
    <div className="space-y-6">
      {/* Game Status Card */}
      <Card className={isPaused ? "border-red-500" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Game Status
            {isPaused && <Badge variant="destructive">PAUSED</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label>Game Status</Label>
                <Badge variant={isPaused ? 'destructive' : 'default'}>
                  {isPaused ? 'PAUSED' : 'ACTIVE'}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label>Cheat Mode</Label>
                <Badge variant={cheatMode ? 'destructive' : 'secondary'}>
                  {cheatMode ? 'ENABLED' : 'DISABLED'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleTogglePause}
                disabled={isUpdating}
                variant={isPaused ? 'default' : 'destructive'}
              >
                {isUpdating ? 'Updating...' : (isPaused ? 'Resume Game' : 'Pause Game')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Round Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Round Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Round Period</Label>
              <p className="text-lg font-semibold">{currentRound?.period || 'No active round'}</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Badge variant={currentRound?.status === 'betting' ? 'default' : 'secondary'}>
                {currentRound?.status || 'No round'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Time Left</Label>
              <p className="text-lg font-semibold">{timeLeft}s</p>
            </div>
            <div className="space-y-2">
              <Label>Total Bets</Label>
              <p className="text-lg font-semibold">₹{currentRound?.total_bets_amount || 0}</p>
            </div>
            <div className="space-y-2">
              <Label>Players</Label>
              <p className="text-lg font-semibold flex items-center gap-1">
                <Users className="h-4 w-4" />
                {currentRound?.total_players || 0}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateRound} 
                  disabled={isCreating || isPaused || (!!currentRound && currentRound.status === 'betting' && timeLeft > 0)} 
                  size="sm"
                >
                  {isCreating ? 'Creating...' : 'Create New Round'}
                </Button>
                <Button 
                  onClick={handleProcessExpiredRounds} 
                  disabled={isProcessingRounds || isPaused} 
                  size="sm"
                  variant="outline"
                >
                  {isProcessingRounds ? 'Processing...' : 'Process Expired Rounds'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {recentRounds.slice(0, 10).map((round) => (
              <div key={round.id} className="text-center p-2 border rounded">
                <div className={`w-8 h-8 rounded-full mx-auto mb-1 ${
                  round.winning_color === 'red' ? 'bg-red-500' :
                  round.winning_color === 'green' ? 'bg-green-500' :
                  round.winning_color === 'violet' ? 'bg-purple-500' : 'bg-gray-500'
                }`}></div>
                <p className="text-xs">{round.period.slice(-3)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cheat Mode Toggle */}
      <Card className={cheatMode ? "border-red-500" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Prediction Manipulation
            {cheatMode && <Badge variant="destructive">CHEAT MODE ACTIVE</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="color-cheat"
              checked={cheatMode}
              onCheckedChange={handleToggleCheatMode}
              disabled={isUpdatingCheatMode || isPaused}
            />
            <Label htmlFor="color-cheat">
              {isUpdatingCheatMode ? 'Updating...' : 'Enable Color Manipulation'}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Color Control */}
      <Card>
        <CardHeader>
          <CardTitle>Force Next Color Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {colors.map((color) => (
                <Button
                  key={color.value}
                  variant={forcedColor === color.value ? "default" : "outline"}
                  onClick={() => handleForceColor(color.value)}
                  disabled={!cheatMode || !currentRound || isForcing || isPaused || currentRound.status !== 'betting'}
                  className="h-20 flex flex-col items-center gap-2"
                >
                  <div className={`w-8 h-8 rounded-full ${color.color}`} />
                  <span className="text-sm">{color.name}</span>
                  <span className="text-xs text-muted-foreground">
                    2x
                  </span>
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setForcedColor(null)}
                disabled={!cheatMode || isPaused}
              >
                Reset Color Control
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

