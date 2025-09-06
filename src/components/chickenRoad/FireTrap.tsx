import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FireTrapProps {
  isActive: boolean;
  className?: string;
}

export const FireTrap: React.FC<FireTrapProps> = ({ isActive, className }) => {
  if (!isActive) return null;

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Fire Base */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Multiple Fire Layers for Depth */}
        <div className="relative">
          {/* Outer Glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ width: 80, height: 80, left: -20, top: -20 }}
          />
          
          {/* Main Fire */}
          <motion.div
            className="relative z-10"
            animate={{
              scale: [1, 1.1, 0.95, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="text-4xl">🔥</span>
          </motion.div>
          
          {/* Additional Flames */}
          <motion.div
            className="absolute -top-2 -left-2"
            animate={{
              y: [-2, -5, -2],
              opacity: [0.7, 1, 0.7],
              scale: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              delay: 0.1
            }}
          >
            <span className="text-2xl">🔥</span>
          </motion.div>
          
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{
              y: [-2, -5, -2],
              opacity: [0.7, 1, 0.7],
              scale: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              delay: 0.2
            }}
          >
            <span className="text-2xl">🔥</span>
          </motion.div>
          
          {/* Smoke Particles */}
          <motion.div
            className="absolute -top-4 left-1/2 -translate-x-1/2"
            animate={{
              y: [-5, -15],
              opacity: [0.8, 0],
              scale: [1, 1.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          >
            <span className="text-gray-600 text-xl">💨</span>
          </motion.div>
          
          {/* Sparks */}
          <motion.div
            className="absolute inset-0"
            animate={{
              y: [-10, -20],
              opacity: [1, 0]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              staggerChildren: 0.1
            }}
          >
            <span className="absolute left-0 text-xs">✨</span>
            <span className="absolute right-0 text-xs">✨</span>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Heat Distortion Effect (visual only) */}
      <div className="absolute inset-0 bg-gradient-radial from-orange-500/10 to-transparent animate-pulse" />
    </div>
  );
};