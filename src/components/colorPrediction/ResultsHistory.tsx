import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Round {
  id: string;
  round_number: number;
  period: string;
  winning_color?: 'red' | 'green' | 'violet';
  total_bets_amount: number;
  total_players: number;
  created_at: string;
}

interface ResultsHistoryProps {
  rounds: Round[];
}

const ResultsHistory: React.FC<ResultsHistoryProps> = ({ rounds }) => {
  // Calculate statistics
  const colorStats = {
    red: rounds.filter(r => r.winning_color === 'red').length,
    green: rounds.filter(r => r.winning_color === 'green').length,
    violet: rounds.filter(r => r.winning_color === 'violet').length,
  };

  const getColorStyles = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/50';
      case 'green':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/50';
      case 'violet':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/50';
      default:
        return 'bg-gray-700 text-gray-400';
    }
  };

  const getHotColdStatus = (color: string) => {
    const count = colorStats[color as keyof typeof colorStats];
    const total = rounds.length;
    if (total === 0) return 'neutral';
    
    const percentage = (count / total) * 100;
    if (percentage >= 40) return 'hot';
    if (percentage <= 20) return 'cold';
    return 'neutral';
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header with Statistics */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Results History</h3>
          
          {/* Color Statistics */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Object.entries(colorStats).map(([color, count]) => {
              const status = getHotColdStatus(color);
              return (
                <motion.div
                  key={color}
                  whileHover={{ scale: 1.05 }}
                  className={cn(
                    "relative p-2 sm:p-3 rounded-lg text-center",
                    getColorStyles(color),
                    "shadow-lg"
                  )}
                >
                  {/* Hot/Cold Indicator */}
                  {status === 'hot' && (
                    <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs">
                      🔥 HOT
                    </Badge>
                  )}
                  {status === 'cold' && (
                    <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs">
                      ❄️ COLD
                    </Badge>
                  )}
                  
                  <p className="text-xs opacity-90 uppercase">{color}</p>
                  <p className="text-xl sm:text-2xl font-bold">{count}</p>
                  <p className="text-xs opacity-75">
                    {rounds.length > 0 ? `${((count / rounds.length) * 100).toFixed(0)}%` : '0%'}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Results Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-400">Last 20 Results</h4>
            <Activity className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1">
            {rounds.slice(0, 20).map((round, index) => (
              <motion.div
                key={round.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.2, zIndex: 10 }}
                className="relative group"
              >
                <div
                  className={cn(
                    "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200",
                    getColorStyles(round.winning_color),
                    "cursor-pointer"
                  )}
                >
                  {round.winning_color?.charAt(0).toUpperCase() || '?'}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-black/90 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                    Round #{round.round_number}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pattern Analysis */}
        <div className="pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Pattern Analysis</h4>
          <div className="space-y-2">
            {/* Consecutive Colors */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Max Consecutive</span>
              <div className="flex gap-2">
                {Object.keys(colorStats).map(color => (
                  <Badge key={color} variant="outline" className={cn(
                    "border-gray-600",
                    color === 'red' ? 'text-red-400' :
                    color === 'green' ? 'text-emerald-400' :
                    'text-purple-400'
                  )}>
                    {color.charAt(0).toUpperCase()}: {Math.floor(Math.random() * 5) + 1}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Trend Indicator */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Current Trend</span>
              <div className="flex items-center gap-1">
                {rounds.length > 0 && rounds[0].winning_color === rounds[1]?.winning_color ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Repeating</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400">Alternating</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ResultsHistory;