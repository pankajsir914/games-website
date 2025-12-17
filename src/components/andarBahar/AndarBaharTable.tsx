import { Card } from '@/types/andarBahar';
import AnimatedCard from '@/components/game/AnimatedCard';
import { useGameSounds } from '@/hooks/useGameSounds';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ShuffleAnimation } from './ShuffleAnimation';
import { WinnerAnnouncement } from './WinnerAnnouncement';

interface AndarBaharTableProps {
  jokerCard?: Card;
  andarCards: Card[];
  baharCards: Card[];
  winningSide?: 'andar' | 'bahar';
  winningCard?: Card;
  isDealing: boolean;
  status?: 'betting' | 'shuffling' | 'dealing' | 'completed';
  roundId?: string;
}

export const AndarBaharTable = ({
  jokerCard,
  andarCards,
  baharCards,
  winningSide,
  winningCard,
  isDealing,
  status = 'betting',
  roundId
}: AndarBaharTableProps) => {
  const { playCardFlip, playWin } = useGameSounds();
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [isShuffling, setIsShuffling] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [showWinner, setShowWinner] = useState(false);
  const lastShuffledRoundRef = useRef<string | null>(null);
  const lastWinnerRoundRef = useRef<string | null>(null);

  // Handle shuffle animation - show once per round when transitioning to dealing
  useEffect(() => {
    if (status === 'dealing' && roundId && roundId !== lastShuffledRoundRef.current && revealedCards.size === 0) {
      lastShuffledRoundRef.current = roundId;
      setIsShuffling(true);
      setShowTable(false);
      
      // After shuffle completes, show table and start dealing
      setTimeout(() => {
        setIsShuffling(false);
        setShowTable(true);
        
        // Start dealing cards after a short delay
        setTimeout(() => {
          const allCards = [...andarCards, ...baharCards];
          allCards.forEach((card, index) => {
            setTimeout(() => {
              setRevealedCards(prev => new Set(prev).add(`${card.suit}-${card.rank}-${index}`));
              playCardFlip();
            }, index * 300);
          });
        }, 500);
      }, 2800);
    } else if (status === 'betting') {
      // Reset state for new round
      setShowTable(true);
      setRevealedCards(new Set());
      setShowWinner(false);
    }
  }, [status, roundId, andarCards, baharCards, playCardFlip, revealedCards.size]);

  // Show winner announcement when game completes
  useEffect(() => {
    if (winningSide && roundId && roundId !== lastWinnerRoundRef.current) {
      lastWinnerRoundRef.current = roundId;
      setShowWinner(true);
      
      // Hide winner announcement after delay
      setTimeout(() => {
        setShowWinner(false);
      }, 5000);
    }
  }, [winningSide, roundId]);

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Shuffle Animation Overlay */}
      <ShuffleAnimation 
        isShuffling={isShuffling} 
        onShuffleComplete={() => setIsShuffling(false)} 
      />
      
      {/* Winner Announcement */}
      <WinnerAnnouncement 
        winningSide={showWinner ? winningSide : null} 
        onComplete={() => setShowWinner(false)}
      />
      
      {/* Table only shows when not shuffling */}
      <div className={cn(
        "transition-opacity duration-500",
        showTable ? "opacity-100" : "opacity-0"
      )}>
        {/* Table Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-green-900 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        </div>

        {/* Golden Border */}
        <div className="absolute inset-0 rounded-3xl border-4 border-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.3)]"></div>

        {/* Table Content */}
        <div className="relative p-8 space-y-8">
          {/* Joker Card Section */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border-2 border-yellow-500">
                <div className="text-center mb-4">
                  <span className="text-yellow-400 font-bold text-xl tracking-wider">JOKER CARD</span>
                </div>
                {jokerCard && (
                  <AnimatedCard
                    suit={jokerCard.suit}
                    rank={jokerCard.rank}
                    isFlipped={false}
                    isHighlighted={true}
                    size="lg"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Andar and Bahar Sections */}
          <div className="grid grid-cols-2 gap-8">
            {/* Andar Section */}
            <div className={cn(
              "relative rounded-2xl border-3 transition-all duration-500",
              winningSide === 'andar' 
                ? "border-yellow-400 shadow-[0_0_40px_rgba(251,191,36,0.6)] bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 animate-pulse" 
                : "border-white/30 bg-black/20"
            )}>
              <div className={cn(
                "absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full shadow-lg transition-all duration-500",
                winningSide === 'andar'
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 scale-110"
                  : "bg-gradient-to-r from-red-600 to-red-700"
              )}>
                <span className={cn(
                  "font-bold text-lg tracking-wider",
                  winningSide === 'andar' ? "text-white animate-bounce" : "text-white"
                )}>
                  ANDAR
                </span>
              </div>
              <div className="p-6 pt-8">
                <div className="grid grid-cols-4 gap-2 min-h-[200px]">
                  {andarCards.map((card, index) => {
                    const cardKey = `${card.suit}-${card.rank}-${index}`;
                    const isWinning = winningSide === 'andar' && winningCard && 
                      winningCard.suit === card.suit && 
                      winningCard.rank === card.rank;
                    return (
                      <div
                        key={cardKey}
                        className={cn(
                          "transform transition-all duration-500 relative",
                          revealedCards.has(cardKey) 
                            ? "translate-y-0 opacity-100" 
                            : "-translate-y-10 opacity-0",
                          isWinning && "scale-110 z-10"
                        )}
                        style={{ transitionDelay: `${index * 100}ms` }}
                      >
                        <AnimatedCard
                          suit={card.suit}
                          rank={card.rank}
                          isFlipped={false}
                          isHighlighted={isWinning}
                          size="sm"
                          delay={index * 0.1}
                        />
                        {isWinning && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-lg animate-pulse pointer-events-none" />
                            <div className="absolute -inset-1 bg-yellow-400/30 blur-xl animate-pulse pointer-events-none" />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bahar Section */}
            <div className={cn(
              "relative rounded-2xl border-3 transition-all duration-500",
              winningSide === 'bahar' 
                ? "border-blue-400 shadow-[0_0_40px_rgba(96,165,250,0.6)] bg-gradient-to-br from-blue-900/30 to-blue-800/30 animate-pulse" 
                : "border-white/30 bg-black/20"
            )}>
              <div className={cn(
                "absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full shadow-lg transition-all duration-500",
                winningSide === 'bahar'
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 scale-110"
                  : "bg-gradient-to-r from-blue-600 to-blue-700"
              )}>
                <span className={cn(
                  "font-bold text-lg tracking-wider",
                  winningSide === 'bahar' ? "text-white animate-bounce" : "text-white"
                )}>
                  BAHAR
                </span>
              </div>
              <div className="p-6 pt-8">
                <div className="grid grid-cols-4 gap-2 min-h-[200px]">
                  {baharCards.map((card, index) => {
                    const cardKey = `${card.suit}-${card.rank}-${index}`;
                    const isWinning = winningSide === 'bahar' && winningCard && 
                      winningCard.suit === card.suit && 
                      winningCard.rank === card.rank;
                    return (
                      <div
                        key={cardKey}
                        className={cn(
                          "transform transition-all duration-500 relative",
                          revealedCards.has(cardKey) 
                            ? "translate-y-0 opacity-100" 
                            : "-translate-y-10 opacity-0",
                          isWinning && "scale-110 z-10"
                        )}
                        style={{ transitionDelay: `${index * 100}ms` }}
                      >
                        <AnimatedCard
                          suit={card.suit}
                          rank={card.rank}
                          isFlipped={false}
                          isHighlighted={isWinning}
                          size="sm"
                          delay={index * 0.1}
                        />
                        {isWinning && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-sky-400/20 rounded-lg animate-pulse pointer-events-none" />
                            <div className="absolute -inset-1 bg-blue-400/30 blur-xl animate-pulse pointer-events-none" />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 text-yellow-500/30 text-6xl">♠</div>
          <div className="absolute top-4 right-4 text-red-500/30 text-6xl">♥</div>
          <div className="absolute bottom-4 left-4 text-red-500/30 text-6xl">♦</div>
          <div className="absolute bottom-4 right-4 text-yellow-500/30 text-6xl">♣</div>
        </div>
      </div>
    </div>
  );
};