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
  
  const { wallet } = useWallet();
  const balance = wallet?.current_balance || 0;

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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Teen Patti
          </h1>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2 border-primary/50 text-primary">
              Continuous Rounds
            </Badge>
            <Badge variant="outline" className="px-4 py-2 border-accent/50 text-accent">
              System Results
            </Badge>
          </div>
        </div>

        {/* Last Round Result */}
        {lastResult && (
          <Card className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold text-green-400">Previous Round Result</h3>
              <div className="flex justify-center gap-2">
                {lastResult.winningCards.map((card, index) => (
                  <div key={index} className="bg-white rounded-lg p-2 shadow-md">
                    <span className={`text-lg font-bold ${
                      card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'
                    }`}>
                      {card.rank}{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : 
                       card.suit === 'clubs' ? '♣' : '♠'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-green-300">
                <p className="text-lg font-semibold">{lastResult.handRank}</p>
                <p>Multiplier: {lastResult.multiplier}x • Winners: {lastResult.totalWinners}</p>
                <p>Total Payouts: ₹{lastResult.totalPayouts}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Current Round */}
        {currentRound && (
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-4 py-2 text-lg font-bold border-primary text-primary">
                  Round #{currentRound.round_number}
                </Badge>
                <Badge className={`px-4 py-2 text-sm font-bold ${getStatusColor(currentRound.status)}`}>
                  {currentRound.status.toUpperCase()}
                </Badge>
              </div>
              
              {currentRound.status === 'betting' && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-6 py-3 rounded-full border border-orange-500/30">
                  <Clock className="w-6 h-6 text-orange-400" />
                  <span className="text-3xl font-mono font-bold text-orange-300">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl border border-yellow-500/30">
                <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
                  <Coins className="w-6 h-6" />
                  <span className="text-sm font-medium">Total Pot</span>
                </div>
                <p className="text-3xl font-bold text-yellow-300">₹{currentRound.total_pot}</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                  <Users className="w-6 h-6" />
                  <span className="text-sm font-medium">Players</span>
                </div>
                <p className="text-3xl font-bold text-blue-300">{currentRound.total_players}</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                  <Trophy className="w-6 h-6" />
                  <span className="text-sm font-medium">Your Balance</span>
                </div>
                <p className="text-3xl font-bold text-green-300">₹{balance}</p>
              </div>
            </div>

            {/* User's bet status */}
            {currentUserBet && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                <div className="text-center space-y-2">
                  <p className="text-blue-300 text-lg font-medium">Your Bet: ₹{currentUserBet.bet_amount}</p>
                  {currentUserBet.payout_amount && (
                    <p className="text-green-400 font-bold text-xl">
                      🎉 Won: ₹{currentUserBet.payout_amount} (x{currentUserBet.multiplier})
                    </p>
                  )}
                  {currentUserBet.status === 'lost' && (
                    <p className="text-red-400 font-medium">Better luck next time!</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Betting Interface */}
        {currentRound?.status === 'betting' && !hasUserBetInCurrentRound && (
          <Card className="p-8 bg-gradient-to-br from-card/90 to-secondary/10 backdrop-blur-sm border-border/50 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Place Your Bet
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {BET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedBet === amount ? "default" : "outline"}
                  className={`h-14 text-lg font-bold transition-all duration-200 ${
                    selectedBet === amount 
                      ? 'bg-primary hover:bg-primary/90 shadow-lg scale-105' 
                      : 'border-border hover:bg-accent/20 hover:border-accent'
                  } ${amount > balance ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setSelectedBet(amount)}
                  disabled={amount > balance}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>

            <Button
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg transition-all duration-200 hover:scale-105"
              onClick={handlePlaceBet}
              disabled={loading || selectedBet > balance || timeRemaining <= 5}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing Bet...
                </div>
              ) : (
                `🎯 Place Bet ₹${selectedBet}`
              )}
            </Button>
            
            {timeRemaining <= 5 && timeRemaining > 0 && (
              <p className="text-center text-orange-400 mt-3 font-medium">
                ⏰ Betting closes in {timeRemaining} seconds
              </p>
            )}
          </Card>
        )}

        {/* Round History */}
        {roundHistory.length > 0 && (
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
            <h3 className="text-xl font-bold text-center mb-4 text-foreground">Recent Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roundHistory.slice(0, 6).map((round) => (
                <div 
                  key={round.id} 
                  className="p-4 bg-gradient-to-br from-muted/50 to-accent/10 rounded-lg border border-border/30"
                >
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Round #{round.round_number}</p>
                    {round.winning_cards && (
                      <div className="flex justify-center gap-1 my-2">
                        {round.winning_cards.map((card, index) => (
                          <div key={index} className="bg-white rounded p-1 text-xs shadow">
                            <span className={`font-bold ${
                              card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'
                            }`}>
                              {card.rank}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs font-medium text-primary">{round.winning_hand_rank}</p>
                    <p className="text-xs text-muted-foreground">₹{round.total_pot} pot</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};