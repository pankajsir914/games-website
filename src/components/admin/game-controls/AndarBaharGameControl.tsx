import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spade, Heart, Diamond, Club, Target, Zap, Timer, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AndarBaharGameControl = () => {
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedSide, setForcedSide] = useState<string>('');
  const [jokerCard, setJokerCard] = useState('');
  const [manipulationType, setManipulationType] = useState('side-control');

  const cardSuits = ['♠️', '♥️', '♦️', '♣️'];
  const cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const handleForceResult = () => {
    toast({
      title: "Result Forced",
      description: `Next round will win on ${forcedSide} side`,
    });
  };

  const handleGameControl = (action: string) => {
    toast({
      title: "Game Action",
      description: `${action} executed successfully`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Spade className="h-5 w-5" />
            Andar Bahar Game Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-success">Round #1247</p>
              <p className="text-sm text-muted-foreground">Current Round</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">1,580</p>
              <p className="text-sm text-muted-foreground">Active Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-gold">₹67,850</p>
              <p className="text-sm text-muted-foreground">Total Bets</p>
            </div>
            <div className="text-center">
              <Badge className="bg-gaming-success">Betting</Badge>
              <p className="text-sm text-muted-foreground mt-1">Round Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="controls">Game Controls</TabsTrigger>
          <TabsTrigger value="rounds">Round Management</TabsTrigger>
          <TabsTrigger value="bets">Bet Analytics</TabsTrigger>
          <TabsTrigger value="history">Game History</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Result Manipulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="cheat-mode">Cheat Mode</Label>
                <Switch
                  id="cheat-mode"
                  checked={cheatMode}
                  onCheckedChange={setCheatMode}
                />
              </div>

              {cheatMode && (
                <div className="space-y-4 p-4 border rounded-lg bg-destructive/5">
                  <div className="space-y-2">
                    <Label>Force Winning Side</Label>
                    <Select value={forcedSide} onValueChange={setForcedSide}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select winning side" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="andar">Andar (Left)</SelectItem>
                        <SelectItem value="bahar">Bahar (Right)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Joker Card Control</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {cardSuits.map((suit) => (
                        <Button
                          key={suit}
                          variant="outline"
                          size="sm"
                          onClick={() => setJokerCard(suit)}
                          className={jokerCard === suit ? 'bg-primary' : ''}
                        >
                          {suit}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="destructive" className="flex-1" onClick={handleForceResult}>
                      <Target className="mr-2 h-4 w-4" />
                      Force Next Result
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleGameControl('Start New Round')}>
                  <Timer className="mr-2 h-4 w-4" />
                  Start New Round
                </Button>
                <Button variant="outline" onClick={() => handleGameControl('End Current Round')}>
                  End Current Round
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rounds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Round Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <h3 className="font-semibold text-lg mb-2">Andar (Left)</h3>
                    <p className="text-2xl font-bold text-red-500">₹34,250</p>
                    <p className="text-sm text-muted-foreground">Total Bets</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <h3 className="font-semibold text-lg mb-2">Bahar (Right)</h3>
                    <p className="text-2xl font-bold text-blue-500">₹33,600</p>
                    <p className="text-sm text-muted-foreground">Total Bets</p>
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Joker Card</h4>
                  <div className="text-4xl">🃏</div>
                  <p className="text-sm text-muted-foreground mt-2">King of Hearts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bet Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Andar Bets</span>
                    <div className="text-right">
                      <p className="font-bold">847 bets</p>
                      <p className="text-sm text-muted-foreground">₹34,250</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Bahar Bets</span>
                    <div className="text-right">
                      <p className="font-bold">733 bets</p>
                      <p className="text-sm text-muted-foreground">₹33,600</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Today's Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Rounds</span>
                    <span className="font-bold">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-bold text-gaming-success">₹2,47,850</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Edge</span>
                    <span className="font-bold">2.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Round Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { round: 1246, joker: 'K♥️', winner: 'Andar', payout: '₹28,450' },
                  { round: 1245, joker: '7♠️', winner: 'Bahar', payout: '₹31,200' },
                  { round: 1244, joker: 'A♦️', winner: 'Andar', payout: '₹25,800' },
                  { round: 1243, joker: 'Q♣️', winner: 'Bahar', payout: '₹29,600' },
                  { round: 1242, joker: '9♥️', winner: 'Andar', payout: '₹27,300' }
                ].map((result) => (
                  <div key={result.round} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">#{result.round}</span>
                      <span className="text-lg">{result.joker}</span>
                      <Badge variant={result.winner === 'Andar' ? 'default' : 'secondary'}>
                        {result.winner}
                      </Badge>
                    </div>
                    <span className="font-medium text-gaming-success">{result.payout}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};