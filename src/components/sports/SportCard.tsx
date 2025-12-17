import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trophy, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import sport icons (you can replace these with actual sport icons)
import cricketBg from '@/assets/cricket-bg.jpg';
import footballBg from '@/assets/football-bg.jpg';
import basketballBg from '@/assets/basketball-bg.jpg';
import tennisBg from '@/assets/tennis-bg.jpg';
import hockeyBg from '@/assets/hockey-bg.jpg';
import sportsGenericBg from '@/assets/sports-generic-bg.jpg';

interface SportCardProps {
  sport: string;
  isSelected: boolean;
  onClick: () => void;
  liveCount?: number;
}

const getSportDetails = (sport: string) => {
  const sportMap: Record<string, { icon: string; color: string; bg: string }> = {
    cricket: { icon: '🏏', color: 'from-green-500 to-green-600', bg: cricketBg },
    football: { icon: '⚽', color: 'from-blue-500 to-blue-600', bg: footballBg },
    basketball: { icon: '🏀', color: 'from-orange-500 to-orange-600', bg: basketballBg },
    tennis: { icon: '🎾', color: 'from-purple-500 to-purple-600', bg: tennisBg },
    hockey: { icon: '🏒', color: 'from-cyan-500 to-cyan-600', bg: hockeyBg },
    kabaddi: { icon: '🤼', color: 'from-red-500 to-red-600', bg: sportsGenericBg },
    baseball: { icon: '⚾', color: 'from-indigo-500 to-indigo-600', bg: sportsGenericBg },
    'table-tennis': { icon: '🏓', color: 'from-pink-500 to-pink-600', bg: sportsGenericBg },
    boxing: { icon: '🥊', color: 'from-gray-500 to-gray-600', bg: sportsGenericBg },
  };
  
  return sportMap[sport] || { icon: '🏆', color: 'from-primary to-primary/80', bg: sportsGenericBg };
};

export const SportCard: React.FC<SportCardProps> = ({ sport, isSelected, onClick, liveCount = 0 }) => {
  const details = getSportDetails(sport);
  const displayName = sport.replace('-', ' ');

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          "hover:shadow-xl hover:shadow-primary/10",
          isSelected 
            ? "ring-2 ring-primary shadow-lg shadow-primary/20" 
            : "hover:ring-1 hover:ring-primary/50"
        )}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${details.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        
        {/* Gradient Overlay */}
        <div className={cn(
          "absolute inset-0 opacity-20 bg-gradient-to-br",
          isSelected ? "from-primary/30 to-accent/30" : "from-transparent to-transparent"
        )} />

        {/* Content */}
        <div className="relative p-4 space-y-3">
          {/* Icon and Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{details.icon}</span>
              <h3 className="font-semibold capitalize text-sm md:text-base">{displayName}</h3>
            </div>
            {liveCount > 0 && (
              <Badge variant="destructive" className="animate-pulse px-2 py-1">
                <Activity className="h-3 w-3 mr-1" />
                {liveCount}
              </Badge>
            )}
          </div>

          {/* Stats */}
          {isSelected && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trophy className="h-3 w-3" />
              <span>Active</span>
            </div>
          )}
        </div>

        {/* Bottom Gradient Bar */}
        {isSelected && (
          <div className={cn("absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r", details.color)} />
        )}
      </Card>
    </motion.div>
  );
};