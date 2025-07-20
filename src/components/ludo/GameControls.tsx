
import React from 'react';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/ludo';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Play } from 'lucide-react';

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
    return <Icon className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-lg" />;
  };

  return (
    <div className="flex flex-col items-center space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Dice Display with Glassmorphic Design */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl blur-sm"></div>
          <div className={`
            relative bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 border border-white/30 rounded-2xl p-4 md:p-6
            flex items-center justify-center backdrop-blur-lg shadow-2xl
            ${gameState.isRolling ? 'animate-bounce' : 'hover:scale-105 transition-transform duration-300'}
          `}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20 rounded-xl"></div>
              <div className="relative p-2 md:p-3">
                {getDiceIcon(gameState.diceValue)}
              </div>
            </div>
          </div>
          
          {/* Glowing ring effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 rounded-3xl animate-pulse pointer-events-none"></div>
        </div>
      </div>

      {/* Game Status */}
      <div className="text-center max-w-md px-4">
        {gameState.canRoll ? (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-4 border border-green-400/30">
            <p className="text-green-700 font-semibold text-sm md:text-base mb-2">
              Ready to Roll!
            </p>
            <p className="text-green-600 text-xs md:text-sm">
              Click the button below to roll the dice
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/30">
            <p className="text-blue-700 font-semibold text-sm md:text-base mb-2">
              {gameState.isRolling ? "Rolling dice..." : "Choose Your Move"}
            </p>
            <p className="text-blue-600 text-xs md:text-sm">
              {gameState.isRolling 
                ? "Wait for the dice to land..." 
                : "Click on a glowing token to move it"
              }
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full max-w-md">
        <Button
          onClick={onRollDice}
          disabled={!gameState.canRoll || gameState.isRolling || !!gameState.winner}
          className={`
            flex-1 py-3 md:py-4 px-6 md:px-8 text-base md:text-lg font-bold rounded-2xl
            bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500
            hover:from-emerald-600 hover:via-green-600 hover:to-teal-600
            disabled:from-gray-400 disabled:to-gray-500
            border-2 border-white/20 shadow-2xl backdrop-blur-sm
            transform transition-all duration-300 hover:scale-105 hover:shadow-3xl
            disabled:hover:scale-100 disabled:cursor-not-allowed
          `}
        >
          <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          {gameState.isRolling ? "Rolling..." : "Roll Dice"}
        </Button>
        
        <Button
          onClick={onResetGame}
          variant="outline"
          className={`
            flex-1 sm:flex-none py-3 md:py-4 px-4 md:px-6 text-sm md:text-base font-semibold rounded-2xl
            bg-gradient-to-r from-white/10 to-gray-100/10 backdrop-blur-sm
            border-2 border-gray-300/50 text-gray-700 hover:text-gray-800
            hover:bg-gradient-to-r hover:from-white/20 hover:to-gray-100/20
            transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl
          `}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Game Rules Card */}
      <div className="bg-gradient-to-br from-white/10 via-blue-50/20 to-purple-50/10 backdrop-blur-md rounded-2xl p-4 md:p-6 max-w-2xl border border-white/20 shadow-xl">
        <h3 className="font-bold text-foreground mb-3 text-center text-base md:text-lg">Game Rules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <span>Roll 6 to bring tokens out</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <span>Rolling 6 gives extra turn</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <span>Capture opponents to send them back</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <span>First to get all tokens home wins!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameControls;
