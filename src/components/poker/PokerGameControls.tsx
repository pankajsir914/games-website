
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePoker } from '@/hooks/usePoker';
import { 
  Play, 
  UserMinus, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users
} from 'lucide-react';

interface PokerPlayer {
  id: string;
  table_id: string;
  user_id: string;
  seat_number: number;
  chip_count: number;
  status: 'waiting' | 'playing' | 'folded' | 'all_in' | 'sitting_out';
  is_dealer: boolean;
  is_small_blind: boolean;
  is_big_blind: boolean;
  hole_cards?: any[];
  joined_at: string;
  profiles?: { full_name: string };
}

interface PokerGame {
  id: string;
  table_id: string;
  game_state: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'completed';
  community_cards: any[];
  pot_amount: number;
  current_bet: number;
  current_player_turn?: string;
  dealer_position: number;
  turn_timer_start?: string;
  turn_time_limit: number;
  started_at: string;
  completed_at?: string;
  winner_id?: string;
  winning_hand?: any;
}

interface PokerGameControlsProps {
  tableId: string;
  players: PokerPlayer[];
  currentGame: PokerGame | null;
  isPlayerAtTable: boolean;
  currentUserId: string;
}

const PokerGameControls = ({ 
  tableId, 
  players, 
  currentGame, 
  isPlayerAtTable, 
  currentUserId 
}: PokerGameControlsProps) => {
  const { leaveTable, isLeaving } = usePoker();
  const [raiseAmount, setRaiseAmount] = useState(0);

  const currentPlayer = players.find(p => p.user_id === currentUserId);
  const isMyTurn = currentGame?.current_player_turn === currentUserId;

  const handleLeaveTable = () => {
    leaveTable(tableId);
  };

  const handleGameAction = (action: string, amount: number = 0) => {
    // TODO: Implement game action logic
    console.log(`Action: ${action}, Amount: ${amount}`);
  };

  return (
    <div className="space-y-4">
      {/* Player Status */}
      {currentPlayer && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Your Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Chips:</span>
              <Badge variant="secondary" className="bg-green-600">
                <DollarSign className="w-4 h-4 mr-1" />
                ₹{currentPlayer.chip_count.toFixed(2)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Status:</span>
              <Badge variant={currentPlayer.status === 'playing' ? 'default' : 'secondary'}>
                {currentPlayer.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Seat:</span>
              <span className="text-white">#{currentPlayer.seat_number}</span>
            </div>
            {isMyTurn && (
              <Badge variant="destructive" className="w-full justify-center">
                <Clock className="w-4 h-4 mr-2" />
                Your Turn!
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Actions */}
      {isPlayerAtTable && currentGame && currentGame.game_state !== 'completed' && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Game Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isMyTurn ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleGameAction('fold')}
                    className="w-full"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Fold
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGameAction('check')}
                    className="w-full text-white border-white/20"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Check
                  </Button>
                </div>
                
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleGameAction('call', currentGame.current_bet)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Call ₹{currentGame.current_bet}
                </Button>

                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Raise amount"
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-white/10 border-white/20 text-white"
                  />
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleGameAction('raise', raiseAmount)}
                    disabled={raiseAmount <= currentGame.current_bet}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Raise ₹{raiseAmount}
                  </Button>
                </div>

                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleGameAction('all_in', currentPlayer?.chip_count || 0)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  All In
                </Button>
              </>
            ) : (
              <div className="text-center text-gray-400 py-4">
                {currentGame.current_player_turn ? (
                  <div>
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    Waiting for {players.find(p => p.user_id === currentGame.current_player_turn)?.profiles?.full_name || 'player'}
                  </div>
                ) : (
                  <div>
                    <Play className="w-8 h-8 mx-auto mb-2" />
                    Game not started
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Info */}
      {currentGame && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Game Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Pot:</span>
              <Badge variant="secondary" className="bg-yellow-600">
                <DollarSign className="w-4 h-4 mr-1" />
                ₹{currentGame.pot_amount.toFixed(2)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Current Bet:</span>
              <span className="text-white">₹{currentGame.current_bet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Game State:</span>
              <Badge variant="outline" className="text-white border-white">
                {currentGame.game_state.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Players List */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Players ({players.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {players.map((player, index) => (
                <div key={player.id}>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-white text-sm">
                        {player.profiles?.full_name || 'Player'} (#{player.seat_number})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm">₹{player.chip_count.toFixed(2)}</div>
                      <Badge variant="secondary" className="text-xs">
                        {player.status}
                      </Badge>
                    </div>
                  </div>
                  {index < players.length - 1 && <Separator className="bg-white/10" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Leave Table */}
      {isPlayerAtTable && (
        <Button 
          variant="destructive" 
          onClick={handleLeaveTable}
          disabled={isLeaving}
          className="w-full"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          {isLeaving ? 'Leaving...' : 'Leave Table'}
        </Button>
      )}
    </div>
  );
};

export default PokerGameControls;
