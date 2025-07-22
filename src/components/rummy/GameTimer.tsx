
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface GameTimerProps {
  timeLeft: number;
  isActive: boolean;
}

export const GameTimer: React.FC<GameTimerProps> = ({ timeLeft: initialTime, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const getTimerColor = () => {
    if (timeLeft > 30) return 'bg-green-600';
    if (timeLeft > 15) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <Badge className={`${getTimerColor()} text-white flex items-center space-x-1`}>
      <Clock className="h-3 w-3" />
      <span>{timeLeft}s</span>
    </Badge>
  );
};
