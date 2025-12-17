import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveMatchTickerProps {
  matches: any[];
}

export const LiveMatchTicker: React.FC<LiveMatchTickerProps> = ({ matches }) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-destructive/10 via-destructive/5 to-destructive/10 border-y border-destructive/20 py-3 overflow-hidden">
      <div className="flex items-center gap-4">
        {/* Live Indicator */}
        <div className="flex-shrink-0 px-4">
          <Badge variant="destructive" className="animate-pulse">
            <Activity className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
        </div>

        {/* Scrolling Matches */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex gap-6 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 20,
                ease: "linear",
              },
            }}
          >
            {/* Duplicate matches for seamless loop */}
            {[...matches, ...matches].map((match, index) => (
              <div
                key={`${match.id}-${index}`}
                className="flex items-center gap-2 text-sm"
              >
                <span className="font-medium">{match.teams?.home || match.homeTeam}</span>
                <span className="text-destructive font-bold">
                  {match.scores?.home || match.homeScore || 0}
                </span>
                <span className="text-muted-foreground">vs</span>
                <span className="text-destructive font-bold">
                  {match.scores?.away || match.awayScore || 0}
                </span>
                <span className="font-medium">{match.teams?.away || match.awayTeam}</span>
                <span className="text-muted-foreground">•</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bet Now CTA */}
        <div className="flex-shrink-0 px-4">
          <Badge variant="outline" className="border-primary text-primary cursor-pointer hover:bg-primary/10">
            <TrendingUp className="h-3 w-3 mr-1" />
            Bet Now
          </Badge>
        </div>
      </div>
    </div>
  );
};