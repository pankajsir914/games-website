import React, { useState } from 'react';
import { useGameSounds } from '@/hooks/useGameSounds';

interface AnimatedCardProps {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  isFlipped?: boolean;
  isHighlighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  delay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  suit,
  rank,
  isFlipped = false,
  isHighlighted = false,
  size = 'md',
  onClick,
  delay = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { playCardFlip } = useGameSounds();

  const sizeClasses = {
    sm: 'w-12 h-16',
    md: 'w-16 h-24',
    lg: 'w-20 h-28'
  };

  const getSuitSymbol = () => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
    }
  };

  const getSuitColor = () => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-900';
  };

  const handleClick = () => {
    if (onClick) {
      playCardFlip();
      onClick();
    }
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        relative perspective-1000 cursor-pointer
        transform transition-all duration-500
        ${isHovered ? 'scale-110 -translate-y-2' : ''}
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}
      `}
      style={{
        animationDelay: `${delay}ms`,
        transformStyle: 'preserve-3d',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Card Front */}
      <div
        className={`
          absolute inset-0 rounded-lg
          bg-gradient-to-br from-white to-gray-100
          shadow-xl border border-gray-300
          flex flex-col items-center justify-center
          backface-hidden
          ${isFlipped ? 'invisible' : 'visible'}
        `}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className={`text-2xl font-bold ${getSuitColor()}`}>
          {rank}
        </div>
        <div className={`text-3xl ${getSuitColor()}`}>
          {getSuitSymbol()}
        </div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-50" />
      </div>

      {/* Card Back */}
      <div
        className={`
          absolute inset-0 rounded-lg
          bg-gradient-to-br from-blue-600 to-purple-700
          shadow-xl border border-purple-800
          flex items-center justify-center
          ${!isFlipped ? 'invisible' : 'visible'}
        `}
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)'
        }}
      >
        {/* Pattern */}
        <div className="absolute inset-2 rounded border-2 border-white/20">
          <div className="absolute inset-0 opacity-20">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-px bg-white/30"
                style={{ top: `${(i + 1) * 16.66}%` }}
              />
            ))}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full w-px bg-white/30"
                style={{ left: `${(i + 1) * 25}%` }}
              />
            ))}
          </div>
        </div>
        
        {/* Center logo */}
        <div className="text-white text-2xl font-bold z-10">♠</div>
      </div>

      {/* Shadow */}
      {isHovered && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/20 rounded-full blur-md" />
      )}
    </div>
  );
};

export default AnimatedCard;