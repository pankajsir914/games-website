import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  Settings, 
  Users, 
  DollarSign, 
  BarChart3, 
  Play, 
  Pause, 
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

const RouletteAdmin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adjustAmount, setAdjustAmount] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Check if user is admin (simplified check)
  const isAdmin = user?.email?.includes('admin') || user?.id === 'admin-user-id';

  // Fetch admin stats
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['roulette-admin-stats'],
    queryFn: async () => {
      const [rounds, bets, users, recentActivity] = await Promise.all([
        supabase.from('roulette_rounds').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('roulette_bets').select('*, profiles!inner(full_name)').order('created_at', { ascending: false }).limit(20),
        supabase.from('wallets').select('*, profiles!inner(full_name)').order('current_balance', { ascending: false }),
        supabase.from('roulette_rounds').select('round_number, winning_number, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(50)
      ]);

      const totalBets = bets.data?.reduce((sum, bet) => sum + bet.bet_amount, 0) || 0;
      const totalPayouts = bets.data?.reduce((sum, bet) => sum + (bet.payout_amount || 0), 0) || 0;
      const houseProfit = totalBets - totalPayouts;

      return {
        rounds: rounds.data || [],
        bets: bets.data || [],
        users: users.data || [],
        recentActivity: recentActivity.data || [],
        totalBets,
        totalPayouts,
        houseProfit,
        activeUsers: new Set(bets.data?.map(bet => bet.user_id)).size
      };
    },
    enabled: isAdmin,
    refetchInterval: 5000,
  });

  // Game management mutations
  const pauseGame = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('game_settings')
        .upsert({ game_type: 'roulette', is_paused: true })
        .eq('game_type', 'roulette');
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Game Paused", description: "Roulette game has been paused" });
      queryClient.invalidateQueries({ queryKey: ['game-settings'] });
    }
  });

  const resumeGame = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('game_settings')
        .upsert({ game_type: 'roulette', is_paused: false })
        .eq('game_type', 'roulette');
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Game Resumed", description: "Roulette game has been resumed" });
      queryClient.invalidateQueries({ queryKey: ['game-settings'] });
    }
  });

  const createRound = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('roulette-game-manager', {
        body: { action: 'create_round' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Round Created", description: "New roulette round created successfully" });
      queryClient.invalidateQueries({ queryKey: ['roulette-admin-stats'] });
    }
  });

  // Balance adjustment mutation
  const adjustBalance = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_type: amount > 0 ? 'credit' : 'debit',
        p_reason: `Admin balance adjustment: ${amount > 0 ? '+' : ''}${amount}`,
        p_game_type: null,
        p_game_session_id: null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Balance Updated", description: "User balance has been adjusted" });
      queryClient.invalidateQueries({ queryKey: ['roulette-admin-stats'] });
      setAdjustAmount('');
      setSelectedUserId('');
    }
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Access denied. Admin privileges required.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Loading Admin Panel...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">🎰 Roulette Admin Panel</h1>
          <p className="text-xl text-gray-300">
            Manage games, users, and monitor performance
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">₹{adminStats?.totalBets.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Bets</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">₹{adminStats?.totalPayouts.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Payouts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">₹{adminStats?.houseProfit.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">House Profit</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{adminStats?.activeUsers}</div>
              <div className="text-sm text-muted-foreground">Active Players</div>
            </CardContent>
          </Card>
        </div>

        {/* Game Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Game Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => pauseGame.mutate()} variant="destructive">
                <Pause className="w-4 h-4 mr-2" />
                Pause Game
              </Button>
              <Button onClick={() => resumeGame.mutate()} variant="default">
                <Play className="w-4 h-4 mr-2" />
                Resume Game
              </Button>
              <Button onClick={() => createRound.mutate()} variant="secondary">
                <RotateCcw className="w-4 h-4 mr-2" />
                Create New Round
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="rounds">Rounds</TabsTrigger>
            <TabsTrigger value="bets">Recent Bets</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Balance Adjustment */}
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Adjust User Balance</h3>
                  <div className="flex gap-4">
                    <select 
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex-1 p-2 border rounded"
                    >
                      <option value="">Select User</option>
                      {adminStats?.users.map((user) => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.profiles?.full_name || 'Anonymous'} - ₹{user.current_balance}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="Amount (+/-)"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-32"
                    />
                    <Button
                      onClick={() => {
                        if (selectedUserId && adjustAmount) {
                          adjustBalance.mutate({
                            userId: selectedUserId,
                            amount: parseFloat(adjustAmount)
                          });
                        }
                      }}
                      disabled={!selectedUserId || !adjustAmount}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Adjust
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminStats?.users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>{user.profiles?.full_name || 'Anonymous'}</TableCell>
                        <TableCell>₹{user.current_balance.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={user.current_balance > 1000 ? 'default' : 'secondary'}>
                            {user.current_balance > 1000 ? 'High Balance' : 'Low Balance'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rounds">
            <Card>
              <CardHeader>
                <CardTitle>Recent Rounds</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Winning Number</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminStats?.rounds.map((round) => (
                      <TableRow key={round.id}>
                        <TableCell>{round.round_number}</TableCell>
                        <TableCell>
                          <Badge variant={
                            round.status === 'completed' ? 'default' :
                            round.status === 'spinning' ? 'secondary' : 'outline'
                          }>
                            {round.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {round.winning_number !== null ? (
                            <span className={`font-bold ${
                              round.winning_number === 0 ? 'text-green-600' :
                              [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(round.winning_number) ? 
                              'text-red-600' : 'text-gray-800'
                            }`}>
                              {round.winning_number}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(round.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bets">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Bet Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payout</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminStats?.bets.map((bet) => (
                      <TableRow key={bet.id}>
                        <TableCell>{bet.profiles?.full_name || 'Anonymous'}</TableCell>
                        <TableCell>{bet.bet_type} {bet.bet_value}</TableCell>
                        <TableCell>₹{bet.bet_amount}</TableCell>
                        <TableCell>₹{bet.payout_amount || 0}</TableCell>
                        <TableCell>
                          <Badge variant={
                            bet.status === 'won' ? 'default' :
                            bet.status === 'lost' ? 'destructive' : 'secondary'
                          }>
                            {bet.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Game Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Number Frequency (Last 50 Rounds)</h3>
                    <div className="grid grid-cols-10 gap-2">
                      {Array.from({ length: 37 }, (_, i) => {
                        const number = i;
                        const frequency = adminStats?.recentActivity.filter(
                          round => round.winning_number === number
                        ).length || 0;
                        
                        return (
                          <div
                            key={number}
                            className={`p-2 text-center rounded text-white font-bold ${
                              number === 0 ? 'bg-green-600' :
                              [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number) ? 
                              'bg-red-600' : 'bg-gray-800'
                            }`}
                          >
                            <div>{number}</div>
                            <div className="text-xs">{frequency}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-lg font-semibold">House Edge</div>
                        <div className="text-2xl font-bold text-green-600">
                          {adminStats?.totalBets > 0 ? 
                            ((adminStats.houseProfit / adminStats.totalBets) * 100).toFixed(2) + '%' : 
                            '0%'
                          }
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-lg font-semibold">Avg Bet Size</div>
                        <div className="text-2xl font-bold">
                          ₹{adminStats?.bets.length ? 
                            (adminStats.totalBets / adminStats.bets.length).toFixed(0) : 
                            '0'
                          }
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-lg font-semibold">Total Rounds</div>
                        <div className="text-2xl font-bold">
                          {adminStats?.recentActivity.length || 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RouletteAdmin;