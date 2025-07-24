
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { useJackpot } from '@/hooks/useJackpot';
import { AuthModal } from '@/components/auth/AuthModal';
import { JackpotGame } from '@/components/jackpot/JackpotGame';
import { JackpotHistory } from '@/components/jackpot/JackpotHistory';
import { WinnerModal } from '@/components/jackpot/WinnerModal';
import { Trophy, Timer, Users, Ticket } from 'lucide-react';

const Jackpot = () => {
  const { user } = useAuth();
  const { activeGames, winnersHistory, gamesLoading, winnersLoading } = useJackpot();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('low');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">🎰 Jackpot Games</h1>
            <p className="text-xl mb-8">Sign in to participate in exciting jackpot games!</p>
            <Button 
              onClick={() => setAuthModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
            >
              Sign In to Play
            </Button>
          </div>
        </div>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  const filteredGames = activeGames?.filter(game => game.tier === selectedTier) || [];
  const latestWinner = winnersHistory?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🎰 Jackpot Games
          </h1>
          <p className="text-xl text-gray-300">
            Buy tickets and win amazing prizes!
          </p>
        </div>

        {/* Latest Winner Banner */}
        {latestWinner && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-yellow-400/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-4 text-white">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <div className="text-center">
                  <p className="text-lg font-semibold">🎉 Latest Winner!</p>
                  <p className="text-2xl font-bold">
                    {latestWinner.profiles?.full_name} won ₹{latestWinner.prize_amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-300">
                    Ticket #{latestWinner.winning_ticket_number} • {latestWinner.tier.toUpperCase()} tier
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Tier Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 p-1 rounded-lg backdrop-blur-sm">
            {['low', 'medium', 'high'].map((tier) => (
              <Button
                key={tier}
                variant={selectedTier === tier ? "default" : "ghost"}
                onClick={() => setSelectedTier(tier)}
                className={`mx-1 ${
                  selectedTier === tier 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                {tier.toUpperCase()} Stakes
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="games" className="text-white data-[state=active]:bg-white/20">
              Active Games
            </TabsTrigger>
            <TabsTrigger value="history" className="text-white data-[state=active]:bg-white/20">
              Winner History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="mt-6">
            {gamesLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white/10 backdrop-blur-sm animate-pulse">
                    <CardContent className="p-6 h-64" />
                  </Card>
                ))}
              </div>
            ) : filteredGames.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredGames.map((game) => (
                  <JackpotGame key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8 text-center text-white">
                  <Timer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Active Games</h3>
                  <p className="text-gray-300">
                    No {selectedTier} stakes games are currently active. Check back soon!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <JackpotHistory winners={winnersHistory} loading={winnersLoading} />
          </TabsContent>
        </Tabs>
      </div>

      <WinnerModal />
    </div>
  );
};

export default Jackpot;
