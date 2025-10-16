import { Circle } from "lucide-react";

export const LiveIndicator = () => {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Circle className="w-2 h-2 sm:w-3 sm:h-3 fill-red-500 text-red-500 animate-pulse" />
      <span className="text-[10px] sm:text-sm font-semibold text-red-500 uppercase tracking-wide">
        LIVE
      </span>
    </div>
  );
};
