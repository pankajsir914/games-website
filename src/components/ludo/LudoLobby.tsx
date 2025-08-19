import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, Trophy, Coins } from 'lucide-react';
import { useLudoBackend } from '@/hooks/useLudoBackend';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

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

  // Mock available games with bot players appearing as real players
  const mockAvailableGames = [
    { id: '1', entryFee: 10, players: ['Rahul K.', 'Priya S.'], maxPlayers: 4, waitingPlayers: 2 },
    { id: '2', entryFee: 25, players: ['Amit P.'], maxPlayers: 2, waitingPlayers: 1 },
    { id: '3', entryFee: 50, players: ['Neha M.', 'Ravi T.', 'Sneha B.'], maxPlayers: 4, waitingPlayers: 1 },
    { id: '4', entryFee: 5, players: ['Vikash R.'], maxPlayers: 4, waitingPlayers: 3 },
    { id: '5', entryFee: 100, players: ['Anjali S.', 'Rohit K.'], maxPlayers: 4, waitingPlayers: 2 },
  ];

  const handleJoinGame = async (gameId: string) => {
    await onJoinGame(gameId);
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
    if (activeTab === 'history') {
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
            {mockAvailableGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No games available right now</p>
                <p className="text-sm">Check back in a few minutes!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockAvailableGames.map((game) => (
                  <Card key={game.id} className="bg-card border-border hover:bg-card/80 transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              ₹{game.entryFee} Entry
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Users className="w-4 h-4" />
                              {game.maxPlayers - game.waitingPlayers}/{game.maxPlayers} Players
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {game.waitingPlayers} waiting
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Current Players:</p>
                          <div className="flex flex-wrap gap-1">
                            {game.players.map((player, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {player}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="text-xs text-muted-foreground mb-2">
                            Win Pot: ₹{(game.entryFee * game.maxPlayers * 0.9).toFixed(0)}
                          </div>
                          <Button 
                            onClick={() => handleJoinGame(game.id)}
                            disabled={loading}
                            className="w-full"
                            size="sm"
                          >
                            {loading ? 'Joining...' : `Join Game (₹${game.entryFee})`}
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