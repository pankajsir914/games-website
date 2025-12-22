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

  /* 
    Sizes:
    mobile   → 70px  (smaller outer circle)
    tablet   → 90px
    desktop  → 110px
  */
  const sizeMobile = 70;
  const sizeTablet = 90;
  const sizeDesktop = 110;

  const radius = 42;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;

  const progress = safeValue / max;
  const strokeDashoffset =
    circumference - progress * circumference;

  return (
    <div
      className="
        relative
        w-[70px] h-[70px]
        sm:w-[90px] sm:h-[90px]
        lg:w-[110px] lg:h-[110px]
      "
    >
      <svg
        viewBox="0 0 110 110"
        className="rotate-[-90deg] w-full h-full"
      >
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
        <div
          className="
            rounded-full bg-zinc-900 flex items-center justify-center shadow-md
            w-[38px] h-[38px]
            sm:w-[44px] sm:h-[44px]
            lg:w-[54px] lg:h-[54px]
          "
        >
          <span
            className="
              text-white font-bold font-mono
              text-lg
              sm:text-xl
              lg:text-2xl
            "
          >
            {safeValue}
          </span>
        </div>
      </div>
    </div>
  );
};
