import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useDiamondSportsData } from '@/hooks/useDiamondSportsData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { HeroSection } from './HeroSection';
import { SportsFilterBar } from './SportsFilterBar';
import { DiamondSportsCard } from './DiamondSportsCard';
import { LiveMatchTicker } from './LiveMatchTicker';
import { MatchCardMobile } from './MatchCardMobile';
import { Loader2, Trophy, Activity, Timer, TrendingUp, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const DiamondSportsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useDeviceDetection();
  const [filter, setFilter] = useState<'all' | 'live' | 'today' | 'upcoming'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'results'>('live');
  
  const {
    matches,
    sidConfigs,
    selectedSport,
    loading,
    stats,
    loadSIDConfigs,
    fetchMatches,
    fetchSportMatches,
    setSelectedSport
  } = useDiamondSportsData();

  // Load configurations on mount
  useEffect(() => {
    const initializeData = async () => {
      const configs = await loadSIDConfigs();
      console.log('Initialized with configs:', configs);
      // If we have configs but no selected sport, select the first active one
      if (configs && configs.length > 0 && !selectedSport) {
        const firstActive = configs.find(c => c.is_active);
        if (firstActive) {
          const sport = {
            sport_type: firstActive.sport_type,
            sid: firstActive.sid,
            label: firstActive.label,
            is_default: firstActive.is_default
          };
          setSelectedSport(sport);
          await fetchMatches(sport);
        }
      }
    };
    
    initializeData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch matches when selected sport changes
  useEffect(() => {
    if (selectedSport) {
      fetchMatches(selectedSport, true);
    }
  }, [selectedSport, fetchMatches]);

  const handleRefresh = async () => {
    if (!selectedSport) {
      toast.error('Please select a sport first');
      return;
    }
    await fetchMatches(selectedSport);
  };

  const handleSportChange = async (sportType: string) => {
    await fetchSportMatches(sportType);
  };

  // Get available sports from SID configs
  const availableSports = sidConfigs
    .filter(config => config.is_active)
    .map(config => config.sport_type);

  // Filter matches based on tab
  const getFilteredMatches = () => {
    if (!matches || matches.length === 0) return [];
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let filteredMatches = matches;
    
    // Filter by tab
    if (activeTab === 'live') {
      filteredMatches = matches.filter(match => 
        match.status?.toLowerCase() === 'live' || 
        match.status?.toLowerCase() === 'in_play' ||
        match.status?.toLowerCase() === 'in play'
      );
    } else if (activeTab === 'upcoming') {
      filteredMatches = matches.filter(match => {
        const matchDate = new Date(match.startTime || match.date || match.datetime);
        return matchDate > now && (
          match.status?.toLowerCase() === 'scheduled' ||
          match.status?.toLowerCase() === 'upcoming' ||
          !match.status
        );
      });
    } else if (activeTab === 'results') {
      filteredMatches = matches.filter(match => 
        match.status?.toLowerCase() === 'completed' ||
        match.status?.toLowerCase() === 'finished' ||
        match.status?.toLowerCase() === 'ended'
      );
    }
    
    // Apply additional filter for upcoming matches
    if (activeTab === 'upcoming' && filter === 'today') {
      filteredMatches = filteredMatches.filter(match => {
        const matchDate = new Date(match.startTime || match.date || match.datetime);
        return matchDate >= today && matchDate < tomorrow;
      });
    }
    
    return filteredMatches;
  };

  const filteredMatches = getFilteredMatches();
  const liveCount = matches.filter(m => 
    m.status?.toLowerCase() === 'live' || 
    m.status?.toLowerCase() === 'in_play' ||
    m.status?.toLowerCase() === 'in play'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      {/* Hero Section */}
      <HeroSection
        sport={selectedSport?.sport_type || 'cricket'}
        liveMatches={stats.liveMatches}
        todayMatches={stats.upcomingMatches}
      />

      {/* Live Match Ticker */}
      {liveCount > 0 && (
        <LiveMatchTicker matches={filteredMatches.filter(m => 
          m.status?.toLowerCase() === 'live' || 
          m.status?.toLowerCase() === 'in_play'
        )} />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Bar with Refresh Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1">
            <SportsFilterBar
              filter={filter}
              onFilterChange={setFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Sports Selection */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Select Sport
            </h3>
            {selectedSport && (
              <Badge variant="secondary" className="capitalize">
                {selectedSport.sport_type}
              </Badge>
            )}
          </div>
          
          {availableSports.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Loading sports...</span>
            </div>
          ) : isMobile ? (
            <Select 
              value={selectedSport?.sport_type || ''} 
              onValueChange={handleSportChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a sport to view matches" />
              </SelectTrigger>
              <SelectContent>
                {availableSports.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    <div className="flex items-center gap-2">
                      {sport === 'cricket' && <Trophy className="h-4 w-4" />}
                      {sport === 'football' && <Activity className="h-4 w-4" />}
                      {sport === 'tennis' && <Timer className="h-4 w-4" />}
                      {sport === 'basketball' && <TrendingUp className="h-4 w-4" />}
                      {sport === 'hockey' && <Activity className="h-4 w-4" />}
                      <span className="capitalize">{sport.replace('-', ' ')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {availableSports.map((sport) => {
                  const isSelected = selectedSport?.sport_type === sport;
                  return (
                    <Button
                      key={sport}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => handleSportChange(sport)}
                      className={cn(
                        "flex-shrink-0 capitalize transition-all duration-200",
                        isSelected && "shadow-lg scale-105"
                      )}
                    >
                      {sport === 'cricket' && <Trophy className="h-4 w-4 mr-2" />}
                      {sport === 'football' && <Activity className="h-4 w-4 mr-2" />}
                      {sport === 'tennis' && <Timer className="h-4 w-4 mr-2" />}
                      {sport === 'basketball' && <TrendingUp className="h-4 w-4 mr-2" />}
                      {sport === 'hockey' && <Activity className="h-4 w-4 mr-2" />}
                      {sport.replace('-', ' ')}
                    </Button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
          
          {!selectedSport && availableSports.length > 0 && (
            <p className="text-sm text-muted-foreground mt-3 text-center bg-muted/50 p-2 rounded-md">
              👆 Please select a sport above to view available matches
            </p>
          )}
        </Card>

        {/* Matches Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live
              {liveCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1">
                  {liveCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <Card className="p-8 text-center">
                {activeTab === 'live' && <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />}
                {activeTab === 'upcoming' && <Timer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />}
                {activeTab === 'results' && <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />}
                <p className="text-muted-foreground">
                  {activeTab === 'live' && `No live ${selectedSport?.sport_type || 'sports'} matches at the moment`}
                  {activeTab === 'upcoming' && `No upcoming ${selectedSport?.sport_type || 'sports'} matches scheduled`}
                  {activeTab === 'results' && `No recent ${selectedSport?.sport_type || 'sports'} results available`}
                </p>
                {!selectedSport && (
                  <p className="text-sm text-muted-foreground mt-2">Please select a sport to view matches</p>
                )}
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-4"
              )}>
                {filteredMatches.map((match: any) => (
                  <DiamondSportsCard
                    key={match.id || match.eventId || match.diamondId}
                    match={match}
                    sport={selectedSport?.sport_type || 'cricket'}
                    showOdds={true}
                    showLiveTV={activeTab === 'live'}
                  />
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};