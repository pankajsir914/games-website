import React from 'react';
import { cn } from '@/lib/utils';

interface MultiplierDisplayProps {
  multiplier: number;
  potentialPayout: number;
  isVisible: boolean;
}

export const MultiplierDisplay: React.FC<MultiplierDisplayProps> = ({
  multiplier,
  potentialPayout,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-4 right-4 z-10 animate-multiplier-pop">
      <div className="bg-gradient-to-br from-chicken-gold to-yellow-600 rounded-2xl p-4 shadow-2xl border-2 border-chicken-gold/50">
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-chicken-dark">
            {multiplier.toFixed(2)}x
          </div>
          <div className="text-sm font-semibold text-chicken-dark/80">
            Win: ₹{potentialPayout.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};