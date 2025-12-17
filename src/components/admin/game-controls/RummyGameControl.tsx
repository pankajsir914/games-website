import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spade, Heart, Diamond, Club, Zap, Target, Users, Timer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const RummyGameControl = () => {
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedCards, setForcedCards] = useState<string[]>([]);
  const [targetPlayer, setTargetPlayer] = useState('');
  const [manipulationType, setManipulationType] = useState('card-control');

  const cardSuits = [
    { name: 'Spades', value: 'spades', icon: Spade },
    { name: 'Hearts', value: 'hearts', icon: Heart },
    { name: 'Diamonds', value: 'diamonds', icon: Diamond },
    { name: 'Clubs', value: 'clubs', icon: Club }
  ];

  const cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const handleForceCard = () => {
    toast({
      title: "Card Forced",
      description: `Forced cards for ${targetPlayer || 'selected player'}`,
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
            Rummy Game Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-success">156</p>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">2,340</p>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-gold">₹89,450</p>
              <p className="text-sm text-muted-foreground">Total Pool</p>
            </div>
            <div className="text-center">
              <Badge className="bg-gaming-success">Live</Badge>
              <p className="text-sm text-muted-foreground mt-1">Game Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="controls">Game Controls</TabsTrigger>
          <TabsTrigger value="cards">Card Management</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Manipulation Controls
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
                    <Label>Manipulation Type</Label>
                    <Select value={manipulationType} onValueChange={setManipulationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card-control">Card Control</SelectItem>
                        <SelectItem value="sequence-control">Sequence Control</SelectItem>
                        <SelectItem value="meld-manipulation">Meld Manipulation</SelectItem>
                        <SelectItem value="winning-control">Winning Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Player</Label>
                    <Input
                      placeholder="Enter player ID or username"
                      value={targetPlayer}
                      onChange={(e) => setTargetPlayer(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="destructive" className="flex-1" onClick={handleForceCard}>
                      <Target className="mr-2 h-4 w-4" />
                      Apply Manipulation
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Distribution Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {cardSuits.map((suit) => (
                  <Card key={suit.value} className="p-4">
                    <div className="text-center">
                      <suit.icon className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">{suit.name}</p>
                      <Button size="sm" className="mt-2">Control</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Rummy Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((session) => (
                  <div key={session} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Session #{session}</p>
                      <p className="text-sm text-muted-foreground">4 players • Pool: ₹2,500</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Active</Badge>
                      <Button size="sm" variant="outline">View</Button>
                      <Button size="sm" variant="destructive">End</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Player Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Win Rate</span>
                    <span className="font-bold">67%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Game Time</span>
                    <span className="font-bold">12 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drop Rate</span>
                    <span className="font-bold">15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Today's Revenue</span>
                    <span className="font-bold text-gaming-success">₹45,670</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission Earned</span>
                    <span className="font-bold text-gaming-gold">₹3,240</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Entry Fee</span>
                    <span className="font-bold">₹287</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};