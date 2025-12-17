import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import EnhancedGameInterface from '@/components/aviator/EnhancedGameInterface';
import LiveBetsPanel from '@/components/aviator/LiveBetsPanel';
import StatisticsPanel from '@/components/aviator/StatisticsPanel';
import BettingHistory from '@/components/aviator/BettingHistory';
import LiveChat from '@/components/aviator/LiveChat';
import SingleBettingControls from '@/components/aviator/SingleBettingControls';
import GameStats from '@/components/aviator/GameStats';
import MyBetHistory from '@/components/aviator/MyBetHistory';
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
    cashOut,
    isPlacingBet,
    roundLoading
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
        isPlaying: !!userBet && userBet.status === 'active',
        multiplier: prev.multiplier > 1.0 ? prev.multiplier : 1.0 // Keep existing multiplier if already flying
      }));
      setBettingCountdown(0);
    } else if (currentRound.status === 'crashed') {
      setGameData(prev => ({
        ...prev,
        gameState: 'crashed',
        multiplier: Math.min(currentRound.crash_multiplier, 4.0),
        isPlaying: false
      }));
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

  // Sync currentMultiplier from hook to gameData during flying phase
  useEffect(() => {
    if (currentRound?.status === 'flying' && currentMultiplier > 1.0) {
      setGameData(prev => {
        // Check if we've reached crash point (max 4x)
        const maxCrashPoint = Math.min(currentRound.crash_multiplier, 4.0);
        const hasCrashed = currentMultiplier >= maxCrashPoint;
        
        // Check auto cash out
        if (prev.autoCashOut && currentMultiplier >= prev.autoCashOut && prev.isPlaying && userBet && !hasCrashed) {
          cashOut({
            betId: userBet.id,
            currentMultiplier: currentMultiplier
          });
        }
        
        // If crashed, update game state immediately (max 4x)
        if (hasCrashed && prev.gameState === 'flying') {
          const maxCrashPoint = Math.min(currentRound.crash_multiplier, 4.0);
          return {
            ...prev,
            multiplier: maxCrashPoint,
            gameState: 'crashed',
            isPlaying: false
          };
        }
        
        return {
          ...prev,
          multiplier: Math.min(currentMultiplier, 4.0)
        };
      });
    }
  }, [currentMultiplier, currentRound?.status, currentRound?.crash_multiplier, userBet, cashOut]);

  // Subscribe to backend multiplier broadcasts (as backup)
  useEffect(() => {
    if (!currentRound || currentRound.status !== 'flying') return;
    
    const channel = supabase.channel(`aviator-${currentRound.id}`);
    
    channel
      .on('broadcast', { event: 'multiplier' }, ({ payload }) => {
        const multiplier = payload.multiplier;
        setCurrentMultiplier(multiplier);
        setGameData(prev => {
          // Check auto cash out
          if (prev.autoCashOut && multiplier >= prev.autoCashOut && prev.isPlaying && userBet) {
            cashOut({
              betId: userBet.id,
              currentMultiplier: multiplier
            });
          }
          
          return {
            ...prev,
            multiplier: multiplier
          };
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRound, userBet, setCurrentMultiplier, cashOut]);

  const handlePlaceBet = useCallback((amount: number, autoCashout?: number) => {
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

    if (amount < 10) {
      toast({
        title: "Invalid Bet Amount",
        description: "Minimum bet amount is ₹10.",
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

  if (roundLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark">
        <Navigation />
        <div className="container mx-auto p-4 pt-20">
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-white/70">Connecting to game...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <Navigation />
      
      <div className="container mx-auto px-2 py-2 pt-16 sm:px-4 sm:pt-20 max-w-7xl">
        {gameIsPaused && (
          <Alert className="mb-3 bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-500">
              Game is currently paused by admin
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {/* Game Interface - Full Width */}
          <EnhancedGameInterface
            gameData={gameData}
            bettingCountdown={bettingCountdown}
            onCashOut={handleCashOut}
          />
          
          {/* Betting Controls - Full Width */}
          <SingleBettingControls
            gameData={gameData}
            setGameData={setGameData}
            onPlaceBet={handlePlaceBet}
            bettingCountdown={bettingCountdown}
            isPlacingBet={isPlacingBet}
            disabled={gameData.gameState !== 'betting'}
          />
          
          {/* My Bet History */}
          <MyBetHistory />
          
          {/* Stats Bar */}
          <GameStats
            gameData={gameData}
          />
        </div>
      </div>
    </div>
  );
};

export default Aviator;