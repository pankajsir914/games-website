
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import GameInterface from '@/components/aviator/GameInterface';
import GameControls from '@/components/aviator/GameControls';
import GameStats from '@/components/aviator/GameStats';
import { useAviator } from '@/hooks/useAviator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
              body: null,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            }, {
              query: { action: 'crash_round', round_id: currentRound.id }
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

  const handlePlaceBet = useCallback(() => {
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

    if (gameData.betAmount > gameData.balance) {
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
      betAmount: gameData.betAmount,
      autoCashoutMultiplier: gameData.autoCashOut || undefined
    });
  }, [currentRound, user, gameData.betAmount, gameData.balance, gameData.autoCashOut, userBet, placeBet]);

  const handleCashOut = useCallback(() => {
    if (!userBet || gameData.gameState !== 'flying' || !gameData.isPlaying) return;

    cashOut({
      betId: userBet.id,
      currentMultiplier: gameData.multiplier
    });
  }, [userBet, gameData.gameState, gameData.isPlaying, gameData.multiplier, cashOut]);

  // Auto-manage rounds
  useEffect(() => {
    const manageRounds = () => {
      supabase.functions.invoke('aviator-game-manager', {
        method: 'POST',
        body: null,
      }, {
        query: { action: 'auto_manage' }
      });
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
      <div className="min-h-screen bg-gradient-hero">
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
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-3 sm:mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">Aviator</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
              Watch the plane fly and cash out before it crashes!
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
            {/* Game Interface - Takes most space */}
            <div className="xl:col-span-3 order-1">
              <GameInterface 
                gameData={gameData}
                bettingCountdown={bettingCountdown}
                onCashOut={handleCashOut}
              />
            </div>

            {/* Controls and Stats Sidebar */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6 order-2">
              <GameControls
                gameData={gameData}
                setGameData={setGameData}
                onPlaceBet={handlePlaceBet}
                bettingCountdown={bettingCountdown}
              />
              <div className="hidden sm:block">
                <GameStats gameData={gameData} />
              </div>
            </div>
          </div>

          {/* Mobile Stats - Show below on mobile */}
          <div className="sm:hidden mt-4">
            <GameStats gameData={gameData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aviator;
