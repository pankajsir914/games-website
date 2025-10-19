
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Users, Trophy, TrendingUp } from 'lucide-react';
import { GameData } from '@/pages/Aviator';

interface GameStatsProps {
  gameData: GameData;
}

const GameStats = ({ gameData }: GameStatsProps) => {
  // Fake live users data for demonstration
  const liveUsers = [
    { name: 'Player1', cashOut: '2.45x', amount: '₹245' },
    { name: 'Player2', cashOut: '1.78x', amount: '₹178' },
    { name: 'Player3', cashOut: '3.21x', amount: '₹642' },
    { name: 'Player4', cashOut: '1.34x', amount: '₹134' },
  ];

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier < 2) return 'bg-gaming-danger/10 text-gaming-danger';
    if (multiplier < 5) return 'bg-gaming-gold/10 text-gaming-gold';
    return 'bg-gaming-success/10 text-gaming-success';
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Crash History */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-primary" />
            <span>Recent Crashes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {gameData.crashHistory.length > 0 ? (
              gameData.crashHistory.map((crash, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  <Badge className={getMultiplierColor(crash)}>
                    {crash.toFixed(2)}x
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No crash history yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-gaming-gold" />
            <span>Top Winners</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Badge className="bg-gaming-gold/10 text-gaming-gold">1</Badge>
                <span>AviatorPro</span>
              </div>
              <div className="text-right">
                <div className="text-gaming-success font-semibold">45.67x</div>
                <div className="text-xs text-muted-foreground">₹45,670</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Badge className="bg-muted text-muted-foreground">2</Badge>
                <span>SkyWalker</span>
              </div>
              <div className="text-right">
                <div className="text-gaming-success font-semibold">23.45x</div>
                <div className="text-xs text-muted-foreground">₹23,450</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Badge className="bg-muted text-muted-foreground">3</Badge>
                <span>FlightMaster</span>
              </div>
              <div className="text-right">
                <div className="text-gaming-success font-semibold">12.89x</div>
                <div className="text-xs text-muted-foreground">₹12,890</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Tips */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• Set auto cash-out to secure profits</p>
            <p>• Start with smaller bets to learn</p>
            <p>• Don't chase losses</p>
            <p>• The plane can crash at any time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameStats;
