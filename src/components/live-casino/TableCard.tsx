import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveIndicator } from "./LiveIndicator";
import { Users } from "lucide-react";

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
  const isLive = table.status === 'active' || table.status === 'live';

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20 overflow-hidden"
      onClick={onClick}
    >
      {table.imageUrl && (
        <div className="relative w-full h-20 sm:h-32 md:h-40 bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center">
          <img 
            src={table.imageUrl} 
            alt={table.name}
            className="w-full h-full object-cover"
            loading="eager"
            onLoad={(e) => {
              console.log('Image loaded:', table.name, table.imageUrl);
              e.currentTarget.classList.remove('opacity-0');
            }}
            onError={(e) => {
              console.error('Image failed to load:', table.name, table.imageUrl);
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="flex items-center justify-center text-xs text-muted-foreground p-4">
                  <span>🎮 ${table.name}</span>
                </div>`;
              }
            }}
            style={{ opacity: 0, transition: 'opacity 0.3s' }}
          />
          {isLive && (
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
              <LiveIndicator />
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="pb-1 sm:pb-2 md:pb-3 px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 md:pt-6">
        <div className="flex items-start justify-between">
          <CardTitle className="text-[10px] sm:text-base md:text-lg font-bold leading-tight">{table.name}</CardTitle>
          {!table.imageUrl && isLive && <LiveIndicator />}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-1 sm:space-y-2 md:space-y-3 px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6">
        {table.data?.lastRound && (
          <div className="hidden sm:block text-xs text-muted-foreground">
            Round: #{table.data.lastRound}
          </div>
        )}

        <Badge 
          variant={isLive ? "default" : "secondary"}
          className="w-full justify-center text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 md:py-1.5"
        >
          {isLive ? "Join Now" : "Coming Soon"}
        </Badge>
      </CardContent>
    </Card>
  );
};
