import { Circle } from "lucide-react";

export const LiveIndicator = () => {
  return (
    <div className="flex items-center gap-2">
      <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
      <span className="text-sm font-semibold text-red-500 uppercase tracking-wide">
        LIVE
      </span>
    </div>
  );
};
