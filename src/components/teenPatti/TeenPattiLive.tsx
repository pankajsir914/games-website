import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Coins, Trophy, Play, TrendingUp, Activity } from 'lucide-react';
import { TeenPattiCard } from './TeenPattiCard';
import { useWallet } from '@/hooks/useWallet';
import { useGameSounds } from '@/hooks/useGameSounds';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_BET_AMOUNTS = [10, 25, 50, 100, 250, 500, 1000];
const ROUND_DURATION = 30; // seconds
const BETTING_PHASE_DURATION = 10; // seconds

interface LiveRound {
  id: string;
  round_number: number;
  status: 'betting' | 'dealing' | 'revealing' | 'result' | 'completed';
  phase_time_remaining: number;
  total_pot: number;
  total_players: number;
  player_cards?: Array<{ rank: string; suit: string }>;
  dealer_cards?: Array<{ rank: string; suit: string }>;
  winning_side?: 'player' | 'dealer' | 'tie';
  winning_hand?: string;
  created_at: string;
}

interface LiveBet {
  id: string;
  amount: number;
  status: 'pending' | 'won' | 'lost';
  payout?: number;
  side: 'player' | 'dealer' | 'tie';
  multiplier?: number;
}

interface RecentWinner {
  user_name: string;
  amount: number;
  multiplier: number;
  hand: string;
  time: string;
}

