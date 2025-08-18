import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  useEffect(() => {
    if (widgetRef.current && (window as any).CDOrgAPI) {
      // Clear any existing widget
      widgetRef.current.innerHTML = '';
      
      try {
        // Initialize the widget
        (window as any).CDOrgAPI.widget({
          container: widgetRef.current,
          sport: sport,
          league: league,
          theme: theme,
          height: height,
          width: '100%'
        });
      } catch (error) {
        console.error('Failed to initialize sports widget:', error);
        // Fallback content
        widgetRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full text-muted-foreground">
            <div class="text-center">
              <p>Sports widget loading...</p>
              <p class="text-sm">Please check your internet connection</p>
            </div>
          </div>
        `;
      }
    }
  }, [sport, league, theme, height]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Live Sports Scores</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({sport} - {league})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={widgetRef}
          style={{ height: `${height}px` }}
          className="w-full border rounded-lg overflow-hidden bg-background"
        >
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Loading sports widget...</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Widget configurations for different sports
export const WIDGET_CONFIGS = {
  football: {
    'premier-league': 'Premier League',
    'la-liga': 'La Liga',
    'serie-a': 'Serie A',
    'bundesliga': 'Bundesliga',
    'champions-league': 'Champions League'
  },
  cricket: {
    'ipl': 'IPL',
    'international': 'International',
    'county': 'County Championship'
  },
  basketball: {
    'nba': 'NBA',
    'euroleague': 'Euroleague'
  },
  tennis: {
    'atp': 'ATP Tour',
    'wta': 'WTA Tour'
  }
};