
import React from 'react';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/ludo';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw } from 'lucide-react';

interface GameControlsProps {
  gameState: GameState;
  onRollDice: () => void;
  onResetGame: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ 
  gameState, 
  onRollDice, 
  onResetGame 
}) => {
  const getDiceIcon = (value: number) => {
    const icons = {
      1: Dice1,
      2: Dice2,
      3: Dice3,
      4: Dice4,
      5: Dice5,
      6: Dice6
    };
    const Icon = icons[value as keyof typeof icons] || Dice1;
    return <Icon className="w-8 h-8" />;
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Dice Display */}
      <div className="flex items-center space-x-6">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Dice</div>
          <div className={`
            bg-gradient-card border border-border rounded-lg p-4 flex items-center justify-center
            ${gameState.isRolling ? 'animate-spin' : ''}
          `}>
            {getDiceIcon(gameState.diceValue)}
          </div>
        </div>
      </div>

      {/* Game Instructions */}
      <div className="text-center max-w-md">
        {gameState.canRoll ? (
          <p className="text-muted-foreground mb-4">
            Click "Roll Dice" to start your turn
          </p>
        ) : (
          <p className="text-muted-foreground mb-4">
            {gameState.isRolling 
              ? "Rolling dice..." 
              : "Click on a highlighted token to move it"
            }
          </p>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={onRollDice}
          disabled={!gameState.canRoll || gameState.isRolling || !!gameState.winner}
          className="px-8 py-3 text-lg font-medium shadow-gaming"
        >
          {gameState.isRolling ? "Rolling..." : "Roll Dice"}
        </Button>
        
        <Button
          onClick={onResetGame}
          variant="outline"
          className="px-6 py-3"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Game
        </Button>
      </div>

      {/* Game Rules */}
      <div className="bg-secondary/30 rounded-lg p-4 max-w-2xl text-sm text-muted-foreground">
        <h3 className="font-medium text-foreground mb-2">Quick Rules:</h3>
        <ul className="space-y-1 text-xs">
          <li>• Roll 6 to bring a token out of base</li>
          <li>• Rolling 6 gives you another turn</li>
          <li>• Land on opponent's token to send it back to base</li>
          <li>• First player to get all 4 tokens home wins!</li>
        </ul>
      </div>
    </div>
  );
};

export default GameControls;
