import React from 'react';
import { useGameSounds } from '@/hooks/useGameSounds';

interface ChipStackProps {
  value: number;
  color?: 'red' | 'blue' | 'green' | 'black' | 'purple' | 'yellow';
  count?: number;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ChipStack: React.FC<ChipStackProps> = ({
  value,
  color = 'red',
  count = 1,
  onClick,
  selected = false,
  size = 'md'
}) => {
  const { playChipPlace } = useGameSounds();

  const colorClasses = {
    red: 'from-red-500 to-red-700 border-red-800',
    blue: 'from-blue-500 to-blue-700 border-blue-800',
    green: 'from-green-500 to-green-700 border-green-800',
    black: 'from-gray-700 to-gray-900 border-black',
    purple: 'from-purple-500 to-purple-700 border-purple-800',
    yellow: 'from-yellow-400 to-yellow-600 border-yellow-700'
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-18 h-18 text-base'
  };

  const handleClick = () => {
    if (onClick) {
      playChipPlace();
      onClick();
    }
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${val / 1000000}M`;
    if (val >= 1000) return `${val / 1000}K`;
    return val.toString();
  };

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={handleClick}
    >
      {/* Stack of chips */}
      <div className="relative">
        {[...Array(Math.min(count, 5))].map((_, i) => (
          <div
            key={i}
            className={`
              ${sizeClasses[size]}
              absolute rounded-full
              bg-gradient-to-br ${colorClasses[color]}
              border-2 shadow-lg
              flex items-center justify-center
              transform transition-all duration-200
              ${selected ? 'scale-110' : 'group-hover:scale-105'}
            `}
            style={{
              bottom: `${i * 3}px`,
              zIndex: 5 - i,
              transform: `translateX(${i % 2 === 0 ? -1 : 1}px)`
            }}
          >
            {/* Chip design */}
            <div className="absolute inset-1 rounded-full border-2 border-white/30" />
            <div className="absolute inset-2 rounded-full border border-white/20" />
            
            {/* Value display (only on top chip) */}
            {i === count - 1 && (
              <span className="relative z-10 font-bold text-white drop-shadow-md">
                {formatValue(value)}
              </span>
            )}
            
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Selected glow */}
      {selected && (
        <div className={`
          absolute -inset-2 rounded-full
          bg-gradient-to-r ${colorClasses[color]}
          opacity-30 blur-xl animate-pulse
        `} />
      )}

      {/* Count badge for large stacks */}
      {count > 5 && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {count}x
        </div>
      )}
    </div>
  );
};

export default ChipStack;