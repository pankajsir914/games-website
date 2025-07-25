
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoulette } from '@/hooks/useRoulette';
import { useGameManagement } from '@/hooks/useGameManagement';
import Navigation from '@/components/Navigation';
import { WalletCard } from '@/components/wallet/WalletCard';
import { RouletteWheel } from '@/components/roulette/RouletteWheel';
import { BettingGrid } from '@/components/roulette/BettingGrid';
import { GameTimer } from '@/components/roulette/GameTimer';
import { RouletteHistory } from '@/components/roulette/RouletteHistory';
import { AuthModal } from '@/components/auth/AuthModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const Roulette = () => {
  const { user } = useAuth();
  const { isGamePaused } = useGameManagement();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const {
    currentRound,
    userBets,
    roundHistory,
    userBetHistory,
    timeRemaining,
    roundLoading,
    placeBet,
    isPlacingBet,
  } = useRoulette();
  
  const gameIsPaused = isGamePaused('roulette');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">🎰 Roulette</h1>
            <p className="text-xl text-gray-300 mb-8">
              Please sign in to play Roulette
            </p>
            <Button onClick={() => setAuthModalOpen(true)}>
              Sign In
            </Button>
            <AuthModal 
              open={authModalOpen} 
              onOpenChange={setAuthModalOpen} 
            />
          </div>
        </div>
      </div>
    );
  }

  const isBettingOpen = currentRound?.status === 'betting' && timeRemaining > 0 && !gameIsPaused;
  const isSpinning = currentRound?.status === 'spinning';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Game Paused Alert */}
        {gameIsPaused && (
          <Alert variant="destructive" className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700 dark:text-red-300 font-medium">
              Roulette game is currently paused for maintenance. Please check back later.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">🎰 Roulette</h1>
          <p className="text-xl text-gray-300">
            Place your bets and spin the wheel of fortune!
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <WalletCard />
            
            {roundLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : (
              <GameTimer
                timeRemaining={timeRemaining}
                status={currentRound?.status || 'completed'}
                roundNumber={currentRound?.round_number}
              />
            )}
          </div>

          {/* Main Game Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Roulette Wheel */}
            <Card>
              <CardContent className="p-8">
                {roundLoading ? (
                  <div className="flex justify-center">
                    <Skeleton className="w-80 h-80 rounded-full" />
                  </div>
                ) : (
                  <RouletteWheel
                    isSpinning={isSpinning}
                    winningNumber={currentRound?.winning_number}
                  />
                )}
              </CardContent>
            </Card>

            {/* Game Status */}
            {currentRound && (
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">
                      Round #{currentRound.round_number}
                    </div>
                    
                    {currentRound.status === 'betting' && (
                      <div className="text-green-600 font-medium">
                        🟢 Betting is open! Place your bets now.
                      </div>
                    )}
                    
                    {currentRound.status === 'spinning' && (
                      <div className="text-blue-600 font-medium">
                        🔵 Wheel is spinning... Good luck!
                      </div>
                    )}
                    
                    {currentRound.status === 'completed' && currentRound.winning_number !== undefined && (
                      <div className="text-purple-600 font-medium">
                        🎯 Winning number: {currentRound.winning_number} ({currentRound.winning_color})
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel */}
          <div className="xl:col-span-1">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="space-y-4">
                <RouletteHistory
                  roundHistory={roundHistory}
                  userBetHistory={userBetHistory}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Betting Interface */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">Betting Table</h2>
              <BettingGrid
                onPlaceBet={placeBet}
                userBets={userBets}
                disabled={!isBettingOpen || gameIsPaused}
                isPlacingBet={isPlacingBet}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Roulette;
