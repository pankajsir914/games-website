import React, { useState, useEffect } from 'react';
import { useGameSounds } from '@/hooks/useGameSounds';

interface AnimatedDiceProps {
  value: number;
  isRolling: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const AnimatedDice: React.FC<AnimatedDiceProps> = ({ 
  value, 
  isRolling, 
  size = 'md',
  color = 'from-red-500 to-red-700'
}) => {
  const [currentFace, setCurrentFace] = useState(value);
  const { playDiceRoll } = useGameSounds();

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  useEffect(() => {
    if (isRolling) {
      playDiceRoll();
      const interval = setInterval(() => {
        setCurrentFace(Math.floor(Math.random() * 6) + 1);
      }, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        setCurrentFace(value);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isRolling, value, playDiceRoll]);

  const renderDots = () => {
    const dotPositions: { [key: number]: string[] } = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    };

    const positions = dotPositions[currentFace] || [];

    const getPosition = (pos: string) => {
      switch (pos) {
        case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
        case 'top-left': return 'top-2 left-2';
        case 'top-right': return 'top-2 right-2';
        case 'middle-left': return 'top-1/2 left-2 -translate-y-1/2';
        case 'middle-right': return 'top-1/2 right-2 -translate-y-1/2';
        case 'bottom-left': return 'bottom-2 left-2';
        case 'bottom-right': return 'bottom-2 right-2';
        default: return '';
      }
    };

    return positions.map((pos, i) => (
      <div
        key={i}
        className={`absolute w-2 h-2 bg-white rounded-full shadow-inner ${getPosition(pos)}`}
      />
    ));
  };

  return (
    <div className="relative perspective-1000">
      <div
        className={`
          ${sizeClasses[size]}
          relative rounded-lg
          bg-gradient-to-br ${color}
          shadow-xl
          transform transition-all duration-200
          ${isRolling ? 'animate-bounce scale-110' : 'hover:scale-105'}
          border-2 border-white/20
        `}
        style={{
          transform: isRolling ? `rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)` : 'rotateX(0) rotateY(0)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Dice face */}
        <div className="absolute inset-0 rounded-lg bg-white/10 backdrop-blur-sm" />
        
        {/* Dots */}
        {renderDots()}
        
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
      </div>
      
      {/* Shadow */}
      <div 
        className={`
          absolute -bottom-2 left-1/2 -translate-x-1/2
          ${sizeClasses[size]}
          bg-black/20 rounded-full blur-md
          ${isRolling ? 'scale-125' : 'scale-100'}
          transition-transform duration-200
        `}
        style={{ width: '80%', height: '20%' }}
      />
    </div>
  );
};

export default AnimatedDice;