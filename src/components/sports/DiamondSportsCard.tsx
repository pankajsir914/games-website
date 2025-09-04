import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Tv,
  Activity,
  DollarSign,
  PlayCircle
} from 'lucide-react';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { toast } from 'sonner';

interface DiamondSportsCardProps {
  match: any;
  sport: string;
  showOdds?: boolean;
  showLiveTV?: boolean;
  onBetClick?: (match: any, odds: any) => void;
}

export const DiamondSportsCard: React.FC<DiamondSportsCardProps> = ({
  match,
  sport,
  showOdds = true,
  showLiveTV = true,
  onBetClick
}) => {
  const { getOdds, getLiveTv, getSportsScore } = useDiamondSportsAPI();
  const [odds, setOdds] = useState<any>(null);
  const [liveScore, setLiveScore] = useState<any>(null);
  const [liveTvUrl, setLiveTvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match.diamondId || match.betfairId) {
      fetchEnhancedData();
    }
  }, [match.diamondId, match.betfairId]);

  const fetchEnhancedData = async () => {
    setLoading(true);
    try {
      const eventId = match.diamondId || match.betfairId;
      
      // Fetch odds
      if (showOdds && eventId) {
        const oddsResponse = await getOdds(eventId);
        if (oddsResponse?.success) {
          setOdds(oddsResponse.data);
        }
      }

      // Fetch live score for live matches
      if (match.status === 'live' && eventId) {
        const scoreResponse = await getSportsScore(eventId);
        if (scoreResponse?.success) {
          setLiveScore(scoreResponse.data);
        }
      }

      // Fetch live TV URL
      if (showLiveTV && match.status === 'live' && eventId) {
        const tvResponse = await getLiveTv(eventId);
        if (tvResponse?.success) {
          setLiveTvUrl(tvResponse.data?.url || tvResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching enhanced data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchLive = () => {
    if (liveTvUrl) {
      window.open(liveTvUrl, '_blank');
    } else {
      toast.error('Live stream not available');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return (
          <Badge className="bg-red-500 text-white animate-pulse">
            <Activity className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        );
      case 'scheduled':
      case 'upcoming':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Upcoming
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline">
            <Trophy className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {match.marketCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {match.marketCount} Markets
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <Calendar className="inline w-3 h-3 mr-1" />
              {formatDate(match.start_time)}
              <Clock className="inline w-3 h-3 ml-2 mr-1" />
              {formatTime(match.start_time)}
            </p>
          </div>
          {match.status === 'live' && liveTvUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleWatchLive}
              className="gap-1"
            >
              <Tv className="w-3 h-3" />
              Watch
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Teams */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">{match.home_team}</span>
            <span className="text-2xl font-bold">
              {liveScore?.homeScore || match.score?.home || '-'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">{match.away_team}</span>
            <span className="text-2xl font-bold">
              {liveScore?.awayScore || match.score?.away || '-'}
            </span>
          </div>
        </div>

        {/* Live Score Updates */}
        {match.status === 'live' && liveScore?.currentStatus && (
          <div className="bg-primary/5 rounded-lg p-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {liveScore.currentStatus}
            </p>
          </div>
        )}

        {/* Odds Display */}
        {showOdds && odds && !loading && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Betting Odds</p>
            <div className="grid grid-cols-3 gap-2">
              {odds.selections?.slice(0, 3).map((selection: any, idx: number) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => onBetClick?.(match, selection)}
                  className="flex-col gap-1 h-auto py-2"
                >
                  <span className="text-xs">{selection.name}</span>
                  <span className="font-bold">{selection.price || '-'}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex justify-between items-center w-full">
          {match.betfairId && (
            <p className="text-xs text-muted-foreground">
              Betfair ID: {match.betfairId}
            </p>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => onBetClick?.(match, odds)}
            className="ml-auto"
          >
            <DollarSign className="w-3 h-3 mr-1" />
            Place Bet
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};