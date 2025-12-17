import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BettingCardsProps {
  selectedColor: string | null;
  onSelectColor: (color: string) => void;
  betAmount: number;
  onSelectAmount: (amount: number) => void;
  onPlaceBet: () => void;
  canBet: boolean;
  isPlacingBet: boolean;
  userBet: any;
}

const BettingCards: React.FC<BettingCardsProps> = ({
  selectedColor,
  onSelectColor,
  betAmount,
  onSelectAmount,
  onPlaceBet,
  canBet,
  isPlacingBet,
  userBet
}) => {
  const colors = [
    { 
      name: 'red', 
      gradient: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/50',
      multiplier: '2x',
      icon: Zap,
      glowColor: 'rgba(239, 68, 68, 0.5)'
    },
    { 
      name: 'green', 
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/50',
      multiplier: '5x',
      icon: Sparkles,
      glowColor: 'rgba(16, 185, 129, 0.5)'
    },
    { 
      name: 'violet', 
      gradient: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/50',
      multiplier: '2x',
      icon: TrendingUp,
      glowColor: 'rgba(139, 92, 246, 0.5)'
    }
  ];

  const betAmounts = [10, 20, 50, 100, 200, 500, 1000, 2000];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Color Selection Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {colors.map((color) => {
          const Icon = color.icon;
          const isSelected = selectedColor === color.name;
          
          return (
            <motion.div
              key={color.name}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectColor(color.name)}
              className="relative cursor-pointer"
            >
              {/* Glow Effect */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-xl sm:rounded-2xl blur-xl"
                  style={{ backgroundColor: color.glowColor }}
                />
              )}
              
              <Card className={cn(
                "relative overflow-hidden border-2 transition-all duration-300",
                isSelected ? "border-white shadow-2xl" : "border-gray-700 hover:border-gray-600",
                color.shadow
              )}>
                <div className={cn(
                  "p-2 sm:p-6 bg-gradient-to-br",
                  color.gradient,
                  "relative z-10"
                )}>
                  {/* 3D Card Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  
                  {/* Content */}
                  <div className="relative z-20 text-white text-center space-y-1 sm:space-y-3">
                    <Icon className="w-5 h-5 sm:w-10 sm:h-10 mx-auto" />
                    <h3 className="text-sm sm:text-2xl font-bold uppercase tracking-wider">
                      {color.name}
                    </h3>
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-[10px] sm:text-sm px-1 sm:px-2">
                      {color.multiplier}
                    </Badge>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center"
                    >
                      <span className="text-black font-bold">✓</span>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Bet Amount Selection */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Select Bet Amount</h3>
        <div className="grid grid-cols-4 gap-2">
          {betAmounts.map((amount) => (
            <motion.div
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={betAmount === amount ? "default" : "outline"}
                onClick={() => onSelectAmount(amount)}
                className={cn(
                  "w-full font-bold text-sm sm:text-base",
                  betAmount === amount 
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black border-yellow-400 shadow-lg shadow-yellow-500/30" 
                    : "border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-yellow-400"
                )}
              >
                ₹{amount}
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Place Bet Button */}
      {userBet ? (
        <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500">
          <div className="text-center space-y-2">
            <p className="text-white font-semibold text-sm sm:text-base">Your Bet</p>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <Badge className={cn(
                "text-white px-3 py-1 sm:px-4 sm:py-2 text-base sm:text-lg",
                userBet.color === 'red' ? 'bg-red-500' :
                userBet.color === 'green' ? 'bg-emerald-500' :
                'bg-purple-500'
              )}>
                {userBet.color.toUpperCase()}
              </Badge>
              <span className="text-xl sm:text-2xl font-bold text-white">₹{userBet.bet_amount}</span>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">Potential Win: ₹{userBet.bet_amount * userBet.multiplier}</p>
          </div>
        </Card>
      ) : (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={onPlaceBet}
            disabled={!canBet || !selectedColor || isPlacingBet}
            className={cn(
              "w-full h-12 text-base sm:h-14 sm:text-lg md:h-16 md:text-xl font-bold shadow-2xl transition-all duration-300",
              canBet && selectedColor
                ? "bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-black hover:from-yellow-400 hover:to-yellow-400 animate-pulse shadow-yellow-500/50"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            {isPlacingBet ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                />
                Placing Bet...
              </span>
            ) : userBet ? (
              "Bet Placed"
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                PLACE BET - ₹{betAmount}
              </span>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default BettingCards;