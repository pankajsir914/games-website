
import React, { useState } from 'react';
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
import { useGameManagement } from '@/hooks/useGameManagement';
import { useColorPredictionSettings } from '@/hooks/useColorPredictionSettings';

export const ColorPredictionGameControl = () => {
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedColor, setForcedColor] = useState<string | null>(null);
  
  const { currentRound, recentRounds, timeLeft } = useColorPrediction();
  const { forceResult, createRound, isForcing, isCreating } = useColorPredictionAdmin();
  const { toggleGameStatus, isGamePaused, gameSettings } = useGameManagement();
  const { updateCheatMode, forceProcessExpiredRounds, isUpdatingCheatMode, isProcessingRounds } = useColorPredictionSettings();

  const colors = [
    { name: 'Red', value: 'red', color: 'bg-red-500' },
    { name: 'Green', value: 'green', color: 'bg-green-500' },
    { name: 'Violet', value: 'violet', color: 'bg-purple-500' },
  ];

  const toggleCheatMode = () => {
    const newCheatMode = !cheatMode;
    setCheatMode(newCheatMode);
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

    setForcedColor(color);
    forceResult({ roundId: currentRound.id, color: color as 'red' | 'green' | 'violet' });
  };

  const handleCreateRound = () => {
    createRound();
  };

  return (
    <div className="space-y-6">
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
              <Label>Game Status</Label>
              <Badge variant={isGamePaused('color_prediction') ? 'destructive' : 'default'}>
                {isGamePaused('color_prediction') ? 'PAUSED' : 'ACTIVE'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    console.log('Pause button clicked, current paused state:', isGamePaused('color_prediction'));
                    console.log('Game settings:', gameSettings);
                    toggleGameStatus('color_prediction');
                  }} 
                  variant={isGamePaused('color_prediction') ? 'default' : 'destructive'}
                  size="sm"
                >
                  {isGamePaused('color_prediction') ? 'Resume Game' : 'Pause Game'}
                </Button>
                <Button 
                  onClick={handleCreateRound} 
                  disabled={isCreating || (!!currentRound && currentRound.status === 'betting' && timeLeft > 0)} 
                  size="sm"
                >
                  {isCreating ? 'Creating...' : 'Create New Round'}
                </Button>
                <Button 
                  onClick={() => forceProcessExpiredRounds()} 
                  disabled={isProcessingRounds} 
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
              onCheckedChange={toggleCheatMode}
              disabled={isUpdatingCheatMode}
            />
            <Label htmlFor="color-cheat">
              {isUpdatingCheatMode ? 'Updating...' : 'Enable Color Manipulation'}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors">Color Control</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Control</TabsTrigger>
          <TabsTrigger value="outcomes">Outcome Control</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
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
                      disabled={!cheatMode || !currentRound || isForcing}
                      className="h-20 flex flex-col items-center gap-2"
                    >
                      <div className={`w-8 h-8 rounded-full ${color.color}`} />
                      <span className="text-sm">{color.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {color.value === 'violet' ? '4.5x' : '2x'}
                      </span>
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setForcedColor(null)}
                    disabled={!cheatMode}
                  >
                    Reset Color Control
                  </Button>
                  <Button 
                    variant="destructive"
                    disabled={!cheatMode || !currentRound}
                  >
                    Opposite Popular Choice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Manipulation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Manipulation Pattern</Label>
                  <Select disabled={!cheatMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manipulation pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Pattern (Random)</SelectItem>
                      <SelectItem value="red-streak">Red Streak</SelectItem>
                      <SelectItem value="green-streak">Green Streak</SelectItem>
                      <SelectItem value="violet-streak">Violet Streak</SelectItem>
                      <SelectItem value="alternating">Alternating Colors</SelectItem>
                      <SelectItem value="avoid-popular">Avoid Most Popular Color</SelectItem>
                      <SelectItem value="favor-unpopular">Favor Least Popular Color</SelectItem>
                      <SelectItem value="house-edge">Maximum House Edge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!cheatMode}>
                    Start Pattern (10 rounds)
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Stop Current Pattern
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Pattern Preview</h4>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={i} className="w-6 h-6 bg-gray-300 rounded border" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preview of next 10 results based on selected pattern
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Outcome Manipulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Win Rate Control</Label>
                    <div className="grid grid-cols-1 gap-1 mt-2">
                      <Button variant="outline" size="sm" disabled={!cheatMode}>
                        High Win Rate (70%+)
                      </Button>
                      <Button variant="outline" size="sm" disabled={!cheatMode}>
                        Normal Win Rate (50%)
                      </Button>
                      <Button variant="destructive" size="sm" disabled={!cheatMode}>
                        Low Win Rate (30%-)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Betting Manipulation</Label>
                    <div className="grid grid-cols-1 gap-1 mt-2">
                      <Button variant="outline" size="sm" disabled={!cheatMode}>
                        Favor Small Bets
                      </Button>
                      <Button variant="outline" size="sm" disabled={!cheatMode}>
                        Favor Large Bets
                      </Button>
                      <Button variant="destructive" size="sm" disabled={!cheatMode}>
                        Target Large Bets
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Special Modes</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline" disabled={!cheatMode}>
                      <Target className="mr-2 h-4 w-4" />
                      Target Specific User
                    </Button>
                    <Button variant="outline" disabled={!cheatMode}>
                      Balanced Mode (Fair Play)
                    </Button>
                    <Button variant="destructive" disabled={!cheatMode}>
                      Maximum Profit Mode
                    </Button>
                    <Button variant="outline" disabled={!cheatMode}>
                      Engagement Mode (Keep Playing)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
