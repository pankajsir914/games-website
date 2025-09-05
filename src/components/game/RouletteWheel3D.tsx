import React, { useEffect, useState } from 'react';
import { useGameSounds } from '@/hooks/useGameSounds';

interface RouletteWheel3DProps {
  isSpinning: boolean;
  winningNumber?: number;
  onSpinComplete?: () => void;
}

const RouletteWheel3D: React.FC<RouletteWheel3DProps> = ({
  isSpinning,
  winningNumber,
  onSpinComplete
}) => {
  const [rotation, setRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const { playSpinWheel } = useGameSounds();

  const numbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-green-600';
    return redNumbers.includes(num) ? 'bg-red-600' : 'bg-gray-900';
  };

  useEffect(() => {
    if (isSpinning && winningNumber !== undefined) {
      playSpinWheel();
      const numberIndex = numbers.indexOf(winningNumber);
      const segmentAngle = 360 / numbers.length;
      const targetRotation = numberIndex * segmentAngle + 360 * 5; // 5 full rotations
      
      setRotation(targetRotation);
      setBallRotation(-targetRotation - 360 * 3); // Ball spins opposite direction

      setTimeout(() => {
        if (onSpinComplete) onSpinComplete();
      }, 4000);
    }
  }, [isSpinning, winningNumber, onSpinComplete, playSpinWheel]);

  return (
    <div className="relative w-80 h-80 mx-auto perspective-1000">
      {/* Outer rim with metallic effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-800 shadow-2xl">
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-800 via-amber-900 to-black">
          {/* Inner wheel */}
          <div
            className="absolute inset-4 rounded-full overflow-hidden transition-transform duration-[4000ms] ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Number segments */}
            {numbers.map((num, index) => {
              const angle = (360 / numbers.length) * index;
              return (
                <div
                  key={index}
                  className={`absolute w-full h-full ${getNumberColor(num)}`}
                  style={{
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 5) * Math.PI / 180)}% ${50 - 50 * Math.sin((angle - 5) * Math.PI / 180)}%, ${50 + 50 * Math.cos((angle + 5) * Math.PI / 180)}% ${50 - 50 * Math.sin((angle + 5) * Math.PI / 180)}%)`,
                    filter: index % 2 === 0 ? 'brightness(1)' : 'brightness(0.85)'
                  }}
                >
                  {/* Number label */}
                  <div
                    className="absolute text-white font-bold text-xs"
                    style={{
                      top: '15%',
                      left: '50%',
                      transform: `rotate(${-angle}deg) translateX(-50%)`,
                      transformOrigin: 'center'
                    }}
                  >
                    {num}
                  </div>
                </div>
              );
            })}
            
            {/* Center cone */}
            <div className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-inner" />
            </div>
          </div>

          {/* Ball track */}
          <div className="absolute inset-3 rounded-full border-4 border-amber-900">
            {/* Ball */}
            <div
              className="absolute w-4 h-4 bg-gradient-to-br from-white via-gray-200 to-gray-400 rounded-full shadow-lg transition-transform duration-[4000ms] ease-out"
              style={{
                top: '5%',
                left: '50%',
                transform: `rotate(${ballRotation}deg) translateX(120px)`,
                transformOrigin: '0 140px'
              }}
            >
              <div className="absolute inset-0 rounded-full bg-white/50 blur-sm animate-pulse" />
            </div>
          </div>

          {/* Diamond markers */}
          {[0, 90, 180, 270].map((angle) => (
            <div
              key={angle}
              className="absolute w-2 h-2 bg-gradient-to-br from-yellow-400 to-yellow-600 transform rotate-45"
              style={{
                top: angle === 0 ? '2%' : angle === 180 ? '95%' : '50%',
                left: angle === 270 ? '2%' : angle === 90 ? '95%' : '50%',
                transform: 'translate(-50%, -50%) rotate(45deg)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Pointer */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-yellow-400 drop-shadow-lg" />
      </div>

      {/* Reflection effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Winning number display */}
      {!isSpinning && winningNumber !== undefined && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
          <div className={`inline-block px-4 py-2 rounded-lg ${getNumberColor(winningNumber)} text-white font-bold text-xl animate-bounce`}>
            {winningNumber}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouletteWheel3D;