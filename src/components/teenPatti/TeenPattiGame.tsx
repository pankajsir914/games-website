import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Users, Coins } from 'lucide-react';
import { TeenPattiCard } from './TeenPattiCard';
import { useTeenPatti } from '@/hooks/useTeenPatti';
import { useWallet } from '@/hooks/useWallet';

const BET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export const TeenPattiGame = () => {
  const [selectedBet, setSelectedBet] = useState<number>(10);
  const { 
    currentRound, 
    timeRemaining, 
    loading, 
    userBets, 
    roundHistory, 
    lastResult,
    hasUserBetInCurrentRound,
    placeBet 
  } = useTeenPatti();
  
  const { balance } = useWallet();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlaceBet = async () => {
    if (selectedBet && selectedBet <= balance) {
      await placeBet(selectedBet);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'betting': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const currentUserBet = currentRound ? 
    userBets.find(bet => bet.round_id === currentRound.id) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Teen Patti</h1>
          <p className="text-gray-300">Continuous rounds • System-based results</p>
        </div>

        {/* Current Round */}
        {currentRound && (
          <Card className="p-6 bg-black/40 border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-white border-white">
                  Round #{currentRound.round_number}
                </Badge>
                <Badge className={getStatusColor(currentRound.status)}>
                  {currentRound.status.toUpperCase()}
                </Badge>
              </div>
              
              {currentRound.status === 'betting' && (
                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-mono font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <Coins className="w-5 h-5" />
                  <span className="text-sm text-gray-300">Total Pot</span>
                </div>
                <p className="text-2xl font-bold text-white">₹{currentRound.total_pot}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <Users className="w-5 h-5" />
                  <span className="text-sm text-gray-300">Players</span>
                </div>
                <p className="text-2xl font-bold text-white">{currentRound.total_players}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <Trophy className="w-5 h-5" />
                  <span className="text-sm text-gray-300">Your Balance</span>
                </div>
                <p className="text-2xl font-bold text-white">₹{balance}</p>
              </div>
            </div>

            {/* User's bet status */}
            {currentUserBet && (
              <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <p className="text-blue-300 text-sm">Your bet: ₹{currentUserBet.bet_amount}</p>
                {currentUserBet.payout_amount && (
                  <p className="text-green-400 font-bold">
                    Won: ₹{currentUserBet.payout_amount} (x{currentUserBet.multiplier})
                  </p>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Betting Interface */}
        {currentRound?.status === 'betting' && !hasUserBetInCurrentRound && (
          <Card className="p-6 bg-black/40 border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Place Your Bet</h3>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
              {BET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedBet === amount ? "default" : "outline"}
                  className={`h-12 ${selectedBet === amount ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-white hover:bg-gray-700'}`}
                  onClick={() => setSelectedBet(amount)}
                  disabled={amount > balance}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>

            <Button
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={handlePlaceBet}
              disabled={loading || selectedBet > balance || timeRemaining <= 5}
            >
              {loading ? 'Placing Bet...' : `Place Bet ₹${selectedBet}`}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};