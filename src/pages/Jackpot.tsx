import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/Navigation';
import { Crown, Clock, Users, Coins, Trophy, DollarSign, Timer, Wallet } from 'lucide-react';
import { useJackpotRounds } from '@/hooks/useJackpotRounds';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Jackpot = () => {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [betAmount, setBetAmount] = useState<string>('10');
  
  const { 
    currentRound,
    history,
    walletBalance,
    timeLeft,
    formatTime,
    currentRoundLoading,
    joinRound,
    isJoining,
    testDeposit,
    isDepositing,
    showingResult,
    lastResult,
  } = useJackpotRounds();

  // Real-time notifications for round completion
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('jackpot-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'jackpot_rounds',
        filter: 'status=eq.completed'
      }, (payload) => {
        const round = payload.new;
        if (round.winner_id === user.id) {
          toast.success(`🎉 You won ₹${round.winner_amount}!`, {
            duration: 10000,
          });
        } else {
          toast.info(`Round completed! Winner received ₹${round.winner_amount}`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-refresh wallet balance
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('wallet-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Wallet balance updated - useJackpotRounds will refetch automatically
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">Real-Money Jackpot</CardTitle>
              <CardDescription>
                Sign in to participate in real-money jackpot rounds and win big!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setAuthModalOpen(true)}
                className="w-full"
                size="lg"
              >
                Sign In to Play
              </Button>
            </CardContent>
          </Card>
        </div>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  const handleJoinRound = () => {
    const amount = parseFloat(betAmount);
    if (amount >= 1) {
      joinRound(amount);
    }
  };

  const canJoin = currentRound?.active && 
                 !currentRound.user_entry && 
                 parseFloat(betAmount) >= 1 && 
                 walletBalance >= parseFloat(betAmount);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-6 pt-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-12 w-12 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">Real-Money Jackpot</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Contribute to the pot and win based on your stake! Fair & transparent.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Round */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-blue-800 to-purple-800 border-yellow-400 border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                    Current Jackpot Round
                  </CardTitle>
                  {currentRound?.active && (
                    <Badge variant="secondary" className="bg-green-500 text-white">
                      <Timer className="h-4 w-4 mr-1" />
                      {formatTime(timeLeft)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentRoundLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-white/20 rounded"></div>
                    <div className="h-6 bg-white/20 rounded w-2/3"></div>
                    <div className="h-12 bg-white/20 rounded"></div>
                  </div>
                ) : showingResult ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="animate-bounce">
                      <Trophy className="h-24 w-24 text-yellow-400 mx-auto" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">🎉 Winner Announced! 🎉</h3>
                    <div className="space-y-2">
                      <p className="text-xl text-yellow-300">Prize: ₹{lastResult?.winner_amount?.toLocaleString()}</p>
                      <p className="text-blue-200">From a pot of ₹{lastResult?.pot?.toLocaleString()}</p>
                    </div>
                    <p className="text-white/80 text-sm">Next round starting soon...</p>
                  </div>
                ) : currentRound?.active ? (
                  <>
                    {/* Pot Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-blue-200 text-sm">Total Pot</p>
                        <p className="text-3xl font-bold text-yellow-400">
                          ₹{currentRound.total_amount?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-blue-200 text-sm">Players</p>
                        <p className="text-3xl font-bold text-white">
                          {currentRound.total_players || 0}
                        </p>
                      </div>
                    </div>

                    {/* User's Entry */}
                    {currentRound.user_entry ? (
                      <Card className="bg-green-500/20 border-green-400">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-semibold">You're in this round!</p>
                              <p className="text-green-200">
                                Bet: ₹{currentRound.user_entry.amount} | 
                                Win Chance: {(currentRound.user_entry.win_probability * 100).toFixed(2)}%
                              </p>
                            </div>
                            <Trophy className="h-8 w-8 text-yellow-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-white/10">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div>
                              <label className="text-white text-sm font-medium">Bet Amount (₹)</label>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                className="mt-1 bg-white/20 border-white/30 text-white placeholder-white/60"
                                placeholder="Minimum ₹1"
                              />
                            </div>
                            <Button 
                              onClick={handleJoinRound}
                              disabled={!canJoin || isJoining}
                              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                              size="lg"
                            >
                              {isJoining ? 'Joining...' : 'Join Jackpot'}
                            </Button>
                            {parseFloat(betAmount) >= 1 && (
                              <p className="text-blue-200 text-sm text-center">
                                Win chance: ~{((parseFloat(betAmount) / ((currentRound.total_amount || 0) + parseFloat(betAmount))) * 100).toFixed(2)}%
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Current Entries */}
                    {currentRound.entries && currentRound.entries.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-3">Current Entries</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {currentRound.entries.map((entry, index) => (
                            <div key={index} className="flex justify-between items-center bg-white/10 rounded p-2">
                              <span className="text-white">{entry.user_name}</span>
                              <div className="text-right">
                                <span className="text-yellow-400 font-semibold">₹{entry.amount}</span>
                                <span className="text-blue-200 text-sm block">
                                  {(entry.win_probability * 100).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-16 w-16 text-white/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Active Round</h3>
                    <p className="text-blue-200">
                      A new round will start when the first player joins.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Your Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{walletBalance?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => testDeposit(100)}
                    variant="outline"
                    size="sm"
                    disabled={isDepositing}
                    className="w-full"
                  >
                    {isDepositing ? 'Adding...' : 'Add ₹100 (Test)'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <p>Players contribute money to a shared pot</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <p>Your win chance = your bet ÷ total pot</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <p>After 60 seconds, a winner is randomly selected</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">4</span>
                  <p>Winner gets 95% of the pot (5% commission)</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Winners */}
            {history && history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Winners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {history.slice(0, 5).map((round: any) => (
                      <div key={round.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">
                            {round.winner?.full_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(round.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-green-600 font-bold">
                          ₹{round.winner_amount?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};

export default Jackpot;