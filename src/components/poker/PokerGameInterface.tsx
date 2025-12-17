import React, { useState, useEffect } from 'react';
import { usePokerGame } from '@/hooks/usePokerGame';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Coins, 
  Users, 
  Play, 
  LogOut, 
  Timer,
  Spade,
  Heart,
  Diamond,
  Club
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CardProps {
  card: {
    suit: string;
    rank: number;
    name: string;
  };
  hidden?: boolean;
}

const PlayingCard: React.FC<CardProps> = ({ card, hidden = false }) => {
  if (hidden) {
    return (
      <div className="w-12 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg border border-blue-600 flex items-center justify-center">
        <div className="text-white text-xs">?</div>
      </div>
    );
  }

  const getSuitIcon = (suit: string) => {
    switch (suit.toLowerCase()) {
      case 'spades': return <Spade className="h-3 w-3" />;
      case 'hearts': return <Heart className="h-3 w-3" />;
      case 'diamonds': return <Diamond className="h-3 w-3" />;
      case 'clubs': return <Club className="h-3 w-3" />;
      default: return null;
    }
  };

  const isRed = ['hearts', 'diamonds'].includes(card.suit.toLowerCase());

  return (
    <div className={`w-12 h-16 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-between p-1 ${
      isRed ? 'text-red-500' : 'text-black'
    }`}>
      <div className="text-xs font-bold">{card.name}</div>
      {getSuitIcon(card.suit)}
      <div className="text-xs font-bold transform rotate-180">{card.name}</div>
    </div>
  );
};

interface PlayerSeatProps {
  player: any;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  seatNumber: number;
  isEmpty?: boolean;
  isMyTurn: boolean;
}

