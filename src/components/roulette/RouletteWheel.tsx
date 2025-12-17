
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RouletteWheelProps {
  isSpinning: boolean;
  winningNumber?: number;
  onSpinComplete?: () => void;
}

// Roulette numbers in wheel order (European layout)
const wheelNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Red numbers in roulette
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num: number) => {
  if (num === 0) return 'green';
  return redNumbers.includes(num) ? 'red' : 'black';
};

export const RouletteWheel = ({ isSpinning, winningNumber, onSpinComplete }: RouletteWheelProps) => {
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isSpinning && winningNumber !== undefined) {
      setIsAnimating(true);
      
      // Calculate target rotation
      const numberIndex = wheelNumbers.indexOf(winningNumber);
      const sectionAngle = 360 / wheelNumbers.length;
      const targetAngle = (numberIndex * sectionAngle) + (sectionAngle / 2);
      
      // Add multiple full rotations for effect
      const finalRotation = 360 * 5 + (360 - targetAngle);
      
      setRotation(prev => prev + finalRotation);

      // Complete spin after animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onSpinComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isSpinning, winningNumber, onSpinComplete]);

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Wheel Background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-2xl">
        {/* Wheel Numbers */}
        <div
          className={cn(
            "w-full h-full rounded-full relative transition-transform duration-[4000ms] ease-out",
            isAnimating && "animate-spin"
          )}
          style={{
            transform: `rotate(${rotation}deg)`,
            animationDuration: isAnimating ? '4s' : '0s'
          }}
        >
          {wheelNumbers.map((number, index) => {
            const angle = (360 / wheelNumbers.length) * index;
            const color = getNumberColor(number);
            
            return (
              <div
                key={number}
                className="absolute w-6 h-6 flex items-center justify-center text-white text-xs font-bold rounded-full"
                style={{
                  transform: `rotate(${angle}deg) translateY(-140px) rotate(-${angle}deg)`,
                  backgroundColor: color === 'green' ? '#10b981' : color === 'red' ? '#ef4444' : '#1f2937'
                }}
              >
                {number}
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Hub */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full shadow-inner flex items-center justify-center">
        <div className="w-8 h-8 bg-gray-600 rounded-full shadow-inner"></div>
      </div>

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400"></div>
      </div>

      {/* Winning Number Display */}
      {winningNumber !== undefined && !isSpinning && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className={cn(
            "px-6 py-3 rounded-lg text-white font-bold text-xl shadow-lg",
            getNumberColor(winningNumber) === 'green' && "bg-green-500",
            getNumberColor(winningNumber) === 'red' && "bg-red-500",
            getNumberColor(winningNumber) === 'black' && "bg-gray-800"
          )}>
            {winningNumber}
          </div>
        </div>
      )}
    </div>
  );
};
