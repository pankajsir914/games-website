import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useRouletteSounds } from '@/hooks/useRouletteSounds';

interface RouletteWheel3DProps {
  isSpinning: boolean;
  winningNumber?: number;
  onSpinComplete?: () => void;
}

// European Roulette wheel order
const wheelNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num: number) => {
  if (num === 0) return 'green';
  return redNumbers.includes(num) ? 'red' : 'black';
};

export default function RouletteWheel3D({ isSpinning, winningNumber, onSpinComplete }: RouletteWheel3DProps) {
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [ballRadius, setBallRadius] = useState(125);
  const [showResult, setShowResult] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { playSound } = useRouletteSounds();
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isSpinning && winningNumber !== undefined) {
      setIsAnimating(true);
      setShowResult(false);
      
      // Play spinning sound
      playSound('spin');
      
      // Calculate final positions
      const numberIndex = wheelNumbers.indexOf(winningNumber);
      const sectionAngle = 360 / wheelNumbers.length;
      const targetWheelAngle = numberIndex * sectionAngle;
      
      // Multiple rotations for effect
      const wheelSpins = 5 + Math.random() * 3;
      const ballSpins = 8 + Math.random() * 4;
      
      const finalWheelRotation = wheelSpins * 360 - targetWheelAngle;
      const finalBallRotation = -ballSpins * 360;
      
      // Animate wheel and ball
      let startTime: number | null = null;
      const duration = 5000; // 5 seconds
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function for realistic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        // Update rotations
        setWheelRotation(finalWheelRotation * easeOut);
        setBallRotation(finalBallRotation * easeOut);
        
        // Ball drops towards the end
        if (progress > 0.7) {
          const dropProgress = (progress - 0.7) / 0.3;
          setBallRadius(125 - (30 * dropProgress));
          
          // Play ball drop sound
          if (progress > 0.7 && progress < 0.75) {
            playSound('ballDrop');
          }
        }
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          setIsAnimating(false);
          setShowResult(true);
          playSound('win');
          onSpinComplete?.();
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isSpinning, winningNumber, onSpinComplete, playSound]);

  return (
    <div className="relative w-[400px] h-[400px] mx-auto perspective-1000">
      {/* Outer Rim */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 shadow-2xl">
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900">
          {/* Diamond Markers */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-yellow-400 transform rotate-45"
              style={{
                top: '50%',
                left: '50%',
                transform: `
                  translate(-50%, -50%) 
                  rotate(${i * 45}deg) 
                  translateY(-175px)
                  rotate(45deg)
                `,
              }}
            />
          ))}
          
          {/* Inner Wheel */}
          <div className="absolute inset-4 rounded-full">
            <div
              className="w-full h-full rounded-full relative transition-none"
              style={{
                transform: `rotateZ(${wheelRotation}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Number Pockets */}
              {wheelNumbers.map((number, index) => {
                const angle = (360 / wheelNumbers.length) * index;
                const color = getNumberColor(number);
                
                return (
                  <div
                    key={number}
                    className="absolute w-full h-full"
                    style={{
                      transform: `rotateZ(${angle}deg)`,
                    }}
                  >
                    <div
                      className={cn(
                        "absolute top-3 left-1/2 w-8 h-12 flex items-center justify-center text-white font-bold text-sm rounded-sm shadow-inner",
                        "transform -translate-x-1/2"
                      )}
                      style={{
                        backgroundColor: color === 'green' ? '#10b981' : color === 'red' ? '#dc2626' : '#1f2937',
                        transform: `translateX(-50%) rotateZ(-${angle - wheelRotation}deg)`,
                      }}
                    >
                      {number}
                    </div>
                  </div>
                );
              })}
              
              {/* Center Cone */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 shadow-xl">
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500">
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 shadow-inner" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Ball Track */}
          <div className="absolute inset-6 rounded-full">
            <div
              className="absolute w-4 h-4 bg-gradient-to-br from-gray-100 to-white rounded-full shadow-lg transition-none"
              style={{
                top: '50%',
                left: '50%',
                transform: `
                  translate(-50%, -50%) 
                  rotate(${ballRotation}deg) 
                  translateY(-${ballRadius}px)
                `,
              }}
            >
              <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white to-gray-200" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-10">
        <div className="relative">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg" />
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-yellow-300" />
        </div>
      </div>
      
      {/* Result Display */}
      {showResult && winningNumber !== undefined && (
        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 animate-fade-in">
          <div
            className={cn(
              "px-8 py-4 rounded-lg text-white font-bold text-2xl shadow-2xl animate-scale-in",
              "bg-gradient-to-r",
              getNumberColor(winningNumber) === 'green' && "from-green-600 to-green-700",
              getNumberColor(winningNumber) === 'red' && "from-red-600 to-red-700",
              getNumberColor(winningNumber) === 'black' && "from-gray-800 to-gray-900"
            )}
          >
            <div className="text-center">
              <div className="text-3xl mb-1">{winningNumber}</div>
              <div className="text-sm uppercase tracking-wide opacity-90">
                {getNumberColor(winningNumber)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Spinning Indicator */}
      {isAnimating && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
            Spinning...
          </div>
        </div>
      )}
    </div>
  );
}