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
  };
  onClick: () => void;
}

export const TableCard = ({ table, onClick }: TableCardProps) => {
  const isLive = table.status === 'active' || table.status === 'live';

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold">{table.name}</CardTitle>
          {isLive && <LiveIndicator />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
          className="w-full justify-center"
        >
          {isLive ? "Join Now" : "Coming Soon"}
        </Badge>
      </CardContent>
    </Card>
  );
};
