
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Crown } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  cards: any[];
  hasDropped: boolean;
  hasDeclared: boolean;
}

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer: boolean;
  isMe: boolean;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, isCurrentPlayer, isMe }) => {
  return (
    <Card className={`
      bg-white/10 backdrop-blur-sm border-white/20 transition-all duration-200
      ${isCurrentPlayer ? 'ring-2 ring-blue-500 bg-blue-500/20' : ''}
      ${isMe ? 'ring-2 ring-green-500' : ''}
    `}>
      <CardContent className="p-3 text-center">
        <div className="flex items-center justify-center mb-2">
          <User className="h-8 w-8 text-white/80" />
          {isCurrentPlayer && <Crown className="h-4 w-4 text-yellow-400 ml-1" />}
        </div>
        
        <h4 className="text-white font-semibold text-sm mb-1">
          {isMe ? 'You' : player.name}
        </h4>
        
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs">
            {player.cards.length} cards
          </Badge>
          
          {player.hasDropped && (
            <Badge className="bg-red-600 text-xs">Dropped</Badge>
          )}
          
          {player.hasDeclared && (
            <Badge className="bg-green-600 text-xs">Declared</Badge>
          )}
          
          {isCurrentPlayer && !player.hasDropped && (
            <Badge className="bg-blue-600 text-xs animate-pulse">Playing</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
