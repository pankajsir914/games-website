import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameSounds } from '@/hooks/useGameSounds';

interface WinnerCelebrationProps {
  show: boolean;
  winningColor: 'red' | 'green' | 'violet';
  amount?: number;
  onClose: () => void;
}

const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({
  show,
  winningColor,
  amount,
  onClose
}) => {
  const { playWin } = useGameSounds();

  useEffect(() => {
    if (show) {
      playWin();
      
      // Fire confetti
      const colors = {
        red: ['#ef4444', '#dc2626', '#b91c1c'],
        green: ['#10b981', '#059669', '#047857'],
        violet: ['#8b5cf6', '#7c3aed', '#6d28d9']
      };

      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          setTimeout(onClose, 1000);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: colors[winningColor]
        });
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: colors[winningColor]
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [show, winningColor, playWin, onClose]);

  const getColorStyles = () => {
    switch (winningColor) {
      case 'red':
        return 'from-red-500 to-red-600';
      case 'green':
        return 'from-emerald-500 to-emerald-600';
      case 'violet':
        return 'from-purple-500 to-purple-600';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* Winner Content */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative"
          >
            <div className={`bg-gradient-to-br ${getColorStyles()} p-6 sm:p-8 md:p-12 rounded-3xl shadow-2xl`}>
              {/* Trophy Icon */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="flex justify-center mb-4 sm:mb-6"
              >
                <Trophy className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-yellow-400 drop-shadow-lg" />
              </motion.div>

              {/* Winner Text */}
              <motion.h1
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-3 sm:mb-4 uppercase tracking-wider"
              >
                {winningColor} WINS!
              </motion.h1>

              {amount && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <p className="text-white/80 text-base sm:text-lg mb-2">You Won</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-400">₹{amount}</p>
                </motion.div>
              )}

              {/* Decorative Elements */}
              <div className="absolute -top-8 -left-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-16 h-16 text-yellow-400/50" />
                </motion.div>
              </div>
              <div className="absolute -bottom-8 -right-8">
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-16 h-16 text-yellow-400/50" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinnerCelebration;