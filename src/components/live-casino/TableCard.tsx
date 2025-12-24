// src/components/live-casino/TableCard.tsx
import { useState, memo } from "react";
import { Card } from "@/components/ui/card";

interface TableCardProps {
  table: {
    id: string;
    name: string;
    status: string;
    imageUrl?: string;
  };
  onClick: () => void;
}
   
export const TableCard = memo(({ table, onClick }: TableCardProps) => {
  const isRestricted = table.status === "restricted";
  const isMaintenance = table.status === "maintenance";
  const isDisabled = isRestricted || isMaintenance;
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
      className={`transition-all duration-300 border-primary/20 overflow-hidden ${
        isDisabled 
          ? "opacity-60 cursor-not-allowed" 
          : "cursor-pointer hover:shadow-lg hover:scale-105"
      }`}
      onClick={() => !isDisabled && onClick()}
    >
      {/* IMAGE SECTION */}
      <div
        className={`relative w-full aspect-square bg-gradient-to-br ${getGradientClass()} flex items-center justify-center ${
          isMaintenance ? "opacity-50" : ""
        }`}
      >
        {table.imageUrl && !imageError && (
          <img
            key={table.imageUrl}
            src={table.imageUrl}
            alt={table.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        )}

        {showFallback && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl sm:text-6xl">🎰</div>
          </div>
        )}

        {/* Maintenance Overlay */}
        {isMaintenance && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="text-center px-2">
              <p className="text-white font-bold text-sm sm:text-base mb-1">🔧</p>
              <p className="text-white font-semibold text-xs sm:text-sm">Under Maintenance</p>
            </div>
          </div>
        )}
      </div>

      
      <div className="px-3 py-2 bg-background/90 backdrop-blur border-t">
        <p className="text-sm font-semibold truncate">{table.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          ID: {table.id}
        </p>
        {isMaintenance && (
          <p className="text-xs text-orange-500 font-medium mt-1">Under Maintenance</p>
        )}
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.table.id === nextProps.table.id &&
    prevProps.table.name === nextProps.table.name &&
    prevProps.table.status === nextProps.table.status &&
    prevProps.table.imageUrl === nextProps.table.imageUrl
  );
});
