
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJackpot } from '@/hooks/useJackpot';
import { useWallet } from '@/hooks/useWallet';
import { Timer, Users, Ticket, Trophy, Coins } from 'lucide-react';

interface JackpotGameProps {
  game: {
    id: string;
    tier: string;
    ticket_price: number;
    max_tickets_per_user: number;
    total_pool: number;
    total_tickets: number;
    total_participants: number;
    status: string;
    ends_at: string;
  };
}

export const JackpotGame = ({ game }: JackpotGameProps) => {
  const [ticketCount, setTicketCount] = useState(1);
  const [timeLeft, setTimeLeft] = useState('');
  const { buyTickets, isBuying, userTickets } = useJackpot();
  const { wallet } = useWallet();

  // Calculate user's tickets for this game
  const userGameTickets = userTickets?.filter(ticket => ticket.game_id === game.id) || [];
  const userTotalTickets = userGameTickets.reduce((sum, ticket) => sum + ticket.ticket_count, 0);

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(game.ends_at).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('ENDED');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [game.ends_at]);

  const handleBuyTickets = () => {
    if (ticketCount > 0 && ticketCount <= game.max_tickets_per_user - userTotalTickets) {
      buyTickets({ gameId: game.id, ticketCount });
    }
  };

  const totalCost = ticketCount * game.ticket_price;
  const canBuy = wallet && wallet.current_balance >= totalCost && 
                userTotalTickets + ticketCount <= game.max_tickets_per_user &&
                timeLeft !== 'ENDED';

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'low': return 'from-green-500/20 to-emerald-600/20 border-green-500/50';
      case 'medium': return 'from-yellow-500/20 to-orange-600/20 border-yellow-500/50';
      case 'high': return 'from-red-500/20 to-pink-600/20 border-red-500/50';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/50';
    }
  };

  return (
    <Card className={`bg-gradient-to-br ${getTierGradient(game.tier)} backdrop-blur-sm border-2 hover:shadow-xl transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white text-xl mb-2">
              {game.tier.toUpperCase()} Stakes
            </CardTitle>
            <Badge className={`${getTierColor(game.tier)} text-white`}>
              ₹{game.ticket_price} per ticket
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">
              {timeLeft}
            </div>
            <div className="text-sm text-gray-300">Time Left</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pool Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
            <div className="text-lg font-bold text-white">₹{game.total_pool.toFixed(2)}</div>
            <div className="text-xs text-gray-300">Prize Pool</div>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-1 text-blue-400" />
            <div className="text-lg font-bold text-white">{game.total_participants}</div>
            <div className="text-xs text-gray-300">Players</div>
          </div>
        </div>

        {/* Tickets Information */}
        <div className="flex justify-between text-sm text-gray-300">
          <span>Total Tickets: {game.total_tickets}</span>
          <span>Your Tickets: {userTotalTickets}</span>
        </div>

        {/* Win Chance */}
        {game.total_tickets > 0 && userTotalTickets > 0 && (
          <div className="text-center p-2 bg-yellow-400/20 rounded-lg">
            <div className="text-yellow-400 font-semibold">
              Win Chance: {((userTotalTickets / game.total_tickets) * 100).toFixed(2)}%
            </div>
          </div>
        )}

        {/* Ticket Purchase */}
        {timeLeft !== 'ENDED' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="tickets" className="text-white">Number of Tickets</Label>
              <Input
                id="tickets"
                type="number"
                min="1"
                max={game.max_tickets_per_user - userTotalTickets}
                value={ticketCount}
                onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="flex justify-between text-sm text-gray-300">
              <span>Cost: ₹{totalCost.toFixed(2)}</span>
              <span>Remaining: {game.max_tickets_per_user - userTotalTickets}</span>
            </div>

            <Button
              onClick={handleBuyTickets}
              disabled={!canBuy || isBuying}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
            >
              {isBuying ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Buying...
                </div>
              ) : (
                <div className="flex items-center">
                  <Ticket className="mr-2 h-4 w-4" />
                  Buy {ticketCount} Ticket{ticketCount > 1 ? 's' : ''}
                </div>
              )}
            </Button>

            {!canBuy && wallet && wallet.current_balance < totalCost && (
              <p className="text-red-400 text-sm text-center">Insufficient balance</p>
            )}
          </div>
        )}

        {timeLeft === 'ENDED' && (
          <div className="text-center p-4 bg-gray-500/20 rounded-lg">
            <Timer className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-400 font-semibold">Game Ended</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
