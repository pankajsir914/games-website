
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAndarBahar } from '@/hooks/useAndarBahar';
import Navigation from '@/components/Navigation';
import { WalletCard } from '@/components/wallet/WalletCard';
import { GameBoard } from '@/components/andarBahar/GameBoard';
import { BettingInterface } from '@/components/andarBahar/BettingInterface';
import { GameHistory } from '@/components/andarBahar/GameHistory';
import { AuthModal } from '@/components/auth/AuthModal';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const AndarBahar = () => {
  const { user } = useAuth();
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Andar Bahar</h1>
            <p className="text-xl text-gray-300 mb-8">
              Please sign in to play Andar Bahar
            </p>
            <AuthModal />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Andar Bahar</h1>
          <p className="text-xl text-gray-300">
            Traditional Indian card game with real money betting
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
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
              onPlaceBet={placeBet}
              isPlacingBet={isPlacingBet}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AndarBahar;
