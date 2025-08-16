import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Coins, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WalletCard } from '@/components/wallet/WalletCard';

interface TeenPattiTable {
  id: string;
  table_name: string;
  entry_fee: number;
  min_players: number;
  max_players: number;
  current_players: number;
  min_bet: number;
  max_bet: number;
  status: string;
  created_at: string;
}

interface TeenPattiLobbyProps {
  onJoinGame: (gameId: string) => void;
}

export function TeenPattiLobby({ onJoinGame }: TeenPattiLobbyProps) {
  const [tables, setTables] = useState<TeenPattiTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const { toast } = useToast();

  const [newTable, setNewTable] = useState({
    tableName: '',
    entryFee: 50,
    minPlayers: 2,
    maxPlayers: 5,
    minBet: 10,
    maxBet: 1000
  });

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager/tables');
      
      if (error) throw error;
      
      if (data.success) {
        setTables(data.tables || []);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTable.tableName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a table name",
        variant: "destructive"
      });
      return;
    }

    setCreateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager/create-table', {
        body: newTable
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Table created successfully!"
        });
        setShowCreateDialog(false);
        setNewTable({
          tableName: '',
          entryFee: 50,
          minPlayers: 2,
          maxPlayers: 5,
          minBet: 10,
          maxBet: 1000
        });
        fetchTables();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create table",
        variant: "destructive"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const joinTable = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager/join-table', {
        body: { tableId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        });
        onJoinGame(data.gameId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join table",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (table: TeenPattiTable) => {
    if (table.current_players >= table.max_players) return 'destructive';
    if (table.current_players >= table.min_players) return 'default';
    return 'secondary';
  };

  const getStatusText = (table: TeenPattiTable) => {
    if (table.current_players >= table.max_players) return 'Full';
    if (table.current_players >= table.min_players) return 'Playing';
    return 'Waiting';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Wallet Card */}
        <div className="lg:col-span-1">
          <WalletCard />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Teen Patti Lobby</h1>
              <p className="text-gray-300">Join a table or create your own to start playing!</p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Table
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Teen Patti Table</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tableName" className="text-gray-300">Table Name</Label>
                    <Input
                      id="tableName"
                      value={newTable.tableName}
                      onChange={(e) => setNewTable({ ...newTable, tableName: e.target.value })}
                      placeholder="Enter table name"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entryFee" className="text-gray-300">Entry Fee (₹)</Label>
                      <Input
                        id="entryFee"
                        type="number"
                        value={newTable.entryFee}
                        onChange={(e) => setNewTable({ ...newTable, entryFee: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minBet" className="text-gray-300">Min Bet (₹)</Label>
                      <Input
                        id="minBet"
                        type="number"
                        value={newTable.minBet}
                        onChange={(e) => setNewTable({ ...newTable, minBet: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="minPlayers" className="text-gray-300">Min Players</Label>
                      <Input
                        id="minPlayers"
                        type="number"
                        min="2"
                        max="5"
                        value={newTable.minPlayers}
                        onChange={(e) => setNewTable({ ...newTable, minPlayers: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxPlayers" className="text-gray-300">Max Players</Label>
                      <Input
                        id="maxPlayers"
                        type="number"
                        min="2"
                        max="5"
                        value={newTable.maxPlayers}
                        onChange={(e) => setNewTable({ ...newTable, maxPlayers: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxBet" className="text-gray-300">Max Bet (₹)</Label>
                      <Input
                        id="maxBet"
                        type="number"
                        value={newTable.maxBet}
                        onChange={(e) => setNewTable({ ...newTable, maxBet: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={createTable} 
                    disabled={createLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    {createLoading ? 'Creating...' : 'Create Table'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tables Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded mb-4 w-2/3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-700 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tables.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>No tables available</p>
                  <p className="text-sm">Create a new table to start playing!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tables.map((table) => (
                <Card key={table.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">{table.table_name}</CardTitle>
                      <Badge variant={getStatusColor(table)}>
                        {getStatusText(table)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Entry Fee:</span>
                      <span className="text-yellow-400 font-semibold flex items-center">
                        <Coins className="h-3 w-3 mr-1" />
                        ₹{table.entry_fee}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Players:</span>
                      <span className="text-blue-400 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {table.current_players}/{table.max_players}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Bet Range:</span>
                      <span className="text-green-400">₹{table.min_bet} - ₹{table.max_bet}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(table.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={() => joinTable(table.id)}
                      disabled={table.current_players >= table.max_players}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {table.current_players >= table.max_players ? 'Table Full' : 'Join Table'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}