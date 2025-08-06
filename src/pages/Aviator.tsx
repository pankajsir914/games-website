import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import GameInterface from '@/components/aviator/GameInterface';
import BettingHistory from '@/components/aviator/BettingHistory';
import LiveChat from '@/components/aviator/LiveChat';
import DualBettingControls from '@/components/aviator/DualBettingControls';
import GameStats from '@/components/aviator/GameStats';
import { useAviator } from '@/hooks/useAviator';
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
    placeBet,
    cashOut,
    isPlacingBet,
    isCashingOut,
    balance
  } = useAviator();
  
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
  const gameStartTimeRef = useRef<number | null>(null);

  // Mock data for betting history and chat
  const [bettingHistory] = useState([
    { id: '1', player: 'Player123', betAmount: 1000, multiplier: 2.45, winAmount: 2450, status: 'win' as const },
    { id: '2', player: 'GamerPro', betAmount: 500, multiplier: 1.23, winAmount: 0, status: 'loss' as const },
    { id: '3', player: 'LuckyStar', betAmount: 2000, multiplier: 5.67, winAmount: 11340, status: 'win' as const },
    { id: '4', player: 'RiskTaker', betAmount: 750, multiplier: 1.08, winAmount: 0, status: 'loss' as const },
    { id: '5', player: 'Winner99', betAmount: 300, multiplier: 3.21, winAmount: 963, status: 'win' as const },
  ]);

  const [currentRoundBets] = useState([
    { id: 'current1', player: 'ActiveUser1', betAmount: 500, multiplier: null, winAmount: 0, status: 'active' as const },
    { id: 'current2', player: 'ActiveUser2', betAmount: 1200, multiplier: null, winAmount: 0, status: 'active' as const },
    { id: 'current3', player: 'ActiveUser3', betAmount: 800, multiplier: null, winAmount: 0, status: 'active' as const },
  ]);

  const [chatMessages] = useState([
    { id: '1', user: 'Player123', message: 'Good luck everyone! 🚀', timestamp: new Date(Date.now() - 60000), type: 'message' as const },
    { id: '2', user: 'GamerPro', message: 'Cashed out at 2.5x!', timestamp: new Date(Date.now() - 45000), type: 'win' as const, multiplier: 2.5, amount: 1250 },
    { id: '3', user: 'System', message: 'Round ended at 1.08x', timestamp: new Date(Date.now() - 30000), type: 'system' as const },
    { id: '4', user: 'LuckyStar', message: 'Next round will be big!', timestamp: new Date(Date.now() - 15000), type: 'message' as const },
  ]);

  const handleSendMessage = (message: string) => {
    // In a real app, this would send the message to the server
    console.log('Sending message:', message);
  };

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
        isPlaying: !!userBet
      }));
      setBettingCountdown(0);
      gameStartTimeRef.current = now;
      startFlyingAnimation();
    } else if (currentRound.status === 'crashed') {
      setGameData(prev => ({
        ...prev,
        gameState: 'crashed',
        multiplier: currentRound.crash_multiplier,
        isPlaying: false
      }));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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

  const startFlyingAnimation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setGameData(prev => {
        const newMultiplier = prev.multiplier + 0.01;
        setCurrentMultiplier(newMultiplier);

        // Check if crashed
        if (newMultiplier >= prev.crashPoint) {
          clearInterval(intervalRef.current!);
          
          // Trigger crash processing
          if (currentRound?.id) {
            supabase.functions.invoke('aviator-game-manager', {
              body: { 
                action: 'crash_round', 
                round_id: currentRound.id 
              }
            });
          }

          if (prev.hasBet && prev.isPlaying) {
            toast({
              title: "Crashed!",
              description: `The plane crashed at ${prev.crashPoint.toFixed(2)}x. You lost ₹${prev.currentBet}`,
              variant: "destructive"
            });
          }

          return {
            ...prev,
            multiplier: prev.crashPoint,
            isPlaying: false,
            gameState: 'crashed'
          };
        }

        // Check auto cash out
        if (prev.autoCashOut && newMultiplier >= prev.autoCashOut && prev.isPlaying && userBet) {
          clearInterval(intervalRef.current!);
          
          // Trigger auto cash out
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
    }, 100);
  }, [currentRound?.id, userBet, cashOut]);

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

    if (amount > gameData.balance) {
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
  }, [currentRound, user, gameData.balance, userBet, placeBet]);

  const handleCashOut = useCallback(() => {
    if (!userBet || gameData.gameState !== 'flying' || !gameData.isPlaying) return;

    cashOut({
      betId: userBet.id,
      currentMultiplier: gameData.multiplier
    });
  }, [userBet, gameData.gameState, gameData.isPlaying, gameData.multiplier, cashOut]);

  // Auto-manage rounds
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

    // Run immediately and then every 5 seconds
    manageRounds();
    const interval = setInterval(manageRounds, 5000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">Aviator</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Please sign in to play Aviator game
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      
      <div className="container-fluid px-2 py-4">
        {/* Game Paused Alert */}
        {gameIsPaused && (
          <Alert variant="destructive" className="mb-4 border-red-500 bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700 dark:text-red-300 font-medium">
              Aviator game is currently paused for maintenance. Please check back later.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Main Game Layout */}
        <div className="grid grid-cols-12 gap-2 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Betting History */}
          <div className="col-span-12 lg:col-span-2 order-2 lg:order-1">
            <BettingHistory 
              bets={bettingHistory}
              currentRoundBets={gameData.gameState === 'betting' ? currentRoundBets : []}
            />
          </div>

          {/* Center - Game Interface */}
          <div className="col-span-12 lg:col-span-8 order-1 lg:order-2">
            <div className="h-full flex flex-col gap-2">
              {/* Game Display */}
              <div className="flex-1">
                <GameInterface 
                  gameData={gameData}
                  bettingCountdown={bettingCountdown}
                  onCashOut={handleCashOut}
                />
              </div>

              {/* Betting Controls */}
              <div className="h-auto">
                <DualBettingControls
                  gameData={gameData}
                  setGameData={setGameData}
                  onPlaceBet={handlePlaceBet}
                  bettingCountdown={bettingCountdown}
                  isPlacingBet={isPlacingBet}
                  disabled={gameIsPaused}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Live Chat */}
          <div className="col-span-12 lg:col-span-2 order-3">
            <LiveChat 
              messages={chatMessages}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>

        {/* Mobile Stats Panel */}
        <div className="lg:hidden mt-4">
          <GameStats gameData={gameData} />
        </div>
      </div>
    </div>
  );
};

export default Aviator;
