import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Tv, FileText, Target, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Info, Trophy, Users, Cloud, Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { useDiamondSportsData } from '@/hooks/useDiamondSportsData';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import EnhancedLiveTVSection from '@/components/sports/EnhancedLiveTVSection';
import EnhancedOddsDisplay from '@/components/sports/EnhancedOddsDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase } from '@/integrations/supabase/client';

const SportsBet: React.FC = () => {
  const { sport, matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { getPriveteData, callAPI, getBetfairScoreTv, getDetailsData } = useDiamondSportsAPI();
  const { connectOddsWebSocket } = useDiamondSportsData();
  const { wallet } = useWallet();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
  const [isBetSlipDialogOpen, setIsBetSlipDialogOpen] = useState(false);
  
  const [match, setMatch] = useState<any>(state?.match || null);
  const [odds, setOdds] = useState<any>(null);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [isLoadingOdds, setIsLoadingOdds] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [liveTvUrl, setLiveTvUrl] = useState<string | null>(null);
  const [isLoadingTv, setIsLoadingTv] = useState(false);
  const [oddsError, setOddsError] = useState<string | null>(null);
  const [betfairData, setBetfairData] = useState<{
    tv: string | null;
    scorecard: string | null;
    commentary: string | null;
    statistics: string | null;
    highlights: string | null;
    alternateStreams: string[];
  }>({
    tv: null,
    scorecard: null,
    commentary: null,
    statistics: null,
    highlights: null,
    alternateStreams: []
  });

  const [liveScore, setLiveScore] = useState<any>(null);
  const [liveDetails, setLiveDetails] = useState<any>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [isLoadingMyBets, setIsLoadingMyBets] = useState(false);
  const [myBetsError, setMyBetsError] = useState<string | null>(null);
  const oddsWebSocketRef = useRef<WebSocket | null>(null);
  const oddsFetchedRef = useRef<string | null>(null); // Track which matchId has been fetched
  
  useEffect(() => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      setAuthModalOpen(false);
    }
  }, [user]);

  // Helper: Get SID from sport type
  const getSportSID = (sportType: string): string => {
    const sidMap: Record<string, string> = {
      'Cricket': '4',
      'Football': '1', 
      'Tennis': '2',
      'Soccer': '1'
    };
    return sidMap[sportType] || '4'; // Default to cricket
  };

  // Fallback: fetch match info from Diamond list when state.match missing
  const fetchMatchFromDiamond = useCallback(async () => {
    if (match || !matchId) return;
    const sid = getSportSID(sport || 'Cricket');
    try {
      setIsLoadingMatch(true);
      const resp = await callAPI<any>('sports/esid', { sid });
      const list =
        resp?.data?.data?.t1 ||
        resp?.data?.t1 ||
        (Array.isArray(resp?.data) ? resp?.data : []) ||
        [];
      if (Array.isArray(list)) {
        const found = list.find((m: any) => String(m.gmid) === String(matchId));
        if (found) {
          setMatch({
            id: found.gmid || found.id,
            eventId: found.gmid || found.id,
            name: found.ename || found.name,
            team1: found.team1 || found.section?.[0]?.nat || 'Team A',
            team2: found.team2 || found.section?.[1]?.nat || 'Team B',
            score: found.score || '',
            status: found.iplay ? 'live' : (found.status || 'upcoming'),
            date: found.stime || found.date || new Date().toISOString(),
            isLive: found.iplay === true || found.status === 'live',
            league: found.cname,
            cname: found.cname,
            raw: found,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch match from Diamond list', err);
    } finally {
      setIsLoadingMatch(false);
    }
  }, [matchId, sport, match, callAPI, getSportSID]);

  // Fetch all Betfair Score TV data (TV, Scorecard, Commentary, Statistics, Highlights)
  useEffect(() => {
    if (!user) return;

    const fetchLiveTv = async () => {
      if (!matchId || matchId === 'undefined') return;
      
      // Delay this request significantly to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      setIsLoadingTv(true);
      try {
        const sportSid = getSportSID(sport || 'Cricket');
        const response = await getBetfairScoreTv(matchId, sportSid);
        
        if (response?.success && response.data) {
          const tvData = response.data.data || response.data;
          
          // Extract ALL available URLs
          const extractedData = {
            tv: tvData?.tv_url_three || tvData?.tv_url || tvData?.iframeUrl || tvData?.url || tvData?.liveUrl,
            scorecard: tvData?.scorecard_url || tvData?.scorecardUrl || tvData?.scorecard,
            commentary: tvData?.commentary_url || tvData?.commentaryUrl || tvData?.commentary,
            statistics: tvData?.statistics_url || tvData?.statsUrl || tvData?.statistics || tvData?.stats,
            highlights: tvData?.highlights_url || tvData?.highlightsUrl || tvData?.highlights,
            alternateStreams: [
              tvData?.tv_url,
              tvData?.tv_url_two,
              tvData?.liveUrl,
              tvData?.hlsUrl,
              tvData?.streamUrl,
              tvData?.m3u8,
              tvData?.stream_url
            ].filter(Boolean) // Remove null/undefined
          };
          
          setBetfairData(extractedData);
          setLiveTvUrl(extractedData.tv); // Keep for backward compatibility
        }
      } catch (error) {
        console.error('Error fetching Betfair data:', error);
      } finally {
        setIsLoadingTv(false);
      }
    };

    fetchLiveTv();
  }, [matchId, sport, getBetfairScoreTv, user]); // Removed match?.status to prevent refresh loop


  // Fetch match info if not passed via navigation state
  useEffect(() => {
    if (!user) return;
    fetchMatchFromDiamond();
  }, [matchId, sport, user, fetchMatchFromDiamond]); // Removed 'match' from dependencies to prevent refresh loop

  // Fetch live match details and score (lower priority, delayed) - REMOVED: Now handled by WebSocket
  // This useEffect was causing refresh loops and is no longer needed since WebSocket handles real-time updates

  // Fetch match details data
  const fetchMatchDetailsData = useCallback(async () => {
    if (!matchId || matchId === 'undefined') return;
    
    setIsLoadingDetails(true);
    try {
      const sid = getSportSID(sport || 'Cricket');
      const response = await getDetailsData(sid, matchId);
      
      if (response?.success && response.data?.data) {
        const rawMatch = Array.isArray(response.data.data) 
          ? response.data.data[0] 
          : response.data.data;
        
        if (rawMatch) {
          const mappedDetails = {
            matchName: rawMatch.ename || `Match #${rawMatch.gmid}`,
            series: rawMatch.cname || 'N/A',
            matchType: rawMatch.gtype || 'match',
            startDate: rawMatch.stime || null,
            status: rawMatch.iplay ? 'Live' : 'Scheduled',
            matchId: rawMatch.gmid,
            eventId: rawMatch.etid,
            competitionId: rawMatch.cid,
            hasTv: rawMatch.tv || false,
            hasBookmaker: rawMatch.bm || false,
            hasFancy: rawMatch.f || false,
            hasScorecard: rawMatch.scard === 1
          };
          
          setMatchDetails(mappedDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [matchId, sport, getDetailsData, getSportSID]);

  // Fetch odds once on mount (only initial fetch, WebSocket handles updates)
  useEffect(() => {
    // Reset fetch flag if matchId changed
    if (oddsFetchedRef.current && oddsFetchedRef.current !== matchId) {
      oddsFetchedRef.current = null;
      setOdds(null); // Clear old odds
      setOddsError(null);
    }
    
    // Skip if already fetched for this match
    if (oddsFetchedRef.current === matchId) return;

    if (!user) {
      setOdds(null);
      setOddsError('Please sign in to view match odds.');
      setIsLoadingOdds(false);
      return;
    }

    if (!matchId || matchId === 'undefined') {
      const errorMsg = 'Invalid match ID. Please select a valid match.';
      setOddsError(errorMsg);
      setIsLoadingOdds(false);
      return;
    }
    
    // Mark as fetching to prevent duplicate calls
    oddsFetchedRef.current = matchId;
    setIsLoadingOdds(true);
    setOddsError(null);
    
    // Helper to detect if odds payload has at least one market
    const hasMarkets = (payload: any) => {
      const data = payload?.data || payload;
      return Boolean(
        Array.isArray(data) && data.length ||
        (Array.isArray(data?.t1) && data.t1.length) ||
        (Array.isArray(data?.t2) && data.t2.length) ||
        (Array.isArray(data?.t3) && data.t3.length)
      );
    };

    // Convert provider odds array into b1/b2/b3 & l1/l2/l3 shape used by EnhancedOddsDisplay
    const normalizeBackLay = (payload: any) => {
      const data = payload?.data || payload;
      const transformMarket = (market: any) => {
        if (!market?.section || !Array.isArray(market.section)) return market;
        const section = market.section.map((team: any) => {
          if (!team || team.b1 || team.l1) return team; // already in expected shape
          if (!Array.isArray(team.odds)) return team;

          const backs = team.odds.filter((o: any) => o?.otype?.toLowerCase() === 'back');
          const lays = team.odds.filter((o: any) => o?.otype?.toLowerCase() === 'lay');

          // Sort backs descending (higher odds first), lays ascending (lower liability first)
          backs.sort((a: any, b: any) => (b?.odds || 0) - (a?.odds || 0));
          lays.sort((a: any, b: any) => (a?.odds || 0) - (b?.odds || 0));

          return {
            ...team,
            b1: backs[0]?.odds,
            b2: backs[1]?.odds,
            b3: backs[2]?.odds,
            l1: lays[0]?.odds,
            l2: lays[1]?.odds,
            l3: lays[2]?.odds,
            // carry existing sizes/min/max if present
            bs1: backs[0]?.size,
            bs2: backs[1]?.size,
            bs3: backs[2]?.size,
            ls1: lays[0]?.size,
            ls2: lays[1]?.size,
            ls3: lays[2]?.size,
          };
        });
        return { ...market, section };
      };

      const wrapData = Array.isArray(data)
        ? { t1: data }
        : data;

      const normalized = {
        ...payload,
        data: {
          ...wrapData,
          t1: (wrapData?.t1 || []).map(transformMarket),
          t2: (wrapData?.t2 || []).map(transformMarket),
          t3: (wrapData?.t3 || []).map(transformMarket),
        }
      };

      return normalized;
    };

    // Sequential fetch with fallbacks to avoid rate limiting and wrong IDs
    const fetchDataSequentially = async () => {
      try {
        const sid = getSportSID(sport || 'Cricket');
        // Use matchId first, then try match data if available
        const idCandidates = [
          matchId,
          ...(match ? [
            match.id,
            match.eventId,
            match.raw?.gmid,
            match.raw?.id,
            match.raw?.eventId
          ] : [])
        ]
          .map(String)
          .filter(id => id && id !== 'undefined' && id !== 'null' && id !== '')
          .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

        console.log('Fetching odds for:', { sid, matchId, idCandidates, sport, hasMatch: !!match });

        let found = false;
        let lastError: string | null = null;

        for (const id of idCandidates) {
          try {
            console.log(`Trying to fetch odds with sid: ${sid}, id: ${id}`);
            const oddsResponse = await getPriveteData(String(sid), String(id));
            
            console.log('Odds response:', { success: oddsResponse?.success, hasData: !!oddsResponse?.data, error: oddsResponse?.error });
            
            if (oddsResponse?.success && oddsResponse.data) {
              const rawOdds = oddsResponse.data;
              console.log('Raw odds received:', rawOdds);
              
              // Provider sometimes returns { data: [...] } without t1/t2/t3.
              const normalizedOdds = Array.isArray(rawOdds)
                ? { data: { t1: rawOdds } }
                : Array.isArray(rawOdds?.data)
                  ? { data: { t1: rawOdds.data } }
                  : rawOdds;

              const shapedOdds = normalizeBackLay(normalizedOdds);
              console.log('Shaped odds:', shapedOdds);

              if (hasMarkets(shapedOdds)) {
                // Only update if odds haven't been set yet or are different
                setOdds(prevOdds => {
                  const prevJson = JSON.stringify(prevOdds);
                  const newJson = JSON.stringify(shapedOdds);
                  if (prevJson !== newJson) {
                    return shapedOdds;
                  }
                  return prevOdds;
                });
                setOddsError(null);
                found = true;
                console.log('Odds successfully loaded!');
                break;
              } else {
                lastError = 'No betting markets available from provider.';
                console.log('No markets found in odds data');
              }
            } else if (oddsResponse?.error) {
              lastError = oddsResponse.error;
              console.error('Odds API error:', oddsResponse.error);
            } else {
              lastError = 'Invalid response from odds API';
              console.error('Invalid odds response:', oddsResponse);
            }
          } catch (err: any) {
            console.error(`Error fetching odds for id ${id}:`, err);
            lastError = err.message || 'Failed to fetch odds';
          }
          
          // Small delay between attempts to be polite to the API
          if (!found) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!found) {
          setOdds(null);
          const finalError = lastError || 'No betting markets available. Please try again later.';
          setOddsError(finalError);
          console.error('Failed to fetch odds:', finalError);
        }

        // Fetch match details after odds (if found or not)
        try {
          await fetchMatchDetailsData();
        } catch (err) {
          console.error('Error fetching match details:', err);
        }
        
      } catch (error: any) {
        console.error('Fatal error in fetchDataSequentially:', error);
        setOddsError(error.message || 'Unable to load odds right now. Please retry.');
      } finally {
        setIsLoadingOdds(false);
      }
    };
    
    fetchDataSequentially();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, sport, user?.id]); // Functions are stable from hooks, no need to include them

  // Real-time updates via WebSocket (odds, scores, match info) - Real-time updates every second!
  useEffect(() => {
    if (!user || !matchId) return;

    // Only connect WebSocket once per matchId
    if (oddsWebSocketRef.current) {
      // If matchId changed, close old connection and reconnect
      const currentMatchId = (oddsWebSocketRef.current as any).matchId;
      if (currentMatchId === matchId) return;
      
      oddsWebSocketRef.current.close();
      oddsWebSocketRef.current = null;
    }

    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000; // 2 seconds

    const connectWebSocket = () => {
      try {
        const ws = connectOddsWebSocket(matchId, {
          onOddsUpdate: (updatedOdds: any) => {
          if (updatedOdds) {
            // Normalize WebSocket odds data same way as initial fetch
            const normalizeBackLay = (payload: any) => {
              const data = payload?.data || payload;
              const transformMarket = (market: any) => {
                if (!market?.section || !Array.isArray(market.section)) return market;
                const section = market.section.map((team: any) => {
                  if (!team || team.b1 || team.l1) return team; // already in expected shape
                  if (!Array.isArray(team.odds)) return team;

                  const backs = team.odds.filter((o: any) => o?.otype?.toLowerCase() === 'back');
                  const lays = team.odds.filter((o: any) => o?.otype?.toLowerCase() === 'lay');

                  backs.sort((a: any, b: any) => (b?.odds || 0) - (a?.odds || 0));
                  lays.sort((a: any, b: any) => (a?.odds || 0) - (b?.odds || 0));

                  return {
                    ...team,
                    b1: backs[0]?.odds,
                    b2: backs[1]?.odds,
                    b3: backs[2]?.odds,
                    l1: lays[0]?.odds,
                    l2: lays[1]?.odds,
                    l3: lays[2]?.odds,
                    bs1: backs[0]?.size,
                    bs2: backs[1]?.size,
                    bs3: backs[2]?.size,
                    ls1: lays[0]?.size,
                    ls2: lays[1]?.size,
                    ls3: lays[2]?.size,
                  };
                });
                return { ...market, section };
              };

              const wrapData = Array.isArray(data)
                ? { t1: data }
                : data;

              return {
                ...payload,
                data: {
                  ...wrapData,
                  t1: (wrapData?.t1 || []).map(transformMarket),
                  t2: (wrapData?.t2 || []).map(transformMarket),
                  t3: (wrapData?.t3 || []).map(transformMarket),
                }
              };
            };

            // Normalize the odds data
            const rawOdds = updatedOdds;
            const normalizedOdds = Array.isArray(rawOdds)
              ? { data: { t1: rawOdds } }
              : Array.isArray(rawOdds?.data)
                ? { data: { t1: rawOdds.data } }
                : rawOdds;

            const shapedOdds = normalizeBackLay(normalizedOdds);

            // Smooth update without causing re-render of WebSocket connection
            setOdds(prevOdds => {
              // Deep comparison to prevent unnecessary updates
              const prevJson = JSON.stringify(prevOdds);
              const newJson = JSON.stringify(shapedOdds);
              if (prevJson !== newJson) {
                return shapedOdds;
              }
              return prevOdds;
            });
          }
        },
        onScoreUpdate: (updatedScore: any) => {
          if (updatedScore) {
            // Update live score from WebSocket
            setLiveScore(prev => {
              // Only update if score actually changed
              if (JSON.stringify(prev) !== JSON.stringify(updatedScore)) {
                return updatedScore;
              }
              return prev;
            });
          }
        },
        onMatchInfoUpdate: (updatedMatchInfo: any) => {
          if (updatedMatchInfo) {
            // Update match info from WebSocket
            setMatch(prev => {
              const newScore = updatedMatchInfo.score || prev?.score;
              const newStatus = updatedMatchInfo.status === '1' ? 'Live' : prev?.status;
              // Only update if something actually changed
              if (prev?.score !== newScore || prev?.status !== newStatus) {
                return {
                  ...prev,
                  team1: updatedMatchInfo.t1 || prev?.team1,
                  team2: updatedMatchInfo.t2 || prev?.team2,
                  status: newStatus,
                  score: newScore
                };
              }
              return prev;
            });
          }
        }
        });
        
        // Store matchId with WebSocket for comparison
        (ws as any).matchId = matchId;
        oddsWebSocketRef.current = ws as any;
        
        // Handle WebSocket close - auto reconnect
        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          oddsWebSocketRef.current = null;
          
          // Auto-reconnect if not a normal closure and we haven't exceeded max attempts
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Reconnecting WebSocket... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, reconnectDelay);
          }
        };
        
        // Handle WebSocket errors
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        // Reset reconnect attempts on successful connection
        reconnectAttempts = 0;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        // Retry connection after delay
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, reconnectDelay);
        }
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (oddsWebSocketRef.current) {
        oddsWebSocketRef.current.close();
        oddsWebSocketRef.current = null;
      }
    };
  }, [matchId, user?.id, connectOddsWebSocket]); // Use user.id instead of user object

  // Fetch user's bets for this match
  const fetchMyBets = useCallback(async () => {
    if (!user || !matchId) return;
    setIsLoadingMyBets(true);
    setMyBetsError(null);
    try {
      const { data, error } = await (supabase as any)
        .from('sports_bets')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', matchId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setMyBets(data || []);
    } catch (err: any) {
      setMyBetsError(err.message || 'Unable to load your bets');
    } finally {
      setIsLoadingMyBets(false);
    }
  }, [user, matchId]);

  // Real-time subscription for user's bets
  useEffect(() => {
    if (!user || !matchId) return;

    const channel = supabase
      .channel(`sports-bets-${matchId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sports_bets',
          filter: `user_id=eq.${user.id} AND event_id=eq.${matchId}`
        },
        () => {
          // Refresh bets list when any change occurs
          fetchMyBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, matchId]); // Removed fetchMyBets from dependencies, using user.id instead of user object

  const handleSelectBet = (selection: any, type: 'back' | 'lay' | 'yes' | 'no', rate: number, marketType: string) => {
    setSelectedBet({
      selection,
      type,
      rate,
      marketType,
      matchId,
      matchName: `${match?.team1} vs ${match?.team2}`,
      sport
    });
    // Open bet slip drawer on mobile, dialog on desktop
    if (isMobile) {
      setIsBetSlipOpen(true);
    } else {
      setIsBetSlipDialogOpen(true);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !betAmount || parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(betAmount);
    if (wallet && amount > wallet.current_balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to place this bet",
        variant: "destructive"
      });
      return;
    }

    setIsPlacingBet(true);
    try {
      // Call Supabase RPC to place and store the bet
      const payload = {
        p_sport: sport || match?.sport || 'unknown',
        p_event_id: matchId || match?.id || match?.eventId,
        p_market_type: selectedBet.marketType || 'unknown',
        p_selection: selectedBet.selection || selectedBet.matchName || 'selection',
        p_bet_type: selectedBet.type,
        p_odds: selectedBet.rate,
        p_stake: amount,
        p_provider: match?.provider || 'diamond',
        p_meta: {
          matchName: selectedBet.matchName,
          marketType: selectedBet.marketType,
          selection: selectedBet.selection,
          raw: selectedBet
        }
      };

      const { data, error: rpcError } = await (supabase as any).rpc('place_sports_bet', payload);
      if (rpcError) {
        throw new Error(rpcError.message || 'Bet placement failed');
      }
      const rpcData = data as any;
      if (!rpcData?.success) {
        throw new Error(rpcData?.error || 'Bet placement failed');
      }
      
      toast({
        title: "Bet placed successfully!",
        description: `Your ${selectedBet.type} bet of ₹${amount} has been placed`,
      });
      
      // Reset bet slip
      setSelectedBet(null);
      setBetAmount('');
      // Close dialogs
      if (isMobile) setIsBetSlipOpen(false);
      if (!isMobile) setIsBetSlipDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to place bet",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Keep a numeric version handy for calculations
  const numericAmount = Number.isFinite(parseFloat(betAmount)) ? parseFloat(betAmount) : 0;

  const calculatePotentialWin = () => {
    if (!betAmount || !selectedBet || !numericAmount) return 0;
    return selectedBet.type === 'back'
      ? numericAmount * selectedBet.rate
      : numericAmount; // lay wins stake
  };

  const calculateLiability = () => {
    if (!betAmount || !selectedBet || !numericAmount) return 0;
    return selectedBet.type === 'lay'
      ? numericAmount * Math.max(selectedBet.rate - 1, 0)
      : numericAmount;
  };

  // Auto-focus bet amount when slip opens
  useEffect(() => {
    if ((isBetSlipOpen || isBetSlipDialogOpen) && selectedBet) {
      const id = requestAnimationFrame(() => amountInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isBetSlipOpen, isBetSlipDialogOpen, selectedBet]);

  // Initial fetch of user's bets
  useEffect(() => {
    if (user && matchId) {
      fetchMyBets();
    }
  }, [user?.id, matchId]); // Use user.id instead of fetchMyBets to prevent recreation loop

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Match not found</p>
              <Button 
                onClick={() => navigate('/sports')}
                className="mt-4"
              >
                Back to Sports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Bet Slip Component (reusable for desktop sidebar and mobile drawer)
  const BetSlipContent = () => (
    <>
      {selectedBet ? (
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-semibold text-sm sm:text-base">{selectedBet.matchName}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{selectedBet.selection}</p>
            <div className="flex justify-between mt-2">
              <Badge variant={selectedBet.type === 'back' ? 'default' : 'destructive'}>
                {selectedBet.type.toUpperCase()}
              </Badge>
              <span className="font-bold">{selectedBet.rate}</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="bet-amount" className="text-sm">Stake Amount (₹)</Label>
            <Input
              id="bet-amount"
              type="text"
              placeholder="Enter amount"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              ref={amountInputRef}
              value={betAmount}
              onChange={(e) => {
                const next = e.target.value.replace(/[^0-9.]/g, '');
                const sanitized = next.split('.').slice(0, 2).join('.');
                setBetAmount(sanitized);
              }}
              onBlur={() => {
                // Prevent accidental blur on quick re-renders while slip is open
                if (isBetSlipOpen || isBetSlipDialogOpen) {
                  requestAnimationFrame(() => amountInputRef.current?.focus());
                }
              }}
              className="mt-1 h-12 text-base"
            />
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[100, 500, 1000, 5000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(amount.toString())}
                  className="h-10"
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Potential Win:</span>
              <span className="font-semibold text-primary">
                ₹{calculatePotentialWin().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Liability:</span>
              <span className="font-semibold text-destructive">
                ₹{calculateLiability().toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              className="w-full h-12"
              onClick={handlePlaceBet}
              disabled={!betAmount || parseFloat(betAmount) <= 0 || isPlacingBet}
            >
              {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedBet(null);
                setBetAmount('');
                if (isMobile) setIsBetSlipOpen(false);
                if (!isMobile) setIsBetSlipDialogOpen(false);
              }}
            >
              Clear Bet Slip
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Select a bet to get started
        </p>
      )}
      
      {/* Wallet Balance */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Wallet Balance:</span>
          <span className="font-semibold">₹{wallet ? (wallet.current_balance || 0).toFixed(2) : '0.00'}</span>
        </div>
      </div>
    </>
  );

  const MyBetsCard = () => (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          My Bets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoadingMyBets && (
          <div className="text-sm text-muted-foreground">Loading your bets...</div>
        )}
        {myBetsError && (
          <div className="text-sm text-destructive">{myBetsError}</div>
        )}
        {!isLoadingMyBets && !myBetsError && myBets.length === 0 && (
          <div className="text-sm text-muted-foreground">No bets for this match yet.</div>
        )}
        {myBets.map((bet) => (
          <div key={bet.id} className="p-3 border rounded-md space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-semibold capitalize">{bet.bet_type}</span>
              <span className="text-muted-foreground">{new Date(bet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{bet.selection}</span>
              <span className="font-medium text-primary">{bet.odds} @ ₹{bet.stake}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Status: {bet.status || 'placed'}</span>
              <span>Potential: ₹{bet.potential_win}</span>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={fetchMyBets}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-xl">Sign in to view match details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <p className="text-muted-foreground">
                You need an account to access sports match details and odds.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>
                <Button variant="outline" onClick={() => navigate('/sports')}>Back to Sports</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                <div className="flex-1 w-full">
                  <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl break-words">
                    {match.team1} vs {match.team2}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                    <Badge 
                      variant={match.status === 'Live' ? 'destructive' : 'secondary'} 
                      className={`text-xs sm:text-sm ${match.status === 'Live' ? 'animate-pulse' : ''}`}
                    >
                      {match.status || 'Upcoming'}
                    </Badge>
                    <Badge variant="outline" className="text-xs sm:text-sm">{sport}</Badge>
                    {match.league && <Badge variant="outline" className="hidden sm:inline-flex text-xs sm:text-sm">{match.league}</Badge>}
                    {match.status === 'Live' && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/30 text-xs sm:text-sm">
                        🔴 LIVE
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                  {liveScore ? (
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {liveScore.runs}/{liveScore.wickets}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Overs: {liveScore.overs} | RR: {liveScore.runRate}
                      </p>
                    </div>
                  ) : match.score ? (
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold">{match.score}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Current Score</p>
                    </div>
                  ) : matchDetails?.status === 'Live' ? (
                    <div className="bg-primary/10 rounded-lg p-2 sm:p-3">
                      <p className="text-sm sm:text-base font-semibold text-primary">Match In Progress</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Live score updating soon</p>
                    </div>
                  ) : matchDetails?.startDate ? (
                    <div className="bg-muted rounded-lg p-2 sm:p-3 min-w-[140px] sm:min-w-[160px]">
                      <p className="text-xs font-medium text-muted-foreground">Starts at</p>
                      <p className="text-sm sm:text-base font-bold mt-0.5">
                        {new Date(matchDetails.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(matchDetails.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center sm:text-right">
                      <p className="text-xs sm:text-sm text-muted-foreground">Score not available</p>
                      <p className="text-xs text-muted-foreground mt-1">Check back later</p>
                    </div>
                  )}
                </div>
              </div>
              {liveDetails && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{liveDetails.fours || '0'}</p>
                    <p className="text-xs text-muted-foreground">Fours</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{liveDetails.sixes || '0'}</p>
                    <p className="text-xs text-muted-foreground">Sixes</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{liveDetails.extras || '0'}</p>
                    <p className="text-xs text-muted-foreground">Extras</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{liveDetails.runRate || '0.0'}</p>
                    <p className="text-xs text-muted-foreground">Run Rate</p>
                  </div>
                </div>
              )}

              {/* Live Scorecard Embed */}
              {betfairData.scorecard && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Live Scorecard
                    </h3>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/30">
                      Ball-by-Ball
                    </Badge>
                  </div>
                  <div className="relative w-full bg-background rounded-lg overflow-hidden border" style={{ height: '400px' }}>
                    <iframe
                      src={betfairData.scorecard}
                      className="w-full h-full"
                      title="Live Scorecard"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                    />
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="odds" className="w-full">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="odds" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5">
                <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">ODDS</span>
              </TabsTrigger>
              <TabsTrigger value="livetv" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5">
                <Tv className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Live TV</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5">
                <FileText className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Details</span>
                <span className="text-xs sm:text-sm sm:hidden">Info</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ODDS Tab */}
          <TabsContent value="odds" className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold">Betting Odds</h3>
            </div>

            {/* Error Alert */}
            {oddsError && (
              <Alert className="text-sm" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">{oddsError}</p>
                  <p className="text-xs text-muted-foreground">Please try refreshing or check back later.</p>
                </AlertDescription>
              </Alert>
            )}

            <div className={isMobile ? "space-y-4" : "space-y-4"}>
              <EnhancedOddsDisplay 
                odds={odds}
                selectedBet={selectedBet}
                onSelectBet={handleSelectBet}
                isLoading={isLoadingOdds}
              />
            </div>
          </TabsContent>

          {/* Match Bet Tab */}
          <TabsContent value="matchbet" className={isMobile ? "space-y-4" : "space-y-6"}>
            <Card>
              <CardHeader className={isMobile ? "p-4" : ""}>
                <CardTitle className={isMobile ? "text-lg" : "text-xl"}>Place Your Bet</CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? "p-4" : ""}>
                {selectedBet ? (
                  <div className={isMobile ? "space-y-3" : "space-y-4"}>
                    <div className={isMobile ? "p-3 bg-muted rounded-lg" : "p-4 bg-muted rounded-lg"}>
                      <p className={isMobile ? "font-semibold text-sm" : "font-semibold text-lg"}>
                        {selectedBet.matchName}
                      </p>
                      <p className={isMobile ? "text-xs text-muted-foreground mt-1" : "text-sm text-muted-foreground mt-1"}>
                        {selectedBet.selection}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <Badge 
                          variant={selectedBet.type === 'back' ? 'default' : 'destructive'} 
                          className={isMobile ? "text-xs" : "text-base"}
                        >
                          {selectedBet.type.toUpperCase()}
                        </Badge>
                        <span className={isMobile ? "font-bold text-lg" : "font-bold text-xl"}>
                          {selectedBet.rate}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label 
                        htmlFor="bet-amount-main" 
                        className={isMobile ? "text-xs" : "text-sm"}
                      >
                        Stake Amount (₹)
                      </Label>
                      <Input
                        id="bet-amount-main"
                        type="number"
                        placeholder="Enter amount"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className={isMobile ? "mt-1.5 h-12 text-base" : "mt-2 text-lg p-6"}
                      />
                      
                      {/* Quick Amount Buttons for Mobile */}
                      {isMobile && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[100, 500, 1000, 5000].map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              size="sm"
                              onClick={() => setBetAmount(amount.toString())}
                              className="h-9 text-xs"
                            >
                              ₹{amount}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className={isMobile ? "p-3 bg-primary/10 rounded-lg" : "p-4 bg-primary/10 rounded-lg"}>
                        <p className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                          Potential Win
                        </p>
                        <p className={isMobile ? "text-lg font-bold text-primary mt-1" : "text-2xl font-bold text-primary mt-1"}>
                          ₹{calculatePotentialWin().toFixed(2)}
                        </p>
                      </div>
                      <div className={isMobile ? "p-3 bg-destructive/10 rounded-lg" : "p-4 bg-destructive/10 rounded-lg"}>
                        <p className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                          Liability
                        </p>
                        <p className={isMobile ? "text-lg font-bold text-destructive mt-1" : "text-2xl font-bold text-destructive mt-1"}>
                          ₹{calculateLiability().toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className={isMobile ? "space-y-2 pt-2" : "space-y-3"}>
                      <Button
                        className={isMobile ? "w-full h-12 text-base" : "w-full text-lg py-6"}
                        onClick={handlePlaceBet}
                        disabled={!betAmount || parseFloat(betAmount) <= 0 || isPlacingBet}
                      >
                        {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
                      </Button>
                      <Button
                        variant="outline"
                        className={isMobile ? "w-full h-10 text-sm" : "w-full"}
                        onClick={() => {
                          setSelectedBet(null);
                          setBetAmount('');
                        }}
                      >
                        Clear Bet Slip
                      </Button>
                    </div>
                    
                    <div className={isMobile ? "mt-4 pt-3 border-t" : "mt-6 pt-4 border-t"}>
                      <div className="flex justify-between items-center">
                        <span className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                          Wallet Balance:
                        </span>
                        <span className={isMobile ? "font-bold text-base" : "font-bold text-xl"}>
                          ₹{wallet ? (wallet.current_balance || 0).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={isMobile ? "text-center py-8" : "text-center py-12"}>
                    <p className={isMobile ? "text-muted-foreground text-base mb-3" : "text-muted-foreground text-lg mb-4"}>
                      No bet selected
                    </p>
                    <p className="text-sm text-muted-foreground">Go to ODDS tab to select a bet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live TV Tab */}
          <TabsContent value="livetv" className="space-y-6">
            <EnhancedLiveTVSection
              matchId={matchId!}
              match={match}
              isLive={match?.status === 'Live'}
              betfairData={betfairData}
            />
          </TabsContent>

          {/* Match Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Match Information</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMatchDetailsData}
                    disabled={isLoadingDetails}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingDetails ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Loading State */}
                {isLoadingDetails && (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}

                {/* Match Details Content */}
                {!isLoadingDetails && matchDetails && Object.keys(matchDetails).length > 0 && (
                  <div className="space-y-6">
                    {/* Basic Info Section */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matchDetails.matchName && (
                        <div className="p-3 sm:p-4 bg-muted rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Match Name</p>
                          <p className="font-semibold text-sm sm:text-base">{matchDetails.matchName}</p>
                        </div>
                      )}
                      {matchDetails.series && (
                        <div className="p-3 sm:p-4 bg-muted rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Series</p>
                          <p className="font-semibold text-sm sm:text-base">{matchDetails.series}</p>
                        </div>
                      )}
                      {matchDetails.matchType && (
                        <div className="p-3 sm:p-4 bg-muted rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Match Type</p>
                          <p className="font-semibold text-sm sm:text-base">{matchDetails.matchType}</p>
                        </div>
                      )}
                      {matchDetails.venue && (
                        <div className="p-3 sm:p-4 bg-muted rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Venue</p>
                          <p className="font-semibold text-sm sm:text-base">{matchDetails.venue}</p>
                        </div>
                      )}
                        {matchDetails.startDate && (
                          <div className="p-4 bg-muted rounded-lg col-span-full">
                            <p className="text-sm text-muted-foreground mb-1">Start Date & Time</p>
                            <p className="font-semibold">{new Date(matchDetails.startDate).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Match Status Section */}
                    {(matchDetails.tossWinner || matchDetails.currentInnings || matchDetails.status) && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-primary" />
                          Match Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchDetails.tossWinner && (
                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                              <p className="text-sm text-muted-foreground mb-1">Toss Winner</p>
                              <p className="font-semibold text-primary">{matchDetails.tossWinner}</p>
                              {matchDetails.tossDecision && (
                                <p className="text-sm mt-1">Decision: <span className="font-medium">{matchDetails.tossDecision}</span></p>
                              )}
                            </div>
                          )}
                          {matchDetails.currentInnings && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Current Innings</p>
                              <p className="font-semibold">{matchDetails.currentInnings}</p>
                            </div>
                          )}
                          {matchDetails.status && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Status</p>
                              <p className="font-semibold">{matchDetails.status}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Officials Section */}
                    {(matchDetails.referee || matchDetails.umpires) && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          Match Officials
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchDetails.referee && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Referee</p>
                              <p className="font-semibold">{matchDetails.referee}</p>
                            </div>
                          )}
                          {matchDetails.umpires && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Umpires</p>
                              <p className="font-semibold">{matchDetails.umpires}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Conditions Section */}
                    {(matchDetails.weather || matchDetails.pitch) && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Cloud className="h-5 w-5 text-primary" />
                          Match Conditions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchDetails.weather && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Weather</p>
                              <p className="font-semibold">{matchDetails.weather}</p>
                            </div>
                          )}
                          {matchDetails.pitch && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Pitch Condition</p>
                              <p className="font-semibold">{matchDetails.pitch}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    <div className="text-center text-sm text-muted-foreground pt-2 border-t">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isLoadingDetails && (!matchDetails || Object.keys(matchDetails).length === 0) && (
                  <div className="text-center py-12">
                    <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Details Available</h3>
                    <p className="text-muted-foreground mb-4">Match details are not available at this moment.</p>
                    <Button
                      variant="outline"
                      onClick={fetchMatchDetailsData}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Fallback match info if no detailed data */}
                {!matchDetails && !isLoadingDetails && (
                  <>
                    {match.venue && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Venue</p>
                        <p className="font-semibold">{match.venue}</p>
                      </div>
                    )}

                    {match.date && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Date & Time</p>
                        <p className="font-semibold">{new Date(match.date).toLocaleString()}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Live Statistics */}
                {liveDetails && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Live Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">{liveDetails.fours || '0'}</p>
                        <p className="text-sm text-muted-foreground mt-1">Fours</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">{liveDetails.sixes || '0'}</p>
                        <p className="text-sm text-muted-foreground mt-1">Sixes</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">{liveDetails.extras || '0'}</p>
                        <p className="text-sm text-muted-foreground mt-1">Extras</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">{liveDetails.runRate || '0.0'}</p>
                        <p className="text-sm text-muted-foreground mt-1">Run Rate</p>
                      </div>
                    </div>
                  </div>
                )}

                {!matchDetails && !liveDetails && !isLoadingDetails && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Match details will appear when available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* My Bets */}
        <div className="mt-6">
          <MyBetsCard />
        </div>

        {/* Mobile Floating Bet Slip Drawer */}
        {isMobile && (
          <Drawer open={isBetSlipOpen} onOpenChange={setIsBetSlipOpen}>
            <DrawerTrigger asChild>
              <Button 
                size="lg"
                className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
                onClick={() => setIsBetSlipOpen(true)}
              >
                <Receipt className="h-6 w-6" />
                {selectedBet && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs flex items-center justify-center">
                    1
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>Bet Slip</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto p-4">
                <BetSlipContent />
              </div>
            </DrawerContent>
          </Drawer>
        )}

        {/* Desktop Sticky Bet Slip Button - Fixed at bottom */}
        {!isMobile && (
          <Dialog open={isBetSlipDialogOpen} onOpenChange={setIsBetSlipDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="default" 
                size="default"
                className="fixed bottom-4 right-4 z-50 h-10 px-4 shadow-lg"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Bet Slip
                {selectedBet && (
                  <span className="ml-2 h-5 w-5 rounded-full bg-background text-foreground text-xs flex items-center justify-center">
                    1
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bet Slip</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <BetSlipContent />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default SportsBet;
