
import React from 'react';
import { Card } from '@/components/ui/card';

interface PlayingCardProps {
  card: {
    id: string;
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rank: string;
    isJoker?: boolean;
  };
  isSelected: boolean;
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const PlayingCard: React.FC<PlayingCardProps> = ({ 
  card, 
  isSelected, 
  onClick,
  size = 'medium' 
}) => {
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black';
  };

  const getCardSize = () => {
    switch (size) {
      case 'small': return 'w-12 h-16 text-xs';
      case 'large': return 'w-20 h-28 text-lg';
      default: return 'w-16 h-24 text-sm';
    }
  };

  return (
    <Card
      className={`
        ${getCardSize()}
        bg-white border-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center relative
        ${isSelected ? 'border-blue-500 -translate-y-2 shadow-lg' : 'border-gray-300 hover:border-gray-400'}
        ${card.isJoker ? 'ring-2 ring-yellow-400' : ''}
      `}
      onClick={onClick}
    >
      <div className={`font-bold ${getSuitColor(card.suit)}`}>
        {card.rank}
      </div>
      <div className={`text-xl ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>
      {card.isJoker && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full text-xs flex items-center justify-center text-black font-bold">
          J
        </div>
      )}
    </Card>
  );
};
