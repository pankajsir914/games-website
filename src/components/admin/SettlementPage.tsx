import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminSettlement } from '@/hooks/useAdminSettlement';
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const SettlementPage = () => {
  const { 
    pendingBets, 
    groupedBets, 
    isLoading, 
    refetch, 
    settleBets, 
    isSettling,
    settleIndividualBet,
    isSettlingIndividual
  } = useAdminSettlement();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [manualSettlementDialogOpen, setManualSettlementDialogOpen] = useState(false);
  const [manualSettlementStatus, setManualSettlementStatus] = useState<'won' | 'lost'>('won');
  const [manualSettlementPayout, setManualSettlementPayout] = useState('');

  const handleSettleTable = (tableId: string) => {
    setSelectedTable(tableId);
    setSettlementDialogOpen(true);
  };

  const confirmSettleTable = () => {
    if (selectedTable) {
      const tableGroup = groupedBets.find(g => g.table_id === selectedTable);
      const roundId = tableGroup?.bets[0]?.round_id || undefined;
      
      settleBets({ tableId: selectedTable, roundId });
      setSettlementDialogOpen(false);
      setSelectedTable(null);
    }
  };

  const handleManualSettle = (betId: string) => {
    setSelectedBet(betId);
    setManualSettlementDialogOpen(true);
  };

  const confirmManualSettle = () => {
    if (selectedBet) {
      const payout = manualSettlementStatus === 'won' && manualSettlementPayout 
        ? parseFloat(manualSettlementPayout) 
        : undefined;
      
      settleIndividualBet({ 
        betId: selectedBet, 
        status: manualSettlementStatus,
        payout 
      });
      
      setManualSettlementDialogOpen(false);
      setSelectedBet(null);
      setManualSettlementStatus('won');
      setManualSettlementPayout('');
    }
  };

  const totalPendingAmount = pendingBets.reduce((sum, bet) => sum + bet.bet_amount, 0);
  const totalPendingBets = pendingBets.length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Settlement</h2>
          <p className="text-muted-foreground">
            Settle pending bets for casino games
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Bets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendingBets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {groupedBets.length} table(s) with pending bets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total pending bet amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm" 
              className="w-full"
              disabled={isSettling}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Bets by Table */}
      {groupedBets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No pending bets to settle
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              All bets have been settled or there are no pending bets.
            </p>
          </CardContent>
        </Card>
      ) : (
        groupedBets.map((group) => (
          <Card key={group.table_id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{group.table_name}</CardTitle>
                  <CardDescription>
                    Table ID: {group.table_id} • {group.bets.length} pending bet(s) • Total: {group.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleSettleTable(group.table_id)}
                  disabled={isSettling}
                  size="sm"
                >
                  {isSettling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Settling...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Settle All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Bet Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Odds</TableHead>
                      <TableHead>Round ID</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.bets.map((bet) => (
                      <TableRow key={bet.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{bet.user_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {bet.user_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{bet.bet_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {bet.bet_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell>
                          {bet.odds ? bet.odds.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{bet.round_id || 'N/A'}</code>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(bet.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualSettle(bet.id)}
                            disabled={isSettlingIndividual}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Manual
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Settlement Confirmation Dialog */}
      <Dialog open={settlementDialogOpen} onOpenChange={setSettlementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Settlement</DialogTitle>
            <DialogDescription>
              Are you sure you want to settle all pending bets for this table? This will process all bets using the latest game result.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettlementDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSettleTable} disabled={isSettling}>
              {isSettling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Settling...
                </>
              ) : (
                'Confirm Settlement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Settlement Dialog */}
      <Dialog open={manualSettlementDialogOpen} onOpenChange={setManualSettlementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Settlement</DialogTitle>
            <DialogDescription>
              Manually settle this bet. If won, specify the payout amount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Status</Label>
              <Select value={manualSettlementStatus} onValueChange={(value: 'won' | 'lost') => setManualSettlementStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {manualSettlementStatus === 'won' && (
              <div>
                <Label>Payout Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter payout amount"
                  value={manualSettlementPayout}
                  onChange={(e) => setManualSettlementPayout(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualSettlementDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmManualSettle} disabled={isSettlingIndividual}>
              {isSettlingIndividual ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Settling...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