export const TeenPattiLive = () => {
  const [currentRound, setCurrentRound] = useState<LiveRound | null>(null);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(BETTING_PHASE_DURATION);
  const [selectedBet, setSelectedBet] = useState<number>(50);
  const [userBet, setUserBet] = useState<LiveBet | null>(null);
  const [isAutoBet, setIsAutoBet] = useState(false);
  const [lastBetAmount, setLastBetAmount] = useState<number>(50);
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [revealedCards, setRevealedCards] = useState<number>(0);
  const [livePlayers, setLivePlayers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { wallet, updateBalance } = useWallet();
  const { playCardFlip, playChipPlace, playWin, playLose, playCountdown } = useGameSounds();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const balance = wallet?.current_balance || 0;

  // Start continuous round cycle
  useEffect(() => {
    startRoundCycle();
    fetchRecentWinners();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('teen-patti-live')
      .on('broadcast', { event: 'round-update' }, (payload) => {
        handleRoundUpdate(payload.payload);
      })
      .on('broadcast', { event: 'winner-announcement' }, (payload) => {
        handleWinnerAnnouncement(payload.payload);
      })
      .subscribe();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const startRoundCycle = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    let currentPhase: 'betting' | 'dealing' | 'revealing' | 'result' = 'betting';
    let timeRemaining = BETTING_PHASE_DURATION;
    let roundId = generateRoundId();
    
    // Initialize first round
    const newRound: LiveRound = {
      id: roundId,
      round_number: Math.floor(Date.now() / 1000) % 100000,
      status: 'betting',
      phase_time_remaining: BETTING_PHASE_DURATION,
      total_pot: 0,
      total_players: Math.floor(Math.random() * 50) + 10,
      created_at: new Date().toISOString()
    };
    setCurrentRound(newRound);
    setPhaseTimeRemaining(BETTING_PHASE_DURATION);
    setRevealedCards(0);
    
    intervalRef.current = setInterval(() => {
      timeRemaining--;
      setPhaseTimeRemaining(timeRemaining);
      
      // Phase transitions
      if (timeRemaining <= 0) {
        switch (currentPhase) {
          case 'betting':
            currentPhase = 'dealing';
            timeRemaining = 2;
            setCurrentRound(prev => prev ? { ...prev, status: 'dealing' } : null);
            generateAndDealCards(roundId);
            break;
            
          case 'dealing':
            currentPhase = 'revealing';
            timeRemaining = 8;
            setCurrentRound(prev => prev ? { ...prev, status: 'revealing' } : null);
            startCardReveal();
            break;
            
          case 'revealing':
            currentPhase = 'result';
            timeRemaining = 5;
            setCurrentRound(prev => prev ? { ...prev, status: 'result' } : null);
            evaluateResult();
            break;
            
          case 'result':
            // Start new round
            currentPhase = 'betting';
            timeRemaining = BETTING_PHASE_DURATION;
            roundId = generateRoundId();
            
            const nextRound: LiveRound = {
              id: roundId,
              round_number: Math.floor(Date.now() / 1000) % 100000,
              status: 'betting',
              phase_time_remaining: BETTING_PHASE_DURATION,
              total_pot: 0,
              total_players: Math.floor(Math.random() * 50) + 10,
              created_at: new Date().toISOString()
            };
            
            setCurrentRound(nextRound);
            setUserBet(null);
            setRevealedCards(0);
            
            // Auto-bet if enabled
            if (isAutoBet && lastBetAmount > 0) {
              setTimeout(() => placeBet(lastBetAmount), 1000);
            }
            break;
        }
      }
      
      // Countdown sound for last 3 seconds of betting
      if (currentPhase === 'betting' && timeRemaining <= 3 && timeRemaining > 0) {
        playCountdown();
      }
      
      // Update live player count
      if (Math.random() > 0.7) {
        setLivePlayers(prev => Math.max(10, prev + Math.floor(Math.random() * 10) - 5));
      }
    }, 1000);
  };

  const generateRoundId = () => `round_${Date.now()}`;

  const generateAndDealCards = async (roundId: string) => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    const generateHand = () => {
      const hand = [];
      for (let i = 0; i < 3; i++) {
        hand.push({
          rank: ranks[Math.floor(Math.random() * ranks.length)],
          suit: suits[Math.floor(Math.random() * suits.length)]
        });
      }
      return hand;
    };
    
    const playerCards = generateHand();
    const dealerCards = generateHand();
    
    setCurrentRound(prev => prev ? {
      ...prev,
      player_cards: playerCards,
      dealer_cards: dealerCards
    } : null);
    
    playCardFlip();
  };

  const startCardReveal = () => {
    let cardCount = 0;
    const revealInterval = setInterval(() => {
      cardCount++;
      setRevealedCards(cardCount);
      playCardFlip();
      
      if (cardCount >= 6) {
        clearInterval(revealInterval);
      }
    }, 1300);
  };

  const evaluateResult = async () => {
    if (!currentRound) return;
    
    // Simulate result evaluation
    const outcomes = ['player', 'dealer', 'tie'] as const;
    const winner = outcomes[Math.floor(Math.random() * outcomes.length)];
    const hands = ['Trail (Three of a Kind)', 'Pure Sequence', 'Sequence', 'Color', 'Pair', 'High Card'];
    const winningHand = hands[Math.floor(Math.random() * hands.length)];
    
    setCurrentRound(prev => prev ? {
      ...prev,
      winning_side: winner,
      winning_hand: winningHand,
      status: 'result'
    } : null);
    
    // Process user bet if exists
    if (userBet) {
      const won = userBet.side === winner || (winner === 'tie' && userBet.side === 'tie');
      const multiplier = winner === 'tie' ? 8 : 1.95;
      
      if (won) {
        const payout = userBet.amount * multiplier;
        setUserBet(prev => prev ? { ...prev, status: 'won', payout, multiplier } : null);
        updateBalance({ amount: payout, type: 'credit', reason: 'Teen Patti Live Win' });
        playWin();
        toast.success(`Won ₹${payout.toFixed(2)}!`);
        
        // Add to recent winners
        const newWinner: RecentWinner = {
          user_name: 'You',
          amount: payout,
          multiplier,
          hand: winningHand,
          time: new Date().toLocaleTimeString()
        };
        setRecentWinners(prev => [newWinner, ...prev].slice(0, 5));
      } else {
        setUserBet(prev => prev ? { ...prev, status: 'lost' } : null);
        playLose();
      }
    }
  };

  const placeBet = async (amount: number) => {
    if (!currentRound || currentRound.status !== 'betting' || phaseTimeRemaining <= 1) {
      toast.error('Betting is closed for this round');
      return;
    }
    
    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    
    if (userBet) {
      toast.error('You have already placed a bet for this round');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Deduct from wallet
      updateBalance({ amount, type: 'debit', reason: 'Teen Patti Live Bet' });
      
      const newBet: LiveBet = {
        id: `bet_${Date.now()}`,
        amount,
        status: 'pending',
        side: 'player' // Default to player, can add side selection later
      };
      
      setUserBet(newBet);
      setLastBetAmount(amount);
      
      // Update pot
      setCurrentRound(prev => prev ? {
        ...prev,
        total_pot: prev.total_pot + amount,
        total_players: prev.total_players + 1
      } : null);
      
      playChipPlace();
      toast.success(`Bet placed: ₹${amount}`);
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet');
      updateBalance({ amount, type: 'credit', reason: 'Teen Patti Live Bet Refund' }); // Refund
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentWinners = async () => {
    // Simulate fetching recent winners
    const mockWinners: RecentWinner[] = [
      { user_name: 'Player***89', amount: 5000, multiplier: 2, hand: 'Pure Sequence', time: '12:45:30' },
      { user_name: 'Lucky***21', amount: 10000, multiplier: 5, hand: 'Trail', time: '12:44:15' },
      { user_name: 'King***77', amount: 2500, multiplier: 1.95, hand: 'Color', time: '12:43:45' },
    ];
    setRecentWinners(mockWinners);
  };

  const handleRoundUpdate = (data: any) => {
    // Handle real-time round updates
    console.log('Round update:', data);
  };

  const handleWinnerAnnouncement = (data: any) => {
    // Handle winner announcements
    console.log('Winner announced:', data);
  };

  const getPhaseLabel = () => {
    if (!currentRound) return '';
    switch (currentRound.status) {
      case 'betting': return 'Place Your Bets';
      case 'dealing': return 'Dealing Cards';
      case 'revealing': return 'Revealing Cards';
      case 'result': return 'Round Result';
      default: return '';
    }
  };

  const getPhaseColor = () => {
    if (!currentRound) return 'bg-gray-500';
    switch (currentRound.status) {
      case 'betting': return 'bg-green-500';
      case 'dealing': return 'bg-blue-500';
      case 'revealing': return 'bg-purple-500';
      case 'result': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-900/20 to-pink-900/20 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Live Teen Patti
          </h1>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="px-3 py-1 border-green-500/50 text-green-400">
              <Activity className="w-3 h-3 mr-1" />
              24/7 Live Rounds
            </Badge>
            <Badge variant="outline" className="px-3 py-1 border-blue-500/50 text-blue-400">
              <Users className="w-3 h-3 mr-1" />
              {livePlayers || currentRound?.total_players || 0} Players Online
            </Badge>
          </div>
        </div>

        {/* Recent Winners Ticker */}
        <Card className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
          <div className="flex items-center gap-4 overflow-x-auto">
            <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex gap-6 animate-scroll">
              {recentWinners.map((winner, index) => (
                <div key={index} className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <span className="text-green-400 font-medium">{winner.user_name}</span>
                  <span className="text-gray-400">won</span>
                  <span className="text-yellow-400 font-bold">₹{winner.amount}</span>
                  <span className="text-gray-400">({winner.multiplier}x)</span>
                  <span className="text-purple-400">{winner.hand}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Main Game Area */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          {/* Phase Indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
            <div 
              className={`h-full ${getPhaseColor()} transition-all duration-1000`}
              style={{ width: `${(phaseTimeRemaining / (currentRound?.status === 'betting' ? BETTING_PHASE_DURATION : 8)) * 100}%` }}
            />
          </div>

          <div className="p-6">
            {/* Round Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Badge className="px-3 py-1 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600">
                  Round #{currentRound?.round_number}
                </Badge>
                <Badge className={`px-3 py-1 ${getPhaseColor()}`}>
                  {getPhaseLabel()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-mono font-bold text-yellow-400">
                  {phaseTimeRemaining}s
                </span>
              </div>
            </div>

            {/* Game Table */}
            <div className="relative bg-gradient-to-br from-green-800/50 to-green-900/50 rounded-2xl p-8 mb-6 border border-green-600/30">
              {/* Dealer Side */}
              <div className="text-center mb-8">
                <p className="text-sm text-gray-400 mb-2">DEALER</p>
                <div className="flex justify-center gap-2">
                  <AnimatePresence>
                    {currentRound?.dealer_cards?.map((card, index) => (
                      <motion.div
                        key={index}
                        initial={{ rotateY: 180, scale: 0 }}
                        animate={{ 
                          rotateY: revealedCards > index + 3 ? 0 : 180,
                          scale: currentRound.status !== 'betting' ? 1 : 0
                        }}
                        transition={{ delay: index * 0.2 + 3, duration: 0.5 }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <TeenPattiCard
                          card={revealedCards > index + 3 ? { 
                            rank: card.rank, 
                            suit: card.suit as 'hearts' | 'diamonds' | 'clubs' | 'spades',
                            value: 0 
                          } : null}
                          isVisible={revealedCards > index + 3}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Pot Display */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-black/70 px-6 py-3 rounded-full border border-yellow-500/50">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl font-bold text-yellow-400">
                      ₹{currentRound?.total_pot || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Player Side */}
              <div className="text-center">
                <div className="flex justify-center gap-2 mb-2">
                  <AnimatePresence>
                    {currentRound?.player_cards?.map((card, index) => (
                      <motion.div
                        key={index}
                        initial={{ rotateY: 180, scale: 0 }}
                        animate={{ 
                          rotateY: revealedCards > index ? 0 : 180,
                          scale: currentRound.status !== 'betting' ? 1 : 0
                        }}
                        transition={{ delay: index * 0.2, duration: 0.5 }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <TeenPattiCard
                          card={revealedCards > index ? { 
                            rank: card.rank, 
                            suit: card.suit as 'hearts' | 'diamonds' | 'clubs' | 'spades',
                            value: 0 
                          } : null}
                          isVisible={revealedCards > index}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <p className="text-sm text-gray-400">PLAYER</p>
              </div>

              {/* Result Overlay */}
              <AnimatePresence>
                {currentRound?.status === 'result' && currentRound.winning_side && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl"
                  >
                    <div className="text-center">
                      <h3 className="text-4xl font-bold mb-2">
                        {currentRound.winning_side === 'player' && (
                          <span className="text-green-400">PLAYER WINS!</span>
                        )}
                        {currentRound.winning_side === 'dealer' && (
                          <span className="text-red-400">DEALER WINS!</span>
                        )}
                        {currentRound.winning_side === 'tie' && (
                          <span className="text-yellow-400">IT'S A TIE!</span>
                        )}
                      </h3>
                      <p className="text-xl text-gray-300">{currentRound.winning_hand}</p>
                      {userBet && (
                        <div className="mt-4">
                          {userBet.status === 'won' && (
                            <p className="text-2xl text-green-400 font-bold">
                              You Won ₹{userBet.payout?.toFixed(2)}!
                            </p>
                          )}
                          {userBet.status === 'lost' && (
                            <p className="text-xl text-red-400">Better luck next time!</p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Betting Controls */}
            {currentRound?.status === 'betting' && !userBet && (
              <Card className="p-4 bg-black/50 border-purple-500/30">
                <div className="space-y-4">
                  {/* Quick Bet Buttons */}
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {QUICK_BET_AMOUNTS.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedBet === amount ? "default" : "outline"}
                        className={`h-12 font-bold ${
                          amount > balance ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => setSelectedBet(amount)}
                        disabled={amount > balance}
                      >
                        ₹{amount}
                      </Button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500"
                      onClick={() => placeBet(selectedBet)}
                      disabled={isLoading || phaseTimeRemaining <= 1}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Bet ₹{selectedBet}
                    </Button>
                    
                    <Button
                      variant={isAutoBet ? "default" : "outline"}
                      className="h-14 text-lg font-bold"
                      onClick={() => setIsAutoBet(!isAutoBet)}
                    >
                      🔄 Auto Bet {isAutoBet ? 'ON' : 'OFF'}
                    </Button>
                  </div>

                  {/* Last Bet Options */}
                  {lastBetAmount > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => placeBet(lastBetAmount)}
                        disabled={lastBetAmount > balance}
                      >
                        Repeat ₹{lastBetAmount}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => placeBet(lastBetAmount * 2)}
                        disabled={lastBetAmount * 2 > balance}
                      >
                        2x (₹{lastBetAmount * 2})
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Current Bet Display */}
            {userBet && (
              <Card className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Your Bet</p>
                    <p className="text-2xl font-bold text-blue-300">₹{userBet.amount}</p>
                  </div>
                  {userBet.status === 'won' && (
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Won</p>
                      <p className="text-2xl font-bold text-green-400">
                        ₹{userBet.payout?.toFixed(2)} ({userBet.multiplier}x)
                      </p>
                    </div>
                  )}
                  {userBet.status === 'pending' && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                      Waiting for result...
                    </Badge>
                  )}
                </div>
              </Card>
            )}
          </div>
        </Card>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Balance</span>
              </div>
              <span className="text-lg font-bold text-yellow-300">₹{balance}</span>
            </div>
          </Card>
          
          <Card className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Total Pot</span>
              </div>
              <span className="text-lg font-bold text-blue-300">₹{currentRound?.total_pot || 0}</span>
            </div>
          </Card>
          
          <Card className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Players</span>
              </div>
              <span className="text-lg font-bold text-purple-300">{currentRound?.total_players || 0}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};