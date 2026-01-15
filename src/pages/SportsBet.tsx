import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, TrendingUp, Tv, FileText, Target, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Info, Trophy, Users, Cloud, Receipt, Clock, CheckCircle2 } from 'lucide-react';
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
import { useAutoSettlement } from '@/hooks/useAutoSettlement';

const SportsBet: React.FC = () => {
  const { sport, matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { getPriveteData, callAPI, getBetfairScoreTv, getDetailsData, getDiamondOriginalTv } = useDiamondSportsAPI();
  const { connectOddsWebSocket } = useDiamondSportsData();
  const { wallet } = useWallet();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { settleAllMarkets } = useAutoSettlement();
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
  const [matchBanner, setMatchBanner] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [isLoadingMyBets, setIsLoadingMyBets] = useState(false);
  const [myBetsError, setMyBetsError] = useState<string | null>(null);
  const oddsWebSocketRef = useRef<WebSocket | null>(null);
  const oddsFetchedRef = useRef<string | null>(null); // Track which matchId has been fetched
  const settlementAttemptedRef = useRef<string | null>(null); // Track which matchId has been attempted for settlement
  
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
      
      // Log full response to check for banner
      console.log('[Banner Debug] Full esid response:', resp);
      console.log('[Banner Debug] Response keys:', resp ? Object.keys(resp) : 'No response');
      console.log('[Banner Debug] Response.data keys:', resp?.data ? Object.keys(resp.data) : 'No data');
      
      const list =
        resp?.data?.data?.t1 ||
        resp?.data?.t1 ||
        (Array.isArray(resp?.data) ? resp?.data : []) ||
        [];
      
      // Check if banner is at response level
      const respAny = resp as any;
      if (respAny?.data?.banner || respAny?.banner || respAny?.data?.image || respAny?.image) {
        const topLevelBanner = respAny?.data?.banner || respAny?.banner || respAny?.data?.image || respAny?.image;
        console.log('[Banner Debug] Found banner at response level:', topLevelBanner);
        setMatchBanner(topLevelBanner);
      }
      
      if (Array.isArray(list)) {
        const found = list.find((m: any) => String(m.gmid) === String(matchId));
        if (found) {
          console.log('[Banner Debug] Found match in list, keys:', Object.keys(found));
          
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
          
          // Extract banner from match data - check all possible fields and nested structures
          console.log('[Banner Debug] Found match data:', found);
          console.log('[Banner Debug] Port field value:', found.port, 'Type:', typeof found.port);
          console.log('[Banner Debug] Mname field value:', found.mname, 'Type:', typeof found.mname);
          console.log('[Banner Debug] Full match object:', JSON.stringify(found, null, 2));
          console.log('[Banner Debug] All field values:', {
            banner: found.banner,
            image: found.image,
            img: found.img,
            port: found.port,
            mname: found.mname,
            gmid: found.gmid,
            ename: found.ename,
            mod: found.mod,
            gtv: found.gtv
          });
          
          // Check if port is a URL (starts with http or https)
          const portAsUrl = found.port && typeof found.port === 'string' && (found.port.startsWith('http://') || found.port.startsWith('https://'))
            ? found.port 
            : null;
          
          // Check if mname contains image URL
          const mnameAsUrl = found.mname && typeof found.mname === 'string' && (found.mname.startsWith('http://') || found.mname.startsWith('https://'))
            ? found.mname
            : null;
          
          const bannerUrl = found.banner || 
                           found.image || 
                           found.img || 
                           found.banner_url || 
                           found.bannerUrl ||
                           found.poster ||
                           found.cover ||
                           found.banner_image ||
                           found.match_banner ||
                           found.event_banner ||
                           portAsUrl || // Port might be image URL
                           mnameAsUrl || // Mname might be image URL
                           (found.data && (found.data.banner || found.data.image)) ||
                           null;
          
          console.log('[Banner Debug] Banner URL from match list:', bannerUrl);
          console.log('[Banner Debug] Port as URL:', portAsUrl);
          console.log('[Banner Debug] Mname as URL:', mnameAsUrl);
          
          if (bannerUrl) {
            setMatchBanner(bannerUrl);
            console.log('[Banner Debug] ✅ Banner set from match list:', bannerUrl);
          } else {
            // Try multiple sources for banner
            console.log('[Banner Debug] No banner in match data, trying alternative sources...');
            
            // Try 1: Banner API endpoint
            try {
              console.log('[Banner Debug] Trying welcomebanner API...');
              const { data: bannerResp, error: bannerError } = await supabase.functions.invoke('sports-diamond-proxy', {
                body: { action: 'banner' }
              });
              
              console.log('[Banner Debug] Banner API response:', bannerResp);
              console.log('[Banner Debug] Banner API error:', bannerError);
              
              if (!bannerError && bannerResp?.success && bannerResp.data) {
                const bannerData = Array.isArray(bannerResp.data) ? bannerResp.data[0] : bannerResp.data;
                const apiBanner = bannerData?.banner || bannerData?.image || bannerData?.url || bannerData?.img || (typeof bannerData === 'string' ? bannerData : null);
                console.log('[Banner Debug] Extracted banner from API:', apiBanner);
                if (apiBanner && typeof apiBanner === 'string' && (apiBanner.startsWith('http://') || apiBanner.startsWith('https://'))) {
                  console.log('[Banner Debug] ✅ Found banner from welcomebanner API:', apiBanner);
                  setMatchBanner(apiBanner);
                  return; // Exit early if banner found
                }
              }
            } catch (bannerError) {
              console.error('[Banner Debug] Banner API exception:', bannerError);
            }
            
            // Try 2: Competition/Series level banner (using cid)
            if (found.cid) {
              try {
                console.log('[Banner Debug] Trying to fetch banner for competition:', found.cid);
                // You might need to create an endpoint for competition banners
                // For now, we'll skip this
              } catch (err) {
                console.log('[Banner Debug] Competition banner fetch error:', err);
              }
            }
            
            // Try 3: Construct banner URL from match/competition info
            // Some APIs use pattern like: /banners/{sport}/{competition}/{match}.jpg
            if (found.cname && found.gmid) {
              const constructedBanner = `https://cloud.turnkeyxgaming.com:9086/sports/banner/${sport}/${found.cid || 'default'}/${found.gmid}.jpg`;
              console.log('[Banner Debug] Trying constructed banner URL:', constructedBanner);
              // We'll test this URL by trying to load it
              const testImg = new Image();
              testImg.onload = () => {
                console.log('[Banner Debug] ✅ Constructed banner URL is valid:', constructedBanner);
                setMatchBanner(constructedBanner);
              };
              testImg.onerror = () => {
                console.log('[Banner Debug] Constructed banner URL failed to load');
              };
              testImg.src = constructedBanner;
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch match from Diamond list', err);
    } finally {
      setIsLoadingMatch(false);
    }
  }, [matchId, sport, match, callAPI, getSportSID]);

  // Fetch all Betfair Score TV data (TV, Scorecard, Commentary, Statistics, Highlights)
  // This also fetches banner from betfairscorecardandtv endpoint
  useEffect(() => {
    if (!user) return;

    const fetchLiveTv = async () => {
      if (!matchId || matchId === 'undefined') return;
      
      // Delay this request significantly to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 8000)); // Increased delay to 8 seconds
      
      setIsLoadingTv(true);
      try {
        const sportSid = getSportSID(sport || 'Cricket');
        
        console.log('[Banner Debug] Starting Betfair API call for banner and TV...');
        console.log('[Banner Debug] MatchId:', matchId, 'SportSid:', sportSid);
        
        // Retry logic for Betfair API (in case of rate limit)
        let response = null;
        let retries = 3;
        let retryDelay = 3000; // 3 seconds
        
        while (retries > 0) {
          try {
            response = await getBetfairScoreTv(matchId, sportSid);
            
            // Check if we got rate limit error
            const responseAny = response as any;
            if (responseAny?.data?.error === 'Rate limit exceeded' || responseAny?.data?.error?.includes('Rate limit')) {
              console.log(`[Banner Debug] Rate limit error, retrying... (${retries} attempts left)`);
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay += 2000; // Increase delay with each retry
                continue;
              }
            } else {
              // Success or other error, break the loop
              break;
            }
          } catch (err) {
            console.error('[Banner Debug] Error in Betfair API call:', err);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }
        
        console.log('[Banner Debug] ════════════════════════════════════════');
        console.log('[Banner Debug] Betfair API full response:', JSON.stringify(response, null, 2));
        console.log('[Banner Debug] ════════════════════════════════════════');
        console.log('[Banner Debug] Betfair API response keys:', response ? Object.keys(response) : 'No response');
        console.log('[Banner Debug] Betfair API response.data keys:', response?.data ? Object.keys(response.data) : 'No data');
        
        if (response?.success && response.data) {
          const responseAny = response as any;
          
          // Check for rate limit error
          if (responseAny.data?.error === 'Rate limit exceeded' || responseAny.data?.error?.includes('Rate limit')) {
            console.log('[Banner Debug] ⚠️ Rate limit exceeded, cannot fetch banner at this time');
            setIsLoadingTv(false);
            return;
          }
          
          const tvData = response.data.data || response.data;
          
          console.log('[Banner Debug] TV Data keys:', tvData ? Object.keys(tvData) : 'No tvData');
          console.log('[Banner Debug] TV Data full object:', tvData);
          
          // Extract banner from betfair response - check all possible locations
          const bannerFromBetfair = tvData?.banner || 
                                   tvData?.banner_url || 
                                   tvData?.bannerUrl ||
                                   tvData?.banner_image ||
                                   tvData?.image || 
                                   tvData?.img ||
                                   tvData?.poster ||
                                   tvData?.cover ||
                                   tvData?.match_banner ||
                                   tvData?.event_banner ||
                                   tvData?.match_image ||
                                   tvData?.event_image ||
                                   responseAny.data?.banner ||
                                   responseAny.data?.banner_url ||
                                   responseAny.data?.bannerUrl ||
                                   responseAny.data?.image ||
                                   responseAny.banner ||
                                   responseAny.banner_url ||
                                   responseAny.image ||
                                   null;
          
          console.log('[Banner Debug] Extracted banner from Betfair API:', bannerFromBetfair);
          console.log('[Banner Debug] Banner type:', typeof bannerFromBetfair);
          
          if (bannerFromBetfair && typeof bannerFromBetfair === 'string' && bannerFromBetfair.trim() !== '') {
            setMatchBanner(bannerFromBetfair);
            console.log('[Banner Debug] ✅ Banner set from Betfair API:', bannerFromBetfair);
          } else {
            console.log('[Banner Debug] ❌ No valid banner found in Betfair API response');
            console.log('[Banner Debug] Banner value:', bannerFromBetfair);
          }
          
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
        } else {
          console.log('[Banner Debug] ❌ Betfair API response not successful:', response);
        }
        
        // Also try Diamond Original TV as fallback (but don't override banner if already set)
        try {
          const diamondTvResponse = await getDiamondOriginalTv(matchId, sportSid);
          
          if (diamondTvResponse?.success && diamondTvResponse.data) {
            const streamUrl = diamondTvResponse.data.streamUrl || 
                            diamondTvResponse.data.data?.streamUrl ||
                            diamondTvResponse.data.url ||
                            null;
            
            if (streamUrl && !betfairData.tv) {
              const extractedData = {
                tv: streamUrl,
                scorecard: betfairData.scorecard,
                commentary: betfairData.commentary,
                statistics: betfairData.statistics,
                highlights: betfairData.highlights,
                alternateStreams: [streamUrl]
              };
              
              setBetfairData(extractedData);
              setLiveTvUrl(streamUrl);
            }
          }
        } catch (diamondTvError) {
          console.error('❌ [Frontend] Error fetching Diamond Original TV:', diamondTvError);
        }
      } catch (error) {
        console.error('Error fetching Betfair data:', error);
      } finally {
        setIsLoadingTv(false);
      }
    };

    fetchLiveTv();
  }, [matchId, sport, getBetfairScoreTv, getDiamondOriginalTv, user]); // Removed betfairData from dependencies to prevent loop


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
      
      // Log full response to check for banner at any level
      console.log('[Banner Debug] Full getDetailsData response:', JSON.stringify(response, null, 2));
      
      if (response?.success && response.data?.data) {
        // Log full response for debugging
        console.log('[Banner Debug] Full API response structure:', {
          success: response.success,
          hasData: !!response.data,
          hasDataData: !!response.data?.data,
          dataType: Array.isArray(response.data.data) ? 'array' : typeof response.data.data,
          dataKeys: response.data?.data && !Array.isArray(response.data.data) ? Object.keys(response.data.data) : 'array',
          fullResponseKeys: Object.keys(response),
          dataKeys_full: response.data ? Object.keys(response.data) : 'no data'
        });
        
        // Check for banner at response level first
        const responseAny = response as any;
        if (responseAny.banner || responseAny.data?.banner || responseAny.image || responseAny.data?.image) {
          const topLevelBanner = responseAny.banner || responseAny.data?.banner || responseAny.image || responseAny.data?.image;
          console.log('[Banner Debug] ✅ Found banner at response level:', topLevelBanner);
          setMatchBanner(topLevelBanner);
        }
        
        const rawMatch = Array.isArray(response.data.data) 
          ? response.data.data[0] 
          : response.data.data;
        
        console.log('[Banner Debug] Raw match object keys:', rawMatch ? Object.keys(rawMatch) : 'No rawMatch');
        console.log('[Banner Debug] Raw match object:', rawMatch);
        
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
          
          // Extract banner from API response - check all possible fields
          console.log('[Banner Debug] Raw match data:', rawMatch);
          const bannerUrl = rawMatch.banner || 
                           rawMatch.image || 
                           rawMatch.img || 
                           rawMatch.banner_url || 
                           rawMatch.bannerUrl ||
                           rawMatch.poster ||
                           rawMatch.cover ||
                           rawMatch.banner_image ||
                           rawMatch.match_banner ||
                           rawMatch.event_banner ||
                           (rawMatch.data && (rawMatch.data.banner || rawMatch.data.image)) ||
                           null;
          
          console.log('[Banner Debug] Extracted banner URL:', bannerUrl);
          
          if (bannerUrl) {
            setMatchBanner(bannerUrl);
            console.log('[Banner Debug] ✅ Banner set successfully from match data');
          } else {
            console.log('[Banner Debug] No banner found in match data');
            // Also check in response.data.data structure
            if (response?.data?.data?.banner || response?.data?.data?.image) {
              const altBanner = response.data.data.banner || response.data.data.image;
              console.log('[Banner Debug] Found banner in response.data.data:', altBanner);
              setMatchBanner(altBanner);
            }
          }
        }
      } else {
        console.log('[Banner Debug] Response not successful or no data:', response);
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
    if (!user || !matchId) {
      console.log('[fetchMyBets] Missing user or matchId', { user: !!user, matchId });
      return;
    }
    setIsLoadingMyBets(true);
    setMyBetsError(null);
    try {
      // Get all possible event_id formats that might be used
      const possibleEventIds = [
        matchId,
        match?.id,
        match?.eventId,
        match?.EID,
        match?.eid
      ].filter(Boolean);

      console.log('[fetchMyBets] Fetching bets for:', {
        matchId,
        possibleEventIds,
        userId: user.id,
        match: match ? { id: match.id, eventId: match.eventId } : null
      });

      // Fetch from sports_market_bets table (new betting system)
      // First get all markets for this event_id, then get bets for those markets
      // Include ALL markets (open, closed, settled) so bets remain visible even after match is over
      const { data: markets, error: marketsError } = await (supabase as any)
        .from('sports_markets')
        .select('id, event_id, status')
        .in('event_id', possibleEventIds);
        // No status filter - include all markets (open, closed, settled) so bets remain visible

      if (marketsError) {
        console.error('[fetchMyBets] Error fetching markets:', marketsError);
      }

      const marketIds = (markets || []).map((m: any) => m.id);
      console.log('[fetchMyBets] Found markets:', marketIds.length, 'for event_ids:', possibleEventIds);

      let marketBets: any[] = [];
      if (marketIds.length > 0) {
        // Fetch ALL bets for these markets (including settled bets)
        // No status filter - show all bets regardless of market or bet status
        // This ensures bets remain visible even after match is over
        const { data: bets, error: marketBetsError } = await (supabase as any)
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
              status
            )
          `)
          .eq('user_id', user.id)
          .in('market_id', marketIds)
          .order('created_at', { ascending: false });

        if (marketBetsError) {
          console.error('[fetchMyBets] Error fetching market bets:', marketBetsError);
          throw marketBetsError;
        }

        marketBets = (bets || []).map((bet: any) => ({
          ...bet,
          source: 'market_bets',
          market_name: bet.sports_markets?.market_name,
          selection: bet.sports_markets?.selection || bet.selection,
          market_type: bet.sports_markets?.market_type || bet.market_type
        }));

        console.log('[fetchMyBets] Found market bets:', marketBets.length);
      }

      // Also fetch from old sports_bets table for backward compatibility
      // Try all possible event_id formats
      const { data: oldBets, error: oldBetsError } = await (supabase as any)
        .from('sports_bets')
        .select('*')
        .eq('user_id', user.id)
        .in('event_id', possibleEventIds)
        .order('created_at', { ascending: false })
        .limit(50); // Increased limit to catch more bets

      if (oldBetsError) {
        console.error('[fetchMyBets] Error fetching old bets:', oldBetsError);
        // Don't throw, just log the error
      }

      console.log('[fetchMyBets] Found old bets:', (oldBets || []).length);
      if (oldBets && oldBets.length > 0) {
        console.log('[fetchMyBets] Sample old bet event_ids:', oldBets.slice(0, 3).map((b: any) => b.event_id));
      }

      // Also try fetching ALL user bets to see what's actually there
      const { data: allUserBets, error: allBetsError } = await (supabase as any)
        .from('sports_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!allBetsError && allUserBets && allUserBets.length > 0) {
        console.log('[fetchMyBets] All user bets (first 10):', allUserBets.map((b: any) => ({
          id: b.id,
          event_id: b.event_id,
          selection: b.selection,
          created_at: b.created_at
        })));
      }

      // Combine both results
      const allBets = [
        ...marketBets,
        ...(oldBets || []).map((bet: any) => ({
          ...bet,
          source: 'old_bets'
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // If no bets found for this match, show all user bets as fallback
      if (allBets.length === 0) {
        console.log('[fetchMyBets] No bets found for this match, fetching all user bets...');
        const { data: allBetsFallback, error: fallbackError } = await (supabase as any)
          .from('sports_bets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!fallbackError && allBetsFallback && allBetsFallback.length > 0) {
          console.log('[fetchMyBets] Found', allBetsFallback.length, 'total user bets (fallback)');
          setMyBets(allBetsFallback.map((bet: any) => ({
            ...bet,
            source: 'old_bets'
          })));
          return;
        }
      }

      console.log('[fetchMyBets] Total bets:', allBets.length);
      setMyBets(allBets);
    } catch (err: any) {
      console.error('[fetchMyBets] Error:', err);
      setMyBetsError(err.message || 'Unable to load your bets');
    } finally {
      setIsLoadingMyBets(false);
    }
  }, [user, matchId, match]);

  // Real-time subscription for user's bets
  useEffect(() => {
    if (!user || !matchId) return;

    // Subscribe to sports_market_bets changes
    const marketBetsChannel = supabase
      .channel(`sports-market-bets-${matchId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sports_market_bets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchMyBets();
        }
      )
      .subscribe();

    // Subscribe to old sports_bets changes (backward compatibility)
    const oldBetsChannel = supabase
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
          fetchMyBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(marketBetsChannel);
      supabase.removeChannel(oldBetsChannel);
    };
  }, [user?.id, matchId, fetchMyBets]);

  // Fetch bets when component mounts or matchId changes
  // Note: Initial fetch is handled by the WebSocket subscription effect above
  // This separate effect is removed to prevent duplicate calls

  const handleSelectBet = (selection: any, type: 'back' | 'lay' | 'yes' | 'no', rate: number, marketType: string, mname?: string) => {
    setSelectedBet({
      selection,
      type,
      rate,
      marketType,
      mname: mname || '',
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
      // Calculate potential win and liability (same as shown in bet slip)
      const potentialWin = calculatePotentialWin();
      const liability = calculateLiability();
      
      const eventId = matchId || match?.id || match?.eventId || match?.eventId;
      const marketName = selectedBet.mname || 'Market';
      const marketType = selectedBet.marketType === 'session' ? 'session' : 'odds';
      
      // Step 1: Get or create market using backend RPC (race condition safe)
      // Determine odds/rates based on market type
      let oddsBack = null;
      let oddsLay = null;
      let rateYes = null;
      let rateNo = null;
      let currentLine = null;
      
      if (marketType === 'odds') {
        // For ODDS markets, extract odds from rate
        oddsBack = selectedBet.type === 'back' ? selectedBet.rate : null;
        oddsLay = selectedBet.type === 'lay' ? selectedBet.rate : null;
        // If we don't have the opposite side, use the same rate
        if (!oddsBack && selectedBet.rate) oddsBack = selectedBet.rate;
        if (!oddsLay && selectedBet.rate) oddsLay = selectedBet.rate;
      } else if (marketType === 'session') {
        // For SESSION markets, extract rate and line
        rateYes = selectedBet.type === 'yes' ? selectedBet.rate : null;
        rateNo = selectedBet.type === 'no' ? selectedBet.rate : null;
        // If we don't have the opposite side, use the same rate
        if (!rateYes && selectedBet.rate) rateYes = selectedBet.rate;
        if (!rateNo && selectedBet.rate) rateNo = selectedBet.rate;
        
        // Extract line from selection (e.g., "Over 45.5" -> 45.5)
        const lineMatch = selectedBet.selection?.match(/(\d+\.?\d*)/);
        if (lineMatch) {
          currentLine = parseFloat(lineMatch[1]);
        }
      }
      
      // Extract sportsid and gmid from match data for auto-settlement
      const sportsid = match?.raw?.sid || match?.raw?.sportsid || match?.sid || null;
      const gmid = match?.gmid || match?.id || match?.eventId || eventId || null;
      
      // Use backend RPC to get or create market (race condition safe)
      const { data: marketId, error: marketError } = await (supabase as any).rpc('get_or_create_market', {
        p_event_id: eventId,
        p_sport: sport || match?.sport || 'cricket',
        p_market_name: marketName,
        p_market_type: marketType,
        p_selection: selectedBet.selection || null,
        p_odds_back: oddsBack,
        p_odds_lay: oddsLay,
        p_rate_yes: rateYes,
        p_rate_no: rateNo,
        p_line_value: currentLine,
        p_sportsid: sportsid,
        p_gmid: gmid
      });
      
      if (marketError) {
        console.error('Error getting/creating market:', marketError);
        throw new Error(`Failed to get or create market: ${marketError.message}`);
      }
      
      if (!marketId) {
        throw new Error('Market ID is required to place bet');
      }
      
      // Step 2: Fetch market to get actual odds/rates (to avoid mismatch)
      const { data: marketData, error: marketFetchError } = await (supabase as any)
        .from('sports_markets')
        .select('odds_back, odds_lay, rate_yes, rate_no, current_line')
        .eq('id', marketId)
        .single();
      
      if (marketFetchError) {
        console.error('Error fetching market:', marketFetchError);
        throw new Error(`Failed to fetch market: ${marketFetchError.message}`);
      }
      
      if (!marketData) {
        throw new Error('Market data not found');
      }
      
      // Step 3: Place bet using new system (place_market_bet)
      // Use market's actual odds/rates instead of selectedBet.rate to avoid mismatch
      const betSide = selectedBet.type; // 'back', 'lay', 'yes', 'no'
      const selection = marketType === 'odds' ? selectedBet.selection : null;
      
      // For ODDS markets, use market's actual odds based on bet side
      // For SESSION markets, use market's actual rates based on bet side
      // Pass null to let backend use market's odds/rates (validation will still check)
      const odds = marketType === 'odds' 
        ? (betSide === 'back' ? marketData.odds_back : marketData.odds_lay)
        : null;
      const rate = marketType === 'session'
        ? (betSide === 'yes' ? marketData.rate_yes : marketData.rate_no)
        : null;
      
      const { data: betData, error: rpcError } = await (supabase as any).rpc('place_market_bet', {
        p_market_id: marketId,
        p_bet_side: betSide,
        p_stake: amount,
        p_selection: selection,
        p_odds: odds,
        p_rate: rate
      });
      
      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(rpcError.message || rpcError.details || 'Bet placement failed');
      }
      
      if (!betData?.success) {
        console.error('RPC Data Error:', betData);
        throw new Error(betData?.error || 'Bet placement failed');
      }

      // Refresh bets list after successful bet placement
      console.log('[handlePlaceBet] Bet placed successfully, refreshing bets list...');
      setTimeout(() => {
        fetchMyBets();
      }, 1000); // Wait 1 second for database to update
      
      toast({
        title: "Bet Placed!",
        description: `Your bet of ₹${amount.toFixed(2)} on ${selectedBet.selection} has been placed.`,
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

  // Determine market type based on mname
  // Cricket-specific logic:
  // ODDS markets: MATCH_ODDS, TIED_MATCHES → decimal odds calculation
  // BOOKMAKER markets: BOOKMAKER → (odds / 100) × stake calculation
  // SESSION markets: Normal, fancy1, oddeven, meter, khado → double concept (rate = total return)
  const getMarketCalculationType = (): 'odds' | 'bookmaker' | 'session' => {
    if (!selectedBet) return 'odds';
    
    // Get mname (most reliable indicator)
    const mname = (selectedBet.mname || '').toUpperCase().trim();
    const marketType = selectedBet.marketType?.toLowerCase() || '';
    const selection = (selectedBet.selection || '').toLowerCase();
    
    // BOOKMAKER market (special calculation: odds / 100 × stake)
    if (mname.includes('BOOKMAKER') || marketType.includes('bookmaker')) {
      return 'bookmaker';
    }
    
    // ODDS markets (decimal odds calculation) - mname based
    const oddsMarketNames = ['MATCH_ODDS', 'TIED_MATCHES'];
    if (oddsMarketNames.some(name => mname.includes(name))) {
      return 'odds';
    }
    
    // SESSION markets (double/rate concept) - mname based
    const sessionMarketNames = ['NORMAL', 'FANCY1', 'FANCY', 'ODDEVEN', 'METER', 'KHADO', 'ADV'];
    if (sessionMarketNames.some(name => mname.includes(name))) {
      return 'session';
    }
    
    // Fallback: Check marketType for "fancy"
    if (marketType.includes('fancy')) return 'session';
    
    // Fallback: Check selection for session indicators
    if (selection.includes('adv') || selection.includes('run') || selection.includes('over') || 
        selection.includes('ball') || selection.includes('session') || selection.includes('partnership') ||
        selection.includes('khado') || selection.includes('inn') || selection.includes('meter') ||
        selection.includes('oddeven') || selection.includes('normal')) {
      return 'session';
    }
    
    // Fallback: If rate > 100, likely SESSION market (rate format)
    const rate = parseFloat(selectedBet.rate?.toString() || '0');
    if (rate > 100) {
      return 'session';
    }
    
    return 'odds'; // Default to odds
  };

  const isSessionMarket = () => {
    return getMarketCalculationType() === 'session';
  };

  const calculatePotentialWin = () => {
    if (!betAmount || !selectedBet || !numericAmount || !selectedBet.rate) return 0;
    
    const marketType = getMarketCalculationType();
    const rate = parseFloat(selectedBet.rate.toString());
    
    if (marketType === 'session') {
      // SESSION market (fancy): back = YES, lay = NO
      // Rate format: rate is the TOTAL RETURN amount (not multiplier)
      // If rate = 340, and stake = 100, then total return = 340, profit = 340 - 100 = 240
      if (selectedBet.type === 'back') {
        // YES: Rate is total return, profit = rate - stake
        // Example: Rate 340, Stake 100 → Profit = 340 - 100 = 240
        return Math.max(rate - numericAmount, 0);
      } else if (selectedBet.type === 'lay') {
        // NO: Profit = stake (if NO wins, you get your stake back as profit)
        return numericAmount;
      }
    } else if (marketType === 'bookmaker') {
      // BOOKMAKER market: profit = (odds / 100) × stake
      if (selectedBet.type === 'back') {
        // BACK: Profit = (odds / 100) × stake
        // Example: Odds 250, Stake 100 → Profit = (250 / 100) × 100 = 250
        return (rate / 100) * numericAmount;
      } else if (selectedBet.type === 'lay') {
        // LAY: Profit = stake (when selection loses)
        return numericAmount;
      }
    } else {
      // ODDS market (match): BACK/LAY with decimal odds
      // Decimal odds format: profit = stake × (odds - 1)
      if (selectedBet.type === 'back') {
        // BACK: Profit = stake × (odds - 1)
        return numericAmount * (rate - 1);
      } else if (selectedBet.type === 'lay') {
        // LAY: Profit = stake (when selection loses)
        return numericAmount;
      }
    }
    
    return 0;
  };

  const calculateLiability = () => {
    if (!betAmount || !selectedBet || !numericAmount || !selectedBet.rate) return 0;
    
    const marketType = getMarketCalculationType();
    const rate = parseFloat(selectedBet.rate.toString());
    
    if (marketType === 'session') {
      // SESSION market (fancy): back = YES, lay = NO
      // Rate format: rate is total return amount
      if (selectedBet.type === 'back') {
        // YES: Exposure = stake (if you lose, you lose your stake)
        return numericAmount;
      } else if (selectedBet.type === 'lay') {
        // NO: Exposure = rate - stake (if YES wins, you pay the difference)
        // Example: Rate 340, Stake 100 → If YES wins, you pay 340 - 100 = 240
        return Math.max(rate - numericAmount, 0);
      }
    } else if (marketType === 'bookmaker') {
      // BOOKMAKER market: exposure = (odds / 100) × stake (for LAY)
      if (selectedBet.type === 'back') {
        // BACK: Exposure = stake
        return numericAmount;
      } else if (selectedBet.type === 'lay') {
        // LAY: Exposure = (odds / 100) × stake
        // Example: Odds 250, Stake 100 → Exposure = (250 / 100) × 100 = 250
        return (rate / 100) * numericAmount;
      }
    } else {
      // ODDS market (match): BACK/LAY with decimal odds
      // Decimal odds format: exposure = stake × (odds - 1) (for LAY)
      if (selectedBet.type === 'back') {
        // BACK: Exposure = stake
        return numericAmount;
      } else if (selectedBet.type === 'lay') {
        // LAY: Exposure = stake × (odds - 1)
        return numericAmount * Math.max(rate - 1, 0);
      }
    }
    
    return 0;
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

  // Auto-settle markets when match is completed
  useEffect(() => {
    if (!match || !matchId || !user) return;

    // Skip if already attempted for this match
    if (settlementAttemptedRef.current === matchId) return;

    // Check if match is completed/finished
    const matchStatus = match.status?.toLowerCase() || '';
    const detailsStatus = matchDetails?.status?.toLowerCase() || '';
    const isCompleted = matchStatus.includes('completed') || 
                       matchStatus.includes('finished') || 
                       matchStatus.includes('won') ||
                       detailsStatus.includes('completed') ||
                       detailsStatus.includes('finished');

    // Check if match is not live anymore (iplay = false and status not live)
    const isNotLive = !match.isLive && matchStatus !== 'live' && !matchStatus.includes('upcoming');

    if (isCompleted || isNotLive) {
      // Extract sportsid and gmid for settlement
      const sportsid = match?.raw?.sid || match?.raw?.sportsid || match?.sid || 
                      (sport === 'cricket' ? '4' : 
                       sport === 'football' ? '1' : 
                       sport === 'tennis' ? '2' :
                       sport === 'basketball' ? '3' :
                       sport === 'hockey' ? '5' : null);
      const gmid = match?.gmid || match?.id || match?.eventId || matchId;

      if (sportsid && gmid) {
        // Mark as attempted to prevent duplicate calls
        settlementAttemptedRef.current = matchId;

        console.log('[Auto-Settle] Match completed, triggering auto-settlement...', {
          sportsid,
          gmid,
          matchStatus,
          detailsStatus,
          isCompleted,
          isNotLive
        });

        // Check if there are any markets with placed bets before attempting settlement
        // Check for both open AND closed markets (match might be over but markets not settled yet)
        // First check markets, then check if they have placed bets
        (supabase as any)
          .from('sports_markets')
          .select('id, market_name, status')
          .eq('sportsid', sportsid)
          .eq('gmid', gmid.toString())
          .in('status', ['open', 'closed', 'suspended'])
          .limit(10)
          .then(async ({ data: markets, error: marketsError }: any) => {
            if (marketsError) {
              console.error('[Auto-Settle] Error checking markets:', marketsError);
              settlementAttemptedRef.current = null; // Reset on error
              return;
            }

            if (!markets || markets.length === 0) {
              console.log('[Auto-Settle] No markets found, skipping settlement');
              settlementAttemptedRef.current = matchId; // Mark as attempted even if no markets
              return;
            }

            // Check if any of these markets have placed bets
            const marketIds = markets.map((m: any) => m.id);
            const { data: betsWithPlacedStatus, error: betsError } = await (supabase as any)
              .from('sports_market_bets')
              .select('market_id, status')
              .in('market_id', marketIds)
              .eq('status', 'placed')
              .limit(1);

            if (betsError) {
              console.error('[Auto-Settle] Error checking bets:', betsError);
              settlementAttemptedRef.current = null;
              return;
            }

            if (!betsWithPlacedStatus || betsWithPlacedStatus.length === 0) {
              console.log('[Auto-Settle] No placed bets found in markets, skipping settlement');
              settlementAttemptedRef.current = matchId;
              return;
            }

            console.log('[Auto-Settle] Found markets with placed bets, triggering settlement...');
            console.log('[Auto-Settle] Calling settleAllMarkets with:', { sportsid, gmid: gmid.toString() });

            // Trigger auto-settlement for all open markets
            settleAllMarkets(sportsid, gmid.toString()).then((result) => {
              console.log('[Auto-Settle] settleAllMarkets returned:', result);
              if (result?.success) {
                console.log('[Auto-Settle] ✅ Settlement completed successfully:', result);
                console.log('[Auto-Settle] Settled markets:', result.settled_markets);
                console.log('[Auto-Settle] Failed markets:', result.failed_markets);
                // Refresh bets after settlement
                setTimeout(() => {
                  console.log('[Auto-Settle] Refreshing bets...');
                  fetchMyBets();
                }, 2000);
              } else {
                console.warn('[Auto-Settle] ⚠️ Settlement returned but success=false:', result);
                settlementAttemptedRef.current = null; // Reset on failure
              }
            }).catch((error) => {
              console.error('[Auto-Settle] ❌ Settlement error:', error);
              console.error('[Auto-Settle] Error stack:', error.stack);
              settlementAttemptedRef.current = null; // Reset on error
            });
          });
      }
    }
  }, [match?.status, match?.isLive, matchDetails?.status, matchId, user, settleAllMarkets, fetchMyBets, sport]);

  // Debug: Log when useEffect dependencies change
  useEffect(() => {
    console.log('[Auto-Settle Debug] useEffect dependencies changed:', {
      matchStatus: match?.status,
      matchIsLive: match?.isLive,
      detailsStatus: matchDetails?.status,
      matchId,
      hasUser: !!user,
      hasSettleAllMarkets: !!settleAllMarkets,
      hasFetchMyBets: !!fetchMyBets,
      sport,
      settlementAttempted: settlementAttemptedRef.current
    });
  }, [match?.status, match?.isLive, matchDetails?.status, matchId, user, settleAllMarkets, fetchMyBets, sport]);

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
                {isSessionMarket() 
                  ? (selectedBet.type === 'back' ? 'YES' : 'NO')
                  : selectedBet.type.toUpperCase()}
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
            {/* Banner Image */}
            {matchBanner ? (
              <div className="w-full h-32 sm:h-48 md:h-64 overflow-hidden rounded-t-lg bg-muted">
                <img 
                  src={matchBanner} 
                  alt={`${match.team1} vs ${match.team2}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('[Banner Debug] Image load error:', matchBanner);
                    // Hide banner if image fails to load and set fallback
                    (e.target as HTMLImageElement).style.display = 'none';
                    setMatchBanner(null);
                  }}
                  onLoad={() => {
                    console.log('[Banner Debug] Banner image loaded successfully:', matchBanner);
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-32 sm:h-48 md:h-64 overflow-hidden rounded-t-lg bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDEwIDAgTCAwIDAgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
                <div className="relative z-10 text-center px-4">
                  <Trophy className="h-12 w-12 mx-auto text-primary/40 mb-2" />
                  <p className="text-sm font-semibold text-foreground/60">{match.team1} vs {match.team2}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sport || 'Match'}</p>
                </div>
              </div>
            )}
            
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
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="odds" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5">
                <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">ODDS</span>
              </TabsTrigger>
              <TabsTrigger value="mybets" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5">
                <Receipt className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">My Bets</span>
                <span className="text-xs sm:text-sm sm:hidden">Bets</span>
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

          {/* My Bets Tab */}
          <TabsContent value="mybets" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    My Bets
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Manual Settlement Button - Only show if match is over and there are placed bets */}
                    {match && (!match.isLive) && myBets.some((bet: any) => 
                      (bet.status?.toUpperCase() === 'PLACED' || bet.status === 'placed')
                    ) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          const sportsid = match?.raw?.sid || match?.raw?.sportsid || match?.sid || 
                                         (sport === 'cricket' ? '4' : 
                                          sport === 'football' ? '1' : 
                                          sport === 'tennis' ? '2' :
                                          sport === 'basketball' ? '3' :
                                          sport === 'hockey' ? '5' : null);
                          const gmid = match?.gmid || match?.id || match?.eventId || matchId;
                          
                          if (sportsid && gmid) {
                            toast({
                              title: "Settling Markets",
                              description: "Please wait while we settle your bets...",
                            });
                            
                            const result = await settleAllMarkets(sportsid, gmid.toString());
                            if (result?.success) {
                              setTimeout(() => {
                                fetchMyBets();
                              }, 2000);
                            }
                          }
                        }}
                        disabled={isLoadingMyBets}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Settle Bets
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchMyBets}
                      disabled={isLoadingMyBets}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMyBets ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingMyBets ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : myBetsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{myBetsError}</AlertDescription>
                  </Alert>
                ) : myBets.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">No bets found</p>
                    <p className="text-sm text-muted-foreground">
                      You haven't placed any bets for this match yet.
                    </p>
                  </div>
                ) : (
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
                        {myBets.map((bet: any) => {
                          const isMarketBet = bet.source === 'market_bets';
                          const status = bet.status || 'placed';
                          const statusColors: Record<string, string> = {
                            won: 'bg-green-500/10 text-green-600 border-green-500/20',
                            lost: 'bg-red-500/10 text-red-600 border-red-500/20',
                            placed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                            void: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
                            refunded: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                          };

                          const betSide = bet.bet_side || (bet as any).bet_type || '';
                          const betSideDisplay = betSide === 'back' ? 'BACK' : 
                                               betSide === 'lay' ? 'LAY' :
                                               betSide === 'yes' ? 'YES' : 
                                               betSide === 'no' ? 'NO' : 'N/A';
                          
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
                          
                          const potentialWin = bet.potential_profit || (bet as any).potential_win || 0;
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
                                      {bet.market_type === 'odds' ? 'ODDS' : 'SESSION'}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {isMarketBet 
                                    ? (bet.market_type === 'odds' ? 'ODDS' : 'SESSION')
                                    : (bet as any).market_type || 'Sports'}
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
                                <div className="font-semibold text-orange-600">
                                  ₹{parseFloat(exposure.toString()).toFixed(2)}
                                </div>
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
                                  className={`${statusColors[status] || statusColors.placed} border`}
                                >
                                  {status.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div>
                                    {new Date(bet.created_at).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
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
                )}
              </CardContent>
            </Card>
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
                          {isSessionMarket() 
                            ? (selectedBet.type === 'back' ? 'YES' : 'NO')
                            : selectedBet.type.toUpperCase()}
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
