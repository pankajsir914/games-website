import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import EnhancedGameInterface from '@/components/aviator/EnhancedGameInterface';
import LiveBetsPanel from '@/components/aviator/LiveBetsPanel';
import StatisticsPanel from '@/components/aviator/StatisticsPanel';
import BettingHistory from '@/components/aviator/BettingHistory';
import LiveChat from '@/components/aviator/LiveChat';
import DualBettingControls from '@/components/aviator/DualBettingControls';
import GameStats from '@/components/aviator/GameStats';
import { useAviator } from '@/hooks/useAviator';
import { useAviatorRealtime } from '@/hooks/useAviatorRealtime';
import { useGameManagement } from '@/hooks/useGameManagement';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export type GameState = 'betting' | 'flying' | 'crashed' | 'cashed_out';

export interface GameData {
  multiplier: number;
  crashPoint: number;
  betAmount: number;
  balance: number;
  profit: number;
  isPlaying: boolean;
  gameState: GameState;
  autoCashOut: number | null;
  crashHistory: number[];
  hasBet: boolean;
  currentBet: number;
}

const Aviator = () => {
  const { user } = useAuth();
  const { isGamePaused } = useGameManagement();
  const {
    currentRound,
    userBet,
    recentRounds,
    currentMultiplier,
    setCurrentMultiplier,
    balance,
    placeBet,
    cashOut
  } = useAviator();

  const {
    messages,
    liveBets,
    connectedUsers,
    sendMessage
  } = useAviatorRealtime();
  
  const gameIsPaused = isGamePaused('aviator');
  
  const [gameData, setGameData] = useState<GameData>({
    multiplier: 1.0,
    crashPoint: 0,
    betAmount: 100,
    balance: 0,
    profit: 0,
    isPlaying: false,
    gameState: 'betting',
    autoCashOut: null,
    crashHistory: [],
    hasBet: false,
    currentBet: 0
  });

  const [bettingCountdown, setBettingCountdown] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Update balance from wallet
  useEffect(() => {
    setGameData(prev => ({ ...prev, balance }));
  }, [balance]);

  // Update crash history from recent rounds
  useEffect(() => {
    if (recentRounds) {
      const history = recentRounds.map(round => round.crash_multiplier);
      setGameData(prev => ({ ...prev, crashHistory: history }));
    }
  }, [recentRounds]);

  // Handle current round changes
  useEffect(() => {
    if (!currentRound) return;

    const now = Date.now();
    const betEndTime = new Date(currentRound.bet_end_time).getTime();
    const timeLeft = Math.max(0, Math.floor((betEndTime - now) / 1000));

    if (currentRound.status === 'betting') {
      setGameData(prev => ({
        ...prev,
        gameState: 'betting',
        multiplier: 1.0,
        crashPoint: currentRound.crash_multiplier,
        isPlaying: false
      }));
      setBettingCountdown(timeLeft);
    } else if (currentRound.status === 'flying') {
      setGameData(prev => ({
        ...prev,
        gameState: 'flying',
        crashPoint: currentRound.crash_multiplier,
        isPlaying: !!userBet && userBet.status === 'active'
      }));
      setBettingCountdown(0);
      startFlyingAnimation();
    } else if (currentRound.status === 'crashed') {
      setGameData(prev => ({
        ...prev,
        gameState: 'crashed',
        multiplier: currentRound.crash_multiplier,
        isPlaying: false
      }));
      stopAnimation();
    }
  }, [currentRound, userBet]);

  // Handle user bet changes
  useEffect(() => {
    if (userBet) {
      setGameData(prev => ({
        ...prev,
        hasBet: true,
        currentBet: userBet.bet_amount,
        autoCashOut: userBet.auto_cashout_multiplier || null
      }));
    } else {
      setGameData(prev => ({
        ...prev,
        hasBet: false,
        currentBet: 0,
        autoCashOut: null
      }));
    }
  }, [userBet]);

  // Betting countdown
  useEffect(() => {
    if (bettingCountdown > 0 && currentRound?.status === 'betting') {
      const timer = setInterval(() => {
        setBettingCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [bettingCountdown, currentRound?.status]);

  const stopAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const startFlyingAnimation = useCallback(() => {
    stopAnimation();
    
    const startTime = Date.now();
    const crashAt = gameData.crashPoint;
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newMultiplier = 1 + (elapsed * 0.1);
      
      setCurrentMultiplier(newMultiplier);
      setGameData(prev => {
        // Check if crashed
        if (newMultiplier >= crashAt) {
          stopAnimation();
          
          if (prev.hasBet && prev.isPlaying) {
            toast({
              title: "Crashed!",
              description: `The plane crashed at ${crashAt.toFixed(2)}x`,
              variant: "destructive"
            });
          }
          
          return {
            ...prev,
            multiplier: crashAt,
            isPlaying: false,
            gameState: 'crashed'
          };
        }
        
        // Check auto cash out
        if (prev.autoCashOut && newMultiplier >= prev.autoCashOut && prev.isPlaying && userBet) {
          cashOut({
            betId: userBet.id,
            currentMultiplier: newMultiplier
          });
          
          return {
            ...prev,
            multiplier: newMultiplier,
            isPlaying: false,
            gameState: 'cashed_out'
          };
        }
        
        return { ...prev, multiplier: newMultiplier };
      });
      
      if (newMultiplier < crashAt) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [gameData.crashPoint, userBet, cashOut, setCurrentMultiplier, stopAnimation]);

  const handlePlaceBet = useCallback((betIndex: number, amount: number, autoCashout?: number) => {
    if (!currentRound || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place bets",
        variant: "destructive"
      });
      return;
    }

    if (currentRound.status !== 'betting') {
      toast({
        title: "Betting Closed",
        description: "You can only bet before the plane takes off!",
        variant: "destructive"
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "Your bet amount exceeds your balance.",
        variant: "destructive"
      });
      return;
    }

    if (userBet) {
      toast({
        title: "Bet Already Placed",
        description: "You have already placed a bet for this round.",
        variant: "destructive"
      });
      return;
    }

    placeBet({
      roundId: currentRound.id,
      betAmount: amount,
      autoCashoutMultiplier: autoCashout
    });
  }, [currentRound, user, balance, userBet, placeBet]);

  const handleCashOut = useCallback(() => {
    if (!userBet || gameData.gameState !== 'flying' || !gameData.isPlaying) return;

    cashOut({
      betId: userBet.id,
      currentMultiplier: gameData.multiplier
    });
  }, [userBet, gameData.gameState, gameData.isPlaying, gameData.multiplier, cashOut]);

  // Auto-manage rounds periodically
  useEffect(() => {
    const manageRounds = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        await fetch('https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/aviator-game-manager?action=auto_manage', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW9qaWhncGVlaHZwd2VqZXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0NTEsImV4cCI6MjA2ODU5OTQ1MX0.izGAao4U7k8gn4UIb7kgPs-w1ZEg0GzmAhkZ_Ff_Oxk',
          }
        });
      } catch (error) {
        console.error('Auto-manage error:', error);
      }
    };

    // Initial call
    manageRounds();
    
    // Call every 3 seconds
    const interval = setInterval(manageRounds, 3000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gaming-dark">
        <Navigation />
        <div className="container mx-auto p-4 pt-20">
          <Alert className="bg-gaming-gray/50 border-gaming-accent">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to play Aviator
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <Navigation />
      
      <div className="container mx-auto p-4 pt-20">
        {gameIsPaused && (
          <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-500">
              Game is currently paused by admin
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Panel - Live Bets & Stats */}
          <div className="lg:col-span-2 space-y-4">
            <LiveBetsPanel 
              liveBets={liveBets}
              totalPlayers={connectedUsers}
              totalBetsAmount={liveBets.filter(b => b.status === 'active').reduce((sum, b) => sum + b.bet_amount, 0)}
            />
            <StatisticsPanel
              recentRounds={recentRounds?.map(r => ({ multiplier: r.crash_multiplier, id: r.id })) || []}
              userStats={{
                totalBets: 0,
                totalWins: 0,
                totalLosses: 0,
                biggestWin: 0,
                biggestMultiplier: 0,
                averageCashout: 0,
                currentStreak: 0,
                bestStreak: 0
              }}
              liveStats={{
                last24hVolume: 0,
                last24hPlayers: connectedUsers,
                currentRoundNumber: currentRound?.round_number || 0
              }}
            />
          </div>

          {/* Center - Game Interface */}
          <div className="lg:col-span-8 space-y-4">
            <EnhancedGameInterface
              gameData={gameData}
              bettingCountdown={bettingCountdown}
              onCashOut={handleCashOut}
            />
            
            <DualBettingControls
              gameData={gameData}
              setGameData={setGameData}
              onPlaceBet={handlePlaceBet}
              bettingCountdown={bettingCountdown}
              isPlacingBet={false}
              disabled={gameData.gameState !== 'betting'}
            />
            
            <BettingHistory bets={[]} />
          </div>

          {/* Right Panel - Live Chat */}
          <div className="lg:col-span-2">
            <LiveChat
              messages={messages}
              onSendMessage={sendMessage}
            />
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="mt-6">
          <GameStats
            gameData={gameData}
          />
        </div>
      </div>
    </div>
  );
};

export default Aviator;