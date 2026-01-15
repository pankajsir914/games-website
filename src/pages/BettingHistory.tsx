import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy, Target, Calendar, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAutoSettlement } from '@/hooks/useAutoSettlement';
import { cn } from '@/lib/utils';

const BettingHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { settleAllMarkets } = useAutoSettlement();
  const [activeTab, setActiveTab] = useState('sports');
  const settlementAttemptedRef = useRef<Set<string>>(new Set()); // Track settled matches
  
  // Date range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Get date range for filtering
  const getDateRange = () => {
    if (!startDate && !endDate) return null;
    
    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
    
    return { start, end };
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  // Fetch sports bets from new sports_market_bets table
  const { data: sportsBets, isLoading: sportsBetsLoading } = useQuery({
    queryKey: ['user-sports-bets', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const dateRange = getDateRange();
      
      // Fetch from new sports_market_bets table with market details
      let query = (supabase as any)
        .from('sports_market_bets')
        .select(`
          *,
          sports_markets (
            id,
            market_name,
            market_type,
            selection,
            event_id,
            sport,
            odds_back,
            odds_lay,
            rate_yes,
            rate_no,
            sportsid,
            gmid,
            status,
            meta
          )
        `)
        .eq('user_id', user.id);
      
      if (dateRange?.start) {
        query = query.gte('created_at', dateRange.start.toISOString());
      }
      if (dateRange?.end) {
        query = query.lte('created_at', dateRange.end.toISOString());
      }
      
      const { data: marketBets, error: marketBetsError } = await query
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (marketBetsError) {
        console.error('Error fetching market bets:', marketBetsError);
      }
      
      // Also fetch from old sports_bets table for backward compatibility
      let oldBetsQuery = (supabase as any)
        .from('sports_bets')
        .select('*')
        .eq('user_id', user.id);
      
      if (dateRange?.start) {
        oldBetsQuery = oldBetsQuery.gte('created_at', dateRange.start.toISOString());
      }
      if (dateRange?.end) {
        oldBetsQuery = oldBetsQuery.lte('created_at', dateRange.end.toISOString());
      }
      
      const { data: oldBets, error: oldBetsError } = await oldBetsQuery
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (oldBetsError) {
        console.error('Error fetching old bets:', oldBetsError);
      }
      
      // Combine and format bets
      const formattedMarketBets = (marketBets || []).map((bet: any) => {
        // Preserve the original sports_markets object with all fields
        const marketData = bet.sports_markets || {};
        return {
          ...bet,
          source: 'market_bets',
          market_name: marketData.market_name,
          selection: marketData.selection || bet.selection,
          market_type: marketData.market_type || bet.market_type,
          sport: marketData.sport,
          odds: bet.odds || bet.rate_at_bet,
          rate: bet.rate_at_bet || bet.odds,
          stake: bet.stake,
          potential_win: bet.potential_profit,
          profit_loss: bet.profit_loss,
          bet_side: bet.bet_side,
          status: bet.status?.toUpperCase() || 'PLACED',
          // Preserve sports_markets with all fields for settlement
          sports_markets: {
            ...marketData,
            sportsid: marketData.sportsid,
            gmid: marketData.gmid,
            status: marketData.status
          }
        };
      });
      
      const formattedOldBets = (oldBets || []).map((bet: any) => ({
        ...bet,
        source: 'old_bets',
        market_type: bet.market_type || 'Market',
        status: bet.status?.toUpperCase() || 'PLACED'
      }));
      
      // Combine both sources
      return [...formattedMarketBets, ...formattedOldBets].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds to check for new bets
  });

  // Auto-settle markets for placed bets when BettingHistory page loads
  useEffect(() => {
    if (!sportsBets || sportsBets.length === 0 || !user) return;

    console.log('[BettingHistory Auto-Settle] Checking for placed bets to settle...');
    console.log('[BettingHistory Auto-Settle] Total bets:', sportsBets.length);
    console.log('[BettingHistory Auto-Settle] Sample bet structure:', sportsBets[0]);

    // Debug: Log all bets with their status
    const allMarketBets = sportsBets.filter((bet: any) => bet.source === 'market_bets');
    console.log('[BettingHistory Auto-Settle] Market bets:', allMarketBets.length);
    allMarketBets.forEach((bet: any, index: number) => {
      if (index < 5) { // Log first 5 bets
        console.log(`[BettingHistory Auto-Settle] Bet ${index}:`, {
          id: bet.id,
          status: bet.status,
          statusType: typeof bet.status,
          hasSportsMarkets: !!bet.sports_markets,
          sportsid: bet.sports_markets?.sportsid,
          gmid: bet.sports_markets?.gmid,
          event_id: bet.sports_markets?.event_id,
          sport: bet.sports_markets?.sport,
          meta: bet.sports_markets?.meta,
          marketId: bet.market_id,
          // Show full market structure for debugging
          marketStructure: bet.sports_markets
        });
      }
    });

    // Helper function to get sportsid from sport name
    const getSportsidFromSport = (sport: string): string | null => {
      const sportLower = (sport || '').toLowerCase();
      const mapping: Record<string, string> = {
        'cricket': '4',
        'football': '1',
        'soccer': '1',
        'tennis': '2',
        'basketball': '3',
        'hockey': '5',
        'ice-hockey': '19',
        'kabaddi': '66',
        'esoccer': '68',
        'horse-racing': '10',
        'greyhound-racing': '65',
        'wrestling': '69',
        'volleyball': '18',
        'badminton': '22',
        'snooker': '59',
        'darts': '57',
        'boxing': '6',
        'mma': '3',
        'american-football': '58',
        'e-games': '11',
        'futsal': '9',
        'motor-sports': '52',
        'politics': '40',
        'golf': '5',
        'rugby-league': '55',
        'beach-volleyball': '7',
        'handball': '39',
        'motogp': '16',
        'chess': '17',
        'formula1': '23',
        'cycling': '29',
        'motorbikes': '32'
      };
      return mapping[sportLower] || null;
    };

    // Filter placed bets from new market bets
    // Check status in multiple ways (case-insensitive)
    const placedMarketBets = sportsBets.filter((bet: any) => {
      const isMarketBet = bet.source === 'market_bets';
      const statusLower = String(bet.status || '').toLowerCase();
      const isPlaced = statusLower === 'placed';
      
      if (!isMarketBet || !isPlaced) return false;
      
      // Try multiple sources for sportsid and gmid
      let sportsid = bet.sports_markets?.sportsid || 
                    bet.sports_markets?.meta?.sportsid ||
                    bet.sports_markets?.meta?.sid;
      
      let gmid = bet.sports_markets?.gmid || 
                bet.sports_markets?.meta?.gmid ||
                bet.sports_markets?.meta?.matchId ||
                bet.sports_markets?.event_id; // Fallback to event_id
      
      // If sportsid is missing, try to derive from sport name
      if (!sportsid && bet.sports_markets?.sport) {
        sportsid = getSportsidFromSport(bet.sports_markets.sport);
      }
      
      const hasRequiredData = !!(sportsid && gmid);
      
      if (!hasRequiredData) {
        console.warn('[BettingHistory Auto-Settle] Placed bet missing sportsid/gmid:', {
          betId: bet.id,
          sportsid,
          gmid,
          sport: bet.sports_markets?.sport,
          event_id: bet.sports_markets?.event_id,
          meta: bet.sports_markets?.meta,
          sports_markets: bet.sports_markets
        });
      }
      
      return hasRequiredData;
    });

    console.log('[BettingHistory Auto-Settle] Filtered placed bets:', placedMarketBets.length);
    
    if (placedMarketBets.length === 0) {
      console.log('[BettingHistory Auto-Settle] No placed bets found with required data');
      // Log why bets were filtered out
      const placedButMissingData = sportsBets.filter((bet: any) => {
        const statusLower = String(bet.status || '').toLowerCase();
        return bet.source === 'market_bets' && statusLower === 'placed';
      });
      if (placedButMissingData.length > 0) {
        console.log('[BettingHistory Auto-Settle] Found', placedButMissingData.length, 'placed bets but missing sportsid/gmid');
        console.log('[BettingHistory Auto-Settle] Sample bet with missing data:', placedButMissingData[0]);
      }
      return;
    }

    console.log('[BettingHistory Auto-Settle] Found', placedMarketBets.length, 'placed bet(s)');

    // Group bets by match (sportsid + gmid)
    const betsByMatch = new Map<string, any[]>();
    
    console.log('[BettingHistory Auto-Settle] Grouping', placedMarketBets.length, 'placed bets...');
    
    placedMarketBets.forEach((bet: any, index: number) => {
      // Use the same fallback logic as filtering
      let sportsid = bet.sports_markets?.sportsid || 
                    bet.sports_markets?.meta?.sportsid ||
                    bet.sports_markets?.meta?.sid;
      
      let gmid = bet.sports_markets?.gmid || 
                bet.sports_markets?.meta?.gmid ||
                bet.sports_markets?.meta?.matchId ||
                bet.sports_markets?.event_id; // Fallback to event_id
      
      // If sportsid is missing, try to derive from sport name
      if (!sportsid && bet.sports_markets?.sport) {
        sportsid = getSportsidFromSport(bet.sports_markets.sport);
      }
      
      if (index < 3) {
        console.log(`[BettingHistory Auto-Settle] Grouping bet ${index}:`, {
          betId: bet.id,
          sportsid,
          gmid,
          sport: bet.sports_markets?.sport,
          event_id: bet.sports_markets?.event_id,
          meta: bet.sports_markets?.meta
        });
      }
      
      if (sportsid && gmid) {
        const matchKey = `${sportsid}_${gmid}`;
        if (!betsByMatch.has(matchKey)) {
          betsByMatch.set(matchKey, []);
        }
        betsByMatch.get(matchKey)!.push(bet);
        if (index < 3) {
          console.log(`[BettingHistory Auto-Settle] Added bet ${index} to match group:`, matchKey);
        }
      } else {
        console.warn('[BettingHistory Auto-Settle] Bet passed filter but missing sportsid/gmid in grouping:', {
          betId: bet.id,
          sportsid,
          gmid,
          sport: bet.sports_markets?.sport,
          event_id: bet.sports_markets?.event_id,
          meta: bet.sports_markets?.meta,
          market: bet.sports_markets
        });
      }
    });

    console.log('[BettingHistory Auto-Settle] Found', betsByMatch.size, 'unique match(es) with placed bets');

    // Settle each match
    betsByMatch.forEach((bets, matchKey) => {
      // Skip if already attempted
      if (settlementAttemptedRef.current.has(matchKey)) {
        console.log('[BettingHistory Auto-Settle] Skipping match (already attempted):', matchKey);
        return;
      }

      const firstBet = bets[0];
      
      // Try multiple sources for sportsid and gmid
      let sportsid = firstBet.sports_markets?.sportsid || 
                    firstBet.sports_markets?.meta?.sportsid ||
                    firstBet.sports_markets?.meta?.sid;
      
      let gmid = firstBet.sports_markets?.gmid || 
                firstBet.sports_markets?.meta?.gmid ||
                firstBet.sports_markets?.meta?.matchId ||
                firstBet.sports_markets?.event_id; // Fallback to event_id
      
      // If sportsid is missing, try to derive from sport name
      if (!sportsid && firstBet.sports_markets?.sport) {
        const sportLower = (firstBet.sports_markets.sport || '').toLowerCase();
        const mapping: Record<string, string> = {
          'cricket': '4', 'football': '1', 'soccer': '1', 'tennis': '2',
          'basketball': '3', 'hockey': '5', 'ice-hockey': '19', 'kabaddi': '66'
        };
        sportsid = mapping[sportLower] || null;
      }

      if (!sportsid || !gmid) {
        console.warn('[BettingHistory Auto-Settle] Missing sportsid or gmid for bet:', {
          betId: firstBet.id,
          sportsid,
          gmid,
          sport: firstBet.sports_markets?.sport,
          event_id: firstBet.sports_markets?.event_id,
          market: firstBet.sports_markets
        });
        return;
      }

      // Mark as attempted
      settlementAttemptedRef.current.add(matchKey);

      console.log('[BettingHistory Auto-Settle] Triggering settlement for match:', {
        matchKey,
        sportsid,
        gmid,
        betCount: bets.length
      });

      // Trigger settlement
      settleAllMarkets(sportsid, gmid.toString())
        .then((result) => {
          if (result?.success) {
            console.log('[BettingHistory Auto-Settle] ✅ Settlement completed for match:', matchKey, result);
            // Refetch bets after a delay to show updated status
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['user-sports-bets', user?.id] });
            }, 2000);
          } else {
            console.warn('[BettingHistory Auto-Settle] ⚠️ Settlement failed for match:', matchKey, result);
            settlementAttemptedRef.current.delete(matchKey);
          }
        })
        .catch((error) => {
          console.error('[BettingHistory Auto-Settle] ❌ Settlement error for match:', matchKey, error);
          settlementAttemptedRef.current.delete(matchKey);
        });
    });
  }, [sportsBets, user, settleAllMarkets]);

  // Fetch casino bets
  const { data: casinoBets, isLoading: casinoBetsLoading } = useQuery({
    queryKey: ['user-casino-bets', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const dateRange = getDateRange();
      const startISO = dateRange?.start?.toISOString();
      const endISO = dateRange?.end?.toISOString();
      
      const [aviator, roulette, teenPatti, andarBahar, colorPrediction] = await Promise.all([
        (async () => {
          let q = supabase.from('aviator_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
        (async () => {
          let q = supabase.from('roulette_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
        (async () => {
          let q = supabase.from('teen_patti_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
        (async () => {
          let q = supabase.from('andar_bahar_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
        (async () => {
          let q = supabase.from('color_prediction_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
      ]);

      const allBets = [
        ...(aviator.data || []).map(b => ({ ...b, game_type: 'Aviator' })),
        ...(roulette.data || []).map(b => ({ ...b, game_type: 'Roulette' })),
        ...(teenPatti.data || []).map(b => ({ ...b, game_type: 'Teen Patti' })),
        ...(andarBahar.data || []).map(b => ({ ...b, game_type: 'Andar Bahar' })),
        ...(colorPrediction.data || []).map(b => ({ ...b, game_type: 'Color Prediction' })),
      ];

      return allBets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please log in to view your betting history.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const hasDateFilter = startDate || endDate;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-3 sm:mb-4 text-sm sm:text-base"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Betting History</h1>
              <p className="text-sm sm:text-base text-muted-foreground">View all your betting activity</p>
            </div>
            
            {/* Date Filter */}
            <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Calendar className="h-4 w-4 mr-2" />
                  {hasDateFilter ? 'Filtered' : 'Filter by Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-96" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Date Range</Label>
                    {hasDateFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDateFilter}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate" className="text-xs sm:text-sm">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-sm"
                        max={endDate || undefined}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate" className="text-xs sm:text-sm">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-sm"
                        min={startDate || undefined}
                      />
                    </div>
                  </div>
                  
                  {hasDateFilter && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {startDate && endDate && (
                          <span>
                            Showing bets from {new Date(startDate).toLocaleDateString('en-IN')} to {new Date(endDate).toLocaleDateString('en-IN')}
                          </span>
                        )}
                        {startDate && !endDate && (
                          <span>Showing bets from {new Date(startDate).toLocaleDateString('en-IN')} onwards</span>
                        )}
                        {!startDate && endDate && (
                          <span>Showing bets until {new Date(endDate).toLocaleDateString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="w-full sm:w-auto grid grid-cols-2">
            <TabsTrigger value="sports" className="text-xs sm:text-sm">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Sports </span>Bets
            </TabsTrigger>
            <TabsTrigger value="casino" className="text-xs sm:text-sm">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Casino </span>Bets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sports" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Sports Bets</CardTitle>
                {hasDateFilter && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {sportsBets?.length || 0} bet{sportsBets?.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {sportsBetsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 sm:h-24 w-full" />
                    <Skeleton className="h-20 sm:h-24 w-full" />
                    <Skeleton className="h-20 sm:h-24 w-full" />
                  </div>
                ) : sportsBets && sportsBets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Market/Selection</TableHead>
                          <TableHead className="min-w-[80px]">Type</TableHead>
                          <TableHead className="min-w-[80px]">Side</TableHead>
                          <TableHead className="min-w-[100px]">Stake</TableHead>
                          <TableHead className="min-w-[80px]">Odds/Rate</TableHead>
                          <TableHead className="min-w-[100px]">Exposure</TableHead>
                          <TableHead className="min-w-[120px]">Potential Win</TableHead>
                          <TableHead className="min-w-[100px]">P&L</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[150px]">Placed At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sportsBets.map((bet: any) => {
                          const isMarketBet = bet.source === 'market_bets';
                          const status = bet.status?.toUpperCase() || 'PLACED';
                          const statusColors: Record<string, string> = {
                            WON: 'bg-green-500/10 text-green-600 border-green-500/20',
                            LOST: 'bg-red-500/10 text-red-600 border-red-500/20',
                            PLACED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                            VOID: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
                            REFUNDED: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                          };

                          const betSide = bet.bet_side || bet.bet_type || '';
                          const betSideDisplay = betSide === 'back' ? 'BACK' : 
                                               betSide === 'lay' ? 'LAY' :
                                               betSide === 'yes' ? 'YES' : 
                                               betSide === 'no' ? 'NO' : 
                                               betSide?.toUpperCase() || 'N/A';
                          
                          const stakeAmount = parseFloat(
                            bet.stake || 
                            (bet as any).amount || 
                            (bet as any).bet_amount || 
                            0
                          );
                          
                          const oddsRate = bet.odds || 
                                          bet.rate || 
                                          bet.rate_at_bet || 
                                          (bet as any).odds || 
                                          'N/A';
                          
                          const potentialWin = bet.potential_profit || bet.potential_win || 0;
                          const exposure = bet.exposure || stakeAmount;
                          const profitLoss = bet.profit_loss;

                          return (
                            <TableRow key={bet.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {isMarketBet 
                                      ? (bet.market_name || bet.selection || 'Market Bet')
                                      : (bet.selection || (bet as any).market_type || 'Bet')}
                                  </div>
                                  {bet.selection && (
                                    <div className="text-xs text-muted-foreground">
                                      {bet.selection}
                                    </div>
                                  )}
                                  {bet.market_type && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {bet.market_type === 'odds' ? 'ODDS' : bet.market_type === 'session' ? 'SESSION' : bet.market_type.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {isMarketBet 
                                    ? (bet.market_type === 'odds' ? 'ODDS' : bet.market_type === 'session' ? 'SESSION' : bet.market_type?.toUpperCase() || 'MARKET')
                                    : (bet.market_type?.toUpperCase() || 'MARKET')}
                                </div>
                                {bet.market_type === 'session' && bet.line_at_bet && (
                                  <div className="text-xs text-muted-foreground">
                                    Line: {bet.line_at_bet}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-medium">
                                  {betSideDisplay}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold">
                                  ₹{stakeAmount.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {oddsRate}
                                </div>
                              </TableCell>
                              <TableCell>
                                {isMarketBet ? (
                                  <div className="font-semibold text-orange-600">
                                    ₹{parseFloat(exposure.toString()).toFixed(2)}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {potentialWin > 0 ? (
                                  <div className="font-semibold text-green-600">
                                    ₹{parseFloat(potentialWin.toString()).toFixed(2)}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {profitLoss !== null && profitLoss !== undefined ? (
                                  <div className={`font-semibold ${
                                    profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {profitLoss >= 0 ? '+' : ''}₹{parseFloat(profitLoss.toString()).toFixed(2)}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={`${statusColors[status] || statusColors.PLACED} border`}
                                >
                                  {status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div>
                                    {new Date(bet.created_at).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  {bet.settled_at && (
                                    <div className="text-muted-foreground">
                                      Settled: {new Date(bet.settled_at).toLocaleString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
                    {hasDateFilter ? 'No sports bets found for selected date range' : 'No sports bets found'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="casino" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Casino Bets</CardTitle>
                {hasDateFilter && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {casinoBets?.length || 0} bet{casinoBets?.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {casinoBetsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 sm:h-24 w-full" />
                    <Skeleton className="h-20 sm:h-24 w-full" />
                    <Skeleton className="h-20 sm:h-24 w-full" />
                  </div>
                ) : casinoBets && casinoBets.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {casinoBets.map((bet: any, index: number) => (
                      <div key={bet.id || index} className="p-3 sm:p-4 border rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base">{bet.game_type || 'Casino'}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              {bet.bet_type || bet.color || bet.side || 'Bet'}
                            </div>
                          </div>
                          <Badge
                            variant={
                              bet.status === 'won' || bet.status === 'WON'
                                ? 'default'
                                : bet.status === 'lost' || bet.status === 'LOST'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs w-fit"
                          >
                            {bet.status || 'PENDING'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
                          <div>
                            <span className="text-muted-foreground">Amount: </span>
                            <span className="font-medium">
                              ₹{Number(bet.bet_amount || bet.stake || bet.amount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {bet.payout_amount && (
                            <div>
                              <span className="text-muted-foreground">Payout: </span>
                              <span className="font-medium">₹{Number(bet.payout_amount).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(bet.created_at).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
                    {hasDateFilter ? 'No casino bets found for selected date range' : 'No casino bets found'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BettingHistory;
