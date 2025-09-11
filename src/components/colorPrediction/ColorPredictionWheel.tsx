import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameSounds } from '@/hooks/useGameSounds';

interface ColorPredictionWheelProps {
  isSpinning: boolean;
  winningColor?: 'red' | 'green' | 'violet';
  onSpinComplete?: () => void;
}

const ColorPredictionWheel: React.FC<ColorPredictionWheelProps> = ({
  isSpinning,
  winningColor,
  onSpinComplete
}) => {
  const [rotation, setRotation] = useState(0);
  const [currentSegment, setCurrentSegment] = useState<string>('');
  const { playSpinWheel, playWin } = useGameSounds();

  // Wheel segments - red, green, violet pattern repeated
  const segments = [
    { color: 'red', value: 'red', bgClass: 'from-red-500 to-red-600' },
    { color: 'green', value: 'green', bgClass: 'from-emerald-500 to-emerald-600' },
    { color: 'violet', value: 'violet', bgClass: 'from-purple-500 to-purple-600' },
    { color: 'red', value: 'red', bgClass: 'from-red-500 to-red-600' },
    { color: 'green', value: 'green', bgClass: 'from-emerald-500 to-emerald-600' },
    { color: 'violet', value: 'violet', bgClass: 'from-purple-500 to-purple-600' },
    { color: 'red', value: 'red', bgClass: 'from-red-500 to-red-600' },
    { color: 'green', value: 'green', bgClass: 'from-emerald-500 to-emerald-600' },
    { color: 'violet', value: 'violet', bgClass: 'from-purple-500 to-purple-600' },
    { color: 'red', value: 'red', bgClass: 'from-red-500 to-red-600' },
    { color: 'green', value: 'green', bgClass: 'from-emerald-500 to-emerald-600' },
    { color: 'violet', value: 'violet', bgClass: 'from-purple-500 to-purple-600' },
  ];

  useEffect(() => {
    if (isSpinning && winningColor) {
      playSpinWheel();
      
      // Find a segment index that matches the winning color
      const targetSegments = segments.map((s, i) => ({ ...s, index: i }))
        .filter(s => s.value === winningColor);
      const targetSegment = targetSegments[Math.floor(Math.random() * targetSegments.length)];
      
      const segmentAngle = 360 / segments.length;
      const targetRotation = targetSegment.index * segmentAngle + (360 * 5) + (Math.random() * segmentAngle);
      
      setRotation(prev => prev + targetRotation);
      
      setTimeout(() => {
        setCurrentSegment(winningColor);
        playWin();
        if (onSpinComplete) onSpinComplete();
      }, 4000);
    }
  }, [isSpinning, winningColor, playSpinWheel, playWin, onSpinComplete]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Wheel Container */}
      <div className="relative aspect-square">
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 via-emerald-600/20 to-red-600/20 blur-xl animate-pulse" />
        
        {/* Wheel Base */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
          {/* Inner Wheel */}
          <motion.div
            className="absolute inset-2 rounded-full overflow-hidden"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: "easeOut" }}
          >
            {segments.map((segment, index) => {
              const angle = (360 / segments.length);
              const startAngle = index * angle - 90;
              const endAngle = startAngle + angle;
              
              return (
                <div
                  key={index}
                  className={`absolute inset-0 bg-gradient-to-br ${segment.bgClass}`}
                  style={{
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(startAngle * Math.PI / 180)}% ${50 + 50 * Math.sin(startAngle * Math.PI / 180)}%, ${50 + 50 * Math.cos(endAngle * Math.PI / 180)}% ${50 + 50 * Math.sin(endAngle * Math.PI / 180)}%)`
                  }}
                >
                  {/* Segment Border */}
                  <div className="absolute inset-0 border-r-2 border-gray-800/50" 
                       style={{ transformOrigin: '50% 50%', transform: `rotate(${angle}deg)` }} />
                </div>
              );
            })}
            
            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-inner flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg animate-pulse" />
              </div>
            </div>
          </motion.div>

          {/* Decorative Dots */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-lg"
              style={{
                top: `${50 + 42 * Math.sin((i * 30) * Math.PI / 180)}%`,
                left: `${50 + 42 * Math.cos((i * 30) * Math.PI / 180)}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>

        {/* Pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            animate={{ y: isSpinning ? [0, -5, 0] : 0 }}
            transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
            className="relative"
          >
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[35px] border-t-yellow-400 filter drop-shadow-lg" />
            <div className="absolute -top-[35px] left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
          </motion.div>
        </div>

        {/* Spinning Indicator */}
        <AnimatePresence>
          {isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-black/80 backdrop-blur-sm rounded-2xl px-6 py-3">
                <p className="text-white font-bold text-lg animate-pulse">SPINNING...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Winner Display */}
        <AnimatePresence>
          {!isSpinning && currentSegment && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2"
            >
              <div className={`px-6 py-3 rounded-xl bg-gradient-to-r ${
                currentSegment === 'red' ? 'from-red-500 to-red-600' :
                currentSegment === 'green' ? 'from-emerald-500 to-emerald-600' :
                'from-purple-500 to-purple-600'
              } text-white font-bold text-xl shadow-2xl animate-bounce`}>
                {currentSegment.toUpperCase()} WINS!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ColorPredictionWheel;