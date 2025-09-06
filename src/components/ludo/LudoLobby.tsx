import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, Trophy, Coins, Loader2 } from 'lucide-react';
import { useLudoBackend } from '@/hooks/useLudoBackend';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LudoLobbyProps {
  user: any;
  onJoinGame: (gameId: string) => Promise<void>;
  onGetHistory: (limit?: number) => Promise<any[]>;
  loading: boolean;
}

const LudoLobby: React.FC<LudoLobbyProps> = ({ user, onJoinGame, onGetHistory, loading }) => {
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'join' | 'history'>('join');
  const [roomsLoading, setRoomsLoading] = useState(false);

  const fetchAvailableRooms = async () => {
    setRoomsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ludo_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setAvailableRooms(data || []);
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

  const handleJoinGame = async (roomId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ludo-game-manager', {
        body: {
          action: 'join_room',
          roomId,
          playerId: user?.id
        }
      });

      if (error) throw error;
      
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
      const history = await onGetHistory();
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
      <div className="flex justify-center space-x-4">
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
    </div>
  );
};

export default LudoLobby;