import { useState, memo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

/* ======================================================
   🔍 TABLE SEARCH BOX (Reusable)
   ====================================================== */

interface TableSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TableSearchBox = ({
  value,
  onChange,
  placeholder = "Search table..."
}: TableSearchBoxProps) => {
  return (
    <div className="w-full mb-4">
      <div className="relative max-w-md mx-auto sm:mx-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            pl-9
            h-10
            sm:h-11
            rounded-xl
            bg-background/80
            backdrop-blur
            border-primary/20
            focus:border-primary
            focus:ring-primary/20
          "
        />
      </div>
    </div>
  );
};

/* ======================================================
   🎰 TABLE CARD
   ====================================================== */

interface TableCardProps {
  table: {
    id: string;
    name: string;
    status: string;
    imageUrl?: string;
  };
  onClick: () => void;
}

const TableCard = memo(({ table, onClick }: TableCardProps) => {
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
      {/* IMAGE */}
      <div
        className={`relative w-full aspect-square bg-gradient-to-br ${getGradientClass()} flex items-center justify-center ${
          isMaintenance ? "opacity-50" : ""
        }`}
      >
        {!imageLoaded && table.imageUrl && !imageError && (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}

        {table.imageUrl && !imageError && (
          <img
            src={table.imageUrl}
            alt={table.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        )}

        {showFallback && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl sm:text-6xl">🎰</span>
          </div>
        )}

        {isMaintenance && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="text-center">
              <p className="text-white text-sm font-bold">🔧</p>
              <p className="text-white text-xs font-semibold">
                Under Maintenance
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TEXT */}
      <div className="px-3 py-2 bg-background/90 backdrop-blur border-t">
        <p className="text-sm font-semibold truncate">{table.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          ID: {table.id}
        </p>

        {isMaintenance && (
          <p className="text-xs text-orange-500 font-medium mt-1">
            Under Maintenance
          </p>
        )}
      </div>
    </Card>
  );
});

export default TableCard;
