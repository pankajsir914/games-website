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
        <div className="relative w-full h-32 sm:h-40 bg-secondary/20">
          <img 
            src={table.imageUrl} 
            alt={table.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {isLive && (
            <div className="absolute top-2 right-2">
              <LiveIndicator />
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base sm:text-lg font-bold">{table.name}</CardTitle>
          {!table.imageUrl && isLive && <LiveIndicator />}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{table.players || 0} players</span>
        </div>
        
        {table.data?.lastRound && (
          <div className="text-xs text-muted-foreground">
            Round: #{table.data.lastRound}
          </div>
        )}

        <Badge 
          variant={isLive ? "default" : "secondary"}
          className="w-full justify-center text-xs sm:text-sm py-1 sm:py-1.5"
        >
          {isLive ? "Join Now" : "Coming Soon"}
        </Badge>
      </CardContent>
    </Card>
  );
};
