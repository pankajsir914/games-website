import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Trophy, Clock, AlertCircle } from 'lucide-react';
import { useSimpleSportsData } from '@/hooks/useSimpleSportsData';
import { cn } from '@/lib/utils';

export const SimpleSportsDashboard: React.FC = () => {
  const {
    sports,
    selectedSport,
    matches,
    loading,
    error,
    selectSport,
    refresh
  } = useSimpleSportsData();

  const liveMatches = matches.filter(m => m.isLive);
  const upcomingMatches = matches.filter(m => !m.isLive);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Sports Matches</h1>
        <Button
          onClick={refresh}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Sports Selection */}
      <div className="bg-card rounded-lg p-4 border">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Select Sport</h2>
        <div className="flex flex-wrap gap-2">
          {sports.map((sport) => (
            <Button
              key={sport.id}
              onClick={() => selectSport(sport)}
              variant={selectedSport?.id === sport.id ? "default" : "outline"}
              className={cn(
                "transition-all",
                selectedSport?.id === sport.id && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <span className="mr-2 text-lg">{sport.icon}</span>
              {sport.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Error loading matches</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Matches Display */}
      {!loading && !error && selectedSport && (
        <div className="space-y-6">
          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Live Matches
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liveMatches.map((match) => (
                  <MatchCard key={match.id} match={match} isLive />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Matches */}
          {upcomingMatches.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Upcoming Matches
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}

          {/* No Matches */}
          {matches.length === 0 && (
            <Card className="p-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matches available</h3>
              <p className="text-muted-foreground">
                {selectedSport ? `No ${selectedSport.label} matches found` : 'Select a sport to view matches'}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* No Sport Selected */}
      {!selectedSport && !loading && (
        <Card className="p-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Sport</h3>
          <p className="text-muted-foreground">
            Choose a sport from above to view available matches
          </p>
        </Card>
      )}
    </div>
  );
};

interface MatchCardProps {
  match: any;
  isLive?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, isLive }) => {
  return (
    <Card className={cn(
      "p-6 hover:shadow-lg transition-shadow cursor-pointer",
      isLive && "border-red-500/50 bg-red-50/5"
    )}>
      {isLive && (
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-xs font-semibold text-red-500">LIVE</span>
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{match.team1}</p>
            {match.score && (
              <p className="text-sm text-muted-foreground">{match.score.split('-')[0]}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">VS</span>
          <div className="space-y-1 text-right">
            <p className="font-semibold text-foreground">{match.team2}</p>
            {match.score && (
              <p className="text-sm text-muted-foreground">{match.score.split('-')[1]}</p>
            )}
          </div>
        </div>
        
        {!isLive && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {new Date(match.date).toLocaleDateString()}
              {match.time && ` at ${match.time}`}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};