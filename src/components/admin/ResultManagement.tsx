import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dice1, Clock, AlertTriangle, Settings, RotateCcw } from 'lucide-react';

export const ResultManagement = () => {
  const [selectedGame, setSelectedGame] = useState('color_prediction');
  const [manualResult, setManualResult] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Fetch recent results
  const { data: recentResults, isLoading } = useQuery({
    queryKey: ['recent-results', selectedGame],
    queryFn: async () => {
      let tableName = '';
      let selectQuery = '';
      
      switch (selectedGame) {
        case 'color_prediction':
          tableName = 'color_prediction_rounds';
          selectQuery = 'id, period, winning_color, status, created_at, draw_time';
          break;
        case 'aviator':
          tableName = 'aviator_rounds';
          selectQuery = 'id, round_number, crash_multiplier, status, created_at, crash_time';
          break;
        case 'andar_bahar':
          tableName = 'andar_bahar_rounds';
          selectQuery = 'id, round_number, winning_side, joker_card, status, created_at, game_end_time';
          break;
        case 'roulette':
          tableName = 'roulette_rounds';
          selectQuery = 'id, round_number, winning_number, winning_color, status, created_at, spin_end_time';
          break;
        default:
          return [];
      }

      const { data, error } = await (supabase as any)
        .from(tableName)
        .select(selectQuery)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const handleManualOverride = async () => {
    if (!manualResult || !overrideReason) {
      toast({
        title: "Error",
        description: "Please provide both result and reason",
        variant: "destructive",
      });
      return;
    }

    try {
      // Log the manual override
      await supabase.rpc('log_admin_activity', {
        p_action_type: 'manual_result_override',
        p_target_type: 'game',
        p_target_id: null,
        p_details: {
          game: selectedGame,
          result: manualResult,
          reason: overrideReason
        }
      });

      // Create alert for manual override
      await supabase.rpc('create_admin_alert', {
        p_alert_type: 'manual_override',
        p_severity: 'high',
        p_title: 'Manual Result Override',
        p_description: `Admin manually overrode ${selectedGame} result to ${manualResult}`,
        p_data: {
          game: selectedGame,
          result: manualResult,
          reason: overrideReason
        }
      });

      toast({
        title: "Override Recorded",
        description: "Manual result override has been logged and recorded",
      });

      setManualResult('');
      setOverrideReason('');
    } catch (error: any) {
      toast({
        title: "Override Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getResultDisplay = (result: any) => {
    switch (selectedGame) {
      case 'color_prediction':
        return result.winning_color || 'Pending';
      case 'aviator':
        return result.crash_multiplier ? `${result.crash_multiplier}x` : 'Pending';
      case 'andar_bahar':
        return result.winning_side || 'Pending';
      case 'roulette':
        return result.winning_number !== null ? `${result.winning_number} (${result.winning_color})` : 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'betting':
        return <Badge variant="outline">Betting</Badge>;
      case 'drawing':
        return <Badge className="bg-blue-600">Drawing</Badge>;
      case 'flying':
        return <Badge className="bg-purple-600">Flying</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Result Management</h2>
          <p className="text-muted-foreground">
            View and manage game results across all platforms
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Manual Override
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Result Override</DialogTitle>
              <DialogDescription>
                Override the result for testing or emergency purposes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Game Type</Label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color_prediction">Color Prediction</SelectItem>
                    <SelectItem value="aviator">Aviator</SelectItem>
                    <SelectItem value="andar_bahar">Andar Bahar</SelectItem>
                    <SelectItem value="roulette">Roulette</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Manual Result</Label>
                <Input
                  value={manualResult}
                  onChange={(e) => setManualResult(e.target.value)}
                  placeholder="Enter result (e.g., red, 2.5x, andar, 17)"
                />
              </div>

              <div>
                <Label>Reason for Override</Label>
                <Textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why this manual override is necessary..."
                  rows={3}
                />
              </div>

              <Button onClick={handleManualOverride} className="w-full">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Confirm Override
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Game Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Game Results</CardTitle>
          <CardDescription>Select a game to view its recent results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color_prediction">Color Prediction</SelectItem>
                <SelectItem value="aviator">Aviator</SelectItem>
                <SelectItem value="andar_bahar">Andar Bahar</SelectItem>
                <SelectItem value="roulette">Roulette</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Round/Period</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentResults?.length ? (
                    recentResults.map((result: any) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">
                          {result.period || result.round_number || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getResultDisplay(result)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(result.status)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(result.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {result.draw_time || result.crash_time || result.game_end_time || result.spin_end_time
                            ? new Date(result.draw_time || result.crash_time || result.game_end_time || result.spin_end_time).toLocaleString()
                            : 'Pending'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No results found for {selectedGame}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Generation Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dice1 className="h-5 w-5" />
              Random Generation
            </CardTitle>
            <CardDescription>How results are generated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Color Prediction</h4>
              <p className="text-sm text-muted-foreground">
                Results generated using cryptographically secure random number generation.
                Red/Green: 45% each, Violet: 10%
              </p>
            </div>
            <div>
              <h4 className="font-medium">Aviator</h4>
              <p className="text-sm text-muted-foreground">
                Crash multiplier calculated using provably fair algorithm with server seed.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Andar Bahar</h4>
              <p className="text-sm text-muted-foreground">
                Card dealing simulation with shuffled deck and fair distribution.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              CRON Job Status
            </CardTitle>
            <CardDescription>Automated result generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Color Prediction</span>
              <Badge className="bg-green-600">Active (30s)</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Aviator</span>
              <Badge className="bg-green-600">Active (60s)</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Andar Bahar</span>
              <Badge className="bg-green-600">Active (90s)</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Roulette</span>
              <Badge className="bg-green-600">Active (120s)</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};