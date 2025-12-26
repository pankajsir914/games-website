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
    mobile   → 70px
    tablet   → 90px
    desktop  → 110px
  */

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
        pointer-events-none
      "
    >
      <svg
        viewBox="0 0 110 110"
        className="rotate-[-90deg] w-full h-full"
      >
        {/* background ring (slightly transparent) */}
        <circle
          stroke="rgba(255,255,255,0.25)"
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

      {/* center (fully transparent background) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="
            rounded-full
            bg-black/30
            backdrop-blur-[2px]
            flex items-center justify-center
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
              drop-shadow
            "
          >
            {safeValue}
          </span>
        </div>
      </div>
    </div>
  );
};
