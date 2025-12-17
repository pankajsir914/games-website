import React from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

interface PremiumDiceComponentProps {
  value: number;
  isRolling: boolean;
  onClick: () => void;
  canRoll: boolean;
}

const PremiumDiceComponent: React.FC<PremiumDiceComponentProps> = ({
  value,
  isRolling,
  onClick,
  canRoll
}) => {
  const getDiceIcon = (diceValue: number) => {
    const icons = { 1: Dice1, 2: Dice2, 3: Dice3, 4: Dice4, 5: Dice5, 6: Dice6 };
    const Icon = icons[diceValue as keyof typeof icons] || Dice1;
    return <Icon className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-lg" />;
  };

  return (
    <div
      onClick={canRoll ? onClick : undefined}
      className={`
        relative w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-dice transition-all duration-300
        ${canRoll 
          ? 'cursor-pointer hover:scale-110 hover:shadow-ludo-board bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600' 
          : 'cursor-not-allowed bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600'
        }
        ${isRolling ? 'animate-dice-roll' : ''}
        border-3 border-white/50 backdrop-blur-sm
        flex items-center justify-center
      `}
    >
      {/* Dice glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
      
      {/* Dice icon */}
      <div className={`relative z-10 ${isRolling ? 'animate-spin' : ''}`}>
        {getDiceIcon(value)}
      </div>
      
      {/* Roll indicator */}
      {canRoll && !isRolling && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="px-2 py-1 bg-gaming-gold text-black text-xs font-bold rounded-full animate-bounce">
            ROLL
          </div>
        </div>
      )}
      
      {/* Rolling effect */}
      {isRolling && (
        <div className="absolute inset-0 border-4 border-gaming-gold rounded-2xl animate-ping"></div>
      )}
      
      {/* Dice value indicator */}
      <div className="absolute -top-2 -right-2">
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg">
          {value}
        </div>
      </div>
    </div>
  );
};

export default PremiumDiceComponent;