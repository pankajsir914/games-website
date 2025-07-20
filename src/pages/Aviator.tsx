
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import GameInterface from '@/components/aviator/GameInterface';
import GameControls from '@/components/aviator/GameControls';
import GameStats from '@/components/aviator/GameStats';
import { toast } from '@/hooks/use-toast';

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
  const [gameData, setGameData] = useState<GameData>({
    multiplier: 1.0,
    crashPoint: 0,
    betAmount: 100,
    balance: 10000,
    profit: 0,
    isPlaying: false,
    gameState: 'betting',
    autoCashOut: null,
    crashHistory: [],
    hasBet: false,
    currentBet: 0
  });

  const [bettingCountdown, setBettingCountdown] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bettingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random crash point between 1.1x and 100x
  const generateCrashPoint = useCallback(() => {
    const random = Math.random();
    if (random < 0.5) return 1.1 + Math.random() * 1.4; // 50% chance: 1.1x - 2.5x
    if (random < 0.8) return 2.5 + Math.random() * 7.5; // 30% chance: 2.5x - 10x
    return 10 + Math.random() * 90; // 20% chance: 10x - 100x
  }, []);

  const placeBet = useCallback(() => {
    if (gameData.gameState !== 'betting') {
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

    if (gameData.hasBet) {
      toast({
        title: "Bet Already Placed",
        description: "You have already placed a bet for this round.",
        variant: "destructive"
      });
      return;
    }

    setGameData(prev => ({
      ...prev,
      hasBet: true,
      currentBet: prev.betAmount,
      balance: prev.balance - prev.betAmount
    }));

    toast({
      title: "Bet Placed",
      description: `₹${gameData.betAmount} bet placed successfully!`,
      variant: "default"
    });
  }, [gameData.betAmount, gameData.balance, gameData.gameState, gameData.hasBet]);

  const startFlyingPhase = useCallback(() => {
    const crashPoint = generateCrashPoint();
    setGameData(prev => ({
      ...prev,
      crashPoint,
      multiplier: 1.0,
      isPlaying: prev.hasBet,
      gameState: 'flying'
    }));

    // Game loop - increase multiplier every 100ms
    intervalRef.current = setInterval(() => {
      setGameData(prev => {
        const newMultiplier = prev.multiplier + 0.01;
        
        // Check if crashed
        if (newMultiplier >= prev.crashPoint) {
          clearInterval(intervalRef.current!);
          const newHistory = [prev.crashPoint, ...prev.crashHistory.slice(0, 9)];
          
          if (prev.hasBet && prev.isPlaying) {
            toast({
              title: "Crashed!",
              description: `The plane crashed at ${prev.crashPoint.toFixed(2)}x. You lost ₹${prev.currentBet}`,
              variant: "destructive"
            });
          }

          // Start new betting round after 3 seconds
          setTimeout(() => {
            startBettingPhase();
          }, 3000);

          return {
            ...prev,
            multiplier: prev.crashPoint,
            isPlaying: false,
            gameState: 'crashed',
            crashHistory: newHistory
          };
        }

        // Check auto cash out
        if (prev.autoCashOut && newMultiplier >= prev.autoCashOut && prev.isPlaying) {
          clearInterval(intervalRef.current!);
          const winAmount = prev.currentBet * newMultiplier;
          
          toast({
            title: "Auto Cash Out!",
            description: `You won ₹${winAmount.toFixed(2)} at ${newMultiplier.toFixed(2)}x`,
            variant: "default"
          });

          // Start new betting round after 3 seconds
          setTimeout(() => {
            startBettingPhase();
          }, 3000);

          return {
            ...prev,
            multiplier: newMultiplier,
            isPlaying: false,
            gameState: 'cashed_out',
            balance: prev.balance + winAmount,
            profit: prev.profit + (winAmount - prev.currentBet)
          };
        }

        return { ...prev, multiplier: newMultiplier };
      });
    }, 100);
  }, [generateCrashPoint]);

  const startBettingPhase = useCallback(() => {
    setGameData(prev => ({
      ...prev,
      multiplier: 1.0,
      crashPoint: 0,
      isPlaying: false,
      gameState: 'betting',
      hasBet: false,
      currentBet: 0
    }));

    setBettingCountdown(5);
    
    bettingIntervalRef.current = setInterval(() => {
      setBettingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(bettingIntervalRef.current!);
          startFlyingPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startFlyingPhase]);

  const cashOut = useCallback(() => {
    if (gameData.gameState !== 'flying' || !gameData.isPlaying) return;

    clearInterval(intervalRef.current!);
    const winAmount = gameData.currentBet * gameData.multiplier;
    
    setGameData(prev => ({
      ...prev,
      isPlaying: false,
      gameState: 'cashed_out',
      balance: prev.balance + winAmount,
      profit: prev.profit + (winAmount - prev.currentBet)
    }));

    toast({
      title: "Cash Out Successful!",
      description: `You won ₹${winAmount.toFixed(2)} at ${gameData.multiplier.toFixed(2)}x`,
      variant: "default"
    });

    // Start new betting round after 3 seconds
    setTimeout(() => {
      startBettingPhase();
    }, 3000);
  }, [gameData.gameState, gameData.multiplier, gameData.currentBet, gameData.isPlaying, startBettingPhase]);

  // Initialize first betting phase
  useEffect(() => {
    startBettingPhase();
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bettingIntervalRef.current) clearInterval(bettingIntervalRef.current);
    };
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bettingIntervalRef.current) clearInterval(bettingIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">Aviator</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Watch the plane fly and cash out before it crashes!
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Game Interface - Takes most space */}
            <div className="xl:col-span-3">
              <GameInterface 
                gameData={gameData}
                bettingCountdown={bettingCountdown}
                onCashOut={cashOut}
              />
            </div>

            {/* Controls and Stats Sidebar */}
            <div className="xl:col-span-2 space-y-6">
              <GameControls
                gameData={gameData}
                setGameData={setGameData}
                onPlaceBet={placeBet}
                bettingCountdown={bettingCountdown}
              />
              <GameStats gameData={gameData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aviator;
