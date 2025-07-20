
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
      red: 'bg-red-500 border-red-600',
      yellow: 'bg-yellow-500 border-yellow-600',
      green: 'bg-green-500 border-green-600',
      blue: 'bg-blue-500 border-blue-600'
    };
    return colors[token.player];
  };

  const canInteract = isCurrentPlayer && token.canMove;

  return (
    <div
      className={`
        w-5 h-5 rounded-full border-2 cursor-pointer transition-all duration-200
        ${getTokenColor()}
        ${canInteract ? 'hover:scale-110 ring-2 ring-primary' : ''}
        ${token.canMove ? 'animate-pulse' : ''}
      `}
      style={style}
      onClick={canInteract ? onClick : undefined}
      title={`${token.player} token ${token.id.split('-')[1]}`}
    />
  );
};

export default TokenComponent;
