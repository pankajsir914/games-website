
import React from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Wallet, 
  Trophy, 
  History,
  TrendingUp,
  Target
} from 'lucide-react';
import { useColorPrediction } from '@/hooks/useColorPrediction';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const ColorPrediction = () => {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const {
    currentRound,
    recentRounds,
    userBet,
    userBetHistory,
    timeLeft,
    roundLoading,
    placeBet,
    isPlacingBet,
  } = useColorPrediction();

  const [selectedColor, setSelectedColor] = useState<'red' | 'green' | 'violet' | null>(null);
  const [betAmount, setBetAmount] = useState(10);

  const betAmounts = [10, 50, 100, 500, 1000];
  const colors = [
    { name: 'red' as const, label: 'Red', bg: 'bg-red-500', hover: 'hover:bg-red-600', multiplier: '2x' },
    { name: 'green' as const, label: 'Green', bg: 'bg-green-500', hover: 'hover:bg-green-600', multiplier: '2x' },
    { name: 'violet' as const, label: 'Violet', bg: 'bg-purple-500', hover: 'hover:bg-purple-600', multiplier: '4.5x' }
  ];

  const handlePlaceBet = () => {
    if (!currentRound || !selectedColor || !user) return;
    
    placeBet({
      roundId: currentRound.id,
      color: selectedColor,
      amount: betAmount,
    });
  };

  const getColorDisplay = (color: string) => {
    switch (color) {
      case 'red': return { bg: 'bg-red-500', text: 'Red' };
      case 'green': return { bg: 'bg-green-500', text: 'Green' };
      case 'violet': return { bg: 'bg-purple-500', text: 'Violet' };
      default: return { bg: 'bg-gray-500', text: 'Unknown' };
    }
  };

  const canBet = currentRound?.status === 'betting' && timeLeft > 5 && !userBet && user;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-gradient-hero py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Color <span className="bg-gradient-primary bg-clip-text text-transparent">Prediction</span>
              </h1>
              <p className="text-muted-foreground">Predict the winning color and win big!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-card rounded-lg px-4 py-2">
                <Wallet className="h-5 w-5 text-gaming-gold mr-2" />
                <span className="font-bold text-gaming-gold">₹{wallet?.current_balance || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Game Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Timer and Period */}
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Period: {currentRound?.period || 'Loading...'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {currentRound?.status === 'betting' ? 'Betting Open' : 
                     currentRound?.status === 'drawing' ? 'Drawing...' : 'Waiting for next round'}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-primary">{timeLeft}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {timeLeft > 5 ? 'Time left to place bet' : 'Betting closed'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Latest Result */}
            {recentRounds.length > 0 && (
              <Card className="bg-gradient-card border-border">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Latest Result</h3>
                    <div className="flex items-center justify-center space-x-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Period: {recentRounds[0].period}</p>
                        <div className={`w-16 h-16 rounded-full mx-auto mb-2 ${getColorDisplay(recentRounds[0].winning_color!).bg}`}></div>
                        <p className="text-xl font-bold">{getColorDisplay(recentRounds[0].winning_color!).text}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Color Selection */}
            {user ? (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Select Your Color
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {colors.map((color) => (
                      <Button
                        key={color.name}
                        variant={selectedColor === color.name ? "default" : "outline"}
                        className={`h-24 flex flex-col space-y-2 ${
                          selectedColor === color.name 
                            ? `${color.bg} text-white hover:${color.bg}/90` 
                            : `border-2 hover:${color.bg}/10`
                        }`}
                        onClick={() => setSelectedColor(color.name)}
                        disabled={!canBet}
                      >
                        <div className={`w-8 h-8 rounded-full ${color.bg}`}></div>
                        <span className="font-medium">{color.label}</span>
                        <span className="text-xs">{color.multiplier}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Bet Amount Selection */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3">Select Bet Amount</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {betAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant={betAmount === amount ? "default" : "outline"}
                          size="sm"
                          onClick={() => setBetAmount(amount)}
                          disabled={amount > (wallet?.current_balance || 0)}
                        >
                          ₹{amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Place Bet Button */}
                  {userBet ? (
                    <div className="p-4 bg-gaming-success/10 rounded-lg text-center">
                      <p className="text-gaming-success font-medium">
                        Bet placed on {colors.find(c => c.name === userBet.color)?.label} for ₹{userBet.bet_amount}
                      </p>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-12 text-lg font-semibold shadow-gaming"
                      onClick={handlePlaceBet}
                      disabled={!canBet || !selectedColor || isPlacingBet || betAmount > (wallet?.current_balance || 0)}
                    >
                      {isPlacingBet ? 'Placing Bet...' : `Place Bet - ₹${betAmount}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-card border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Please login to place bets</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Game History */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Recent Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentRounds.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No results yet
                    </p>
                  ) : (
                    recentRounds.slice(0, 10).map((round) => (
                      <div key={round.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${getColorDisplay(round.winning_color!).bg}`}></div>
                          <span className="text-sm font-medium">{getColorDisplay(round.winning_color!).text}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {round.period}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Stats */}
            {user && (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wallet Balance</span>
                      <span className="font-semibold text-gaming-gold">₹{wallet?.current_balance || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Games Played</span>
                      <span className="font-semibold">{userBetHistory.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Won</span>
                      <span className="font-semibold text-gaming-success">
                        ₹{userBetHistory.filter(bet => bet.status === 'won').reduce((sum, bet) => sum + (bet.payout_amount || 0), 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Top Winners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Player1', amount: 5000, rank: 1 },
                    { name: 'Player2', amount: 3500, rank: 2 },
                    { name: 'Player3', amount: 2800, rank: 3 }
                  ].map((player) => (
                    <div key={player.rank} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">#{player.rank}</span>
                        <span className="text-sm">{player.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gaming-gold">₹{player.amount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPrediction;
