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
  onCreateMatch: (mode: '2p' | '4p', entryFee: number, botDifficulty: 'easy' | 'normal' | 'pro') => Promise<void>;
  onGetHistory: (limit?: number) => Promise<any[]>;
  loading: boolean;
}

const LudoLobby: React.FC<LudoLobbyProps> = ({ user, onCreateMatch, onGetHistory, loading }) => {
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'history'>('create');
  
  // Create room form
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [entryFee, setEntryFee] = useState<number>(10);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'normal' | 'pro'>('normal');

  const handleCreateRoom = async () => {
    const mode = maxPlayers === 2 ? '2p' : '4p';
    await onCreateMatch(mode, entryFee, botDifficulty);
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
          { id: 'create', label: 'Create Game', icon: Trophy },
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


      {/* Create Game Tab */}
      {activeTab === 'create' && (
        <Card className="max-w-md mx-auto bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Create New Game
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Number of Players</Label>
              <Select value={maxPlayers.toString()} onValueChange={(value) => setMaxPlayers(parseInt(value))}>
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
                min="1"
                max="500"
                value={entryFee}
                onChange={(e) => setEntryFee(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                placeholder="Enter amount"
              />
              <p className="text-xs text-muted-foreground">
                Winner takes 90% (₹{(entryFee * maxPlayers * 0.9).toFixed(2)}), 10% platform fee
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="botDifficulty">Bot Difficulty</Label>
              <Select value={botDifficulty} onValueChange={(value: 'easy' | 'normal' | 'pro') => setBotDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : `Create Game (₹${entryFee})`}
            </Button>
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