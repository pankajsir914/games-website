import React from 'react';
import { cn } from '@/lib/utils';

interface ChickenMascotProps {
  state: 'idle' | 'hopping' | 'scared' | 'celebrating' | 'roasted';
  className?: string;
}

export const ChickenMascot: React.FC<ChickenMascotProps> = ({ state, className }) => {
  return (
    <div className={cn("relative w-32 h-32", className)}>
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "w-full h-full transition-all duration-300",
          state === 'hopping' && "animate-bounce",
          state === 'scared' && "animate-pulse",
          state === 'celebrating' && "animate-spin",
          state === 'roasted' && "opacity-50 grayscale"
        )}
      >
        {/* Chicken Body */}
        <ellipse
          cx="64"
          cy="75"
          rx="30"
          ry="35"
          fill="#FFA500"
          stroke="#FF8C00"
          strokeWidth="2"
        />
        
        {/* Chicken Head */}
        <circle
          cx="64"
          cy="40"
          r="20"
          fill="#FFB84D"
          stroke="#FF8C00"
          strokeWidth="2"
        />
        
        {/* Eyes */}
        <circle cx="57" cy="38" r="3" fill="#000" />
        <circle cx="71" cy="38" r="3" fill="#000" />
        {state === 'scared' && (
          <>
            <circle cx="57" cy="38" r="5" fill="#FFF" />
            <circle cx="71" cy="38" r="5" fill="#FFF" />
            <circle cx="57" cy="38" r="3" fill="#000" />
            <circle cx="71" cy="38" r="3" fill="#000" />
          </>
        )}
        
        {/* Beak */}
        <path
          d="M64 42 L60 46 L68 46 Z"
          fill="#FFD700"
          stroke="#FFA500"
          strokeWidth="1"
        />
        
        {/* Comb */}
        <path
          d="M54 25 Q58 20 62 25 Q64 22 66 25 Q70 20 74 25 L74 30 Q64 28 54 30 Z"
          fill="#FF0000"
          stroke="#CC0000"
          strokeWidth="1"
        />
        
        {/* Wings */}
        <ellipse
          cx="40"
          cy="70"
          rx="12"
          ry="20"
          fill="#FF8C00"
          stroke="#FF6347"
          strokeWidth="2"
          transform="rotate(-20 40 70)"
        />
        <ellipse
          cx="88"
          cy="70"
          rx="12"
          ry="20"
          fill="#FF8C00"
          stroke="#FF6347"
          strokeWidth="2"
          transform="rotate(20 88 70)"
        />
        
        {/* Feet */}
        {state !== 'roasted' && (
          <>
            <line x1="54" y1="105" x2="54" y2="115" stroke="#FFD700" strokeWidth="3" />
            <line x1="74" y1="105" x2="74" y2="115" stroke="#FFD700" strokeWidth="3" />
            <path d="M50 115 L54 115 L58 115" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            <path d="M70 115 L74 115 L78 115" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        
        {/* Roasted Effect */}
        {state === 'roasted' && (
          <>
            <circle cx="64" cy="64" r="40" fill="black" opacity="0.3" />
            <text x="64" y="70" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              X_X
            </text>
          </>
        )}
        
        {/* Celebration Stars */}
        {state === 'celebrating' && (
          <>
            <text x="30" y="30" fill="#FFD700" fontSize="16">⭐</text>
            <text x="90" y="40" fill="#FFD700" fontSize="16">⭐</text>
            <text x="35" y="90" fill="#FFD700" fontSize="16">⭐</text>
            <text x="85" y="95" fill="#FFD700" fontSize="16">⭐</text>
          </>
        )}
      </svg>
      
      {/* Shadow */}
      <div 
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/20 rounded-full blur-md",
          state === 'hopping' && "animate-pulse"
        )}
      />
    </div>
  );
};