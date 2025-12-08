// src/components/live-casino/TableCard.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveIndicator } from "./LiveIndicator";

interface TableCardProps {
  table: {
    id: string;
    name: string;
    status: string;
    players: number;
    data?: any;
    imageUrl?: string;
  };
  onClick: () => void;
}

export const TableCard = ({ table, onClick }: TableCardProps) => {
  const isRestricted = table.status === "restricted";
  const isLive = !isRestricted && (table.status === "active" || table.status === "live");
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getGradientClass = () => {
    const gradients = [
      "from-amber-500/30 to-orange-600/30",
      "from-emerald-500/30 to-teal-600/30",
      "from-violet-500/30 to-purple-600/30",
      "from-rose-500/30 to-pink-600/30",
      "from-blue-500/30 to-indigo-600/30",
      "from-cyan-500/30 to-sky-600/30",
    ];
    const index = table.name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const showFallback = !table.imageUrl || imageError;

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20 overflow-hidden ${isRestricted ? "opacity-60 pointer-events-none" : ""}`}
      onClick={() => !isRestricted && onClick()}
    >
      <div className={`relative w-full h-20 sm:h-32 md:h-40 bg-gradient-to-br ${getGradientClass()} flex items-center justify-center`}>
        {table.imageUrl && !imageError && (
          <img
            src={table.imageUrl}
            alt={table.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {showFallback && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 sm:gap-2 text-foreground p-2 sm:p-4">
            <div className="text-2xl sm:text-4xl">🎰</div>
            <div className="text-[9px] sm:text-xs text-center font-medium line-clamp-2">
              {table.name}
            </div>
          </div>
        )}

        {isLive && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
            <LiveIndicator />
          </div>
        )}
      </div>

      <CardHeader className="pb-1 sm:pb-2 md:pb-3 px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 md:pt-6">
        <div className="flex items-start justify-between">
          <CardTitle className="text-[10px] sm:text-base md:text-lg font-bold leading-tight line-clamp-1">
            {table.name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-1 sm:space-y-2 md:space-y-3 px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6">
        {isRestricted ? (
          <Badge variant="destructive" className="w-full justify-center text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 md:py-1.5">
            Restricted
          </Badge>
        ) : (
          <Badge variant={isLive ? "default" : "secondary"} className="w-full justify-center text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 md:py-1.5">
            {isLive ? "Join Now" : "Coming Soon"}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
