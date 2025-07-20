
import React from 'react';
import { GameState } from '@/types/ludo';
import { Crown, Timer } from 'lucide-react';

interface GameHeaderProps {
  gameState: GameState;
}

const GameHeader: React.FC<GameHeaderProps> = ({ gameState }) => {
  const getPlayerColor = () => {
    const colors = {
      red: 'text-red-500',
      yellow: 'text-yellow-500',
      green: 'text-green-500',
      blue: 'text-blue-500'
    };
    return colors[gameState.currentPlayer];
  };

  const getPlayerName = () => {
    return gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1);
  };

  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
        <Crown className="inline-block w-8 h-8 mr-2 text-gaming-gold" />
        Ludo Game
      </h1>
      
      <div className="bg-gradient-card rounded-lg p-6 max-w-md mx-auto border border-border">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Current Turn</div>
            <div className={`text-xl font-bold ${getPlayerColor()}`}>
              {getPlayerName()} Player
            </div>
          </div>
          
          <div className="h-8 w-px bg-border"></div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Last Roll</div>
            <div className="text-xl font-bold text-primary">
              {gameState.lastRoll || '-'}
            </div>
          </div>
          
          {gameState.consecutiveSixes > 0 && (
            <>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Sixes</div>
                <div className="text-xl font-bold text-gaming-success">
                  {gameState.consecutiveSixes}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
