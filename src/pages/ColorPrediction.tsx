
import React, { useState, useEffect } from 'react';
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

interface GameResult {
  id: number;
  color: 'red' | 'green' | 'violet';
  timestamp: Date;
  period: string;
}

interface Bet {
  color: 'red' | 'green' | 'violet' | null;
  amount: number;
}

const ColorPrediction = () => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameActive, setIsGameActive] = useState(true);
  const [currentBet, setCurrentBet] = useState<Bet>({ color: null, amount: 10 });
  const [walletBalance, setWalletBalance] = useState(1000);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState('20250120001');
  const [lastResult, setLastResult] = useState<'red' | 'green' | 'violet' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);

  const betAmounts = [10, 50, 100, 500, 1000];
  const colors = [
    { name: 'red', label: 'Red', bg: 'bg-red-500', hover: 'hover:bg-red-600' },
    { name: 'green', label: 'Green', bg: 'bg-green-500', hover: 'hover:bg-green-600' },
    { name: 'violet', label: 'Violet', bg: 'bg-purple-500', hover: 'hover:bg-purple-600' }
  ] as const;

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameEnd();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGameEnd = () => {
    setIsGameActive(false);
    setShowResult(true);
    
    // Generate random result
    const randomColor = colors[Math.floor(Math.random() * colors.length)].name;
    setLastResult(randomColor);
    
    // Check if user won
    if (betPlaced && currentBet.color === randomColor) {
      const winAmount = currentBet.amount * 2;
      setWalletBalance(prev => prev + winAmount);
    } else if (betPlaced) {
      setWalletBalance(prev => prev - currentBet.amount);
    }
    
    // Add to results history
    const newResult: GameResult = {
      id: Date.now(),
      color: randomColor,
      timestamp: new Date(),
      period: currentPeriod
    };
    
    setGameResults(prev => [newResult, ...prev.slice(0, 9)]);
    
    // Reset for next round
    setTimeout(() => {
      setShowResult(false);
      setIsGameActive(true);
      setBetPlaced(false);
      setCurrentBet({ color: null, amount: 10 });
      setCurrentPeriod(prev => (parseInt(prev) + 1).toString());
    }, 3000);
  };

  const placeBet = () => {
    if (currentBet.color && currentBet.amount <= walletBalance && timeLeft > 5) {
      setBetPlaced(true);
    }
  };

  const getColorDisplay = (color: string) => {
    switch (color) {
      case 'red': return { bg: 'bg-red-500', text: 'Red' };
      case 'green': return { bg: 'bg-green-500', text: 'Green' };
      case 'violet': return { bg: 'bg-purple-500', text: 'Violet' };
      default: return { bg: 'bg-gray-500', text: 'Unknown' };
    }
  };

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
              <p className="text-muted-foreground">Predict the winning color and win 2x your bet!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-card rounded-lg px-4 py-2">
                <Wallet className="h-5 w-5 text-gaming-gold mr-2" />
                <span className="font-bold text-gaming-gold">₹{walletBalance}</span>
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
                    <span className="text-sm text-muted-foreground">Period: {currentPeriod}</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {isGameActive ? 'Betting Open' : 'Drawing...'}
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

            {/* Result Display */}
            {showResult && lastResult && (
              <Card className="bg-gradient-card border-border animate-scale-in">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Result</h3>
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 ${getColorDisplay(lastResult).bg}`}></div>
                    <p className="text-xl font-bold">{getColorDisplay(lastResult).text}</p>
                    {betPlaced && (
                      <p className="mt-2 text-lg font-semibold">
                        {currentBet.color === lastResult ? (
                          <span className="text-gaming-success">You Won! +₹{currentBet.amount * 2}</span>
                        ) : (
                          <span className="text-gaming-danger">You Lost -₹{currentBet.amount}</span>
                        )}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Color Selection */}
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
                      variant={currentBet.color === color.name ? "default" : "outline"}
                      className={`h-20 flex flex-col space-y-2 ${
                        currentBet.color === color.name 
                          ? `${color.bg} text-white hover:${color.bg}/90` 
                          : `border-2 hover:${color.bg}/10`
                      }`}
                      onClick={() => setCurrentBet(prev => ({ ...prev, color: color.name }))}
                      disabled={!isGameActive || timeLeft <= 5}
                    >
                      <div className={`w-8 h-8 rounded-full ${color.bg}`}></div>
                      <span className="font-medium">{color.label}</span>
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
                        variant={currentBet.amount === amount ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentBet(prev => ({ ...prev, amount }))}
                        disabled={amount > walletBalance}
                      >
                        ₹{amount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Place Bet Button */}
                <Button 
                  className="w-full h-12 text-lg font-semibold shadow-gaming"
                  onClick={placeBet}
                  disabled={!currentBet.color || !isGameActive || timeLeft <= 5 || betPlaced || currentBet.amount > walletBalance}
                >
                  {betPlaced ? 'Bet Placed!' : `Place Bet - ₹${currentBet.amount}`}
                </Button>
                
                {betPlaced && (
                  <div className="mt-4 p-3 bg-gaming-success/10 rounded-lg text-center">
                    <p className="text-gaming-success font-medium">
                      Bet placed on {colors.find(c => c.name === currentBet.color)?.label} for ₹{currentBet.amount}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  {gameResults.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No results yet
                    </p>
                  ) : (
                    gameResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${getColorDisplay(result.color).bg}`}></div>
                          <span className="text-sm font-medium">{getColorDisplay(result.color).text}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
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
                    <span className="font-semibold text-gaming-gold">₹{walletBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Games Played</span>
                    <span className="font-semibold">{gameResults.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-semibold">
                      {gameResults.length > 0 ? '0%' : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
