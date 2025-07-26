import React, { useEffect, useState } from 'react';
import { usePokerGame } from '@/hooks/usePokerGame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Users, Coins, Play, UserPlus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface JoinTableModalProps {
  table: any;
  onJoin: (seatNumber: number, buyInAmount: number) => void;
  loading: boolean;
}

const JoinTableModal: React.FC<JoinTableModalProps> = ({ table, onJoin, loading }) => {
  const [seatNumber, setSeatNumber] = useState(1);
  const [buyInAmount, setBuyInAmount] = useState(table.buy_in_min);
  const [open, setOpen] = useState(false);

  const handleJoin = () => {
    if (buyInAmount < table.buy_in_min || buyInAmount > table.buy_in_max) {
      toast.error(`Buy-in must be between ${table.buy_in_min} and ${table.buy_in_max}`);
      return;
    }

    const occupiedSeats = table.players.map((p: any) => p.seat_number);
    if (occupiedSeats.includes(seatNumber)) {
      toast.error('Seat is already taken');
      return;
    }

    onJoin(seatNumber, buyInAmount);
    setOpen(false);
  };

  const getAvailableSeats = () => {
    const occupied = table.players.map((p: any) => p.seat_number);
    return Array.from({ length: table.max_players }, (_, i) => i + 1)
      .filter(seat => !occupied.includes(seat));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          disabled={!table.can_join || table.is_full}
          className="w-full"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Join Table
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join {table.name}</DialogTitle>
          <DialogDescription>
            Select your seat and buy-in amount to join the table.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="seat">Seat Number</Label>
            <select
              id="seat"
              value={seatNumber}
              onChange={(e) => setSeatNumber(parseInt(e.target.value))}
              className="w-full mt-1 p-2 border rounded-md"
            >
              {getAvailableSeats().map(seat => (
                <option key={seat} value={seat}>
                  Seat {seat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="buyIn">Buy-in Amount</Label>
            <Input
              id="buyIn"
              type="number"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(parseInt(e.target.value))}
              min={table.buy_in_min}
              max={table.buy_in_max}
              placeholder={`${table.buy_in_min} - ${table.buy_in_max}`}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Range: {table.buy_in_min} - {table.buy_in_max} chips
            </p>
          </div>
          <Button 
            onClick={handleJoin} 
            disabled={loading || getAvailableSeats().length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Join for {buyInAmount} chips
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CreateTableModal: React.FC<{ onCreate: (data: any) => void; loading: boolean }> = ({ onCreate, loading }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    small_blind: 5,
    big_blind: 10,
    buy_in_min: 100,
    buy_in_max: 1000,
    max_players: 6
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Table name is required');
      return;
    }

    if (formData.big_blind <= formData.small_blind) {
      toast.error('Big blind must be greater than small blind');
      return;
    }

    if (formData.buy_in_max <= formData.buy_in_min) {
      toast.error('Maximum buy-in must be greater than minimum buy-in');
      return;
    }

    onCreate(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Play className="mr-2 h-4 w-4" />
          Create Table
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Poker Table</DialogTitle>
          <DialogDescription>
            Set up your poker table with custom blinds and buy-in limits.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tableName">Table Name</Label>
            <Input
              id="tableName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="High Stakes Table"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smallBlind">Small Blind</Label>
              <Input
                id="smallBlind"
                type="number"
                value={formData.small_blind}
                onChange={(e) => setFormData(prev => ({ ...prev, small_blind: parseInt(e.target.value) || 0 }))}
                min={1}
              />
            </div>
            <div>
              <Label htmlFor="bigBlind">Big Blind</Label>
              <Input
                id="bigBlind"
                type="number"
                value={formData.big_blind}
                onChange={(e) => setFormData(prev => ({ ...prev, big_blind: parseInt(e.target.value) || 0 }))}
                min={formData.small_blind + 1}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyInMin">Min Buy-in</Label>
              <Input
                id="buyInMin"
                type="number"
                value={formData.buy_in_min}
                onChange={(e) => setFormData(prev => ({ ...prev, buy_in_min: parseInt(e.target.value) || 0 }))}
                min={formData.big_blind * 10}
              />
            </div>
            <div>
              <Label htmlFor="buyInMax">Max Buy-in</Label>
              <Input
                id="buyInMax"
                type="number"
                value={formData.buy_in_max}
                onChange={(e) => setFormData(prev => ({ ...prev, buy_in_max: parseInt(e.target.value) || 0 }))}
                min={formData.buy_in_min + 1}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="maxPlayers">Max Players</Label>
            <select
              id="maxPlayers"
              value={formData.max_players}
              onChange={(e) => setFormData(prev => ({ ...prev, max_players: parseInt(e.target.value) }))}
              className="w-full mt-1 p-2 border rounded-md"
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num} players</option>
              ))}
            </select>
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Table'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PokerTablesList: React.FC = () => {
  const { user } = useAuth();
  const {
    tables,
    loading,
    fetchTables,
    createTable,
    joinTable,
    currentTable,
    fetchTableDetails
  } = usePokerGame();

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleCreateTable = async (tableData: any) => {
    await createTable(tableData);
  };

  const handleJoinTable = async (tableId: string, seatNumber: number, buyInAmount: number) => {
    const success = await joinTable(tableId, seatNumber, buyInAmount);
    if (success) {
      await fetchTableDetails(tableId);
    }
  };

  const getStatusBadge = (table: any) => {
    if (table.status === 'active') {
      return <Badge variant="destructive">Playing</Badge>;
    } else if (table.is_full) {
      return <Badge variant="secondary">Full</Badge>;
    } else {
      return <Badge variant="default">Waiting</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Poker Tables</CardTitle>
            <CardDescription>
              Please log in to view and join poker tables.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Poker Tables</h1>
          <p className="text-muted-foreground">
            Join a table or create your own to start playing Texas Hold'em
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTables}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <CreateTableModal onCreate={handleCreateTable} loading={loading} />
        </div>
      </div>

      {currentTable && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Currently at: {currentTable.name}
            </CardTitle>
            <CardDescription>
              You are seated at this table. Navigate to the poker game to play.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/poker-table'}>
              Go to Table
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && tables.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{table.name}</CardTitle>
                    <CardDescription>
                      {table.small_blind}/{table.big_blind} blinds
                    </CardDescription>
                  </div>
                  {getStatusBadge(table)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {table.current_players}/{table.max_players} players
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {table.buy_in_min}-{table.buy_in_max}
                  </span>
                </div>

                {table.players.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Players:</p>
                      <div className="space-y-1">
                        {table.players.slice(0, 3).map((player: any) => (
                          <div key={player.id} className="flex justify-between text-xs">
                            <span>Seat {player.seat_number}: {player.profiles?.full_name || 'Anonymous'}</span>
                            <span>{player.chip_count} chips</span>
                          </div>
                        ))}
                        {table.players.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{table.players.length - 3} more players
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <JoinTableModal
                  table={table}
                  onJoin={(seatNumber, buyInAmount) => 
                    handleJoinTable(table.id, seatNumber, buyInAmount)
                  }
                  loading={loading}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && tables.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tables Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              There are no poker tables available right now. Create one to get started!
            </p>
            <CreateTableModal onCreate={handleCreateTable} loading={loading} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PokerTablesList;