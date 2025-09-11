import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '@/components/game/AnimatedCard';
import { useGameSounds } from '@/hooks/useGameSounds';

interface ShuffleAnimationProps {
  isShuffling: boolean;
  onShuffleComplete?: () => void;
}

export const ShuffleAnimation = ({ isShuffling, onShuffleComplete }: ShuffleAnimationProps) => {
  const [shufflePhase, setShufflePhase] = useState<'idle' | 'shuffling' | 'spreading' | 'complete'>('idle');
  const { playSound } = useGameSounds();

  useEffect(() => {
    if (isShuffling) {
      setShufflePhase('shuffling');
      
      // Play shuffle sound
      playSound('shuffle');
      
      // Shuffling phase
      setTimeout(() => {
        setShufflePhase('spreading');
      }, 2000);
      
      // Complete phase
      setTimeout(() => {
        setShufflePhase('complete');
        onShuffleComplete?.();
      }, 2800);
    } else {
      setShufflePhase('idle');
    }
  }, [isShuffling, onShuffleComplete, playSound]);

  const deckCards = Array.from({ length: 8 }, (_, i) => i);

  return (
    <AnimatePresence>
      {isShuffling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
        >
          <div className="relative">
            {/* Main deck container */}
            <motion.div
              className="relative w-32 h-44"
              animate={
                shufflePhase === 'shuffling' 
                  ? {
                      rotateY: [0, 180, 360, 540, 720],
                      scale: [1, 1.1, 1, 1.1, 1],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                ease: "easeInOut",
                times: [0, 0.25, 0.5, 0.75, 1]
              }}
            >
              {deckCards.map((index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    rotateZ: 0,
                    rotateY: 0
                  }}
                  animate={
                    shufflePhase === 'shuffling' 
                      ? {
                          x: [0, Math.random() * 60 - 30, 0],
                          y: [0, Math.random() * 40 - 20, 0],
                          rotateZ: [0, Math.random() * 30 - 15, 0],
                          rotateY: [0, 180, 360]
                        }
                      : shufflePhase === 'spreading'
                      ? {
                          x: (index - 3.5) * 25,
                          y: Math.sin(index) * 10,
                          rotateZ: (index - 3.5) * 5,
                          scale: 0.9
                        }
                      : {}
                  }
                  transition={{
                    duration: shufflePhase === 'shuffling' ? 2 : 0.8,
                    delay: shufflePhase === 'spreading' ? index * 0.05 : 0,
                    ease: "easeInOut"
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                    zIndex: index
                  }}
                >
                  <div className="relative w-full h-full">
                    {/* Card back */}
                    <div className="absolute inset-0">
                      <AnimatedCard
                        isFlipped={true}
                        size="md"
                        suit="hearts"
                        rank="A"
                      />
                    </div>
                    
                    {/* Glow effect */}
                    {shufflePhase === 'shuffling' && (
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(255,215,0,0)',
                            '0 0 40px rgba(255,215,0,0.6)',
                            '0 0 20px rgba(255,215,0,0)'
                          ]
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: 2,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Shuffling text */}
            <motion.div
              className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-2xl font-bold text-yellow-400 drop-shadow-lg animate-pulse">
                {shufflePhase === 'shuffling' ? 'Shuffling Cards...' : 'Get Ready!'}
              </p>
            </motion.div>

            {/* Particle effects */}
            {shufflePhase === 'shuffling' && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0 
                    }}
                    animate={{
                      x: [0, Math.random() * 200 - 100],
                      y: [0, Math.random() * 200 - 100],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: 1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};