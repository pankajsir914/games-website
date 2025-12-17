import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Activity, Trophy, Users, Zap, Globe } from 'lucide-react';

interface SportsWidgetProps {
  sport?: string;
  league?: string;
  theme?: 'light' | 'dark';
  height?: number;
}

export function SportsWidget({ 
  sport = 'football', 
  league = 'premier-league',
  theme = 'light',
  height = 400 
}: SportsWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(sport);
  const [selectedLeague, setSelectedLeague] = useState(league);

  useEffect(() => {
    if (widgetRef.current && (window as any).CDOrgAPI) {
      setIsLoading(true);
      // Clear any existing widget
      widgetRef.current.innerHTML = '';
      
      try {
        // Initialize the widget with animation delay
        setTimeout(() => {
          (window as any).CDOrgAPI.widget({
            container: widgetRef.current,
            sport: selectedSport,
            league: selectedLeague,
            theme: theme,
            height: height - 60, // Account for header
            width: '100%'
          });
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to initialize sports widget:', error);
        setIsLoading(false);
        // Enhanced fallback content
        if (widgetRef.current) {
          widgetRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full text-muted-foreground bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-dashed border-muted">
              <div class="text-center space-y-4 p-8">
                <div class="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-lg">Sports Widget Loading...</p>
                  <p class="text-sm text-muted-foreground mt-1">Connecting to live sports data</p>
                </div>
              </div>
            </div>
          `;
        }
      }
    }
  }, [selectedSport, selectedLeague, theme, height]);

  const handleSportChange = (newSport: string) => {
    setSelectedSport(newSport);
    const defaultLeagues: Record<string, string> = {
      football: 'premier-league',
      cricket: 'ipl',
      basketball: 'nba',
      tennis: 'atp'
    };
    setSelectedLeague(defaultLeagues[newSport] || 'premier-league');
  };

  return (
    <div className="w-full animate-fade-in">
      <Card className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover-scale">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Live Sports Center
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs animate-fade-in">
                    <Globe className="h-3 w-3 mr-1" />
                    {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="text-xs animate-fade-in">
                    <Trophy className="h-3 w-3 mr-1" />
                    {selectedLeague.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            </div>
          </div>
          
          {/* Sport Selection Tabs */}
          <Tabs value={selectedSport} onValueChange={handleSportChange} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-4 bg-primary/5">
              <TabsTrigger value="football" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Football
              </TabsTrigger>
              <TabsTrigger value="cricket" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Cricket
              </TabsTrigger>
              <TabsTrigger value="basketball" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Basketball
              </TabsTrigger>
              <TabsTrigger value="tennis" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                Tennis
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="relative z-10 pt-0">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-20 animate-fade-in">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-l-secondary rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Loading live sports data...</p>
                    <p className="text-xs text-muted-foreground">Please wait a moment</p>
                  </div>
                </div>
              </div>
            )}
            
            <div 
              ref={widgetRef}
              style={{ height: `${height - 60}px` }}
              className="w-full border rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted/20 relative transition-all duration-300"
            >
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-4 animate-scale-in">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                    <Activity className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold">Initializing Sports Widget...</p>
                    <p className="text-sm text-muted-foreground">Connecting to live data feeds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-2xl opacity-30"></div>
      </Card>
    </div>
  );
}

// Enhanced widget configurations for different sports
export const WIDGET_CONFIGS = {
  football: {
    'premier-league': 'Premier League',
    'la-liga': 'La Liga',
    'serie-a': 'Serie A',
    'bundesliga': 'Bundesliga',
    'champions-league': 'Champions League',
    'world-cup': 'World Cup'
  },
  cricket: {
    'ipl': 'IPL',
    'international': 'International',
    'county': 'County Championship',
    't20-world-cup': 'T20 World Cup',
    'the-hundred': 'The Hundred'
  },
  basketball: {
    'nba': 'NBA',
    'euroleague': 'Euroleague',
    'fiba': 'FIBA World Cup'
  },
  tennis: {
    'atp': 'ATP Tour',
    'wta': 'WTA Tour',
    'grand-slam': 'Grand Slam'
  }
};