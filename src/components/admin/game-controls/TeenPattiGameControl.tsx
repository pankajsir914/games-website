import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, Users, TrendingUp, Settings, Crown, Target, BarChart3, Clock, Activity, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const TeenPattiGameControl = () => {
  const { toast } = useToast();
  const [gameSettings, setGameSettings] = useState({
    isEnabled: true,
    maintenanceMode: false,
    minBet: 10,
    maxBet: 1000,
    houseEdge: 5,
    roundDuration: 60, // seconds
    processingTime: 10, // seconds
    maxBetPerRound: 50000
  });

  const [roundStats] = useState({
    currentRound: 247,
    activeRound: true,
    timeRemaining: 45,
    totalPlayers: 32,
    totalPot: 15420,
    revenueToday: 45680,
    totalRounds: 1247,
    averagePot: 450,
    winRate: 48.5
  });

  const [recentRounds] = useState([
    { id: 246, players: 28, pot: 12450, winningHand: 'Trail', winners: 3 },
    { id: 245, players: 35, pot: 18920, winningHand: 'Pure Sequence', winners: 2 },
    { id: 244, players: 22, pot: 9870, winningHand: 'Color', winners: 5 },
    { id: 243, players: 41, pot: 23150, winningHand: 'Pair', winners: 8 },
  ]);

  const handleSettingChange = (key: string, value: any) => {
    setGameSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: "Setting Updated",
      description: `${key} has been updated to ${value}`,
    });
  };

  const handleEmergencyStop = () => {
    setGameSettings(prev => ({ ...prev, isEnabled: false, maintenanceMode: true }));
    toast({
      title: "Emergency Stop Activated",
      description: "Teen Patti rounds have been halted",
      variant: "destructive"
    });
  };

  const handleForceCompleteRound = () => {
    toast({
      title: "Round Completed",
      description: "Current round has been forcefully completed",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Teen Patti Control Panel
          </h2>
          <p className="text-muted-foreground">Manage continuous Teen Patti rounds and system settings</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleForceCompleteRound}
            disabled={!roundStats.activeRound}
          >
            Force Complete Round
          </Button>
          <Button 
            variant={gameSettings.isEnabled ? "destructive" : "default"}
            onClick={handleEmergencyStop}
          >
            {gameSettings.isEnabled ? "Emergency Stop" : "Game Stopped"}
          </Button>
        </div>
      </div>

      {/* Current Round Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Round #{roundStats.currentRound} Status
            </div>
            <Badge variant={roundStats.activeRound ? "default" : "secondary"}>
              {roundStats.activeRound ? "Betting Active" : "Processing"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {formatTime(roundStats.timeRemaining)}
              </div>
              <div className="text-sm text-muted-foreground">Time Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{roundStats.totalPlayers}</div>
              <div className="text-sm text-muted-foreground">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{formatCurrency(roundStats.totalPot)}</div>
              <div className="text-sm text-muted-foreground">Current Pot</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{roundStats.winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{formatCurrency(roundStats.revenueToday)}</div>
              <div className="text-sm text-muted-foreground">Today Revenue</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-500">{roundStats.totalRounds}</div>
              <div className="text-sm text-muted-foreground">Rounds Completed</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{formatCurrency(roundStats.averagePot)}</div>
              <div className="text-sm text-muted-foreground">Avg Pot Size</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {gameSettings.houseEdge}%
              </div>
              <div className="text-sm text-muted-foreground">House Edge</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Control Panel */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Game Settings</TabsTrigger>
          <TabsTrigger value="rounds">Live Rounds</TabsTrigger>
          <TabsTrigger value="history">Round History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Game Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Teen Patti</Label>
                  <Switch
                    checked={gameSettings.isEnabled}
                    onCheckedChange={(value) => handleSettingChange('isEnabled', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Maintenance Mode</Label>
                  <Switch
                    checked={gameSettings.maintenanceMode}
                    onCheckedChange={(value) => handleSettingChange('maintenanceMode', value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>House Edge (%)</Label>
                  <Input
                    type="number"
                    value={gameSettings.houseEdge}
                    onChange={(e) => handleSettingChange('houseEdge', Number(e.target.value))}
                    min="0"
                    max="20"
                    step="0.1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Round Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Round Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Round Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={gameSettings.roundDuration}
                    onChange={(e) => handleSettingChange('roundDuration', Number(e.target.value))}
                    min="30"
                    max="120"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Processing Time (seconds)</Label>
                  <Input
                    type="number"
                    value={gameSettings.processingTime}
                    onChange={(e) => handleSettingChange('processingTime', Number(e.target.value))}
                    min="5"
                    max="30"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Betting Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Betting Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Minimum Bet (₹)</Label>
                  <Input
                    type="number"
                    value={gameSettings.minBet}
                    onChange={(e) => handleSettingChange('minBet', Number(e.target.value))}
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Maximum Bet (₹)</Label>
                  <Input
                    type="number"
                    value={gameSettings.maxBet}
                    onChange={(e) => handleSettingChange('maxBet', Number(e.target.value))}
                    min="10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Max Bet Per Round (₹)</Label>
                  <Input
                    type="number"
                    value={gameSettings.maxBetPerRound}
                    onChange={(e) => handleSettingChange('maxBetPerRound', Number(e.target.value))}
                    min="1000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Game Status</span>
                    <Badge variant={gameSettings.isEnabled ? "default" : "destructive"}>
                      {gameSettings.isEnabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Maintenance</span>
                    <Badge variant={gameSettings.maintenanceMode ? "destructive" : "secondary"}>
                      {gameSettings.maintenanceMode ? "On" : "Off"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Round Duration</span>
                    <Badge variant="outline">
                      {gameSettings.roundDuration}s
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>System Load</span>
                    <Badge variant="outline" className="text-green-500">
                      Normal
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rounds">
          <Card>
            <CardHeader>
              <CardTitle>Live Round Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-4 bg-muted/20 rounded-lg">
                  <h3 className="text-lg font-semibold">Round #{roundStats.currentRound}</h3>
                  <p className="text-muted-foreground">
                    {roundStats.activeRound ? 'Betting in progress' : 'Processing results'}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-lg px-4 py-1">
                      {formatTime(roundStats.timeRemaining)}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-center text-muted-foreground">
                  Real-time round monitoring interface will show:
                  <br />
                  • Live bet placement tracking
                  <br />
                  • Player activity monitoring  
                  <br />
                  • Result generation process
                  <br />
                  • Payout distribution status
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Round History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRounds.map((round) => (
                  <div key={round.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div>
                      <div className="font-medium">Round #{round.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {round.players} players • {round.winningHand} • {round.winners} winners
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(round.pot)}</div>
                      <div className="text-sm text-muted-foreground">Total Pot</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Teen Patti Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Detailed analytics dashboard will include:
                <br />
                • Revenue trends and projections
                <br />
                • Player behavior patterns
                <br />
                • Round completion statistics
                <br />
                • Hand distribution analysis
                <br />
                • Peak activity times
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};