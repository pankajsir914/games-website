import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, TrendingUp, Clock, Zap, Activity, Gauge } from 'lucide-react';
import { GameData } from '@/pages/Aviator';
import { useAviatorSounds } from '@/hooks/useAviatorSounds';
import { cn } from '@/lib/utils';

interface GameInterfaceProps {
  gameData: GameData;
  bettingCountdown: number;
  onCashOut: () => void;
}

const EnhancedGameInterface = ({ gameData, bettingCountdown, onCashOut }: GameInterfaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const prevRotationRef = useRef(0);
  
  const { 
    playJetEngine, 
    playCountdown, 
    playCrash, 
    playCashOut,
    playTakeoff,
    stopJetEngine,
    playFlyingLoop,
    stopFlyingLoop
  } = useAviatorSounds();
  
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, life: number}>>([]);
  const [showCrashEffect, setShowCrashEffect] = useState(false);
  const [multiplierHistory, setMultiplierHistory] = useState<Array<{time: number, multiplier: number}>>([]);
  
  // Graph Grid Component
  const GraphGrid = () => (
    <svg className="absolute inset-0 w-full h-full opacity-20">
      {[...Array(10)].map((_, i) => (
        <line
          key={`h-${i}`}
          x1="0"
          y1={`${i * 10}%`}
          x2="100%"
          y2={`${i * 10}%`}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      {[...Array(10)].map((_, i) => (
        <line
          key={`v-${i}`}
          x1={`${i * 10}%`}
          y1="0"
          x2={`${i * 10}%`}
          y2="100%"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );

  // Axis Labels Component
  const AxisLabels = () => {
    const maxMultiplier = Math.max(gameData.multiplier, 5);
    const multiplierSteps = [1, 2, 3, 5, 10, 20, 50, 100].filter(m => m <= maxMultiplier * 1.2);
    const maxTime = multiplierHistory.length > 0 ? multiplierHistory[multiplierHistory.length - 1].time : 20;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Y-axis labels */}
        <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between py-4">
          {multiplierSteps.reverse().map(mult => (
            <span key={mult} className="text-xs text-white/50 font-mono">{mult}x</span>
          ))}
        </div>
        
        {/* X-axis labels */}
        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-8 text-xs text-white/50 font-mono">
          {[0, Math.floor(maxTime / 4), Math.floor(maxTime / 2), Math.floor(maxTime * 3 / 4), Math.floor(maxTime)].map((sec, idx) => (
            <span key={idx}>{sec}s</span>
          ))}
        </div>
      </div>
    );
  };

  // Calculate plane position from graph curve
  const getPlanePositionFromGraph = () => {
    if (gameData.gameState === 'betting' || multiplierHistory.length < 2) {
      prevRotationRef.current = 0;
      return { x: 5, y: 85, rotation: 0, scale: 1 };
    }
    
    const lastPoint = multiplierHistory[multiplierHistory.length - 1];
    const prevPoint = multiplierHistory[multiplierHistory.length - 2];
    
    // Map time to X-axis (5% to 95%)
    const maxTime = Math.max(lastPoint.time, 10);
    const x = (lastPoint.time / maxTime) * 85 + 5;
    
    // Map multiplier to Y-axis with logarithmic scale
    const maxMultiplier = Math.max(lastPoint.multiplier, 5);
    const y = 85 - (Math.log(lastPoint.multiplier) / Math.log(maxMultiplier)) * 70;
    
    // Calculate rotation based on curve tangent
    const dx = lastPoint.time - prevPoint.time;
    const dy = Math.log(lastPoint.multiplier) - Math.log(prevPoint.multiplier);
    const angle = Math.atan2(-dy * 30, dx) * (180 / Math.PI);
    
    // Smooth rotation interpolation
    const targetRotation = -angle;
    const currentRotation = prevRotationRef.current + (targetRotation - prevRotationRef.current) * 0.2;
    prevRotationRef.current = currentRotation;
    
    const scale = 1 + Math.min(lastPoint.multiplier / 15, 0.5);
    
    return { x, y, rotation: currentRotation, scale };
  };

  // Initialize history with starting points
  useEffect(() => {
    if (gameData.gameState === 'flying' && multiplierHistory.length === 0) {
      setMultiplierHistory([
        { time: 0, multiplier: 1.0 },
        { time: 0.1, multiplier: 1.01 }
      ]);
      startTimeRef.current = Date.now();
    } else if (gameData.gameState === 'betting') {
      setMultiplierHistory([]);
      startTimeRef.current = Date.now();
    }
  }, [gameData.gameState]);

  // Update multiplier history
  useEffect(() => {
    if (gameData.gameState === 'flying' && gameData.multiplier > 1.0) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setMultiplierHistory(prev => {
        const newHistory = [...prev, { time: elapsed, multiplier: gameData.multiplier }];
        return newHistory.slice(-150);
      });
    }
  }, [gameData.multiplier, gameData.gameState]);

  // Draw graph curve on canvas with error handling
  useEffect(() => {
    if (!canvasRef.current || multiplierHistory.length < 2) return;
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2; // Retina display
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
      
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      const maxTime = Math.max(multiplierHistory[multiplierHistory.length - 1].time, 10);
      const maxMultiplier = Math.max(...multiplierHistory.map(p => p.multiplier), 5);
      
      // Draw curve with gradient
      const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
      gradient.addColorStop(0, 'rgba(34, 197, 94, 1)');
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 1)');
      gradient.addColorStop(1, 'rgba(251, 191, 36, 1)');
      
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      multiplierHistory.forEach((point, i) => {
        const x = (point.time / maxTime) * rect.width * 0.85 + rect.width * 0.05;
        const y = rect.height * 0.85 - (Math.log(point.multiplier) / Math.log(maxMultiplier)) * rect.height * 0.7;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Fill area under curve
      const curveEndPoint = multiplierHistory[multiplierHistory.length - 1];
      const curveEndX = (curveEndPoint.time / maxTime) * rect.width * 0.85 + rect.width * 0.05;
      const curveEndY = rect.height * 0.85 - (Math.log(curveEndPoint.multiplier) / Math.log(maxMultiplier)) * rect.height * 0.7;
      
      ctx.lineTo(curveEndX, rect.height * 0.85);
      ctx.lineTo(rect.width * 0.05, rect.height * 0.85);
      ctx.closePath();
      
      const fillGradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      fillGradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
      fillGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
      fillGradient.addColorStop(1, 'rgba(251, 191, 36, 0.1)');
      ctx.fillStyle = fillGradient;
      ctx.shadowBlur = 0;
      ctx.fill();
      
      // Add glow effect at the end point
      const glowGradient = ctx.createRadialGradient(curveEndX, curveEndY, 0, curveEndX, curveEndY, 30);
      glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
      glowGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)');
      glowGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(curveEndX, curveEndY, 30, 0, Math.PI * 2);
      ctx.fill();
    } catch (error) {
      console.error('Canvas drawing error:', error);
    }
  }, [multiplierHistory]);

  // Sound effects management
  useEffect(() => {
    if (gameData.gameState === 'flying') {
      if (gameData.multiplier === 1.0) {
        playTakeoff();
        setTimeout(() => playFlyingLoop(), 800);
      }
    } else {
      stopFlyingLoop();
      stopJetEngine();
    }

    if (gameData.gameState === 'crashed') {
      stopFlyingLoop();
      playCrash();
      setShowCrashEffect(true);
      setTimeout(() => setShowCrashEffect(false), 2000);
    }

    if (gameData.gameState === 'cashed_out') {
      playCashOut();
    }
  }, [gameData.gameState, gameData.multiplier, playTakeoff, playFlyingLoop, stopFlyingLoop, stopJetEngine, playCrash, playCashOut]);

  // Countdown beep
  useEffect(() => {
    if (bettingCountdown > 0 && bettingCountdown <= 3) {
      playCountdown();
    }
  }, [bettingCountdown, playCountdown]);

  // Particle system for trail effect
  useEffect(() => {
    if (gameData.gameState === 'flying') {
      const interval = setInterval(() => {
        const pos = getPlanePositionFromGraph();
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

  const position = getPlanePositionFromGraph();

  // Calculate speed and altitude
  const speed = Math.round((gameData.multiplier - 1) * 500);
  const altitude = Math.round((gameData.multiplier - 1) * 1000);

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 min-h-[350px] sm:min-h-[400px] md:min-h-[500px] relative overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Dynamic Sky Gradient */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: gameData.gameState === 'flying' 
            ? `radial-gradient(ellipse at center, 
                hsl(220, 50%, ${25 - gameData.multiplier * 0.5}%) 0%, 
                hsl(220, 60%, ${30 - gameData.multiplier * 1}%) 40%,
                hsl(220, 70%, ${35 - gameData.multiplier * 1.5}%) 70%,
                hsl(220, 80%, ${40 - gameData.multiplier * 2}%) 100%)`
            : gameData.gameState === 'crashed'
            ? 'radial-gradient(ellipse at center, hsl(0, 60%, 25%) 0%, hsl(0, 70%, 20%) 50%, hsl(0, 80%, 15%) 100%)'
            : 'radial-gradient(ellipse at center, hsl(220, 40%, 20%) 0%, hsl(220, 60%, 30%) 50%, hsl(220, 80%, 40%) 100%)'
        }}
      />
      
      {/* Animated Gradient Overlay */}
      {gameData.gameState === 'flying' && (
        <div 
          className="absolute inset-0 opacity-30 animate-gradient-x"
          style={{
            background: `linear-gradient(90deg, 
              transparent 0%, 
              rgba(59, 130, 246, 0.3) 25%,
              rgba(251, 191, 36, 0.3) 50%,
              rgba(34, 197, 94, 0.3) 75%,
              transparent 100%)`,
            backgroundSize: '200% 100%'
          }}
        />
      )}

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
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            bottom: `${particle.y}%`,
            width: `${4 * particle.life}px`,
            height: `${4 * particle.life}px`,
            opacity: particle.life,
            background: `radial-gradient(circle, 
              rgba(251, 191, 36, ${particle.life}) 0%, 
              rgba(251, 146, 60, ${particle.life * 0.7}) 50%,
              transparent 100%)`,
            filter: 'blur(2px)',
            boxShadow: `0 0 ${10 * particle.life}px rgba(251, 191, 36, ${particle.life * 0.8})`
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
            <div className="text-6xl sm:text-8xl animate-bounce">💥</div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl font-bold text-red-500 animate-pulse">
              CRASHED!
            </div>
          </div>
        </div>
      )}
      
      {/* Crash Message Overlay */}
      {gameData.gameState === 'crashed' && !showCrashEffect && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none bg-black/30 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <div className="text-4xl sm:text-6xl mb-2">💥</div>
            <div className="text-xl sm:text-2xl font-bold text-red-500">CRASHED</div>
            <div className="text-sm sm:text-base text-muted-foreground mt-1">
              at {gameData.multiplier.toFixed(2)}x
            </div>
          </div>
        </div>
      )}

      <div className="relative h-full p-2 sm:p-4 md:p-6 flex flex-col">
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
        <div className="text-center mb-2 sm:mb-4 md:mb-6 relative">
          <div className={cn(
            "text-3xl sm:text-5xl md:text-7xl font-bold transition-all duration-300 tabular-nums relative inline-block",
            gameData.gameState === 'flying' && "animate-pulse",
            gameData.gameState === 'crashed' && "text-red-500 animate-shake",
            gameData.gameState === 'cashed_out' && "text-green-500"
          )}>
            {/* Glow effect behind multiplier */}
            {gameData.gameState === 'flying' && (
              <>
                <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-yellow-400/40 via-orange-400/40 to-red-400/40 animate-pulse -z-10" />
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-yellow-400/30 via-orange-400/30 to-red-400/30 animate-pulse -z-10" />
              </>
            )}
            <span className={cn(
              "relative z-10 drop-shadow-2xl",
              gameData.gameState === 'flying' && "bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent",
              gameData.gameState === 'crashed' && "text-red-400",
              gameData.gameState === 'cashed_out' && "text-green-400"
            )}>
              {gameData.multiplier.toFixed(2)}x
            </span>
            {/* Animated border for flying state */}
            {gameData.gameState === 'flying' && (
              <div className="absolute -inset-2 rounded-lg border-2 border-yellow-400/30 animate-pulse pointer-events-none" />
            )}
          </div>
          
          {/* Speed and Altitude Indicators */}
          {gameData.gameState === 'flying' && (
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 mt-1 sm:mt-2">
              <div className="flex items-center space-x-1.5 bg-black/30 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur">
                <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-xs sm:text-sm">{speed} km/h</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-black/30 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                <span className="text-blue-400 font-bold text-xs sm:text-sm">{altitude}m</span>
              </div>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="flex-1 relative min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
          {/* Graph Grid Background */}
          {gameData.gameState === 'flying' && <GraphGrid />}
          
          {/* Axis Labels */}
          {gameData.gameState === 'flying' && <AxisLabels />}
          
          {/* Canvas for graph curve */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
          
          {/* Enhanced Plane */}
          {(gameData.gameState === 'flying' || gameData.gameState === 'crashed') && (
            <div 
              className={cn(
                "absolute transition-all duration-500 z-20",
                gameData.gameState === 'crashed' && "animate-spin"
              )}
              style={{
                left: `${position.x}%`,
                bottom: `${position.y}%`,
                transform: gameData.gameState === 'crashed' 
                  ? `rotate(180deg) scale(0.5) translateY(20px)`
                  : `rotate(${position.rotation}deg) scale(${position.scale})`,
                transition: gameData.gameState === 'crashed' ? 'all 0.5s ease-out' : 'all 0.1s linear',
              }}
            >
              <div className="relative">
                {/* Plane Glow */}
                <div className={cn(
                  "absolute inset-0 rounded-full blur-xl transition-all duration-300",
                  gameData.gameState === 'crashed'
                    ? "bg-gradient-to-r from-red-500 to-orange-500 opacity-80"
                    : "bg-gradient-to-r from-yellow-400 to-orange-500 opacity-60 animate-pulse"
                )} />
                
                {/* Plane Body */}
                <div className={cn(
                  "relative p-1.5 sm:p-2 md:p-3 rounded-full bg-gradient-to-br transition-all duration-300",
                  gameData.gameState === 'crashed' 
                    ? "from-red-600 to-red-900 border-2 border-red-400 shadow-lg shadow-red-500/50" 
                    : "from-yellow-400 to-orange-500"
                )}>
                  <Plane className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white transition-transform",
                    gameData.gameState === 'crashed' && "rotate-45"
                  )} />
                </div>
                
                {/* Engine Fire Effect */}
                {gameData.gameState === 'flying' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <div className="w-4 h-8 bg-gradient-to-t from-blue-500 via-yellow-400 to-transparent rounded-full animate-flicker" />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-6 bg-gradient-to-t from-orange-500 via-red-400 to-transparent rounded-full animate-flicker" style={{ animationDelay: '0.1s' }} />
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-4 bg-gradient-to-t from-red-500 to-transparent rounded-full animate-flicker" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
                
                {/* Crash Smoke Effect */}
                {gameData.gameState === 'crashed' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="w-8 h-8 bg-gray-600/50 rounded-full blur-md animate-ping" />
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-500/50 rounded-full blur-sm animate-ping" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Cash Out Button */}
        {gameData.gameState === 'flying' && gameData.isPlaying && (
          <div className="text-center mt-2">
            <Button 
              onClick={onCashOut}
              size="lg"
              className="relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 sm:px-10 sm:py-5 md:px-12 md:py-6 text-lg sm:text-xl md:text-2xl font-bold shadow-2xl transition-all duration-300 hover:scale-105 group w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse" />
              <div className="relative flex flex-col items-center">
                <span className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
                  <span>CASH OUT</span>
                </span>
                <span className="text-base sm:text-lg md:text-xl font-bold mt-0.5">
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

<<<<<<< HEAD
export default EnhancedGameInterface;
=======
export default EnhancedGameInterface;
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
