import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedChickenProps {
  state: 'idle' | 'walking' | 'jumping' | 'scared' | 'victory' | 'burning';
  position?: { x: number; y: number };
  className?: string;
}

export const AnimatedChicken: React.FC<AnimatedChickenProps> = ({ 
  state, 
  position = { x: 0, y: 0 },
  className 
}) => {
  const getAnimation = () => {
    switch(state) {
      case 'idle':
        return {
          y: [0, -5, 0],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      case 'walking':
        return {
          x: position.x,
          y: position.y,
          rotate: [0, -5, 5, 0],
          transition: {
            duration: 0.5,
            rotate: {
              repeat: Infinity,
              duration: 0.2
            }
          }
        };
      case 'jumping':
        return {
          y: [-20, -40, -20, 0],
          scale: [1, 1.1, 1],
          transition: {
            duration: 0.4,
            ease: "easeOut" as const
          }
        };
      case 'scared':
        return {
          rotate: [0, -10, 10, -10, 10, 0],
          scale: [1, 0.9, 1],
          transition: {
            duration: 0.3,
            repeat: 2
          }
        };
      case 'victory':
        return {
          y: [0, -30, 0],
          rotate: [0, 360],
          scale: [1, 1.2, 1],
          transition: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      case 'burning':
        return {
          rotate: [0, -45, 45, -45, 0],
          scale: [1, 0.8, 0.6],
          opacity: [1, 0.5, 0],
          transition: {
            duration: 1.5,
            ease: "easeOut" as const
          }
        };
      default:
        return {};
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={cn("relative", className)}
        animate={getAnimation()}
        initial={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
      >
        <div className="relative w-16 h-16">
          {/* Main Chicken Body */}
          <motion.div
            className="absolute inset-0"
            animate={state === 'scared' ? { scale: [1, 0.95, 1] } : {}}
            transition={{ duration: 0.2, repeat: Infinity }}
          >
            {/* Chicken Emoji with Effects */}
            <div className="relative">
              <span className={cn(
                "text-5xl block",
                state === 'burning' && "filter brightness-50 contrast-150"
              )}>
                🐓
              </span>
              
              {/* Fear Sweat Drops */}
              {state === 'scared' && (
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ y: [0, 10], opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  💦
                </motion.div>
              )}
              
              {/* Victory Stars */}
              {state === 'victory' && (
                <>
                  <motion.span
                    className="absolute -top-2 -left-2 text-xl"
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ⭐
                  </motion.span>
                  <motion.span
                    className="absolute -top-2 -right-2 text-xl"
                    animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  >
                    ⭐
                  </motion.span>
                </>
              )}
              
              {/* Fire Effect */}
              {state === 'burning' && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.5, 2], opacity: [1, 0.8, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <span className="text-4xl">🔥</span>
                </motion.div>
              )}
            </div>
          </motion.div>
          
          {/* Shadow */}
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/20 rounded-full blur-sm"
            animate={{
              scale: state === 'jumping' ? [1, 0.8, 1] : 1,
              opacity: state === 'burning' ? 0 : 1
            }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Walking Dust */}
          {state === 'walking' && (
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              animate={{ 
                x: [-10, 10],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
            >
              <span className="text-xs">💨</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};