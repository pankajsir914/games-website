
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import { usePoker } from '@/hooks/usePoker';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Users, DollarSign, Clock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Poker = () => {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { tables, tablesLoading, createTable, joinTable, isCreating, isJoining } = usePoker();
  const [createTableOpen, setCreateTableOpen] = useState(false);
  const [joinTableOpen, setJoinTableOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');

  // Create table form state
  const [tableName, setTableName] = useState('');
  const [tableType, setTableType] = useState<'public' | 'private'>('public');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [smallBlind, setSmallBlind] = useState(5);
  const [bigBlind, setBigBlind] = useState(10);
  const [buyInMin, setBuyInMin] = useState(100);
  const [buyInMax, setBuyInMax] = useState(1000);

  // Join table form state
  const [seatNumber, setSeatNumber] = useState(1);
  const [buyInAmount, setBuyInAmount] = useState(100);

  const handleCreateTable = () => {
    createTable({
      name: tableName,
      tableType,
      maxPlayers,
      smallBlind,
      bigBlind,
      buyInMin,
      buyInMax,
    });
    setCreateTableOpen(false);
    // Reset form
    setTableName('');
    setTableType('public');
    setMaxPlayers(6);
    setSmallBlind(5);
    setBigBlind(10);
    setBuyInMin(100);
    setBuyInMax(1000);
  };

  const handleJoinTable = () => {
    if (!selectedTable) return;
    
    joinTable({
      tableId: selectedTable,
      seatNumber,
      buyInAmount,
    });
    setJoinTableOpen(false);
    setSeatNumber(1);
    setBuyInAmount(100);
  };

  const openJoinModal = (tableId: string, minBuyIn: number) => {
    setSelectedTable(tableId);
    setBuyInAmount(minBuyIn);
    setJoinTableOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Texas Hold'em Poker</h1>
          <p className="text-xl text-gray-300 mb-8">Please sign in to play poker</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Texas Hold'em Poker</h1>
          <p className="text-xl text-gray-300 mb-4">
            Join real-money poker tables and test your skills
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Balance: ₹{wallet?.current_balance?.toFixed(2) || '0.00'}
            </Badge>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Live Tables</h2>
          <Dialog open={createTableOpen} onOpenChange={setCreateTableOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Table
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Poker Table</DialogTitle>
                <DialogDescription>
                  Set up your own poker table with custom stakes and rules.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="col-span-3"
                    placeholder="Table name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Select value={tableType} onValueChange={(value: 'public' | 'private') => setTableType(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxPlayers" className="text-right">Max Players</Label>
                  <Select value={maxPlayers.toString()} onValueChange={(value) => setMaxPlayers(parseInt(value))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="smallBlind" className="text-right">Small Blind</Label>
                  <Input
                    id="smallBlind"
                    type="number"
                    value={smallBlind}
                    onChange={(e) => setSmallBlind(parseInt(e.target.value))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bigBlind" className="text-right">Big Blind</Label>
                  <Input
                    id="bigBlind"
                    type="number"
                    value={bigBlind}
                    onChange={(e) => setBigBlind(parseInt(e.target.value))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="buyInMin" className="text-right">Min Buy-in</Label>
                  <Input
                    id="buyInMin"
                    type="number"
                    value={buyInMin}
                    onChange={(e) => setBuyInMin(parseInt(e.target.value))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="buyInMax" className="text-right">Max Buy-in</Label>
                  <Input
                    id="buyInMax"
                    type="number"
                    value={buyInMax}
                    onChange={(e) => setBuyInMax(parseInt(e.target.value))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateTableOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTable} disabled={isCreating || !tableName.trim()}>
                  {isCreating ? 'Creating...' : 'Create Table'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {tablesLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-sm border-white/20 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-white/20 rounded mb-2"></div>
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-white/20 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tables?.map((table) => (
              <Card key={table.id} className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    {table.name}
                    <Badge variant={table.status === 'playing' ? 'destructive' : 'secondary'}>
                      {table.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {table.table_type} table • {table.current_players}/{table.max_players} players
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Blinds:</span>
                    <span>₹{table.small_blind}/₹{table.big_blind}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Buy-in:</span>
                    <span>₹{table.buy_in_min} - ₹{table.buy_in_max}</span>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => openJoinModal(table.id, table.buy_in_min)}
                      disabled={table.current_players >= table.max_players || isJoining}
                      className="flex-1"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Join Table
                    </Button>
                    <Link to={`/poker/${table.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Clock className="w-4 h-4 mr-2" />
                        Watch
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(!tables || tables.length === 0) && !tablesLoading && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-white mb-4">No Active Tables</h3>
            <p className="text-gray-300 mb-6">Be the first to create a poker table!</p>
            <Button 
              onClick={() => setCreateTableOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Table
            </Button>
          </div>
        )}
      </div>

      {/* Join Table Dialog */}
      <Dialog open={joinTableOpen} onOpenChange={setJoinTableOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Join Poker Table</DialogTitle>
            <DialogDescription>
              Choose your seat and buy-in amount to join the table.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seat" className="text-right">Seat</Label>
              <Select value={seatNumber.toString()} onValueChange={(value) => setSeatNumber(parseInt(value))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(seat => (
                    <SelectItem key={seat} value={seat.toString()}>Seat {seat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buyIn" className="text-right">Buy-in</Label>
              <Input
                id="buyIn"
                type="number"
                value={buyInAmount}
                onChange={(e) => setBuyInAmount(parseInt(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="text-sm text-gray-500 col-span-4">
              Available balance: ₹{wallet?.current_balance?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setJoinTableOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleJoinTable} 
              disabled={isJoining || buyInAmount > (wallet?.current_balance || 0)}
            >
              {isJoining ? 'Joining...' : 'Join Table'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Poker;
