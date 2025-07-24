
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface GameTimerProps {
  timeRemaining: number;
  status: 'betting' | 'spinning' | 'completed';
  roundNumber?: number;
}

export const GameTimer = ({ timeRemaining, status, roundNumber }: GameTimerProps) => {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'betting':
        return 'Place Your Bets!';
      case 'spinning':
        return 'Spinning...';
      case 'completed':
        return 'Round Complete';
      default:
        return 'Waiting...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'betting':
        return timeRemaining <= 10 ? 'text-red-600' : 'text-green-600';
      case 'spinning':
        return 'text-blue-600';
      case 'completed':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const progressPercentage = status === 'betting' ? (timeRemaining / 30) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="space-y-4">
          {roundNumber && (
            <div className="text-sm text-gray-500">
              Round #{roundNumber}
            </div>
          )}
          
          <div className={cn("text-2xl font-bold", getStatusColor())}>
            {getStatusText()}
          </div>
          
          {status === 'betting' && (
            <>
              <div className={cn(
                "text-4xl font-bold font-mono",
                timeRemaining <= 10 ? "text-red-600 animate-pulse" : "text-gray-800"
              )}>
                {formatTime(displayTime)}
              </div>
              
              <Progress 
                value={progressPercentage} 
                className={cn(
                  "h-3",
                  timeRemaining <= 10 && "animate-pulse"
                )}
              />
              
              <div className="text-sm text-gray-500">
                {timeRemaining <= 10 ? "Hurry! Betting closes soon!" : "Time remaining to place bets"}
              </div>
            </>
          )}
          
          {status === 'spinning' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
