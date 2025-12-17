
import { Card } from '@/types/andarBahar';

interface CardComponentProps {
  card?: Card;
  isJoker?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const CardComponent = ({ card, isJoker = false, size = 'medium', className = '' }: CardComponentProps) => {
  if (!card) {
    return (
      <div className={`
        bg-gray-700 border-2 border-gray-600 rounded-lg flex items-center justify-center
        ${size === 'small' ? 'w-12 h-16' : size === 'large' ? 'w-20 h-28' : 'w-16 h-22'}
        ${className}
      `}>
        <div className="text-gray-400 text-xs">?</div>
      </div>
    );
  }

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥️';
      case 'diamonds': return '♦️';
      case 'clubs': return '♣️';
      case 'spades': return '♠️';
      default: return '';
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-900';
  };

  return (
    <div className={`
      bg-white border-2 rounded-lg flex flex-col items-center justify-center relative shadow-sm
      ${isJoker ? 'border-yellow-400 ring-2 ring-yellow-400 ring-opacity-50 bg-yellow-50' : 'border-gray-300'}
      ${size === 'small' ? 'w-12 h-16 text-xs' : size === 'large' ? 'w-20 h-28 text-lg' : 'w-16 h-20 text-sm'}
      ${className}
    `}>
      {isJoker && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-1 rounded-full font-bold">
          JOKER
        </div>
      )}
      <div className={`font-bold ${getSuitColor(card.suit)}`}>
        {card.rank}
      </div>
      <div className={`text-xl ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>
    </div>
  );
};
