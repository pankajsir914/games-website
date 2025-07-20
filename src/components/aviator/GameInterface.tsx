
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, TrendingUp } from 'lucide-react';
import { GameData } from '@/pages/Aviator';

interface GameInterfaceProps {
  gameData: GameData;
  countdown: number;
  onCashOut: () => void;
}

const GameInterface = ({ gameData, countdown, onCashOut }: GameInterfaceProps) => {
  const getPlanePosition = () => {
    const progress = Math.min((gameData.multiplier - 1) * 10, 80);
    return {
      x: progress,
      y: 80 - progress * 0.8,
      rotation: Math.min(progress * 2, 45)
    };
  };

  const position = getPlanePosition();

  return (
    <Card className="bg-gradient-card border-border min-h-[500px] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Flight Path */}
      {gameData.gameState === 'playing' && (
        <svg className="absolute inset-0 w-full h-full">
          <path
            d={`M 5% 95% Q ${position.x}% ${position.y}% 95% 5%`}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            fill="none"
            className="animate-pulse"
          />
        </svg>
      )}

      <div className="relative h-full p-8 flex flex-col">
        {/* Multiplier Display */}
        <div className="text-center mb-8">
          {countdown > 0 ? (
            <div className="text-6xl md:text-8xl font-bold text-muted-foreground">
              {countdown}
            </div>
          ) : (
            <div className={`text-6xl md:text-8xl font-bold transition-all duration-200 ${
              gameData.gameState === 'playing' 
                ? 'text-primary animate-pulse' 
                : gameData.gameState === 'crashed' 
                  ? 'text-gaming-danger' 
                  : gameData.gameState === 'cashed_out'
                    ? 'text-gaming-success'
                    : 'text-muted-foreground'
            }`}>
              {gameData.multiplier.toFixed(2)}x
            </div>
          )}
          
          {gameData.gameState === 'crashed' && (
            <div className="text-xl text-gaming-danger font-semibold mt-4 animate-bounce">
              Crashed at {gameData.crashPoint.toFixed(2)}x
            </div>
          )}
          
          {gameData.gameState === 'cashed_out' && (
            <div className="text-xl text-gaming-success font-semibold mt-4">
              Cashed out at {gameData.multiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="flex-1 relative">
          {/* Animated Plane */}
          {(gameData.gameState === 'playing' || gameData.gameState === 'crashed') && (
            <div 
              className={`absolute transition-all duration-200 ${
                gameData.gameState === 'crashed' ? 'animate-spin' : ''
              }`}
              style={{
                left: `${position.x}%`,
                bottom: `${position.y}%`,
                transform: `rotate(${position.rotation}deg)`,
                transformOrigin: 'center'
              }}
            >
              <div className={`p-3 rounded-full ${
                gameData.gameState === 'crashed' 
                  ? 'bg-gaming-danger/20 text-gaming-danger' 
                  : 'bg-primary/20 text-primary'
              }`}>
                <Plane className="h-8 w-8" />
              </div>
            </div>
          )}

          {/* Waiting State */}
          {gameData.gameState === 'waiting' && countdown === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-12 w-12 text-primary" />
                </div>
                <p className="text-xl text-muted-foreground">Ready to take off!</p>
              </div>
            </div>
          )}

          {/* Trend Line Visualization */}
          {gameData.gameState === 'playing' && (
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-primary font-semibold">Rising</span>
              </div>
            </div>
          )}
        </div>

        {/* Cash Out Button */}
        {gameData.gameState === 'playing' && (
          <div className="text-center">
            <Button 
              onClick={onCashOut}
              size="lg"
              className="bg-gaming-success hover:bg-gaming-success/90 text-gaming-success-foreground px-12 py-6 text-2xl font-bold shadow-gaming animate-pulse"
            >
              CASH OUT
              <br />
              <span className="text-lg">
                ₹{(gameData.betAmount * gameData.multiplier).toFixed(2)}
              </span>
            </Button>
          </div>
        )}

        {/* Next Round Timer */}
        {countdown > 0 && (
          <div className="text-center">
            <p className="text-muted-foreground">Next round in {countdown} seconds</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GameInterface;
