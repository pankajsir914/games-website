import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, Trophy, Coins, Loader2, Plus, X } from 'lucide-react';
import { useLudoBackend } from '@/hooks/useLudoBackend';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface LudoLobbyProps {
  user: any;
  onJoinGame: (gameId: string) => Promise<void>;
  onGetHistory: (limit?: number) => Promise<any[]>;
  loading: boolean;
}

const LudoLobby: React.FC<LudoLobbyProps> = ({ user, onJoinGame, onGetHistory, loading }) => {
  const { createRoom, getAvailableRooms, getGameHistory } = useLudoBackend();
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'join' | 'history'>('join');
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomConfig, setRoomConfig] = useState({
    maxPlayers: 2,
    entryFee: 100
  });

  const fetchAvailableRooms = async () => {
    setRoomsLoading(true);
    try {
      const rooms = await getAvailableRooms();
      setAvailableRooms(rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Failed to load rooms",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a room",
        variant: "destructive"
      });
      return;
    }

    // Validate entry fee
    if (roomConfig.entryFee < 10 || roomConfig.entryFee > 1000) {
      toast({
        title: "Invalid Entry Fee",
        description: "Entry fee must be between ₹10 and ₹1000",
        variant: "destructive"
      });
      return;
    }

    setCreatingRoom(true);
    try {
      const result = await createRoom(roomConfig.maxPlayers, roomConfig.entryFee);
      
      if (result?.room_id) {
        toast({
          title: "Room Created!",
          description: "Waiting for players to join...",
        });
        setShowCreateDialog(false);
        await fetchAvailableRooms();
        // Auto-join the created room - this will also fetch the room
        await handleJoinGame(result.room_id);
      } else {
        throw new Error('Room creation failed - no room ID returned');
      }
    } catch (error: any) {
      console.error('Create room error:', error);
      toast({
        title: "Failed to create room",
        description: error?.message || error?.error || "Please check your balance and try again",
        variant: "destructive"
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinGame = async (roomId: string) => {
    try {
      await onJoinGame(roomId);
    } catch (error: any) {
      toast({
        title: "Failed to join room",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  };

  const loadGameHistory = async () => {
    try {
      const history = await getGameHistory();
      setGameHistory(history || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'join') {
      fetchAvailableRooms();
      
      // Set up real-time subscription for room updates
      const channel = supabase
        .channel('ludo-rooms-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ludo_rooms' },
          (payload) => {
            fetchAvailableRooms();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else if (activeTab === 'history') {
      loadGameHistory();
    }
  }, [activeTab]);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      waiting: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-300'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Ludo Lobby</h1>
        <p className="text-muted-foreground">Create or join a real-money Ludo game</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center items-center space-x-4">
        {[
          { id: 'join', label: 'Join Game', icon: Users },
          { id: 'history', label: 'Game History', icon: Clock },
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'default' : 'outline'}
            onClick={() => setActiveTab(id as any)}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Create Room
        </Button>
      </div>


      {/* Join Game Tab */}
      {activeTab === 'join' && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Available Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading available rooms...</p>
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No games available right now</p>
                <p className="text-sm">Create a new game or check back in a few minutes!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableRooms.map((room) => (
                  <Card key={room.id} className="bg-card border-border hover:bg-card/80 transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              ₹{room.entry_fee} Entry
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Users className="w-4 h-4" />
                              {room.current_players}/{room.max_players} Players
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {room.max_players - room.current_players} slots
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Room Details:</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {room.max_players === 2 ? '2 Player' : '4 Player'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Room #{room.id.slice(-6)}
                            </Badge>
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="text-xs text-muted-foreground mb-2">
                            Win Pot: ₹{(room.entry_fee * room.max_players * 0.9).toFixed(0)}
                          </div>
                          <Button 
                            onClick={() => handleJoinGame(room.id)}
                            disabled={loading || room.current_players >= room.max_players}
                            className="w-full"
                            size="sm"
                          >
                            {loading ? 'Joining...' : room.current_players >= room.max_players ? 'Room Full' : `Join Room (₹${room.entry_fee})`}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game History Tab */}
      {activeTab === 'history' && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Your Game History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gameHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No completed games yet</p>
                <p className="text-sm">Start playing to build your history!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gameHistory.map((game) => (
                  <Card key={game.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">Game #{game.id.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {game.max_players} players • ₹{game.entry_fee} entry fee
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(game.completed_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          {getStatusBadge(game.status)}
                          {game.winner_id === user?.id ? (
                            <div className="text-green-400 font-medium">
                              <Trophy className="w-4 h-4 inline mr-1" />
                              Won ₹{game.winner_amount}
                            </div>
                          ) : (
                            <div className="text-red-400 text-sm">
                              Lost ₹{game.entry_fee}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Room Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Ludo Room</DialogTitle>
            <DialogDescription>
              Set up a new multiplayer Ludo game. Other players can join your room.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Number of Players</Label>
              <Select
                value={roomConfig.maxPlayers.toString()}
                onValueChange={(value) => setRoomConfig(prev => ({ ...prev, maxPlayers: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryFee">Entry Fee (₹)</Label>
              <Input
                id="entryFee"
                type="number"
                min="10"
                max="1000"
                step="10"
                value={roomConfig.entryFee}
                onChange={(e) => setRoomConfig(prev => ({ ...prev, entryFee: parseInt(e.target.value) || 100 }))}
                placeholder="Enter entry fee"
              />
              <p className="text-xs text-muted-foreground">
                Minimum: ₹10, Maximum: ₹1000
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pot:</span>
                  <span className="font-bold text-primary">
                    ₹{(roomConfig.entryFee * roomConfig.maxPlayers * 0.9).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Commission (10%):</span>
                  <span>₹{(roomConfig.entryFee * roomConfig.maxPlayers * 0.1).toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreateRoom}
                disabled={creatingRoom || roomConfig.entryFee < 10 || roomConfig.entryFee > 1000}
                className="flex-1"
              >
                {creatingRoom ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Room
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creatingRoom}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

<<<<<<< HEAD
export default LudoLobby;
=======
export default LudoLobby;
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
