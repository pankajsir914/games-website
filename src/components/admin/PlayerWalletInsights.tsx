import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, Wallet, AlertTriangle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export const PlayerWalletInsights = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  
  const { data: users, isLoading } = useAdminUsers();

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm)
  );

  const handleWalletAdjustment = async () => {
    if (!selectedPlayer || !adjustmentAmount || !adjustmentReason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: selectedPlayer.id,
        p_amount: parseFloat(adjustmentAmount),
        p_type: adjustmentType,
        p_reason: `Admin adjustment: ${adjustmentReason}`,
        p_game_type: null
      });

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_action_type: 'wallet_adjustment',
        p_target_type: 'user',
        p_target_id: selectedPlayer.id,
        p_details: {
          amount: adjustmentAmount,
          type: adjustmentType,
          reason: adjustmentReason
        }
      });

      toast({
        title: "Wallet Adjusted",
        description: `Successfully ${adjustmentType === 'credit' ? 'added' : 'deducted'} ₹${adjustmentAmount}`,
      });

      setSelectedPlayer(null);
      setAdjustmentAmount('');
      setAdjustmentReason('');
    } catch (error: any) {
      toast({
        title: "Adjustment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSuspiciousFlag = (user: any) => {
    const winLossRatio = user.total_deposits > 0 ? user.total_withdrawals / user.total_deposits : 0;
    const hasHighBalance = user.current_balance > 50000;
    const hasHighActivity = (user.total_deposits + user.total_withdrawals) > 100000;
    
    if (winLossRatio > 2 || hasHighBalance || hasHighActivity) {
      return <Badge variant="destructive">Suspicious</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Player Wallet Insights</h2>
          <p className="text-muted-foreground">
            {filteredUsers ? `${filteredUsers.length} players found` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{users?.reduce((sum, user) => sum + user.current_balance, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{users?.reduce((sum, user) => sum + user.total_deposits, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime deposits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{users?.reduce((sum, user) => sum + user.total_withdrawals, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime withdrawals</p>
          </CardContent>
        </Card>
      </div>

      {/* Player Wallets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Player Wallets</CardTitle>
          <CardDescription>View and manage player wallet balances and transaction history</CardDescription>
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
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Total Deposits</TableHead>
                    <TableHead>Total Withdrawals</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{user.current_balance.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-green-600">
                          ₹{user.total_deposits.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-red-600">
                          ₹{user.total_withdrawals.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                            {getSuspiciousFlag(user)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedPlayer(user)}
                              >
                                Adjust
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Wallet Balance</DialogTitle>
                                <DialogDescription>
                                  Make manual adjustments to {user.full_name || user.email}'s wallet
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Current Balance</Label>
                                  <div className="text-lg font-bold">₹{user.current_balance.toLocaleString()}</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Adjustment Type</Label>
                                    <select 
                                      className="w-full p-2 border rounded"
                                      value={adjustmentType}
                                      onChange={(e) => setAdjustmentType(e.target.value as 'credit' | 'debit')}
                                    >
                                      <option value="credit">Add Money (Credit)</option>
                                      <option value="debit">Deduct Money (Debit)</option>
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <Label>Amount (₹)</Label>
                                    <Input
                                      type="number"
                                      value={adjustmentAmount}
                                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label>Reason for Adjustment</Label>
                                  <Textarea
                                    value={adjustmentReason}
                                    onChange={(e) => setAdjustmentReason(e.target.value)}
                                    placeholder="Enter reason for this adjustment..."
                                    rows={3}
                                  />
                                </div>

                                <Button onClick={handleWalletAdjustment} className="w-full">
                                  Confirm Adjustment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No players found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspicious Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Suspicious Activity Detection
          </CardTitle>
          <CardDescription>Players flagged for unusual activity patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.filter(user => {
              const winLossRatio = user.total_deposits > 0 ? user.total_withdrawals / user.total_deposits : 0;
              return winLossRatio > 2 || user.current_balance > 50000 || (user.total_deposits + user.total_withdrawals) > 100000;
            }).map(user => (
              <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{user.full_name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">₹{user.current_balance.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    W/L Ratio: {user.total_deposits > 0 ? (user.total_withdrawals / user.total_deposits).toFixed(2) : 'N/A'}
                  </div>
                </div>
              </div>
            )) || []}
            {(!users || users.filter(user => {
              const winLossRatio = user.total_deposits > 0 ? user.total_withdrawals / user.total_deposits : 0;
              return winLossRatio > 2 || user.current_balance > 50000;
            }).length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                No suspicious activity detected
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};