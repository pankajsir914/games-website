
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAndarBahar } from '@/hooks/useAndarBahar';
import { useGameManagement } from '@/hooks/useGameManagement';
import Navigation from '@/components/Navigation';
import { WalletCard } from '@/components/wallet/WalletCard';
import { GameBoard } from '@/components/andarBahar/GameBoard';
import { BettingInterface } from '@/components/andarBahar/BettingInterface';
import { GameHistory } from '@/components/andarBahar/GameHistory';
import { AuthModal } from '@/components/auth/AuthModal';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const AndarBahar = () => {
  const { user } = useAuth();
  const { isGamePaused } = useGameManagement();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const {
    currentRound,
    userBet,
    gameHistory,
    userBetHistory,
    timeRemaining,
    roundLoading,
    placeBet,
    isPlacingBet,
  } = useAndarBahar();
  
  const gameIsPaused = isGamePaused('andar_bahar');

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Andar Bahar</h1>
            <p className="text-xl text-gray-300 mb-8">
              Please sign in to play Andar Bahar
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Andar Bahar</h1>
          <p className="text-xl text-gray-300">
            Traditional Indian card game with real money betting
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Game Paused Alert */}
          {gameIsPaused && (
            <div className="lg:col-span-3">
              <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-700 dark:text-red-300 font-medium">
                  Andar Bahar game is currently paused for maintenance. Please check back later.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {/* Left Column - Game Board */}
          <div className="lg:col-span-2 space-y-6">
            {roundLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ) : (
              <GameBoard currentRound={currentRound} />
            )}

            <GameHistory 
              gameHistory={gameHistory} 
              userBetHistory={userBetHistory} 
            />
          </div>

          {/* Right Column - Wallet & Betting */}
          <div className="space-y-6">
            <WalletCard />
            
            <BettingInterface
              currentRound={currentRound}
              userBet={userBet}
              timeRemaining={timeRemaining}
              onPlaceBet={(roundId, betSide, amount) => placeBet({ roundId, betSide, amount })}
              isPlacingBet={isPlacingBet}
              disabled={gameIsPaused}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AndarBahar;
