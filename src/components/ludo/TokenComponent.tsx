
import React from 'react';
import { Token } from '@/types/ludo';

interface TokenComponentProps {
  token: Token;
  onClick: () => void;
  isCurrentPlayer: boolean;
  style?: React.CSSProperties;
}

const TokenComponent: React.FC<TokenComponentProps> = ({ 
  token, 
  onClick, 
  isCurrentPlayer,
  style 
}) => {
  const getTokenColor = () => {
    const colors = {
      red: 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 border-red-700 shadow-red-400/50',
      yellow: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-700 shadow-yellow-400/50',
      green: 'bg-gradient-to-br from-green-400 via-green-500 to-green-600 border-green-700 shadow-green-400/50',
      blue: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 border-blue-700 shadow-blue-400/50'
    };
    return colors[token.player];
  };

  const canInteract = isCurrentPlayer && token.canMove;

  return (
    <div
      className={`
        w-5 h-5 md:w-7 md:h-7 rounded-full border-2 cursor-pointer transition-all duration-300 transform relative
        ${getTokenColor()}
        ${canInteract ? 'hover:scale-125 ring-2 md:ring-4 ring-white/80 ring-offset-1 ring-offset-transparent animate-pulse shadow-2xl' : 'shadow-lg'}
        ${token.canMove ? 'shadow-xl hover:shadow-2xl' : ''}
        backdrop-blur-sm
      `}
      style={style}
      onClick={canInteract ? onClick : undefined}
      title={`${token.player} token ${token.id.split('-')[1]}`}
    >
      {/* 3D Inner highlight */}
      <div className="absolute inset-0.5 md:inset-1 rounded-full bg-gradient-to-t from-transparent via-white/40 to-white/60 pointer-events-none"></div>
      
      {/* Glowing effect for movable tokens */}
      {canInteract && (
        <div className="absolute -inset-1 md:-inset-2 rounded-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-spin-slow pointer-events-none"></div>
      )}
      
      {/* Center dot for better visibility */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 md:w-1.5 md:h-1.5 bg-white/80 rounded-full shadow-sm"></div>
    </div>
  );
};

export default TokenComponent;
