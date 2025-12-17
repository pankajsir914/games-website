
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, TrendingUp, Clock } from 'lucide-react';
import { GameData } from '@/pages/Aviator';

interface GameInterfaceProps {
  gameData: GameData;
  bettingCountdown: number;
  onCashOut: () => void;
}

const GameInterface = ({ gameData, bettingCountdown, onCashOut }: GameInterfaceProps) => {
  const getPlanePosition = () => {
    if (gameData.gameState === 'betting') {
      return { x: 10, y: 85, rotation: 0 };
    }
    
    const progress = Math.min((gameData.multiplier - 1) * 8, 75);
    return {
      x: 10 + progress,
      y: 85 - progress * 0.9,
      rotation: Math.min(progress * 1.5, 35)
    };
  };

  const position = getPlanePosition();

  return (
    <Card className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border-slate-700/50 min-h-[400px] md:min-h-[600px] relative overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.4"/>
              </pattern>
              <linearGradient id="flightPath" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                <stop offset="50%" stopColor="hsl(var(--gaming-success))" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="hsl(var(--gaming-gold))" stopOpacity="0.4"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-800/20"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse`}
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${60 + (i * 5)}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2 + (i * 0.3)}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Enhanced Flight Path Trail */}
      {gameData.gameState === 'flying' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path
            d={`M 10% 85% Q ${position.x * 0.7}% ${position.y + 10}% ${position.x}% ${position.y}%`}
            stroke="url(#flightPath)"
            strokeWidth="6"
            fill="none"
            className="animate-pulse"
            filter="url(#glow)"
            strokeLinecap="round"
          />
          {/* Secondary glow trail */}
          <path
            d={`M 10% 85% Q ${position.x * 0.7}% ${position.y + 10}% ${position.x}% ${position.y}%`}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      )}

      <div className="relative h-full p-4 sm:p-6 md:p-8 flex flex-col">
        {/* Betting Phase Overlay */}
        {gameData.gameState === 'betting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-md z-10 rounded-lg">
            <div className="text-center px-4">
              <div className="bg-primary/20 w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse border-2 border-primary/30">
                <Clock className="h-10 w-10 sm:h-16 sm:w-16 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 sm:mb-4">Place Your Bets!</h2>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-3 sm:mb-4 tabular-nums">{bettingCountdown}</div>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">Betting closes in {bettingCountdown} seconds</p>
            </div>
          </div>
        )}

        {/* Enhanced Multiplier Display */}
        <div className="text-center mb-6 md:mb-8">
          <div className={`text-4xl sm:text-6xl md:text-8xl font-bold transition-all duration-300 tabular-nums ${
            gameData.gameState === 'flying' 
              ? 'text-primary animate-pulse drop-shadow-2xl scale-110' 
              : gameData.gameState === 'crashed' 
                ? 'text-gaming-danger scale-95' 
                : gameData.gameState === 'cashed_out'
                  ? 'text-gaming-success scale-105'
                  : 'text-muted-foreground'
          }`} style={{
            textShadow: gameData.gameState === 'flying' 
              ? '0 0 30px hsl(var(--primary)), 0 0 60px hsl(var(--primary))' 
              : 'none',
            filter: gameData.gameState === 'flying' ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
          }}>
            {gameData.multiplier.toFixed(2)}x
          </div>
          
          {gameData.gameState === 'crashed' && (
            <div className="text-lg sm:text-xl md:text-2xl text-gaming-danger font-bold mt-4 animate-bounce">
              💥 Crashed at {gameData.crashPoint.toFixed(2)}x
            </div>
          )}
          
          {gameData.gameState === 'cashed_out' && (
            <div className="text-lg sm:text-xl md:text-2xl text-gaming-success font-bold mt-4 animate-pulse">
              🎉 Cashed out at {gameData.multiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Enhanced Game Area */}
        <div className="flex-1 relative min-h-[200px] md:min-h-[300px]">
          {/* Enhanced Animated Plane */}
          {(gameData.gameState === 'flying' || gameData.gameState === 'crashed') && (
            <div 
              className={`absolute transition-all duration-300 z-10 ${
                gameData.gameState === 'crashed' ? 'animate-spin' : ''
              }`}
              style={{
                left: `${position.x}%`,
                bottom: `${position.y}%`,
                transform: `rotate(${position.rotation}deg) ${gameData.gameState === 'crashed' ? 'scale(0.8)' : 'scale(1)'}`,
                transformOrigin: 'center',
                filter: gameData.gameState === 'crashed' 
                  ? 'drop-shadow(0 0 20px hsl(var(--gaming-danger))) hue-rotate(0deg)' 
                  : 'drop-shadow(0 0 15px hsl(var(--primary))) drop-shadow(0 0 30px hsl(var(--primary)))'
              }}
            >
              <div className={`p-3 sm:p-4 rounded-full transition-all duration-300 ${
                gameData.gameState === 'crashed' 
                  ? 'bg-gaming-danger/30 text-gaming-danger border-2 border-gaming-danger/50' 
                  : 'bg-primary/30 text-primary border-2 border-primary/50 animate-pulse'
              }`}>
                <Plane className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
              </div>
              
              {/* Plane Trail Effect */}
              {gameData.gameState === 'flying' && (
                <div className="absolute -top-1 -left-1 w-full h-full">
                  <div className="w-full h-full bg-primary/10 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Speed Indicator */}
          {gameData.gameState === 'flying' && (
            <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-4 sm:left-6 md:left-8">
              <div className="flex items-center space-x-2 sm:space-x-3 bg-primary/20 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full backdrop-blur-sm border border-primary/30 shadow-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary animate-bounce" />
                <span className="text-primary font-bold text-sm sm:text-base md:text-lg">Flying High!</span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Cash Out Button */}
        {gameData.gameState === 'flying' && gameData.isPlaying && (
          <div className="text-center mt-4 md:mt-0">
            <Button 
              onClick={onCashOut}
              size="lg"
              className="bg-gaming-success hover:bg-gaming-success/90 text-gaming-success-foreground px-8 sm:px-12 md:px-16 py-4 sm:py-6 md:py-8 text-xl sm:text-2xl md:text-3xl font-bold shadow-2xl animate-pulse hover:animate-none transition-all duration-300 hover:scale-105 border-2 border-gaming-success/30"
              style={{
                boxShadow: '0 0 30px hsl(var(--gaming-success)), inset 0 0 20px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              <div className="flex flex-col items-center">
                <span>CASH OUT</span>
                <span className="text-base sm:text-lg md:text-xl font-semibold">
                  ₹{(gameData.currentBet * gameData.multiplier).toFixed(2)}
                </span>
              </div>
            </Button>
          </div>
        )}

        {/* Enhanced Waiting Message */}
        {(gameData.gameState === 'crashed' || gameData.gameState === 'cashed_out') && (
          <div className="text-center mt-4 md:mt-0">
            <div className="bg-secondary/50 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-full backdrop-blur-sm border border-secondary/30 shadow-lg">
              <p className="text-muted-foreground text-base sm:text-lg">Next round starting soon...</p>
            </div>
          </div>
        )}

        {/* Enhanced Current Bet Display */}
        {gameData.hasBet && (
          <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 z-20">
            <div className="bg-primary/20 px-3 sm:px-4 py-2 sm:py-3 rounded-lg backdrop-blur-sm border border-primary/30 shadow-lg">
              <div className="text-primary font-bold text-sm sm:text-base">Your Bet: ₹{gameData.currentBet}</div>
              {gameData.autoCashOut && (
                <div className="text-xs sm:text-sm text-muted-foreground">Auto: {gameData.autoCashOut}x</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GameInterface;
