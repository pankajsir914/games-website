import { useEffect, useState } from 'react';
import { useGameSounds } from '@/hooks/useGameSounds';
import { cn } from '@/lib/utils';

interface CircularTimerProps {
  timeRemaining: number;
  maxTime?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const CircularTimer = ({ 
  timeRemaining, 
  maxTime = 30,
  size = 'md'
}: CircularTimerProps) => {
  const { playCountdown, playNotification } = useGameSounds();
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false);
  
  const percentage = (timeRemaining / maxTime) * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (percentage > 50) return 'stroke-green-500';
    if (percentage > 25) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };
  
  const getTextColor = () => {
    if (percentage > 50) return 'text-green-500';
    if (percentage > 25) return 'text-yellow-500';
    return 'text-red-500';
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  useEffect(() => {
    if (timeRemaining <= 5 && timeRemaining > 0) {
      playCountdown();
    }
    if (timeRemaining === 0 && !hasPlayedWarning) {
      playNotification();
      setHasPlayedWarning(true);
    }
    if (timeRemaining > 0) {
      setHasPlayedWarning(false);
    }
  }, [timeRemaining, playCountdown, playNotification, hasPlayedWarning]);

  return (
    <div className="relative">
      <svg 
        className={cn(sizeClasses[size], "transform -rotate-90")}
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          strokeWidth="8"
          fill="none"
          className={cn(getColor(), "transition-all duration-300")}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={cn(textSizeClasses[size], getTextColor(), "font-bold transition-colors")}>
            {timeRemaining}
          </div>
          {timeRemaining === 0 && (
            <div className="text-xs text-red-500 animate-pulse">No Bets</div>
          )}
        </div>
      </div>
    </div>
  );
};