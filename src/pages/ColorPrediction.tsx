import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useGameManagement } from '@/hooks/useGameManagement';
import { useColorPrediction } from '@/hooks/useColorPrediction';
import Navigation from '@/components/Navigation';
import ColorPredictionWheel from '@/components/colorPrediction/ColorPredictionWheel';
import BettingCards from '@/components/colorPrediction/BettingCards';
import GameTimer from '@/components/colorPrediction/GameTimer';
import ResultsHistory from '@/components/colorPrediction/ResultsHistory';
import WinnerCelebration from '@/components/colorPrediction/WinnerCelebration';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Users, Trophy, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const ColorPrediction = () => {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { gameSettings } = useGameManagement();
  const colorPredictionSettings = gameSettings?.find(s => s.game_type === 'color_prediction');
  
  const {
    currentRound,
    recentRounds,
    userBet,
    userBetHistory,
    timeLeft,
    roundLoading,
    placeBet
  } = useColorPrediction();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [lastWinningColor, setLastWinningColor] = useState<'red' | 'green' | 'violet' | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Check for round completion and trigger animation
  useEffect(() => {
    if (currentRound?.status === 'completed' && currentRound.winning_color && !isSpinning) {
      setIsSpinning(true);
      setLastWinningColor(currentRound.winning_color);
      setTimeout(() => {
        setIsSpinning(false);
        setShowWinner(true);
        // Balance will refresh automatically via subscriptions
      }, 4000);
    }
  }, [currentRound]);

  const handlePlaceBet = async () => {
    if (!selectedColor || !currentRound) return;
    
    setIsPlacingBet(true);
    try {
      await placeBet({
        roundId: currentRound.id,
        color: selectedColor as 'red' | 'green' | 'violet',
        amount: betAmount
      });
      
      setSelectedColor(null);
      // Balance will refresh automatically via subscriptions
    } catch (error) {
      console.error('Failed to place bet:', error);
    } finally {
      setIsPlacingBet(false);
    }
  };

  const canBet = currentRound?.status === 'betting' && !userBet && timeLeft > 0;

  // Calculate user statistics
  const userStats = {
    totalBets: userBetHistory?.length || 0,
    totalWins: userBetHistory?.filter(b => b.status === 'won').length || 0,
    totalWinnings: userBetHistory?.reduce((sum, bet) => 
      bet.status === 'won' ? sum + (bet.payout_amount || 0) : sum, 0) || 0
  };

  const isGamePaused = colorPredictionSettings?.settings?.is_active === false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navigation />
      
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Color Prediction</h1>
              <p className="text-gray-400 text-sm">Predict the winning color and win big!</p>
            </div>
            {user && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl px-4 py-2"
              >
                <Wallet className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-lg">₹{(wallet?.current_balance || 0).toLocaleString()}</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isGamePaused && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              Game is currently paused by admin. Please wait for it to resume.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer and Round Info */}
            <GameTimer
              timeLeft={timeLeft}
              roundNumber={currentRound?.period || '0'}
              status={currentRound?.status || 'betting'}
              totalBets={currentRound?.total_bets_amount || 0}
              totalPlayers={currentRound?.total_players || 0}
            />

            {/* Color Prediction Wheel */}
            <Card className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
              <ColorPredictionWheel
                isSpinning={isSpinning}
                winningColor={lastWinningColor || undefined}
                onSpinComplete={() => setIsSpinning(false)}
              />
            </Card>

            {/* Betting Interface */}
            {!isGamePaused && (
              <BettingCards
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
                betAmount={betAmount}
                onSelectAmount={setBetAmount}
                onPlaceBet={handlePlaceBet}
                canBet={canBet}
                isPlacingBet={isPlacingBet}
                userBet={userBet}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Results History */}
            <ResultsHistory rounds={recentRounds || []} />

            {/* User Statistics */}
            {user && (
              <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Your Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Bets</span>
                    <Badge variant="outline" className="border-gray-600">
                      {userStats.totalBets}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Wins</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {userStats.totalWins}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Win Rate</span>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {userStats.totalBets > 0 
                        ? `${((userStats.totalWins / userStats.totalBets) * 100).toFixed(1)}%`
                        : '0%'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <span className="text-gray-400 font-semibold">Total Winnings</span>
                    <span className="text-yellow-400 font-bold text-lg">
                      ₹{userStats.totalWinnings.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Top Winners */}
            <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Top Winners Today
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div key={rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        rank === 1 ? 'bg-yellow-500 text-black' :
                        rank === 2 ? 'bg-gray-400 text-black' :
                        rank === 3 ? 'bg-orange-600 text-white' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {rank}
                      </div>
                      <span className="text-gray-300">Player{rank}</span>
                    </div>
                    <span className="text-yellow-400 font-semibold">
                      ₹{(10000 - rank * 1500).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Live Stats */}
            <Card className="p-6 bg-gradient-to-br from-purple-900/30 via-gray-800 to-gray-900 border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Live Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">
                    {currentRound?.total_players || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Active Players</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">
                    ₹{(currentRound?.total_bets_amount || 0).toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm">Prize Pool</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Winner Celebration */}
      <WinnerCelebration
        show={showWinner}
        winningColor={lastWinningColor || 'red'}
        amount={userBet?.status === 'won' ? userBet.payout_amount : undefined}
        onClose={() => setShowWinner(false)}
      />
    </div>
  );
};

export default ColorPrediction;