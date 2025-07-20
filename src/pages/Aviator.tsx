
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import GameInterface from '@/components/aviator/GameInterface';
import GameControls from '@/components/aviator/GameControls';
import GameStats from '@/components/aviator/GameStats';
import { toast } from '@/hooks/use-toast';

export type GameState = 'waiting' | 'playing' | 'crashed' | 'cashed_out';

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
}

const Aviator = () => {
  const [gameData, setGameData] = useState<GameData>({
    multiplier: 1.0,
    crashPoint: 0,
    betAmount: 100,
    balance: 10000,
    profit: 0,
    isPlaying: false,
    gameState: 'waiting',
    autoCashOut: null,
    crashHistory: []
  });

  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random crash point between 1.1x and 100x
  const generateCrashPoint = useCallback(() => {
    const random = Math.random();
    if (random < 0.5) return 1.1 + Math.random() * 1.4; // 50% chance: 1.1x - 2.5x
    if (random < 0.8) return 2.5 + Math.random() * 7.5; // 30% chance: 2.5x - 10x
    return 10 + Math.random() * 90; // 20% chance: 10x - 100x
  }, []);

  const startGame = useCallback(() => {
    if (gameData.betAmount > gameData.balance) {
      toast({
        title: "Insufficient Balance",
        description: "Your bet amount exceeds your balance.",
        variant: "destructive"
      });
      return;
    }

    const crashPoint = generateCrashPoint();
    setGameData(prev => ({
      ...prev,
      crashPoint,
      multiplier: 1.0,
      isPlaying: true,
      gameState: 'playing',
      balance: prev.balance - prev.betAmount
    }));

    // Game loop - increase multiplier every 100ms
    intervalRef.current = setInterval(() => {
      setGameData(prev => {
        const newMultiplier = prev.multiplier + 0.01;
        
        // Check if crashed
        if (newMultiplier >= prev.crashPoint) {
          clearInterval(intervalRef.current!);
          const newHistory = [prev.crashPoint, ...prev.crashHistory.slice(0, 9)];
          
          toast({
            title: "Crashed!",
            description: `The plane crashed at ${prev.crashPoint.toFixed(2)}x`,
            variant: "destructive"
          });

          // Start countdown for next round
          setCountdown(5);
          countdownRef.current = setInterval(() => {
            setCountdown(c => {
              if (c <= 1) {
                clearInterval(countdownRef.current!);
                return 0;
              }
              return c - 1;
            });
          }, 1000);

          return {
            ...prev,
            multiplier: prev.crashPoint,
            isPlaying: false,
            gameState: 'crashed',
            crashHistory: newHistory
          };
        }

        // Check auto cash out
        if (prev.autoCashOut && newMultiplier >= prev.autoCashOut) {
          clearInterval(intervalRef.current!);
          const winAmount = prev.betAmount * newMultiplier;
          
          toast({
            title: "Auto Cash Out!",
            description: `You won ₹${winAmount.toFixed(2)} at ${newMultiplier.toFixed(2)}x`,
            variant: "default"
          });

          // Start countdown for next round
          setCountdown(5);
          countdownRef.current = setInterval(() => {
            setCountdown(c => {
              if (c <= 1) {
                clearInterval(countdownRef.current!);
                return 0;
              }
              return c - 1;
            });
          }, 1000);

          return {
            ...prev,
            multiplier: newMultiplier,
            isPlaying: false,
            gameState: 'cashed_out',
            balance: prev.balance + winAmount,
            profit: prev.profit + (winAmount - prev.betAmount)
          };
        }

        return { ...prev, multiplier: newMultiplier };
      });
    }, 100);
  }, [gameData.betAmount, gameData.balance, generateCrashPoint]);

  const cashOut = useCallback(() => {
    if (gameData.gameState !== 'playing') return;

    clearInterval(intervalRef.current!);
    const winAmount = gameData.betAmount * gameData.multiplier;
    
    setGameData(prev => ({
      ...prev,
      isPlaying: false,
      gameState: 'cashed_out',
      balance: prev.balance + winAmount,
      profit: prev.profit + (winAmount - prev.betAmount)
    }));

    toast({
      title: "Cash Out Successful!",
      description: `You won ₹${winAmount.toFixed(2)} at ${gameData.multiplier.toFixed(2)}x`,
      variant: "default"
    });

    // Start countdown for next round
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [gameData.gameState, gameData.multiplier, gameData.betAmount]);

  const resetGame = useCallback(() => {
    setGameData(prev => ({
      ...prev,
      multiplier: 1.0,
      crashPoint: 0,
      isPlaying: false,
      gameState: 'waiting'
    }));
    setCountdown(0);
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Auto start after countdown
  useEffect(() => {
    if (countdown === 0 && gameData.gameState !== 'waiting' && gameData.gameState !== 'playing') {
      resetGame();
    }
  }, [countdown, gameData.gameState, resetGame]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">Aviator</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Watch the plane fly and cash out before it crashes!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Game Interface - Takes most space */}
            <div className="lg:col-span-3">
              <GameInterface 
                gameData={gameData}
                countdown={countdown}
                onCashOut={cashOut}
              />
            </div>

            {/* Controls and Stats Sidebar */}
            <div className="space-y-6">
              <GameControls
                gameData={gameData}
                setGameData={setGameData}
                onStartGame={startGame}
                onResetGame={resetGame}
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
