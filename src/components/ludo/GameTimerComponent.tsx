import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface GameTimerComponentProps {
  timeLimit: number; // in seconds
  onTimeUp: () => void;
  isActive: boolean;
  onReset?: () => void;
}

const GameTimerComponent: React.FC<GameTimerComponentProps> = ({
  timeLimit,
  onTimeUp,
  isActive,
  onReset
}) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    if (onReset) {
      setTimeLeft(timeLimit);
    }
  }, [onReset, timeLimit]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeUp]);

  const percentage = (timeLeft / timeLimit) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        {/* Background circle */}
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-300"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
            className={`transition-all duration-1000 ${
              isUrgent ? 'text-red-500 animate-pulse' : 'text-gaming-gold'
            }`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-lg ${isUrgent ? 'text-red-500 animate-bounce' : 'text-gray-700'}`}>
            {timeLeft}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-1 text-sm font-medium">
          <Clock className="w-4 h-4" />
          <span>Turn Timer</span>
        </div>
        <div className={`text-xs ${isUrgent ? 'text-red-500 font-bold' : 'text-gray-600'}`}>
          {isUrgent ? 'Hurry up!' : `${timeLeft}s remaining`}
        </div>
      </div>
    </div>
  );
};

export default GameTimerComponent;