const PlayerSeat: React.FC<PlayerSeatProps> = ({ 
  player, 
  isCurrentPlayer, 
  isDealer, 
  seatNumber, 
  isEmpty = false,
  isMyTurn 
}) => {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center space-y-2 p-3 rounded-lg border-2 border-dashed border-gray-300">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
          <Users className="h-6 w-6 text-gray-400" />
        </div>
        <span className="text-sm text-gray-500">Seat {seatNumber}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-2 p-3 rounded-lg border-2 ${
      isMyTurn ? 'border-yellow-400 bg-yellow-50' : 
      isCurrentPlayer ? 'border-blue-400 bg-blue-50' : 
      'border-gray-300'
    }`}>
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarFallback>
            {player.profiles?.full_name?.charAt(0) || 'P'}
          </AvatarFallback>
        </Avatar>
        {isDealer && (
          <Badge className="absolute -top-1 -right-1 text-xs px-1">D</Badge>
        )}
      </div>
      
      <div className="text-center">
        <div className="text-sm font-medium">
          {player.profiles?.full_name || 'Anonymous'}
        </div>
        <div className="text-xs text-gray-600">{player.chip_count} chips</div>
        {player.current_bet > 0 && (
          <div className="text-xs text-blue-600">Bet: {player.current_bet}</div>
        )}
      </div>

      {player.status === 'folded' && (
        <Badge variant="destructive" className="text-xs">Folded</Badge>
      )}
      {player.status === 'all_in' && (
        <Badge variant="secondary" className="text-xs">All-in</Badge>
      )}
      {player.last_action && (
        <div className="text-xs text-gray-500 capitalize">{player.last_action}</div>
      )}

      {/* Hole cards */}
      {player.hole_cards && (
        <div className="flex space-x-1">
          {player.hole_cards.map((card: any, index: number) => (
            <PlayingCard key={index} card={card} />
          ))}
        </div>
      )}
    </div>
  );
};

const PokerGameInterface: React.FC = () => {
  const { user } = useAuth();
  const {
    currentTable,
    currentGame,
    gameEvents,
    loading,
    startGame,
    makeAction,
    leaveTable,
    isMyTurn,
    getMyPlayer,
    canStartGame
  } = usePokerGame();

  const [betAmount, setBetAmount] = useState(0);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const myPlayer = getMyPlayer();

  useEffect(() => {
    if (currentGame && myPlayer) {
      setBetAmount(currentGame.minimum_bet);
    }
  }, [currentGame, myPlayer]);

  const handleAction = async (action: string, amount: number = 0) => {
    if (!currentGame) return;
    
    await makeAction(currentGame.id, action, amount);
    setShowActionPanel(false);
  };

  const handleStartGame = async () => {
    if (!currentTable) return;
    await startGame(currentTable.id);
  };

  const handleLeaveTable = async () => {
    if (!currentTable) return;
    await leaveTable(currentTable.id);
  };

  if (!currentTable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">No Table Selected</h2>
            <p className="text-muted-foreground mb-4">
              Please join a poker table first to start playing.
            </p>
            <Button onClick={() => window.location.href = '/poker'}>
              Browse Tables
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Table Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <h1 className="text-2xl font-bold">{currentTable.name}</h1>
            <p className="text-green-200">
              Blinds: {currentTable.small_blind}/{currentTable.big_blind}
            </p>
          </div>
          <div className="flex gap-2">
            {canStartGame() && (
              <Button onClick={handleStartGame} disabled={loading}>
                <Play className="mr-2 h-4 w-4" />
                Start Game
              </Button>
            )}
            <Button variant="outline" onClick={handleLeaveTable}>
              <LogOut className="mr-2 h-4 w-4" />
              Leave Table
            </Button>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative">
          {/* Poker Table */}
          <div className="bg-green-700 rounded-full h-96 w-full border-8 border-green-600 relative overflow-hidden">
            {/* Community Cards */}
            {currentGame && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="text-center text-white mb-4">
                  <div className="text-lg font-bold">Pot: {currentGame.pot_amount}</div>
                  <div className="text-sm capitalize">{currentGame.game_state} Round</div>
                </div>
                <div className="flex space-x-2 justify-center">
                  {currentGame.community_cards?.map((card: any, index: number) => (
                    <PlayingCard key={index} card={card} />
                  ))}
                  {/* Placeholder for remaining community cards */}
                  {Array.from({ length: Math.max(0, 5 - (currentGame.community_cards?.length || 0)) }).map((_, index) => (
                    <div 
                      key={`placeholder-${index}`} 
                      className="w-12 h-16 border-2 border-dashed border-gray-400 rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Player Seats */}
            <div className="absolute inset-0">
              {Array.from({ length: currentTable.max_players }).map((_, index) => {
                const seatNumber = index + 1;
                const player = currentTable.players.find(p => p.seat_number === seatNumber);
                const angle = (index * 360) / currentTable.max_players;
                const x = 50 + 35 * Math.cos((angle * Math.PI) / 180);
                const y = 50 + 35 * Math.sin((angle * Math.PI) / 180);

                return (
                  <div
                    key={seatNumber}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <PlayerSeat
                      player={player}
                      isCurrentPlayer={player?.user_id === user?.id}
                      isDealer={currentGame?.dealer_position === index}
                      seatNumber={seatNumber}
                      isEmpty={!player}
                      isMyTurn={isMyTurn() && player?.user_id === user?.id}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Panel */}
          {isMyTurn() && myPlayer && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Your Turn</h3>
                  <Timer className="h-5 w-5" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleAction('fold')}
                    disabled={loading}
                  >
                    Fold
                  </Button>
                  
                  {myPlayer.current_bet < (currentGame?.current_bet || 0) ? (
                    <Button 
                      variant="default" 
                      onClick={() => handleAction('call')}
                      disabled={loading}
                    >
                      Call {(currentGame?.current_bet || 0) - myPlayer.current_bet}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => handleAction('check')}
                      disabled={loading}
                    >
                      Check
                    </Button>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                      min={currentGame?.minimum_bet || 0}
                      max={myPlayer.chip_count}
                      className="w-20"
                    />
                    <Button 
                      variant="default" 
                      onClick={() => handleAction('bet', betAmount)}
                      disabled={loading || betAmount < (currentGame?.minimum_bet || 0)}
                    >
                      {myPlayer.current_bet < (currentGame?.current_bet || 0) ? 'Raise' : 'Bet'}
                    </Button>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    onClick={() => handleAction('bet', myPlayer.chip_count)}
                    disabled={loading}
                  >
                    All-in
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Your chips: {myPlayer.chip_count} | 
                  Current bet: {myPlayer.current_bet} | 
                  To call: {Math.max(0, (currentGame?.current_bet || 0) - myPlayer.current_bet)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Game Events */}
        {gameEvents.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {gameEvents.slice(0, 5).map((event, index) => (
                  <div key={event.id} className="text-sm text-muted-foreground">
                    {event.event_type.replace('_', ' ').toLowerCase()}
                    {event.event_data && typeof event.event_data === 'object' && (
                      <span className="ml-2">
                        {JSON.stringify(event.event_data).substring(0, 50)}...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Players</div>
                  <div className="text-sm text-muted-foreground">
                    {currentTable.current_players}/{currentTable.max_players}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Buy-in Range</div>
                  <div className="text-sm text-muted-foreground">
                    {currentTable.buy_in_min} - {currentTable.buy_in_max}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {currentTable.status}
                </Badge>
                <div>
                  <div className="font-semibold">Table Status</div>
                  <div className="text-sm text-muted-foreground">
                    {currentGame ? `${currentGame.game_state} round` : 'Waiting to start'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PokerGameInterface;