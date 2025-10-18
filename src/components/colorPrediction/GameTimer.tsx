import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GameTimerProps {
  timeLeft: number;
  roundNumber: string;
  status: 'betting' | 'drawing' | 'completed';
  totalBets: number;
  totalPlayers: number;
}

const GameTimer: React.FC<GameTimerProps> = ({
  timeLeft,
  roundNumber,
  status,
  totalBets,
  totalPlayers
}) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = status === 'betting' ? (timeLeft / 30) : 0;
  const strokeDashoffset = circumference - (progress * circumference);
  
  const getTimerColor = () => {
    if (status !== 'betting') return 'text-gray-500';
    if (timeLeft <= 5) return 'text-red-500';
    if (timeLeft <= 10) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const getStrokeColor = () => {
    if (status !== 'betting') return 'stroke-gray-600';
    if (timeLeft <= 5) return 'stroke-red-500';
    if (timeLeft <= 10) return 'stroke-yellow-500';
    return 'stroke-emerald-500';
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] bg-repeat" />
      </div>

      <div className="relative z-10 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Round #{roundNumber}</h2>
            <Badge 
              variant="outline" 
              className={cn(
                "mt-1",
                status === 'betting' ? 'border-emerald-500 text-emerald-400' :
                status === 'drawing' ? 'border-yellow-500 text-yellow-400 animate-pulse' :
                'border-gray-500 text-gray-400'
              )}
            >
              {status === 'betting' ? 'BETTING OPEN' :
               status === 'drawing' ? 'DRAWING...' : 'COMPLETED'}
            </Badge>
          </div>
          
          <div className="text-right">
            <p className="text-xs sm:text-sm text-gray-400">Total Bets</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-white">₹{totalBets.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{totalPlayers} players</p>
          </div>
        </div>

        {/* Timer Circle */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-4 sm:mb-6">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
            {/* Background Circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-700"
            />
            
            {/* Progress Circle */}
            <motion.circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={getStrokeColor()}
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </svg>

          {/* Timer Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {status === 'betting' ? (
              <>
                <motion.div
                  animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  className={cn("text-3xl sm:text-4xl md:text-5xl font-bold", getTimerColor())}
                >
                  {timeLeft}
                </motion.div>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">seconds</p>
                {timeLeft <= 5 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-2 flex items-center gap-1 text-red-400 text-xs"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>Hurry up!</span>
                  </motion.div>
                )}
              </>
            ) : status === 'drawing' ? (
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400 mx-auto mb-2" />
                </motion.div>
                <p className="text-yellow-400 font-semibold">Drawing...</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400">Closed</div>
                <p className="text-gray-500 text-sm mt-1">Wait for next</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              status === 'betting' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'
            )} />
            <span className="text-gray-400 text-sm">Betting</span>
          </div>
          <div className="text-gray-600">→</div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              status === 'drawing' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'
            )} />
            <span className="text-gray-400 text-sm">Drawing</span>
          </div>
          <div className="text-gray-600">→</div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              status === 'completed' ? 'bg-blue-500' : 'bg-gray-600'
            )} />
            <span className="text-gray-400 text-sm">Result</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GameTimer;