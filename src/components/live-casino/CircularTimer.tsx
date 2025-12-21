// src/components/live-casino/CircularTimer.tsx

import React from "react";

interface CircularTimerProps {
  value: number; // seconds
  max?: number;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  value,
  max = 20,
}) => {
  const safeValue = Math.max(0, Math.min(value, max));

  const radius = 42;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;

  const progress = safeValue / max;
  const strokeDashoffset =
    circumference - progress * circumference;

  return (
    <div className="relative w-[110px] h-[110px]">
      <svg height="110" width="110" className="rotate-[-90deg]">
        {/* background ring */}
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="55"
          cy="55"
        />

        {/* progress ring */}
        <circle
          stroke={safeValue <= 5 ? "#ef4444" : "#4f5bd5"}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx="55"
          cy="55"
          className="transition-all duration-500 ease-linear"
        />
      </svg>

      {/* center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[54px] h-[54px] rounded-full bg-zinc-900 flex items-center justify-center shadow-md">
          <span className="text-white text-xl font-bold font-mono">
            {safeValue}
          </span>
        </div>
      </div>
    </div>
  );
};
