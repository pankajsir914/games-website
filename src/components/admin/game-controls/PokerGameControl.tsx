import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spade, Heart, Diamond, Club, Target, Zap, Users, Timer, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGameManagement } from '@/hooks/useGameManagement';

export const PokerGameControl = () => {
  const { toggleGameStatus, isGamePaused } = useGameManagement();
  const [cheatMode, setCheatMode] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState('');
  const [forcedHand, setForcedHand] = useState('');
  const [manipulationType, setManipulationType] = useState('hand-control');

  const pokerHands = [
    'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House',
    'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'One Pair', 'High Card'
  ];

  const activeTables = [
    { id: 1, name: 'High Roller', players: 6, pot: 125000, stakes: '₹1000/₹2000' },
    { id: 2, name: 'VIP Room', players: 4, pot: 89000, stakes: '₹500/₹1000' },
    { id: 3, name: 'Beginner', players: 8, pot: 12000, stakes: '₹10/₹20' },
    { id: 4, name: 'Tournament', players: 24, pot: 250000, stakes: 'Tournament' }
  ];

  const handleForceHand = () => {
    toast({
      title: "Hand Forced",
      description: `${targetPlayer} will receive ${forcedHand}`,
    });
  };

  const handleTableAction = (action: string, tableId: number) => {
    toast({
      title: "Table Action",
      description: `${action} on Table ${tableId}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Spade className="h-5 w-5" />
            Poker Game Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-success">12</p>
              <p className="text-sm text-muted-foreground">Active Tables</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">156</p>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-gold">₹4,76,000</p>
              <p className="text-sm text-muted-foreground">Total Pot Value</p>
            </div>
            <div className="text-center">
              <Badge variant={isGamePaused('poker') ? 'destructive' : 'default'}>
                {isGamePaused('poker') ? 'PAUSED' : 'Live'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Game Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="controls">Game Controls</TabsTrigger>
          <TabsTrigger value="tables">Active Tables</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Hand Manipulation
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
                    <Label>Target Player</Label>
                    <Input
                      placeholder="Enter player ID or username"
                      value={targetPlayer}
                      onChange={(e) => setTargetPlayer(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Force Hand Type</Label>
                    <Select value={forcedHand} onValueChange={setForcedHand}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hand type" />
                      </SelectTrigger>
                      <SelectContent>
                        {pokerHands.map((hand) => (
                          <SelectItem key={hand} value={hand}>
                            {hand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Manipulation Type</Label>
                    <Select value={manipulationType} onValueChange={setManipulationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hand-control">Hand Control</SelectItem>
                        <SelectItem value="card-control">Specific Cards</SelectItem>
                        <SelectItem value="river-control">River Control</SelectItem>
                        <SelectItem value="showdown-control">Showdown Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="destructive" className="flex-1" onClick={handleForceHand}>
                      <Target className="mr-2 h-4 w-4" />
                      Force Hand
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button 
                  onClick={() => toggleGameStatus('poker')} 
                  variant={isGamePaused('poker') ? 'default' : 'destructive'}
                >
                  {isGamePaused('poker') ? 'Resume Game' : 'Pause Game'}
                </Button>
                <Button onClick={() => toast({ title: "Tables paused" })}>
                  <Timer className="mr-2 h-4 w-4" />
                  Pause All Tables
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "New table created" })}>
                  Create New Table
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTables.map((table) => (
              <Card key={table.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{table.name}</span>
                    <Badge>{table.players} Players</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current Pot</p>
                      <p className="font-bold text-gaming-gold">₹{table.pot.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stakes</p>
                      <p className="font-bold">{table.stakes}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleTableAction('View', table.id)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      View Table
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleTableAction('Close', table.id)}
                    >
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Today's Rake</span>
                    <span className="font-bold text-gaming-success">₹45,670</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tournament Fees</span>
                    <span className="font-bold text-gaming-gold">₹23,400</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-bold">₹69,070</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Player Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Session</span>
                    <span className="font-bold">2h 34m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hands/Hour</span>
                    <span className="font-bold">87</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate</span>
                    <span className="font-bold">23%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Game Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Hands</span>
                    <span className="font-bold">24,567</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Pot</span>
                    <span className="font-bold">₹12,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Edge</span>
                    <span className="font-bold">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tournaments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'High Roller Championship', players: 124, prize: '₹5,00,000', status: 'Running' },
                  { name: 'Daily Freeroll', players: 456, prize: '₹50,000', status: 'Registration' },
                  { name: 'Sit & Go Express', players: 8, prize: '₹10,000', status: 'Starting' }
                ].map((tournament, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{tournament.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tournament.players} players • Prize: {tournament.prize}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{tournament.status}</Badge>
                      <Button size="sm" variant="outline">Manage</Button>
                    </div>
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