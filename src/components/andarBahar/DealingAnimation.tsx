import { useEffect, useState } from 'react';
import { Card } from '@/types/andarBahar';
import AnimatedCard from '@/components/game/AnimatedCard';
import { useGameSounds } from '@/hooks/useGameSounds';

interface DealingAnimationProps {
  andarCards: Card[];
  baharCards: Card[];
  isDealing: boolean;
  winningSide?: 'andar' | 'bahar';
  winningCard?: Card;
}

export const DealingAnimation = ({
  andarCards,
  baharCards,
  isDealing,
  winningSide,
  winningCard
}: DealingAnimationProps) => {
  const [visibleAndarCards, setVisibleAndarCards] = useState<Card[]>([]);
  const [visibleBaharCards, setVisibleBaharCards] = useState<Card[]>([]);
  const { playCardFlip } = useGameSounds();
  const [lastDealTime, setLastDealTime] = useState(0);

  useEffect(() => {
    if (!isDealing) {
      // Show all cards immediately when not dealing
      setVisibleAndarCards(andarCards);
      setVisibleBaharCards(baharCards);
      return;
    }

    // Progressive card reveal with realistic timing
    const dealInterval = setInterval(() => {
      const totalVisible = visibleAndarCards.length + visibleBaharCards.length;
      const totalCards = andarCards.length + baharCards.length;

      if (totalVisible < totalCards) {
        const now = Date.now();
        if (now - lastDealTime < 800) return; // Minimum 800ms between cards

        // Determine which side gets the next card
        // First card goes to Bahar (index 0), then alternates
        const isBaharTurn = totalVisible % 2 === 0;
        
        if (isBaharTurn && visibleBaharCards.length < baharCards.length) {
          setVisibleBaharCards(prev => [...prev, baharCards[prev.length]]);
          playCardFlip();
          setLastDealTime(now);
        } else if (!isBaharTurn && visibleAndarCards.length < andarCards.length) {
          setVisibleAndarCards(prev => [...prev, andarCards[prev.length]]);
          playCardFlip();
          setLastDealTime(now);
        }
      }
    }, 100);

    return () => clearInterval(dealInterval);
  }, [isDealing, andarCards, baharCards, visibleAndarCards, visibleBaharCards, playCardFlip, lastDealTime]);

  const isWinningCard = (card: Card, side: 'andar' | 'bahar') => {
    return winningSide === side && winningCard?.rank === card.rank && winningCard?.suit === card.suit;
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Andar Side */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-center text-yellow-400 drop-shadow-lg">
          ANDAR
        </h3>
        <div className="bg-black/30 rounded-lg p-4 min-h-[200px] border-2 border-yellow-600/50">
          <div className="flex flex-wrap gap-2">
            {visibleAndarCards.map((card, index) => (
              <div
                key={`andar-${index}`}
                className={`transform transition-all duration-500 ${
                  isWinningCard(card, 'andar') 
                    ? 'scale-110 ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.8)]' 
                    : ''
                }`}
                style={{
                  animation: `slideInLeft 0.5s ease-out ${index * 0.1}s`,
                  animationFillMode: 'both'
                }}
              >
                <AnimatedCard
                  suit={card.suit}
                  rank={card.rank}
                  size="sm"
                  isFlipped={false}
                />
              </div>
            ))}
          </div>
          {visibleAndarCards.length === 0 && (
            <p className="text-gray-500 text-center mt-8">Cards will appear here</p>
          )}
        </div>
      </div>

      {/* Bahar Side */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-center text-blue-400 drop-shadow-lg">
          BAHAR
        </h3>
        <div className="bg-black/30 rounded-lg p-4 min-h-[200px] border-2 border-blue-600/50">
          <div className="flex flex-wrap gap-2">
            {visibleBaharCards.map((card, index) => (
              <div
                key={`bahar-${index}`}
                className={`transform transition-all duration-500 ${
                  isWinningCard(card, 'bahar') 
                    ? 'scale-110 ring-4 ring-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.8)]' 
                    : ''
                }`}
                style={{
                  animation: `slideInRight 0.5s ease-out ${index * 0.1}s`,
                  animationFillMode: 'both'
                }}
              >
                <AnimatedCard
                  suit={card.suit}
                  rank={card.rank}
                  size="sm"
                  isFlipped={false}
                />
              </div>
            ))}
          </div>
          {visibleBaharCards.length === 0 && (
            <p className="text-gray-500 text-center mt-8">Cards will appear here</p>
          )}
        </div>
      </div>
    </div>
  );
};