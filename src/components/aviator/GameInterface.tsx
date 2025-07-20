
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
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 min-h-[600px] relative overflow-hidden shadow-2xl">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
            <linearGradient id="flightPath" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="hsl(var(--gaming-success))" stopOpacity="0.4"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Flight Path Trail */}
      {gameData.gameState === 'flying' && (
        <svg className="absolute inset-0 w-full h-full">
          <path
            d={`M 10% 85% Q ${position.x * 0.7}% ${position.y + 10}% ${position.x}% ${position.y}%`}
            stroke="url(#flightPath)"
            strokeWidth="4"
            fill="none"
            className="animate-pulse"
            filter="drop-shadow(0 0 8px hsl(var(--primary)))"
          />
        </svg>
      )}

      <div className="relative h-full p-8 flex flex-col">
        {/* Betting Phase */}
        {gameData.gameState === 'betting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="bg-primary/20 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Clock className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-4xl font-bold text-primary mb-4">Place Your Bets!</h2>
              <div className="text-6xl font-bold text-foreground mb-4">{bettingCountdown}</div>
              <p className="text-xl text-muted-foreground">Betting closes in {bettingCountdown} seconds</p>
            </div>
          </div>
        )}

        {/* Multiplier Display */}
        <div className="text-center mb-8">
          <div className={`text-6xl md:text-8xl font-bold transition-all duration-200 ${
            gameData.gameState === 'flying' 
              ? 'text-primary animate-pulse drop-shadow-2xl' 
              : gameData.gameState === 'crashed' 
                ? 'text-gaming-danger' 
                : gameData.gameState === 'cashed_out'
                  ? 'text-gaming-success'
                  : 'text-muted-foreground'
          }`}>
            {gameData.multiplier.toFixed(2)}x
          </div>
          
          {gameData.gameState === 'crashed' && (
            <div className="text-2xl text-gaming-danger font-bold mt-4 animate-bounce">
              💥 Crashed at {gameData.crashPoint.toFixed(2)}x
            </div>
          )}
          
          {gameData.gameState === 'cashed_out' && (
            <div className="text-2xl text-gaming-success font-bold mt-4">
              🎉 Cashed out at {gameData.multiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="flex-1 relative">
          {/* Animated Plane */}
          {(gameData.gameState === 'flying' || gameData.gameState === 'crashed') && (
            <div 
              className={`absolute transition-all duration-200 ${
                gameData.gameState === 'crashed' ? 'animate-spin' : ''
              }`}
              style={{
                left: `${position.x}%`,
                bottom: `${position.y}%`,
                transform: `rotate(${position.rotation}deg)`,
                transformOrigin: 'center',
                filter: gameData.gameState === 'crashed' 
                  ? 'drop-shadow(0 0 20px hsl(var(--gaming-danger)))' 
                  : 'drop-shadow(0 0 15px hsl(var(--primary)))'
              }}
            >
              <div className={`p-4 rounded-full ${
                gameData.gameState === 'crashed' 
                  ? 'bg-gaming-danger/30 text-gaming-danger' 
                  : 'bg-primary/30 text-primary'
              }`}>
                <Plane className="h-10 w-10" />
              </div>
            </div>
          )}

          {/* Speed Indicator */}
          {gameData.gameState === 'flying' && (
            <div className="absolute bottom-8 left-8">
              <div className="flex items-center space-x-3 bg-primary/20 px-6 py-3 rounded-full backdrop-blur-sm border border-primary/30">
                <TrendingUp className="h-6 w-6 text-primary animate-bounce" />
                <span className="text-primary font-bold text-lg">Flying High!</span>
              </div>
            </div>
          )}
        </div>

        {/* Cash Out Button */}
        {gameData.gameState === 'flying' && gameData.isPlaying && (
          <div className="text-center">
            <Button 
              onClick={onCashOut}
              size="lg"
              className="bg-gaming-success hover:bg-gaming-success/90 text-gaming-success-foreground px-16 py-8 text-3xl font-bold shadow-2xl animate-pulse hover:animate-none transition-all duration-300 hover:scale-105"
              style={{
                boxShadow: '0 0 30px hsl(var(--gaming-success)), inset 0 0 20px rgba(255,255,255,0.1)'
              }}
            >
              CASH OUT
              <br />
              <span className="text-xl">
                ₹{(gameData.currentBet * gameData.multiplier).toFixed(2)}
              </span>
            </Button>
          </div>
        )}

        {/* Waiting for next round */}
        {(gameData.gameState === 'crashed' || gameData.gameState === 'cashed_out') && (
          <div className="text-center">
            <div className="bg-secondary/50 px-8 py-4 rounded-full backdrop-blur-sm">
              <p className="text-muted-foreground text-lg">Next round starting soon...</p>
            </div>
          </div>
        )}

        {/* Current Bet Display */}
        {gameData.hasBet && (
          <div className="absolute top-8 right-8">
            <div className="bg-primary/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-primary/30">
              <div className="text-primary font-bold">Your Bet: ₹{gameData.currentBet}</div>
              {gameData.autoCashOut && (
                <div className="text-xs text-muted-foreground">Auto: {gameData.autoCashOut}x</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GameInterface;
