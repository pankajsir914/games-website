import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameSounds } from '@/hooks/useGameSounds';
import { Trophy, Sparkles } from 'lucide-react';

interface WinnerAnnouncementProps {
  winningSide: 'andar' | 'bahar' | null;
  onComplete?: () => void;
}

export const WinnerAnnouncement = ({ winningSide, onComplete }: WinnerAnnouncementProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { playSound } = useGameSounds();

  useEffect(() => {
    if (winningSide) {
      setIsVisible(true);
      
      // Play win sound
      playSound('win');
      
      // Trigger confetti
      const shootConfetti = () => {
        const colors = winningSide === 'andar' ? ['#fbbf24', '#f59e0b'] : ['#60a5fa', '#3b82f6'];
        
        // Left side
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        
        // Right side
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });
        
        // Center burst
        confetti({
          particleCount: 100,
          origin: { y: 0.6 },
          spread: 180,
          colors
        });
      };
      
      shootConfetti();
      
      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [winningSide, onComplete, playSound]);

  return (
    <AnimatePresence>
      {isVisible && winningSide && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            className="relative"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, -2, 2, 0]
            }}
            transition={{
              duration: 0.5,
              repeat: 3,
              ease: "easeInOut"
            }}
          >
            {/* Background glow */}
            <div className={`absolute inset-0 blur-3xl ${
              winningSide === 'andar' 
                ? 'bg-yellow-400/30' 
                : 'bg-blue-400/30'
            } animate-pulse`} />
            
            {/* Main announcement card */}
            <div className={`relative px-12 py-8 rounded-3xl border-4 ${
              winningSide === 'andar'
                ? 'bg-gradient-to-br from-yellow-400/95 to-amber-500/95 border-yellow-300'
                : 'bg-gradient-to-br from-blue-400/95 to-blue-600/95 border-blue-300'
            } shadow-2xl`}>
              {/* Trophy icon */}
              <motion.div
                className="absolute -top-6 left-1/2 -translate-x-1/2"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="bg-white rounded-full p-3 shadow-xl">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
              </motion.div>
              
              {/* Sparkles decoration */}
              <Sparkles className="absolute top-2 right-2 h-6 w-6 text-white/50 animate-pulse" />
              <Sparkles className="absolute bottom-2 left-2 h-6 w-6 text-white/50 animate-pulse" />
              
              {/* Winner text */}
              <motion.h1
                className="text-5xl font-bold text-white drop-shadow-lg text-center"
                animate={{
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              >
                {winningSide.toUpperCase()} WINS!
              </motion.h1>
              
              {/* Subtitle */}
              <p className="text-white/90 text-center mt-2 text-lg font-semibold">
                Congratulations to all winners!
              </p>
              
              {/* Decorative dots */}
              <div className="flex justify-center gap-2 mt-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-white/70 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.1,
                      repeat: Infinity
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};