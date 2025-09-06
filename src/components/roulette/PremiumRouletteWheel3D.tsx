import React, { useEffect, useRef, useState } from 'react';
import { useRouletteSounds } from '@/hooks/useRouletteSounds';

interface PremiumRouletteWheel3DProps {
  isSpinning: boolean;
  winningNumber?: number;
  onSpinComplete?: () => void;
}

const PremiumRouletteWheel3D: React.FC<PremiumRouletteWheel3DProps> = ({
  isSpinning,
  winningNumber,
  onSpinComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballRadius, setBallRadius] = useState(140);
  const [ballHeight, setBallHeight] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { playBallRolling, playBallDrop, playWin } = useRouletteSounds();

  const numbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  const getNumberColor = (num: number): string => {
    if (num === 0) return '#10B981'; // Green
    return redNumbers.includes(num) ? '#EF4444' : '#111827'; // Red or Black
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 180;
    const innerRadius = 140;
    const pocketRadius = 100;

    const drawWheel = (rotation: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      
      // Outer metallic rim
      const rimGradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
      rimGradient.addColorStop(0, '#FCD34D');
      rimGradient.addColorStop(0.3, '#F59E0B');
      rimGradient.addColorStop(0.6, '#D97706');
      rimGradient.addColorStop(1, '#92400E');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = rimGradient;
      ctx.fill();
      ctx.restore();

      // Draw diamond markers
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const x = centerX + Math.cos(angle) * (outerRadius - 10);
        const y = centerY + Math.sin(angle) * (outerRadius - 10);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        
        const diamondGradient = ctx.createLinearGradient(-4, -4, 4, 4);
        diamondGradient.addColorStop(0, '#FEF3C7');
        diamondGradient.addColorStop(0.5, '#FCD34D');
        diamondGradient.addColorStop(1, '#F59E0B');
        
        ctx.fillStyle = diamondGradient;
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      }
      ctx.restore();

      // Draw number pockets
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      const segmentAngle = (Math.PI * 2) / numbers.length;
      
      numbers.forEach((num, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        
        // Draw pocket background
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius, startAngle, endAngle);
        ctx.arc(0, 0, pocketRadius, endAngle, startAngle, true);
        ctx.closePath();
        
        // Add gradient for depth
        const pocketGradient = ctx.createRadialGradient(
          Math.cos(startAngle + segmentAngle / 2) * 120,
          Math.sin(startAngle + segmentAngle / 2) * 120,
          0,
          Math.cos(startAngle + segmentAngle / 2) * 120,
          Math.sin(startAngle + segmentAngle / 2) * 120,
          40
        );
        
        const color = getNumberColor(num);
        pocketGradient.addColorStop(0, color);
        pocketGradient.addColorStop(1, index % 2 === 0 ? color : adjustColorBrightness(color, -20));
        
        ctx.fillStyle = pocketGradient;
        ctx.fill();
        
        // Draw separators
        ctx.strokeStyle = '#FCD34D';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Draw number
        ctx.save();
        const textAngle = startAngle + segmentAngle / 2;
        const textRadius = innerRadius - 20;
        const textX = Math.cos(textAngle) * textRadius;
        const textY = Math.sin(textAngle) * textRadius;
        
        ctx.translate(textX, textY);
        ctx.rotate(textAngle + Math.PI / 2);
        
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.fillText(num.toString(), 0, 0);
        ctx.restore();
      });
      
      ctx.restore();

      // Draw center cone
      const coneGradient = ctx.createRadialGradient(centerX, centerY - 10, 5, centerX, centerY, 40);
      coneGradient.addColorStop(0, '#FEF3C7');
      coneGradient.addColorStop(0.3, '#FCD34D');
      coneGradient.addColorStop(0.7, '#F59E0B');
      coneGradient.addColorStop(1, '#92400E');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.fillStyle = coneGradient;
      ctx.fill();
      
      // Inner highlight
      ctx.beginPath();
      ctx.arc(centerX - 5, centerY - 5, 25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
    };

    const drawBall = (angle: number, radius: number, height: number) => {
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Ball shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4 + height / 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Ball body
      const ballGradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 8);
      ballGradient.addColorStop(0, '#FFFFFF');
      ballGradient.addColorStop(0.3, '#F3F4F6');
      ballGradient.addColorStop(0.7, '#D1D5DB');
      ballGradient.addColorStop(1, '#9CA3AF');
      
      ctx.beginPath();
      ctx.arc(x, y, 8 - height / 20, 0, Math.PI * 2);
      ctx.fillStyle = ballGradient;
      ctx.fill();
      
      // Ball highlight
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      drawWheel(wheelRotation);
      if (isAnimating) {
        drawBall(ballAngle, ballRadius, ballHeight);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [wheelRotation, ballAngle, ballRadius, ballHeight, isAnimating]);

  useEffect(() => {
    if (isSpinning && winningNumber !== undefined) {
      setIsAnimating(true);
      playBallRolling();
      
      const numberIndex = numbers.indexOf(winningNumber);
      const segmentAngle = (Math.PI * 2) / numbers.length;
      const targetWheelRotation = numberIndex * segmentAngle + Math.PI * 2 * 5;
      
      let startTime = Date.now();
      const duration = 4000;
      
      const animateSpinning = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        // Wheel rotation
        setWheelRotation(targetWheelRotation * easeOut);
        
        // Ball animation
        const ballProgress = Math.min(progress * 1.2, 1);
        const ballEaseOut = 1 - Math.pow(1 - ballProgress, 2);
        
        // Ball spirals inward
        setBallAngle(-targetWheelRotation * 0.8 * ballEaseOut);
        setBallRadius(140 - (40 * ballEaseOut));
        
        // Ball drops at the end
        if (progress > 0.7) {
          const dropProgress = (progress - 0.7) / 0.3;
          setBallHeight(Math.sin(dropProgress * Math.PI * 4) * 10 * (1 - dropProgress));
          
          if (progress > 0.85 && progress < 0.86) {
            playBallDrop();
          }
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateSpinning);
        } else {
          setIsAnimating(false);
          playWin();
          if (onSpinComplete) {
            onSpinComplete();
          }
        }
      };
      
      animateSpinning();
    }
  }, [isSpinning, winningNumber, onSpinComplete, playBallRolling, playBallDrop, playWin]);

  const adjustColorBrightness = (color: string, amount: number): string => {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  };

  return (
    <div className="relative">
      {/* Pointer */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="relative">
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[35px] border-t-yellow-400 drop-shadow-2xl" />
          <div className="absolute -top-[33px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-yellow-300" />
        </div>
      </div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="mx-auto"
      />
      
      {/* Winning number display */}
      {!isSpinning && winningNumber !== undefined && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl ${
            winningNumber === 0 ? 'bg-green-600' : 
            redNumbers.includes(winningNumber) ? 'bg-red-600' : 'bg-gray-900'
          } text-white font-bold text-2xl animate-bounce shadow-2xl`}>
            <span className="text-yellow-400">★</span>
            {winningNumber}
            <span className="text-yellow-400">★</span>
          </div>
        </div>
      )}
      
      {/* Spinning indicator */}
      {isSpinning && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full">
            <span className="text-yellow-400 font-semibold animate-pulse">Spinning...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumRouletteWheel3D;