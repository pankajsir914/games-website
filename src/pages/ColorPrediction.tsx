import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useGameManagement } from '@/hooks/useGameManagement';
import { useColorPrediction } from '@/hooks/useColorPrediction';
import Navigation from '@/components/Navigation';
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
    lastCompletedRound,
    recentRounds,
    userBet,
    userBetHistory,
    timeLeft,
    roundLoading,
    placeBet,
    roundDuration,
    topWinners
  } = useColorPrediction();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [showWinner, setShowWinner] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Show winner celebration when new completed round arrives
  useEffect(() => {
    if (lastCompletedRound?.winning_color) {
      console.log('🎉 Showing winner celebration for:', lastCompletedRound.winning_color);
      setShowWinner(true);
      const timer = setTimeout(() => setShowWinner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastCompletedRound?.id]);

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

  const canBet = currentRound?.status === 'betting' && !userBet && timeLeft > 2;

  // Calculate user statistics
  const userStats = {
    totalBets: userBetHistory?.length || 0,
    totalWins: userBetHistory?.filter(b => b.status === 'won').length || 0,
    totalWinnings: userBetHistory?.reduce((sum, bet) => 
      bet.status === 'won' ? sum + (bet.payout_amount || 0) : sum, 0) || 0
  };

  const isGamePaused = !colorPredictionSettings?.is_enabled || colorPredictionSettings?.is_paused;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navigation />
      
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Color Prediction</h1>
              <p className="text-gray-400 text-xs sm:text-sm">Predict the winning color and win big!</p>
            </div>
            {user && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl px-4 py-2"
              >
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-base md:text-lg">₹{(wallet?.current_balance || 0).toLocaleString()}</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:py-8">
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
              roundDuration={roundDuration}
            />

            {/* Current Result Display */}
            <Card className="p-3 sm:p-6 md:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
              <div className="text-center space-y-2 sm:space-y-4">
                <h3 className="text-sm sm:text-xl md:text-2xl font-bold text-white">
                  {lastCompletedRound ? 'Latest Result' : 'Current Round'}
                </h3>
                {lastCompletedRound?.winning_color ? (
                  <motion.div
                    key={lastCompletedRound.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className={`mx-auto w-20 h-20 sm:w-36 sm:h-36 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center text-white shadow-2xl ${
                      lastCompletedRound.winning_color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700' :
                      lastCompletedRound.winning_color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-700' :
                      'bg-gradient-to-br from-purple-500 to-purple-700'
                    }`}
                  >
                    <div className="text-lg sm:text-3xl md:text-5xl font-bold">
                      {lastCompletedRound.winning_color.toUpperCase()}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm mt-1 opacity-80">
                      #{lastCompletedRound.period}
                    </div>
                  </motion.div>
                ) : (
                  <div className="mx-auto w-20 h-20 sm:w-36 sm:h-36 md:w-48 md:h-48 rounded-full bg-gray-700 flex items-center justify-center">
                    <p className="text-gray-400 text-xs sm:text-sm">Waiting...</p>
                  </div>
                )}
              </div>
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
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
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
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Top Winners Today
              </h3>
              <div className="space-y-3">
                {topWinners.length > 0 ? (
                  topWinners.map((winner, index) => (
                    <div key={winner.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-gray-300 truncate max-w-[100px]">{winner.name}</span>
                      </div>
                      <span className="text-yellow-400 font-semibold">
                        ₹{winner.total.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No winners yet today</p>
                )}
              </div>
            </Card>

            {/* Live Stats */}
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-900/30 via-gray-800 to-gray-900 border-purple-500/30">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                Live Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
                    {currentRound?.total_players || 0}
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm">Active Players</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-400">
                    ₹{(currentRound?.total_bets_amount || 0).toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm">Prize Pool</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Winner Celebration */}
      <WinnerCelebration
        show={showWinner}
        winningColor={lastCompletedRound?.winning_color || 'red'}
        amount={userBet?.status === 'won' ? userBet.payout_amount : undefined}
        onClose={() => setShowWinner(false)}
      />
    </div>
  );
};

export default ColorPrediction;