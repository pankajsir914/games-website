import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Activity, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import cricketBg from '@/assets/cricket-bg.jpg';
import footballBg from '@/assets/football-bg.jpg';
import basketballBg from '@/assets/basketball-bg.jpg';
import tennisBg from '@/assets/tennis-bg.jpg';
import hockeyBg from '@/assets/hockey-bg.jpg';
import sportsGenericBg from '@/assets/sports-generic-bg.jpg';

interface HeroSectionProps {
  sport: string;
  liveMatches: number;
  todayMatches: number;
}

const getSportBackground = (sport: string) => {
  switch (sport) {
    case 'cricket': return cricketBg;
    case 'football': return footballBg;
    case 'basketball': return basketballBg;
    case 'tennis': return tennisBg;
    case 'hockey': return hockeyBg;
    default: return sportsGenericBg;
  }
};

export const HeroSection: React.FC<HeroSectionProps> = ({ sport, liveMatches, todayMatches }) => {
  const background = getSportBackground(sport);

  return (
    <div className="relative h-[300px] md:h-[400px] overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            {sport.charAt(0).toUpperCase() + sport.slice(1).replace('-', ' ')}
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Live scores, upcoming fixtures, and betting opportunities
          </p>

          {/* Live Stats */}
          <div className="flex justify-center gap-4 pt-4">
            {liveMatches > 0 && (
              <Badge variant="destructive" className="px-4 py-2 text-sm md:text-base">
                <Activity className="h-4 w-4 mr-2 animate-pulse" />
                {liveMatches} LIVE
              </Badge>
            )}
            {todayMatches > 0 && (
              <Badge variant="secondary" className="px-4 py-2 text-sm md:text-base">
                <Trophy className="h-4 w-4 mr-2" />
                {todayMatches} Today
              </Badge>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-3 pt-2">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <TrendingUp className="h-4 w-4 mr-2" />
              Place Bet
            </Button>
            <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/10">
              <Sparkles className="h-4 w-4 mr-2" />
              View Odds
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Animated Gradient Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
    </div>
  );
};