
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { usePokerTable } from '@/hooks/usePoker';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import PokerTableComponent from '@/components/poker/PokerTableComponent';
import PokerGameControls from '@/components/poker/PokerGameControls';
import { ArrowLeft, Users } from 'lucide-react';

const PokerTable = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { players, currentGame, playersLoading, gameLoading, isPlayerAtTable } = usePokerTable(tableId!);

  if (!tableId) {
    navigate('/poker');
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Poker Table</h1>
          <p className="text-xl text-gray-300 mb-8">Please sign in to view this table</p>
          <Button onClick={() => navigate('/poker')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/poker')}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {players?.length || 0} Players
            </Badge>
            {currentGame && (
              <Badge variant={currentGame.game_state === 'completed' ? 'destructive' : 'default'} className="text-lg px-4 py-2">
                {currentGame.game_state.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {playersLoading || gameLoading ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-white text-xl">Loading table...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Table Area */}
            <div className="lg:col-span-3">
              <Card className="bg-green-800/50 backdrop-blur-sm border-green-600/30">
                <CardContent className="p-6">
                  <PokerTableComponent 
                    players={players || []}
                    currentGame={currentGame}
                    tableId={tableId}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Game Controls Sidebar */}
            <div className="lg:col-span-1">
              <PokerGameControls
                tableId={tableId}
                players={players || []}
                currentGame={currentGame}
                isPlayerAtTable={isPlayerAtTable}
                currentUserId={user.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokerTable;
