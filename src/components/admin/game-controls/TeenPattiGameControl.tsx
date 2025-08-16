import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, Users, TrendingUp, Settings, Crown, Target, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const TeenPattiAdminControl = () => {
  const { toast } = useToast();
  const [gameSettings, setGameSettings] = useState({
    isEnabled: true,
    maintenanceMode: false,
    minBet: 10,
    maxBet: 1000,
    entryFee: 50,
    houseEdge: 5,
    maxPlayersPerTable: 5,
    minPlayersToStart: 2
  });

  const [gameStats] = useState({
    activeTables: 12,
    totalPlayers: 45,
    revenueToday: 25680,
    totalHands: 1247,
    averagePot: 450
  });

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
      description: "All Teen Patti tables have been disabled",
      variant: "destructive"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
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
          <p className="text-muted-foreground">Manage Teen Patti tables, settings, and player activities</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={gameSettings.isEnabled ? "destructive" : "default"}
            onClick={handleEmergencyStop}
          >
            {gameSettings.isEnabled ? "Emergency Stop" : "Game Stopped"}
          </Button>
        </div>
      </div>

      {/* Game Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{gameStats.activeTables}</div>
              <div className="text-sm text-muted-foreground">Active Tables</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{gameStats.totalPlayers}</div>
              <div className="text-sm text-muted-foreground">Live Players</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{formatCurrency(gameStats.revenueToday)}</div>
              <div className="text-sm text-muted-foreground">Today Revenue</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{gameStats.totalHands}</div>
              <div className="text-sm text-muted-foreground">Hands Played</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{formatCurrency(gameStats.averagePot)}</div>
              <div className="text-sm text-muted-foreground">Avg Pot Size</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Control Panel */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Game Settings</TabsTrigger>
          <TabsTrigger value="tables">Live Tables</TabsTrigger>
          <TabsTrigger value="players">Player Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Game Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Game Control
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Maximum Bet (₹)</Label>
                  <Input
                    type="number"
                    value={gameSettings.maxBet}
                    onChange={(e) => handleSettingChange('maxBet', Number(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Table Entry Fee (₹)</Label>
                  <Input
                    type="number"
                    value={gameSettings.entryFee}
                    onChange={(e) => handleSettingChange('entryFee', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Table Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Table Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Players Per Table</Label>
                  <Input
                    type="number"
                    value={gameSettings.maxPlayersPerTable}
                    onChange={(e) => handleSettingChange('maxPlayersPerTable', Number(e.target.value))}
                    min="2"
                    max="6"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Min Players to Start</Label>
                  <Input
                    type="number"
                    value={gameSettings.minPlayersToStart}
                    onChange={(e) => handleSettingChange('minPlayersToStart', Number(e.target.value))}
                    min="2"
                    max="4"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Game Status
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
                    <span>Current House Edge</span>
                    <Badge variant="outline">
                      {gameSettings.houseEdge}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Live Teen Patti Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Live tables management interface will be implemented here.
                <br />
                This will show real-time table status, player counts, and pot sizes.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Player Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Player management interface will be implemented here.
                <br />
                This will show active players, betting patterns, and moderation tools.
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
                Detailed analytics and reporting interface will be implemented here.
                <br />
                This will include revenue charts, player behavior analysis, and game statistics.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};