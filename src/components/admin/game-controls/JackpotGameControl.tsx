import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Target, Zap, Timer, Gift, TrendingUp, Users, Clock, DollarSign, RotateCcw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useGameManagement } from '@/hooks/useGameManagement';
import { useJackpotRounds } from '@/hooks/useJackpotRounds';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';

export const JackpotGameControl = () => {
  const adminAuth = useAdminAuth();
  const { gameSettings, toggleGameStatus } = useGameManagement();
  const { currentRound, history, timeLeft, formatTime } = useJackpotRounds();
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedWinner, setForcedWinner] = useState('');
  const [winningTicket, setWinningTicket] = useState<number | null>(null);
  const [manipulationType, setManipulationType] = useState('winner-control');
  
  const gameStatus = gameSettings?.find(g => g.game_type === 'jackpot');

  const handleForceComplete = async () => {
    if (!currentRound?.round_id) {
      toast.error('No active round to complete');
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('jackpot-manager', {
        body: { 
          action: 'complete',
          roundId: currentRound.round_id 
        }
      });
      
      if (error) throw error;
      
      toast.success(`Round completed! Winner: ${data.winner_name}`);
    } catch (error) {
      console.error('Error completing round:', error);
      toast.error('Failed to complete round');
    }
  };

  const handleToggleGame = async (enabled: boolean) => {
    try {
      toggleGameStatus('jackpot');
      toast.success(`Jackpot game ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update game status');
    }
  };

  const getGameStatusColor = () => {
    if (!gameStatus?.is_enabled) return 'bg-red-500';
    if (gameStatus?.maintenance_mode) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getGameStatusText = () => {
    if (!gameStatus?.is_enabled) return 'Disabled';
    if (gameStatus?.maintenance_mode) return 'Maintenance';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Jackpot Control</h1>
            <p className="text-muted-foreground">Manage and monitor jackpot rounds</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getGameStatusColor()}`} />
          <Badge variant={gameStatus?.is_enabled ? 'default' : 'secondary'}>
            {getGameStatusText()}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Current Pot</p>
                <p className="text-2xl font-bold">₹{currentRound?.total_amount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Players</p>
                <p className="text-2xl font-bold">{currentRound?.total_players || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p className="text-2xl font-bold">{formatTime(timeLeft)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Rounds</p>
                <p className="text-2xl font-bold">{history?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Controls */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="rounds">Round History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Round Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Current Round Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentRound?.active ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Round ID:</span>
                    <Badge variant="outline">{currentRound.round_id.slice(0, 8)}...</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Time Remaining:</span>
                      <span className="font-mono">{formatTime(timeLeft)}</span>
                    </div>
                    <Progress value={(60 - timeLeft) / 60 * 100} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Pot</p>
                      <p className="text-xl font-bold text-green-600">₹{currentRound.total_amount}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Players</p>
                      <p className="text-xl font-bold text-blue-600">{currentRound.total_players}</p>
                    </div>
                  </div>

                  {/* Current Entries */}
                  {currentRound.entries && currentRound.entries.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Current Entries:</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {currentRound.entries.map((entry: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">{entry.user_name}</span>
                            <div className="text-right">
                              <span className="text-sm font-medium">₹{entry.amount}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({(entry.win_probability * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No active round</p>
                  <p className="text-sm text-muted-foreground">New round will start when players join</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-6">
          {/* Game Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Game Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="game-enabled">Enable Jackpot Game</Label>
                    <p className="text-sm text-muted-foreground">Allow players to join jackpot rounds</p>
                  </div>
                  <Switch
                    id="game-enabled"
                    checked={gameStatus?.is_enabled || false}
                    onCheckedChange={handleToggleGame}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Temporarily disable new rounds</p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={gameStatus?.maintenance_mode || false}
                    onCheckedChange={(checked) => handleToggleGame(!checked)}
                  />
                </div>
              </div>

              {/* Manual Controls */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Manual Round Management</h4>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleForceComplete}
                    disabled={!currentRound?.active}
                    className="flex-1"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Force Complete Round
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <strong>Note:</strong> Manual controls should only be used in emergency situations. 
                  The system automatically manages rounds.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rounds" className="space-y-6">
          {/* Round History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Rounds</CardTitle>
            </CardHeader>
            <CardContent>
              {history && history.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round ID</TableHead>
                      <TableHead>Winner</TableHead>
                      <TableHead>Prize Amount</TableHead>
                      <TableHead>Players</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.slice(0, 10).map((round: any) => (
                      <TableRow key={round.id}>
                        <TableCell className="font-mono text-sm">
                          {round.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {round.winner_name || 'Anonymous'}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          ₹{round.winner_amount}
                        </TableCell>
                        <TableCell>{round.total_players}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(round.updated_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No completed rounds yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Revenue (5% commission)</span>
                    <span className="font-medium">
                      ₹{history?.reduce((sum: number, round: any) => sum + (round.commission_amount || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Prizes Paid</span>
                    <span className="font-medium">
                      ₹{history?.reduce((sum: number, round: any) => sum + (round.winner_amount || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Round Size</span>
                    <span className="font-medium">
                      ₹{history?.length ? Math.round(history.reduce((sum: number, round: any) => sum + round.total_amount, 0) / history.length) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Player Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Rounds Played</span>
                    <span className="font-medium">{history?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Players per Round</span>
                    <span className="font-medium">
                      {history?.length ? Math.round(history.reduce((sum: number, round: any) => sum + round.total_players, 0) / history.length) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Current Active Players</span>
                    <span className="font-medium">{currentRound?.total_players || 0}</span>
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