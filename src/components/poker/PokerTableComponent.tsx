
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Timer, DollarSign } from 'lucide-react';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
}

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
  hole_cards?: Card[];
  joined_at: string;
  profiles?: { full_name: string };
}

interface PokerGame {
  id: string;
  table_id: string;
  game_state: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'completed';
  community_cards: Card[];
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

interface PokerTableComponentProps {
  players: PokerPlayer[];
  currentGame: PokerGame | null;
  tableId: string;
}

const PokerTableComponent = ({ players, currentGame }: PokerTableComponentProps) => {
  const seatPositions = [
    { top: '20%', left: '50%', transform: 'translate(-50%, -50%)' }, // Seat 1 - Top
    { top: '35%', right: '10%', transform: 'translate(0, -50%)' },   // Seat 2 - Right top
    { bottom: '35%', right: '10%', transform: 'translate(0, 50%)' }, // Seat 3 - Right bottom
    { bottom: '20%', left: '50%', transform: 'translate(-50%, 50%)' }, // Seat 4 - Bottom
    { bottom: '35%', left: '10%', transform: 'translate(0, 50%)' },  // Seat 5 - Left bottom
    { top: '35%', left: '10%', transform: 'translate(0, -50%)' },    // Seat 6 - Left top
  ];

  const getCardSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥️';
      case 'diamonds': return '♦️';
      case 'clubs': return '♣️';
      case 'spades': return '♠️';
      default: return '';
    }
  };

  const getPlayerAtSeat = (seatNumber: number) => {
    return players.find(p => p.seat_number === seatNumber);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing': return 'bg-green-500';
      case 'folded': return 'bg-red-500';
      case 'all_in': return 'bg-yellow-500';
      case 'sitting_out': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-green-700 rounded-2xl border-4 border-yellow-600 overflow-hidden">
      {/* Table felt pattern */}
      <div className="absolute inset-4 bg-green-600 rounded-xl border-2 border-yellow-500">
        
        {/* Community Cards Area */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-center mb-4">
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-yellow-600">
              Pot: ₹{currentGame?.pot_amount?.toFixed(2) || '0.00'}
            </Badge>
          </div>
          
          <div className="flex gap-2 justify-center">
            {currentGame?.community_cards?.map((card, index) => (
              <div key={index} className="w-12 h-16 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center text-xs font-bold">
                <div className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}>
                  {card.rank}
                </div>
                <div className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}>
                  {getCardSymbol(card.suit)}
                </div>
              </div>
            )) || (
              // Placeholder cards when no community cards
              [...Array(5)].map((_, index) => (
                <div key={index} className="w-12 h-16 bg-blue-900 rounded-lg border-2 border-blue-700 flex items-center justify-center">
                  <div className="text-blue-400 text-xs">?</div>
                </div>
              ))
            )}
          </div>

          {currentGame && (
            <div className="text-center mt-4">
              <Badge variant="outline" className="text-white border-white">
                {currentGame.game_state.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>

        {/* Player Seats */}
        {seatPositions.map((position, index) => {
          const seatNumber = index + 1;
          const player = getPlayerAtSeat(seatNumber);
          
          return (
            <div 
              key={seatNumber}
              className="absolute"
              style={position}
            >
              {player ? (
                <div className="text-center">
                  <div className="relative">
                    <Avatar className="w-16 h-16 mx-auto mb-2 border-4 border-yellow-500">
                      <AvatarFallback className="text-lg font-bold">
                        {player.profiles?.full_name?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Dealer Button */}
                    {player.is_dealer && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold">
                        D
                      </div>
                    )}
                    
                    {/* Blind Indicators */}
                    {player.is_small_blind && (
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        SB
                      </div>
                    )}
                    {player.is_big_blind && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        BB
                      </div>
                    )}
                  </div>
                  
                  <div className="text-white text-sm font-semibold">
                    {player.profiles?.full_name || 'Player'}
                  </div>
                  
                  <Badge className={`${getStatusColor(player.status)} text-xs mt-1`}>
                    ₹{player.chip_count.toFixed(2)}
                  </Badge>
                  
                  {/* Player's Hole Cards */}
                  {player.hole_cards && player.hole_cards.length > 0 && (
                    <div className="flex gap-1 justify-center mt-2">
                      {player.hole_cards.map((card, cardIndex) => (
                        <div key={cardIndex} className="w-8 h-10 bg-white rounded border flex flex-col items-center justify-center text-xs">
                          <div className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}>
                            {card.rank}
                          </div>
                          <div className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}>
                            {getCardSymbol(card.suit)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Turn Timer */}
                  {currentGame?.current_player_turn === player.user_id && (
                    <div className="mt-2">
                      <Progress value={75} className="w-20 h-2" />
                      <div className="flex items-center justify-center mt-1 text-yellow-400 text-xs">
                        <Timer className="w-3 h-3 mr-1" />
                        30s
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 border-4 border-dashed border-gray-400 rounded-full flex items-center justify-center bg-gray-700/50">
                    <div className="text-gray-400 text-xs">Empty</div>
                  </div>
                  <div className="text-gray-400 text-sm">Seat {seatNumber}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Table Info */}
      <div className="absolute top-4 left-4">
        <Badge variant="secondary" className="bg-black/50 text-white">
          <DollarSign className="w-4 h-4 mr-1" />
          Table {currentGame?.table_id ? currentGame.table_id.slice(-6) : 'Loading...'}
        </Badge>
      </div>
    </div>
  );
};

export default PokerTableComponent;
