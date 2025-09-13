import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useSportsData, type SportsMatch } from '@/hooks/useSportsData';
import { EnhancedSportsMatchCard } from '@/components/sports/EnhancedSportsMatchCard';
import { BetSlip } from '@/components/sports/BetSlip';

// Import sports background images
import cricketBg from '@/assets/cricket-bg.jpg';
import footballBg from '@/assets/football-bg.jpg';
import basketballBg from '@/assets/basketball-bg.jpg';
import tennisBg from '@/assets/tennis-bg.jpg';
import hockeyBg from '@/assets/hockey-bg.jpg';
import sportsGenericBg from '@/assets/sports-generic-bg.jpg';

// Function to get background image based on sport type
const getSportBackground = (sport: string): string => {
  if (!sport) {
    return sportsGenericBg;
  }
  
  switch (sport.toLowerCase()) {
    case 'cricket':
      return cricketBg;
    case 'football':
      return footballBg;
    case 'basketball':
      return basketballBg;
    case 'tennis':
      return tennisBg;
    case 'hockey':
      return hockeyBg;
    default:
      return sportsGenericBg;
  }
};

const SportsMatches: React.FC = () => {
  const { sport, type } = useParams<{ sport: string; type: string }>();
  const navigate = useNavigate();
  const [selectedBet, setSelectedBet] = useState<{ odds: any; type: string } | null>(null);
  
  // Convert URL params back to proper format
  const matchType = type?.replace('-', ' ').replace('matches', '').trim() as 'live' | 'upcoming' | 'results';
  const sportType = sport as string;
  
  const { data, loading, error, refresh } = useSportsData(
    sportType, 
    matchType === 'live' ? 'live' : matchType === 'upcoming' ? 'upcoming' : 'results'
  );

  useEffect(() => {
    document.title = `${sportType?.charAt(0).toUpperCase()}${sportType?.slice(1)} ${matchType?.charAt(0).toUpperCase()}${matchType?.slice(1)} Matches`;
  }, [sportType, matchType]);

  const handleBetSelect = (odds: any, type: string) => {
    setSelectedBet({ odds, type });
  };

  const sportBackground = getSportBackground(sportType);

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'live-matches':
        return 'Live Matches';
      case 'upcoming-matches':
        return 'Upcoming Matches';
      case 'results':
        return 'Results';
      default:
        return type?.charAt(0).toUpperCase() + type?.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40">
        <Navigation />
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/sports')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sports
                </Button>
                <Button variant="ghost" size="sm" onClick={refresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight capitalize">
                {sportType} - {getTypeDisplayName(type || '')}
              </h1>
              <p className="text-muted-foreground">
                All {matchType} matches for {sportType}
              </p>
            </div>

            {/* Content */}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <Loader2 className="h-4 w-4 animate-spin" /> 
                Loading matches...
              </div>
            )}
            
            {error && (
              <div className="text-destructive mb-6 p-4 bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}
            
            {!loading && !error && (!data || data.length === 0) && (
              <div className="text-muted-foreground text-center py-12">
                No {matchType} matches found for {sportType}.
              </div>
            )}
            
            {data && data.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-sm">
                    {data.length} match{data.length !== 1 ? 'es' : ''} found
                  </Badge>
                </div>
                
                {/* Matches Grid */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {data.map((match, idx) => (
                    <EnhancedSportsMatchCard
                      key={`${match.id ?? 'x'}-${idx}`}
                      match={match}
                      sport={sportType}
                      isLive={matchType === 'live'}
                      showOdds={matchType !== 'results'}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Bet Slip Sidebar */}
          <div className="w-80 hidden lg:block">
            <div className="sticky top-24">
              <BetSlip
                match={selectedBet ? data?.[0] as SportsMatch : null as any}
                selectedBet={selectedBet}
                onClose={() => setSelectedBet(null)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SportsMatches;