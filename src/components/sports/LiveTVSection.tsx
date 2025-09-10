import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tv, PlayCircle, Clock, Trophy, Users, Activity, TrendingUp } from 'lucide-react';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { cn } from '@/lib/utils';

interface LiveTVSectionProps {
  matchId: string;
  match: any;
  isLive?: boolean;
}

const LiveTVSection: React.FC<LiveTVSectionProps> = ({ matchId, match, isLive = false }) => {
  const { getLiveTv, getSportsScore, getDiamondIframeTV, getAllGameDetails, getHlsTv, callAPI } = useDiamondSportsAPI();
  const [liveData, setLiveData] = useState<any>(null);
  const [score, setScore] = useState<any>(null);
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [activeTab, setActiveTab] = useState('tv');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live data
  useEffect(() => {
    const fetchLiveData = async () => {
      if (!matchId) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching live data for match:', matchId);
        
        // Try multiple endpoints for live TV
        let tvData = await getDiamondIframeTV(matchId);
        if (!tvData?.success) {
          tvData = await getLiveTv(matchId);
        }
        if (!tvData?.success) {
          tvData = await getHlsTv(matchId);
        }
        
        // Try to get live TV URL from different endpoints
        if (!tvData?.success) {
          const response = await callAPI('sports/livetv', { 
            params: { eventId: matchId } 
          });
          if (response?.success) {
            tvData = response;
          }
        }

        if (tvData?.success && tvData.data) {
          console.log('Live TV data:', tvData.data);
          // Extract iframe URL or streaming link
          if (tvData.data.iframeUrl || tvData.data.url || tvData.data.liveUrl) {
            setLiveData({
              iframeUrl: tvData.data.iframeUrl || tvData.data.url || tvData.data.liveUrl
            });
          }
        }

        // Fetch score
        const scoreResponse = await getSportsScore(matchId);
        if (scoreResponse?.success && scoreResponse.data) {
          console.log('Score data:', scoreResponse.data);
          setScore(scoreResponse.data);
        }

        // Fetch game details
        const detailsResponse = await getAllGameDetails(matchId);
        if (detailsResponse?.success && detailsResponse.data) {
          console.log('Game details:', detailsResponse.data);
          setGameDetails(detailsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching live data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveData();
    
    // Refresh data every 10 seconds for live matches
    if (isLive) {
      const interval = setInterval(fetchLiveData, 10000);
      return () => clearInterval(interval);
    }
  }, [matchId, isLive, callAPI]);

  // Countdown timer for upcoming matches
  useEffect(() => {
    if (!isLive && match?.startTime) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const matchTime = new Date(match.startTime).getTime();
        const distance = matchTime - now;

        if (distance < 0) {
          setCountdown('Match Started');
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (days > 0) {
          setCountdown(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${minutes}m ${seconds}s`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [isLive, match?.startTime]);

  // Render live score for cricket
  const renderCricketScore = () => {
    if (!score) return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Batting</span>
            <Badge variant="secondary">{score.battingTeam}</Badge>
          </div>
          <div className="text-3xl font-bold">{score.runs}/{score.wickets}</div>
          <div className="text-sm text-muted-foreground">
            Overs: {score.overs} | RR: {score.runRate}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Target</span>
            <Badge variant="outline">{score.target || '-'}</Badge>
          </div>
          <div className="text-sm space-y-1">
            <div>Required: {score.required || '-'}</div>
            <div>RRR: {score.requiredRate || '-'}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isLive ? (
              <>
                <Activity className="h-5 w-5 text-destructive animate-pulse" />
                Live Match
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                Match Details
              </>
            )}
          </CardTitle>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLive ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tv" className="flex items-center gap-2">
                <Tv className="h-4 w-4" />
                Live TV
              </TabsTrigger>
              <TabsTrigger value="score" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Score
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tv" className="mt-4">
              {liveData?.iframeUrl ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={liveData.iframeUrl}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    allowFullScreen
                    frameBorder="0"
                    title="Live Match Stream"
                  />
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-12 text-center">
                  <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Live stream will appear here when available</p>
                  <p className="text-sm text-muted-foreground mt-2">Check back when the match starts</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="score" className="mt-4">
              {renderCricketScore()}
              {!score && (
                <div className="text-center py-8 text-muted-foreground">
                  Live score will update automatically
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="mt-4">
              {gameDetails ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{gameDetails.boundaries || '0'}</p>
                    <p className="text-sm text-muted-foreground">Boundaries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{gameDetails.sixes || '0'}</p>
                    <p className="text-sm text-muted-foreground">Sixes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{gameDetails.extras || '0'}</p>
                    <p className="text-sm text-muted-foreground">Extras</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{gameDetails.partnerships || '0'}</p>
                    <p className="text-sm text-muted-foreground">Partnership</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Match statistics will appear here
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // Upcoming match details
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-6 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground mb-2">Match starts in</p>
              <p className="text-3xl font-bold">{countdown || 'Calculating...'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Venue</p>
                <p className="font-medium">{match?.venue || 'TBA'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Format</p>
                <p className="font-medium">{match?.format || 'T20'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Series</p>
                <p className="font-medium">{match?.league || 'Tournament'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Weather</p>
                <p className="font-medium">{match?.weather || 'Clear'}</p>
              </div>
            </div>

            {/* Head to Head Stats */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Head to Head</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">5</p>
                  <p className="text-sm text-muted-foreground">{match?.team1} Wins</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-sm text-muted-foreground">Draws</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">3</p>
                  <p className="text-sm text-muted-foreground">{match?.team2} Wins</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveTVSection;