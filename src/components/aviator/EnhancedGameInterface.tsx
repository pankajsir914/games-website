import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, TrendingUp, Clock, Zap, Activity, Gauge } from 'lucide-react';
import { GameData } from '@/pages/Aviator';
import { useGameSounds } from '@/hooks/useGameSounds';
import { cn } from '@/lib/utils';

interface GameInterfaceProps {
  gameData: GameData;
  bettingCountdown: number;
  onCashOut: () => void;
}

const EnhancedGameInterface = ({ gameData, bettingCountdown, onCashOut }: GameInterfaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const { 
    playJetEngine, 
    playCountdown, 
    playCrash, 
    playCashOut,
    playTakeoff,
    stopJetEngine 
  } = useGameSounds();
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, life: number}>>([]);
  const [showCrashEffect, setShowCrashEffect] = useState(false);

  // Calculate plane position with bezier curve
  const getPlanePosition = () => {
    if (gameData.gameState === 'betting') {
      return { x: 10, y: 85, rotation: 0, scale: 1 };
    }
    
    const progress = Math.min((gameData.multiplier - 1) * 5, 80);
    const t = progress / 100;
    
    // Bezier curve for smooth trajectory
    const x = 10 + (progress * 1.2);
    const y = 85 - (progress * 0.8) - (Math.sin(t * Math.PI * 2) * 5);
    const rotation = Math.min(progress * 0.8, 45) + (Math.sin(t * Math.PI * 4) * 2);
    const scale = 1 + (progress / 200);
    
    return { x, y, rotation, scale };
  };

  // Sound effects management
  useEffect(() => {
    if (gameData.gameState === 'flying') {
      playJetEngine();
      if (gameData.multiplier === 1.0) {
        playTakeoff();
      }
    } else {
      stopJetEngine();
    }

    if (gameData.gameState === 'crashed') {
      playCrash();
      setShowCrashEffect(true);
      setTimeout(() => setShowCrashEffect(false), 2000);
    }

    if (gameData.gameState === 'cashed_out') {
      playCashOut();
    }

    if (bettingCountdown > 0 && bettingCountdown <= 3) {
      playCountdown();
    }
  }, [gameData.gameState, gameData.multiplier, bettingCountdown]);

  // Particle system for trail effect
  useEffect(() => {
    if (gameData.gameState === 'flying') {
      const interval = setInterval(() => {
        const pos = getPlanePosition();
        setParticles(prev => {
          const newParticles = prev.filter(p => p.life > 0).map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1,
            life: p.life - 0.02
          }));
          
          // Add new particles
          if (newParticles.length < 30) {
            newParticles.push({
              x: pos.x,
              y: pos.y,
              vx: -2 - Math.random() * 2,
              vy: Math.random() * 2 - 1,
              life: 1
            });
          }
          
          return newParticles;
        });
      }, 50);
      
      return () => clearInterval(interval);
    } else {
      setParticles([]);
    }
  }, [gameData.gameState]);

  const position = getPlanePosition();

  // Calculate speed and altitude
  const speed = Math.round((gameData.multiplier - 1) * 500);
  const altitude = Math.round((gameData.multiplier - 1) * 1000);

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 min-h-[400px] sm:min-h-[450px] md:min-h-[500px] lg:min-h-[600px] relative overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Dynamic Sky Gradient */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: gameData.gameState === 'flying' 
            ? `linear-gradient(to top, 
                hsl(220, 40%, ${20 - gameData.multiplier}%) 0%, 
                hsl(220, 60%, ${30 - gameData.multiplier * 2}%) 50%,
                hsl(220, 80%, ${40 - gameData.multiplier * 3}%) 100%)`
            : 'linear-gradient(to top, hsl(220, 40%, 20%) 0%, hsl(220, 60%, 30%) 50%, hsl(220, 80%, 40%) 100%)'
        }}
      />

      {/* Animated Stars */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: gameData.gameState === 'flying' ? 0.8 : 0.3
            }}
          />
        ))}
      </div>

      {/* Clouds */}
      {gameData.gameState === 'flying' && (
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/10 rounded-full blur-xl animate-drift"
              style={{
                width: `${100 + Math.random() * 100}px`,
                height: `${30 + Math.random() * 20}px`,
                left: `${Math.random() * 100}%`,
                top: `${60 + Math.random() * 30}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${15 + i * 5}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Trail Particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
          style={{
            left: `${particle.x}%`,
            bottom: `${particle.y}%`,
            opacity: particle.life,
            transform: `scale(${particle.life})`,
            filter: 'blur(1px)',
            boxShadow: '0 0 10px rgba(251, 191, 36, 0.8)'
          }}
        />
      ))}

      {/* Crash Effect */}
      {showCrashEffect && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="relative">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-explode"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  transform: `rotate(${i * 30}deg) translateX(0)`
                }}
              />
            ))}
            <div className="text-6xl animate-bounce">💥</div>
          </div>
        </div>
      )}

      <div className="relative h-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col">
        {/* Betting Phase Overlay */}
        {gameData.gameState === 'betting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-md z-10 rounded-lg">
            <div className="text-center">
              <div className="relative mb-4 sm:mb-6 md:mb-8">
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-primary/30 flex items-center justify-center mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping" />
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary tabular-nums">
                    {bettingCountdown}
                  </div>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2 sm:mb-4 animate-pulse">
                Place Your Bets!
              </h2>
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="text-base sm:text-lg md:text-xl">Round starting soon...</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Multiplier Display */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className={cn(
            "text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold transition-all duration-300 tabular-nums relative",
            gameData.gameState === 'flying' && "animate-pulse",
            gameData.gameState === 'crashed' && "text-red-500 animate-shake",
            gameData.gameState === 'cashed_out' && "text-green-500"
          )}>
            <span className={cn(
              "relative z-10",
              gameData.gameState === 'flying' && "bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
            )}>
              {gameData.multiplier.toFixed(2)}x
            </span>
            {gameData.gameState === 'flying' && (
              <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 animate-pulse" />
            )}
          </div>
          
          {/* Speed and Altitude Indicators */}
          {gameData.gameState === 'flying' && (
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 md:space-x-6 mt-2 sm:mt-4">
              <div className="flex items-center space-x-2 bg-black/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur">
                <Gauge className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm sm:text-base">{speed} km/h</span>
              </div>
              <div className="flex items-center space-x-2 bg-black/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                <span className="text-blue-400 font-bold text-sm sm:text-base">{altitude}m</span>
              </div>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="flex-1 relative min-h-[300px]">
          {/* Enhanced Plane */}
          {(gameData.gameState === 'flying' || gameData.gameState === 'crashed') && (
            <div 
              className={cn(
                "absolute transition-all duration-300 z-20",
                gameData.gameState === 'crashed' && "animate-fall"
              )}
              style={{
                left: `${position.x}%`,
                bottom: `${position.y}%`,
                transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
              }}
            >
              <div className="relative">
                {/* Plane Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-60 animate-pulse" />
                
                {/* Plane Body */}
                <div className={cn(
                  "relative p-2 sm:p-3 md:p-4 rounded-full bg-gradient-to-br transition-all duration-300",
                  gameData.gameState === 'crashed' 
                    ? "from-red-500 to-red-700" 
                    : "from-yellow-400 to-orange-500"
                )}>
                  <Plane className="h-6 w-6 sm:h-8 sm:h-8 md:h-10 md:w-10 text-white" />
                </div>
                
                {/* Engine Fire Effect */}
                {gameData.gameState === 'flying' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <div className="w-4 h-8 bg-gradient-to-t from-blue-500 via-yellow-400 to-transparent rounded-full animate-flicker" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Multiplier Path Visualization */}
          {gameData.gameState === 'flying' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2"/>
                  <stop offset="50%" stopColor="hsl(var(--gaming-gold))" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="hsl(var(--gaming-success))" stopOpacity="0.8"/>
                </linearGradient>
              </defs>
              <path
                d={`M ${10},${100 - 85} Q ${position.x * 0.7},${100 - (position.y + 10)} ${position.x},${100 - position.y}`}
                stroke="url(#pathGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray="5,5"
                className="animate-dash"
              />
            </svg>
          )}
        </div>

        {/* Enhanced Cash Out Button */}
        {gameData.gameState === 'flying' && gameData.isPlaying && (
          <div className="text-center">
            <Button 
              onClick={onCashOut}
              size="lg"
              className="relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 sm:px-12 sm:py-6 md:px-16 md:py-8 text-xl sm:text-2xl md:text-3xl font-bold shadow-2xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse" />
              <div className="relative flex flex-col items-center">
                <span className="flex items-center space-x-2">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 animate-bounce" />
                  <span>CASH OUT</span>
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-bold mt-1">
                  ₹{(gameData.currentBet * gameData.multiplier).toFixed(2)}
                </span>
              </div>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EnhancedGameInterface;