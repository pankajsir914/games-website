import React from 'react';
import { Token } from '@/types/ludo';

interface PremiumTokenComponentProps {
  token: Token;
  onClick: () => void;
  isCurrentPlayer: boolean;
  style?: React.CSSProperties;
}

const PremiumTokenComponent: React.FC<PremiumTokenComponentProps> = ({
  token,
  onClick,
  isCurrentPlayer,
  style
}) => {
  const getTokenColor = () => {
    const colorClasses = {
      red: 'bg-gradient-ludo-red border-red-600',
      yellow: 'bg-gradient-ludo-yellow border-yellow-600',
      green: 'bg-gradient-ludo-green border-green-600',
      blue: 'bg-gradient-ludo-blue border-blue-600',
    };
    return colorClasses[token.player as keyof typeof colorClasses] || colorClasses.red;
  };

  const canInteract = isCurrentPlayer && token.canMove;

  return (
    <div
      style={style}
      onClick={canInteract ? onClick : undefined}
      className={`
        w-6 h-6 md:w-8 md:h-8 rounded-full border-2 cursor-pointer transition-all duration-300 shadow-ludo-token
        ${getTokenColor()}
        ${canInteract 
          ? 'hover:scale-125 hover:shadow-ludo-board animate-glow-pulse cursor-pointer transform-gpu' 
          : 'cursor-default'
        }
        ${token.canMove && isCurrentPlayer ? 'animate-pulse' : ''}
        ${token.position === 'home' ? 'animate-celebration' : ''}
        relative overflow-hidden
      `}
    >
      {/* Inner shine effect */}
      <div className="absolute inset-1 bg-white/30 rounded-full"></div>
      
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-white/80 rounded-full shadow-sm"></div>
      </div>
      
      {/* Movable token glow */}
      {canInteract && (
        <div className="absolute -inset-1 bg-white/40 rounded-full animate-ping"></div>
      )}
      
      {/* Token border highlight for current player */}
      {isCurrentPlayer && (
        <div className="absolute -inset-0.5 border-2 border-gaming-gold rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default PremiumTokenComponent;