import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoulettePlayerPresenceProps {
  onlineCount: number;
  recentPlayers: Array<{
    id: string;
    username: string;
    isActive: boolean;
  }>;
}

const RoulettePlayerPresence: React.FC<RoulettePlayerPresenceProps> = ({
  onlineCount,
  recentPlayers
}) => {
  return (
    <Card className="p-4 bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Online Players
        </h3>
        <div className="flex items-center gap-2">
          <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
          <span className="font-bold text-lg">{onlineCount}</span>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {recentPlayers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No players online</p>
          </div>
        ) : (
          recentPlayers.map((player) => (
            <div
              key={player.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg",
                "bg-secondary/10 hover:bg-secondary/20 transition-colors"
              )}
            >
              <Circle className={cn(
                "h-2 w-2",
                player.isActive 
                  ? "fill-green-500 text-green-500" 
                  : "fill-gray-400 text-gray-400"
              )} />
              <span className="text-sm font-medium">
                {player.username || 'Anonymous'}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RoulettePlayerPresence;