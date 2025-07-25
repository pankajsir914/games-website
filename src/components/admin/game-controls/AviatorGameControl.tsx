
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plane, TrendingUp, TrendingDown, Zap, Target, Timer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useGameManagement } from '@/hooks/useGameManagement';
import { supabase } from '@/integrations/supabase/client';

export const AviatorGameControl = () => {
  const { data: gameSettings, updateGameSetting } = useGameSettings();
  const { toggleGameStatus, isGamePaused } = useGameManagement();
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedMultiplier, setForcedMultiplier] = useState<number | null>(null);
  const [crashPattern, setCrashPattern] = useState('random');
  const [targetUser, setTargetUser] = useState('');

  React.useEffect(() => {
    const aviatorSettings = gameSettings?.find(g => g.game_type === 'aviator');
    if (aviatorSettings?.settings) {
      setCheatMode(aviatorSettings.settings.cheat_mode || false);
      setForcedMultiplier(aviatorSettings.settings.forced_multiplier || null);
    }
  }, [gameSettings]);

  const toggleCheatMode = async () => {
    const newCheatMode = !cheatMode;
    setCheatMode(newCheatMode);
    
    // Update game settings in database
    await updateGameSetting({
      gameType: 'aviator',
      updates: {
        settings: {
          cheat_mode: newCheatMode,
          forced_multiplier: forcedMultiplier
        }
      }
    });

    toast({
      title: newCheatMode ? "Cheat Mode Enabled" : "Cheat Mode Disabled",
      description: newCheatMode ? "Aviator manipulation is now active" : "Game will run normally",
      variant: newCheatMode ? "destructive" : "default"
    });
  };

  const handleForceMultiplier = async () => {
    if (forcedMultiplier) {
      // Update game settings with forced multiplier
      await updateGameSetting({
        gameType: 'aviator',
        updates: {
          settings: {
            cheat_mode: cheatMode,
            forced_multiplier: forcedMultiplier
          }
        }
      });

      toast({
        title: "Multiplier Set",
        description: `Next round will crash at ${forcedMultiplier}x`,
        variant: "default"
      });
    }
  };

  const createInstantRound = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch('https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/aviator-game-manager?action=create_round', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW9qaWhncGVlaHZwd2VqZXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0NTEsImV4cCI6MjA2ODU5OTQ1MX0.izGAao4U7k8gn4UIb7kgPs-w1ZEg0GzmAhkZ_Ff_Oxk',
        }
      });
      
      if (!response.ok) throw new Error('Failed to create round');
      
      toast({
        title: "Round Created",
        description: "New Aviator round has been created",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Status and Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Aviator Game Control
            <Badge variant={isGamePaused('aviator') ? 'destructive' : 'default'}>
              {isGamePaused('aviator') ? 'PAUSED' : 'ACTIVE'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="aviator-cheat"
                checked={cheatMode}
                onCheckedChange={toggleCheatMode}
              />
              <Label htmlFor="aviator-cheat">Enable Aviator Manipulation</Label>
              {cheatMode && <Badge variant="destructive">CHEAT MODE ACTIVE</Badge>}
            </div>
            <Button 
              onClick={() => toggleGameStatus('aviator')} 
              variant={isGamePaused('aviator') ? 'default' : 'destructive'}
            >
              {isGamePaused('aviator') ? 'Resume Game' : 'Pause Game'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="multiplier" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="multiplier">Multiplier Control</TabsTrigger>
          <TabsTrigger value="patterns">Crash Patterns</TabsTrigger>
          <TabsTrigger value="players">Player Control</TabsTrigger>
          <TabsTrigger value="timing">Timing Control</TabsTrigger>
        </TabsList>

        <TabsContent value="multiplier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Crash Multiplier Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="forced-multiplier">Force Next Crash Multiplier</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="forced-multiplier"
                      type="number"
                      min="1.01"
                      max="1000"
                      step="0.01"
                      placeholder="e.g., 2.50"
                      value={forcedMultiplier || ''}
                      onChange={(e) => setForcedMultiplier(parseFloat(e.target.value))}
                      disabled={!cheatMode}
                    />
                    <Button onClick={handleForceMultiplier} disabled={!cheatMode || !forcedMultiplier}>
                      Set
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setForcedMultiplier(1.01)}
                    disabled={!cheatMode}
                  >
                    Instant Crash (1.01x)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setForcedMultiplier(2.00)}
                    disabled={!cheatMode}
                  >
                    Safe Win (2.00x)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setForcedMultiplier(10.00)}
                    disabled={!cheatMode}
                  >
                    Big Win (10.00x)
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button variant="destructive" disabled={!cheatMode}>
                    Force Low Multipliers (1.01-1.50x)
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Force High Multipliers (5.00x+)
                  </Button>
                  <Button onClick={createInstantRound}>
                    Create New Round
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crash Pattern Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Crash Pattern Mode</Label>
                  <Select onValueChange={setCrashPattern} disabled={!cheatMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crash pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Random (Normal)</SelectItem>
                      <SelectItem value="low-streak">Low Multiplier Streak</SelectItem>
                      <SelectItem value="high-streak">High Multiplier Streak</SelectItem>
                      <SelectItem value="alternating">Alternating High/Low</SelectItem>
                      <SelectItem value="progressive">Progressive Increase</SelectItem>
                      <SelectItem value="house-edge">Maximum House Edge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pattern-rounds">Apply Pattern for X Rounds</Label>
                  <Input
                    id="pattern-rounds"
                    type="number"
                    min="1"
                    max="100"
                    defaultValue="10"
                    disabled={!cheatMode}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!cheatMode}>
                    Start Pattern
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Stop Pattern
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Player-Specific Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="target-user">Target Specific User</Label>
                  <Input
                    id="target-user"
                    placeholder="Enter user ID or email"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    disabled={!cheatMode}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!cheatMode || !targetUser}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Favor User (Higher Multipliers)
                  </Button>
                  <Button variant="destructive" disabled={!cheatMode || !targetUser}>
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Target User (Lower Multipliers)
                  </Button>
                </div>

                <div>
                  <Label>Auto Cash-out Manipulation</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline" disabled={!cheatMode || !targetUser}>
                      Disable Auto Cash-out
                    </Button>
                    <Button variant="outline" disabled={!cheatMode || !targetUser}>
                      Force Early Cash-out
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Game Timing Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="betting-duration">Betting Phase Duration (seconds)</Label>
                  <Input
                    id="betting-duration"
                    type="number"
                    min="3"
                    max="30"
                    defaultValue="7"
                    disabled={!cheatMode}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="flight-speed">Flight Speed Multiplier</Label>
                  <Input
                    id="flight-speed"
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    defaultValue="1"
                    disabled={!cheatMode}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!cheatMode}>
                    Extend Betting Time
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Quick Round Mode
                  </Button>
                  <Button variant="destructive" disabled={!cheatMode}>
                    Instant Crash Mode
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Marathon Mode
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
