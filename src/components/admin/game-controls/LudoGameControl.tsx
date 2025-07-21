
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Target, Zap, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const LudoGameControl = () => {
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedDiceValue, setForcedDiceValue] = useState<number | null>(null);
  const [targetPlayer, setTargetPlayer] = useState('');
  const [manipulationMode, setManipulationMode] = useState('none');

  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  const handleForceDiceRoll = (value: number) => {
    setForcedDiceValue(value);
    toast({
      title: "Dice Manipulation Active",
      description: `Next dice roll will be ${value}`,
      variant: "default"
    });
  };

  const toggleCheatMode = () => {
    setCheatMode(!cheatMode);
    toast({
      title: cheatMode ? "Cheat Mode Disabled" : "Cheat Mode Enabled",
      description: cheatMode ? "Game will run normally" : "Game manipulation is now active",
      variant: cheatMode ? "default" : "destructive"
    });
  };

  return (
    <div className="space-y-6">
      {/* Cheat Mode Toggle */}
      <Card className={cheatMode ? "border-red-500" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Game Manipulation Controls
            {cheatMode && <Badge variant="destructive">CHEAT MODE ACTIVE</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="cheat-mode"
              checked={cheatMode}
              onCheckedChange={toggleCheatMode}
            />
            <Label htmlFor="cheat-mode">Enable Game Manipulation</Label>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dice" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dice">Dice Control</TabsTrigger>
          <TabsTrigger value="player">Player Control</TabsTrigger>
          <TabsTrigger value="game">Game State</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="dice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dice Manipulation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Force Next Dice Roll</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6].map((value) => {
                      const DiceIcon = diceIcons[value - 1];
                      return (
                        <Button
                          key={value}
                          variant={forcedDiceValue === value ? "default" : "outline"}
                          onClick={() => handleForceDiceRoll(value)}
                          disabled={!cheatMode}
                          className="h-12"
                        >
                          <DiceIcon className="h-6 w-6" />
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setForcedDiceValue(null)}
                    disabled={!cheatMode}
                  >
                    Reset Dice Control
                  </Button>
                  <Button 
                    variant="destructive"
                    disabled={!cheatMode}
                  >
                    Force Double Six
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="player" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Player Manipulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="target-player">Target Player</Label>
                  <Select onValueChange={setTargetPlayer} disabled={!cheatMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select player to manipulate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player1">Player 1 (Red)</SelectItem>
                      <SelectItem value="player2">Player 2 (Blue)</SelectItem>
                      <SelectItem value="player3">Player 3 (Green)</SelectItem>
                      <SelectItem value="player4">Player 4 (Yellow)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Manipulation Type</Label>
                  <Select onValueChange={setManipulationMode} disabled={!cheatMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manipulation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="favor">Favor Player (Better Rolls)</SelectItem>
                      <SelectItem value="sabotage">Sabotage Player (Worse Rolls)</SelectItem>
                      <SelectItem value="protect">Protect from Attacks</SelectItem>
                      <SelectItem value="expose">Expose to Attacks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!cheatMode || !targetPlayer}>
                    Move Token Home
                  </Button>
                  <Button variant="outline" disabled={!cheatMode || !targetPlayer}>
                    Advance to Win
                  </Button>
                  <Button variant="destructive" disabled={!cheatMode || !targetPlayer}>
                    Send All Tokens Back
                  </Button>
                  <Button variant="outline" disabled={!cheatMode || !targetPlayer}>
                    Block Player
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="game" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game State Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" disabled={!cheatMode}>
                    Pause Game
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Resume Game
                  </Button>
                  <Button variant="destructive" disabled={!cheatMode}>
                    End Game Early
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Extend Time
                  </Button>
                </div>

                <div>
                  <Label htmlFor="game-speed">Game Speed Multiplier</Label>
                  <Input
                    id="game-speed"
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    defaultValue="1"
                    disabled={!cheatMode}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Game Outcome Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Force Winner</Label>
                  <Select disabled={!cheatMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select winner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player1">Player 1 (Red)</SelectItem>
                      <SelectItem value="player2">Player 2 (Blue)</SelectItem>
                      <SelectItem value="player3">Player 3 (Green)</SelectItem>
                      <SelectItem value="player4">Player 4 (Yellow)</SelectItem>
                      <SelectItem value="draw">Force Draw</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!cheatMode}>
                    Balanced Game
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Close Finish
                  </Button>
                  <Button variant="destructive" disabled={!cheatMode}>
                    House Always Wins
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Random Chaos Mode
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
