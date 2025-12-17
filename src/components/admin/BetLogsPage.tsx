import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBetLogs } from '@/hooks/useBetLogs';
import { Download, Search, Filter } from 'lucide-react';

export const BetLogsPage = () => {
  const [filters, setFilters] = useState({
    game: 'all',
    player: '',
    result: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const { data: betLogs, isLoading } = useBetLogs(filters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportToCSV = () => {
    if (!betLogs?.length) return;

    const headers = ['Player ID', 'Player Name', 'Game', 'Bet Amount', 'Chosen Value', 'Result', 'Payout', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...betLogs.map(bet => [
        bet.player_id,
        bet.player_name,
        bet.game,
        bet.bet_amount,
        bet.chosen_value,
        bet.result,
        bet.payout,
        new Date(bet.timestamp).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `bet-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'won':
        return <Badge className="bg-green-600">Won</Badge>;
      case 'lost':
        return <Badge variant="destructive">Lost</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{result}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bet Logs</h2>
          <p className="text-muted-foreground">
            {betLogs ? `${betLogs.length} bets found` : 'Loading...'}
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={!betLogs?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter bets by game, player, date range, and result</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Game</label>
              <Select value={filters.game} onValueChange={(value) => handleFilterChange('game', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All games</SelectItem>
                  <SelectItem value="color prediction">Color Prediction</SelectItem>
                  <SelectItem value="aviator">Aviator</SelectItem>
                  <SelectItem value="andar bahar">Andar Bahar</SelectItem>
                  <SelectItem value="roulette">Roulette</SelectItem>
                  <SelectItem value="poker">Poker</SelectItem>
                  <SelectItem value="ludo">Ludo</SelectItem>
                  <SelectItem value="rummy">Rummy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Player</label>
              <Input
                placeholder="Search player..."
                value={filters.player}
                onChange={(e) => handleFilterChange('player', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Result</label>
              <Select value={filters.result} onValueChange={(value) => handleFilterChange('result', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All results</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bet Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bet History</CardTitle>
          <CardDescription>Complete log of all bets placed across all games</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Game</TableHead>
                    <TableHead>Bet Amount</TableHead>
                    <TableHead>Choice</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {betLogs?.length ? (
                    betLogs.map((bet) => (
                      <TableRow key={bet.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{bet.player_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {bet.player_id.slice(0, 8)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{bet.game}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{bet.bet_amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{bet.chosen_value}</TableCell>
                        <TableCell>{getResultBadge(bet.result)}</TableCell>
                        <TableCell className="font-medium">
                          {bet.payout > 0 ? `₹${bet.payout.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(bet.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No bet logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{betLogs?.length.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{betLogs?.reduce((sum, bet) => sum + bet.bet_amount, 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{betLogs?.reduce((sum, bet) => sum + bet.payout, 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {betLogs?.length 
                ? ((betLogs.filter(bet => bet.result === 'won').length / betLogs.length) * 100).toFixed(1)
                : 0
              }%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};