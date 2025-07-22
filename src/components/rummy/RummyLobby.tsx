
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateRummyRoomModal } from './CreateRummyRoomModal';
import { Users, Trophy, Clock, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface RummySession {
  id: string;
  game_type: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  status: string;
  prize_pool: number;
  created_at: string;
  players: {
    user_data: Array<{ id: string; name: string }>;
  };
}

interface RummyLobbyProps {
  onJoinGame: (sessionId: string) => void;
}

export const RummyLobby: React.FC<RummyLobbyProps> = ({ onJoinGame }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<RummySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    fetchSessions();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('rummy-sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rummy_sessions'
      }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('rummy_sessions')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedData = (data || []).map(session => ({
        ...session,
        players: session.players as { user_data: Array<{ id: string; name: string }> }
      }));
      
      setSessions(typedData);
    } catch (error: any) {
      toast({
        title: "Error fetching sessions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.rpc('join_rummy_session', {
        p_session_id: sessionId
      });

      if (error) throw error;

      // Type cast the response data
      const responseData = data as { entry_fee: number };
      
      toast({
        title: "Joined session!",
        description: `Entry fee: ₹${responseData.entry_fee}`,
      });

      onJoinGame(sessionId);
    } catch (error: any) {
      toast({
        title: "Failed to join session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getGameTypeColor = (type: string) => {
    switch (type) {
      case 'points': return 'bg-blue-500';
      case 'pool': return 'bg-green-500';
      case 'deals': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Create Room Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Available Tables</h2>
          <Button
            onClick={() => setShowCreateRoom(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Table
          </Button>
        </div>

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-12 text-center">
              <p className="text-white/80">No active tables found. Create one to start playing!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">
                      {session.game_type.charAt(0).toUpperCase() + session.game_type.slice(1)} Rummy
                    </CardTitle>
                    <Badge className={`${getGameTypeColor(session.game_type)} text-white`}>
                      {session.game_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-white/80">
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4" />
                        <span>Entry Fee</span>
                      </div>
                      <p className="font-semibold text-white">₹{session.entry_fee}</p>
                    </div>
                    <div className="text-white/80">
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4" />
                        <span>Prize Pool</span>
                      </div>
                      <p className="font-semibold text-green-400">₹{session.prize_pool}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-white/80">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {session.current_players}/{session.max_players} Players
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/80">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">
                        {new Date(session.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleJoinSession(session.id)}
                    disabled={session.current_players >= session.max_players}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {session.current_players >= session.max_players ? 'Table Full' : 'Join Table'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateRummyRoomModal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        onRoomCreated={(sessionId) => {
          setShowCreateRoom(false);
          onJoinGame(sessionId);
        }}
      />
    </>
  );
};
