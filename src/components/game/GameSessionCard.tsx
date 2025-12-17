
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Trophy, Clock, Gamepad2 } from 'lucide-react';
import { useGameSessions } from '@/hooks/useGameSessions';
import { useAuth } from '@/hooks/useAuth';

interface GameSessionCardProps {
  session: {
    id: string;
    game_type: string;
    entry_fee: number;
    total_pool: number;
    status: string;
    current_players: number;
    max_players: number;
    players: any;
    created_at: string;
    created_by: string;
  };
}

export const GameSessionCard = ({ session }: GameSessionCardProps) => {
  const { joinSession, isJoining } = useGameSessions();
  const { user } = useAuth();

  const isUserInGame = session.players?.user_ids?.includes(user?.id);
  const canJoin = !isUserInGame && session.status === 'waiting' && session.current_players < session.max_players;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500';
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleJoin = () => {
    joinSession(session.id);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gamepad2 className="h-5 w-5" />
            {session.game_type.charAt(0).toUpperCase() + session.game_type.slice(1)}
          </CardTitle>
          <Badge variant="outline" className={getStatusColor(session.status)}>
            {session.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Entry Fee
            </div>
            <p className="font-semibold text-green-600">₹{session.entry_fee}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Total Pool
            </div>
            <p className="font-semibold text-blue-600">₹{session.total_pool}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Players
            </div>
            <span className="text-sm font-medium">
              {session.current_players}/{session.max_players}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {session.players?.user_data?.map((player: any, index: number) => (
              <div key={player.id} className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {player.name?.charAt(0) || `P${index + 1}`}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{player.name || `Player ${index + 1}`}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Created {new Date(session.created_at).toLocaleDateString()}
        </div>

        {canJoin && (
          <Button 
            onClick={handleJoin} 
            disabled={isJoining}
            className="w-full"
          >
            {isJoining ? 'Joining...' : `Join Game (₹${session.entry_fee})`}
          </Button>
        )}

        {isUserInGame && (
          <Badge variant="secondary" className="w-full justify-center">
            You're in this game
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
