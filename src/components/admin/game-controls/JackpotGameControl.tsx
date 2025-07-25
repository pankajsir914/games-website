import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Zap, Timer, Gift, TrendingUp, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const JackpotGameControl = () => {
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedWinner, setForcedWinner] = useState('');
  const [winningTicket, setWinningTicket] = useState<number | null>(null);
  const [manipulationType, setManipulationType] = useState('winner-control');

  const activeJackpots = [
    { id: 1, tier: 'Mega', pool: 2500000, tickets: 8750, players: 1247, endTime: '2h 45m' },
    { id: 2, tier: 'High', pool: 500000, tickets: 2340, players: 567, endTime: '45m' },
    { id: 3, tier: 'Medium', pool: 100000, tickets: 890, players: 234, endTime: '1h 12m' },
    { id: 4, tier: 'Low', pool: 25000, tickets: 450, players: 123, endTime: '23m' }
  ];

  const recentWinners = [
    { game: 'Mega Jackpot', winner: 'Player1234', amount: 2450000, tickets: 156 },
    { game: 'High Jackpot', winner: 'LuckyUser', amount: 456000, tickets: 89 },
    { game: 'Medium Jackpot', winner: 'WinnerABC', amount: 98000, tickets: 45 },
    { game: 'Low Jackpot', winner: 'NewPlayer', amount: 23000, tickets: 12 }
  ];

  const handleForceWinner = () => {
    toast({
      title: "Winner Forced",
      description: `${forcedWinner} will win the next jackpot`,
    });
  };

  const handleJackpotAction = (action: string, jackpotId: number) => {
    toast({
      title: "Jackpot Action",
      description: `${action} on Jackpot ${jackpotId}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Jackpot Game Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-success">4</p>
              <p className="text-sm text-muted-foreground">Active Jackpots</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">2,171</p>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-gold">₹31,25,000</p>
              <p className="text-sm text-muted-foreground">Total Pool Value</p>
            </div>
            <div className="text-center">
              <Badge className="bg-gaming-success">Live</Badge>
              <p className="text-sm text-muted-foreground mt-1">System Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="controls">Game Controls</TabsTrigger>
          <TabsTrigger value="jackpots">Active Jackpots</TabsTrigger>
          <TabsTrigger value="winners">Winners</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Winner Manipulation
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
                    <Label>Force Winner</Label>
                    <Input
                      placeholder="Enter player ID or username"
                      value={forcedWinner}
                      onChange={(e) => setForcedWinner(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Manipulation Type</Label>
                    <Select value={manipulationType} onValueChange={setManipulationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="winner-control">Specific Winner</SelectItem>
                        <SelectItem value="ticket-control">Winning Ticket</SelectItem>
                        <SelectItem value="tier-control">Tier Control</SelectItem>
                        <SelectItem value="timing-control">Timing Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {manipulationType === 'ticket-control' && (
                    <div className="space-y-2">
                      <Label>Winning Ticket Number</Label>
                      <Input
                        type="number"
                        placeholder="Enter ticket number"
                        value={winningTicket || ''}
                        onChange={(e) => setWinningTicket(parseInt(e.target.value))}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="destructive" className="flex-1" onClick={handleForceWinner}>
                      <Target className="mr-2 h-4 w-4" />
                      Force Winner
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => toast({ title: "New jackpot created" })}>
                  <Gift className="mr-2 h-4 w-4" />
                  Create Jackpot
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "All jackpots paused" })}>
                  <Timer className="mr-2 h-4 w-4" />
                  Pause All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jackpots" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJackpots.map((jackpot) => (
              <Card key={jackpot.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{jackpot.tier} Jackpot</span>
                    <Badge className="bg-gaming-gold">Live</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-r from-gaming-gold/10 to-gaming-gold/20 rounded-lg">
                    <p className="text-3xl font-bold text-gaming-gold">₹{jackpot.pool.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Current Pool</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm text-center">
                    <div>
                      <p className="font-bold">{jackpot.tickets}</p>
                      <p className="text-muted-foreground">Tickets</p>
                    </div>
                    <div>
                      <p className="font-bold">{jackpot.players}</p>
                      <p className="text-muted-foreground">Players</p>
                    </div>
                    <div>
                      <p className="font-bold">{jackpot.endTime}</p>
                      <p className="text-muted-foreground">Time Left</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleJackpotAction('Draw Winner', jackpot.id)}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Draw Winner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJackpotAction('Extend Time', jackpot.id)}
                    >
                      Extend
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleJackpotAction('Cancel', jackpot.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="winners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Recent Winners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentWinners.map((winner, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{winner.game}</p>
                      <p className="text-sm text-muted-foreground">
                        Winner: {winner.winner} • {winner.tickets} tickets
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gaming-gold">₹{winner.amount.toLocaleString()}</p>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Today's Sales</span>
                    <span className="font-bold text-gaming-success">₹8,45,670</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Payouts</span>
                    <span className="font-bold text-gaming-gold">₹7,65,430</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Profit</span>
                    <span className="font-bold">₹80,240</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Player Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Players</span>
                    <span className="font-bold">2,171</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Tickets/Player</span>
                    <span className="font-bold">5.7</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate</span>
                    <span className="font-bold">0.046%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Draws Today</span>
                    <span className="font-bold">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Pool Size</span>
                    <span className="font-bold">₹6,65,425</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Edge</span>
                    <span className="font-bold">10%</span>
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