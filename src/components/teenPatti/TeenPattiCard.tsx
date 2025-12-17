import { Card, CardContent } from '@/components/ui/card';

interface TeenPattiCardData {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number;
}

interface TeenPattiCardProps {
  card: TeenPattiCardData | null;
  size?: 'small' | 'medium' | 'large';
  isVisible: boolean;
}

export function TeenPattiCard({ card, size = 'medium', isVisible }: TeenPattiCardProps) {
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
      case 'small': return 'w-8 h-12 text-xs';
      case 'large': return 'w-20 h-28 text-lg';
      default: return 'w-12 h-16 text-sm';
    }
  };

  if (!isVisible || !card) {
    // Card back
    return (
      <Card className={`${getCardSize()} bg-gradient-to-br from-blue-600 to-purple-600 border-2 border-yellow-400 flex items-center justify-center`}>
        <CardContent className="p-0 flex items-center justify-center h-full">
          <div className="text-yellow-200 font-bold text-center">
            <div className="text-xs">🃏</div>
            <div className="text-xs">TEEN</div>
            <div className="text-xs">PATTI</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${getCardSize()} bg-white border-2 border-gray-300 shadow-lg hover:shadow-xl transition-shadow`}>
      <CardContent className="p-1 h-full flex flex-col justify-between">
        {/* Top left corner */}
        <div className={`${getSuitColor(card.suit)} font-bold leading-none`}>
          <div className="text-center">
            {card.rank}
          </div>
          <div className="text-center -mt-1">
            {getSuitSymbol(card.suit)}
          </div>
        </div>

        {/* Center symbol */}
        <div className={`${getSuitColor(card.suit)} text-center flex-1 flex items-center justify-center`}>
          <span className={size === 'large' ? 'text-4xl' : size === 'small' ? 'text-lg' : 'text-2xl'}>
            {getSuitSymbol(card.suit)}
          </span>
        </div>

        {/* Bottom right corner (rotated) */}
        <div className={`${getSuitColor(card.suit)} font-bold leading-none transform rotate-180 self-end`}>
          <div className="text-center">
            {card.rank}
          </div>
          <div className="text-center -mt-1">
            {getSuitSymbol(card.suit)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}