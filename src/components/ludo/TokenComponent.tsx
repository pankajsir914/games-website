
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
      red: 'bg-gradient-to-br from-red-400 to-red-600 border-red-700 shadow-red-300',
      yellow: 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-700 shadow-yellow-300',
      green: 'bg-gradient-to-br from-green-400 to-green-600 border-green-700 shadow-green-300',
      blue: 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-700 shadow-blue-300'
    };
    return colors[token.player];
  };

  const canInteract = isCurrentPlayer && token.canMove;

  return (
    <div
      className={`
        w-7 h-7 rounded-full border-3 cursor-pointer transition-all duration-300 transform
        ${getTokenColor()}
        ${canInteract ? 'hover:scale-125 ring-4 ring-white ring-opacity-60 animate-bounce' : ''}
        ${token.canMove ? 'shadow-lg' : 'shadow-md'}
        hover:shadow-xl
      `}
      style={style}
      onClick={canInteract ? onClick : undefined}
      title={`${token.player} token ${token.id.split('-')[1]}`}
    >
      {/* Inner highlight for 3D effect */}
      <div className="w-full h-full rounded-full bg-gradient-to-t from-transparent via-white/30 to-white/50"></div>
    </div>
  );
};

export default TokenComponent;
