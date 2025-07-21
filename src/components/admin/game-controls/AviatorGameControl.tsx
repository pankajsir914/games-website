
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

export const AviatorGameControl = () => {
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedMultiplier, setForcedMultiplier] = useState<number | null>(null);
  const [crashPattern, setCrashPattern] = useState('random');
  const [targetUser, setTargetUser] = useState('');

  const toggleCheatMode = () => {
    setCheatMode(!cheatMode);
    toast({
      title: cheatMode ? "Cheat Mode Disabled" : "Cheat Mode Enabled",
      description: cheatMode ? "Game will run normally" : "Aviator manipulation is now active",
      variant: cheatMode ? "default" : "destructive"
    });
  };

  const handleForceMultiplier = () => {
    if (forcedMultiplier) {
      toast({
        title: "Multiplier Set",
        description: `Next round will crash at ${forcedMultiplier}x`,
        variant: "default"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cheat Mode Toggle */}
      <Card className={cheatMode ? "border-red-500" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Aviator Game Manipulation
            {cheatMode && <Badge variant="destructive">CHEAT MODE ACTIVE</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="aviator-cheat"
              checked={cheatMode}
              onCheckedChange={toggleCheatMode}
            />
            <Label htmlFor="aviator-cheat">Enable Aviator Manipulation</Label>
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

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="destructive" disabled={!cheatMode}>
                    Force Low Multipliers (1.01-1.50x)
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Force High Multipliers (5.00x+)
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
