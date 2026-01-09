import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { 
  parseRdesc, 
  matchBetAgainstRdesc, 
  extractRdesc, 
  processBetMatching,
  type ParsedRdesc,
  type BetMatchResult 
} from './betMatching.ts';
import {
  parseRouletteResult,
  deriveRouletteAttributes,
  isWinningBet,
  settleRouletteBets,
  isRouletteTable,
  type RouletteResult
} from './rouletteSettlement.ts';
import {
  parseLucky5Result,
  isLucky5WinningBet,
  settleLucky5Bets,
  isLucky5Table,
  type Lucky5Result
} from './lucky5Settlement.ts';
import {
  parseDT6Result,
  isDT6WinningBet,
  settleDT6Bets,
  isDT6Table,
  type DT6Result
} from './dt6Settlement.ts';
import {
  parseTeen3Result,
  isTeen3WinningBet,
  settleTeen3Bets,
  isTeen3Table,
  type Teen3Result
} from './teen3Settlement.ts';
import {
  parseAAA2Result,
  isAAA2WinningBet,
  settleAAA2Bets,
  isAAA2Table,
  type AAA2Result
} from './aaa2Settlement.ts';
import {
  parseCMeter1Result,
  isCMeter1WinningBet,
  settleCMeter1Bets,
  isCMeter1Table,
  type CMeter1Result
} from './cmeter1Settlement.ts';
import {
  parseMogamboResult,
  isMogamboWinningBet,
  isMogamboTable,
  parseThreeCardTotal,
  isThreeCardTotalWinningBet,
  type MogamboResult,
  type ThreeCardTotalResult
} from './mogamboSettlement.ts';
import {
  parseDolidanaResult,
  isDolidanaWinningBet,
  isDolidanaTable,
  type DolidanaResult
} from './dolidanaSettlement.ts';
import {
  parseAB20Result,
  isAB20WinningBet,
  isAB20Table,
  type AB20Result
} from './ab20Settlement.ts';
import {
  parseTeen62Result,
  settleTeen62MainBet,
  settleTeen62SuitBet,
  settleTeen62OddEven,
  settleTeen62Consecutive,
  formatTeen62LastResults,
  isTeen62Table,
  type Teen62Result
} from './teen62Settlement.ts';
import {
  parseAb3Result,
  isAb3WinningBet,
  isAb3Table,
  type Ab3Result
} from './ab3Settlement.ts';
import {
  parseDT202Result,
  isDT202WinningBet,
  settleDT202Bets,
  type DT202Result
} from './dt202Settlement.ts';
import {
  parseDum10Result,
  isDum10WinningBet,
  isDum10Table,
  formatDum10LastResults,
  type Dum10Result
} from './dum10Settlement.ts';
import {
  parseLottcardResult,
  isLottcardWinningBet,
  isLottcardTable,
  formatLottcardLastResults,
  type LottcardResult
} from './lottcardSettlement.ts';
import {
  parseLucky7Result,
  isLucky7WinningBet,
  isLucky7Table,
  formatLucky7LastResults,
  type Lucky7Result
} from './lucky7Settlement.ts';
import {
  parsePatti2Result,
  isPatti2WinningBet,
  isPatti2Table,
  formatPatti2LastResults,
  type Patti2Result
} from './patti2Settlement.ts';
import {
  parseRace2Result,
  isRace2WinningBet,
  isRace2Table,
  formatRace2LastResults,
  type Race2Result
} from './race2Settlement.ts';
import {
  parseJoker120Result,
  isWinningJoker120Bet,
  isJoker120Table,
  formatJoker120Last10,
  type Joker120Result
} from './joker120Settlement.ts';
import {
  parseJoker1Result,
  isWinningJoker1Bet,
  isJoker1Table,
  formatJoker1Last10,
  type Joker1Result
} from './joker1Settlement.ts';
import {
  parseJoker20Result,
  isWinningJoker20Bet,
  isJoker20Table,
  formatJoker20Last10,
  type Joker20Result
} from './joker20Settlement.ts';
import {
  parseTeen120Result,
  isTeen120WinningBet,
  isTeen120Table,
  formatTeen120LastResults,
  type Teen120Result
} from './teen120Settlement.ts';
import {
  parseTeenUniqueResult,
  isWinningTeenUniqueBet,
  isTeenUniqueTable,
  formatTeenUniqueLast10,
  type TeenUniqueResult
} from './teenUniqueSettlement.ts';
import {
  parseTeen20V1Result,
  isTeen20V1WinningBet,
  isTeen20V1Table,
  formatTeen20V1Results,
  type Teen20V1Result
} from './teen20v1Settlement.ts';
import {
  parseTeen1Result,
  isTeen1WinningBet,
  isTeen1Table,
  formatTeen1LastResults,
  type Teen1Result
} from './teen1Settlement.ts';
import {
  parseRoulette11Result,
  isWinningRoulette11Bet,
  isRoulette11Table,
  formatRoulette11Last10,
  type Roulette11Result
} from './roulette11Settlement.ts';
import {
  parseRoulette12Result,
  isWinningRoulette12Bet,
  isRoulette12Table,
  formatRoulette12Last10,
  type Roulette12Result
} from './roulette12Settlement.ts';
import {
  parseRoulette13Result,
  isWinningRoulette13Bet,
  isRoulette13Table,
  formatRoulette13Last10,
  type Roulette13Result
} from './roulette13Settlement.ts';
import {
  parseKBCResult,
  isKBCWinningBet,
  isKBCTable,
  formatKBCLastResults,
  type KBCResult
} from './kbcSettlement.ts';
import {
  parsePoison20Result,
  isWinningPoison20Bet,
  isPoison20Table,
  formatPoison20Last10,
  type Poison20Result
} from './poison20Settlement.ts';
import {
  parseAAAResult,
  isWinningAAABet,
  isAAATable,
  type AAAResult
} from './aaaSettlement.ts';
import {
  parsePokerResult,
  isWinningPokerMainBet,
  isPokerTable,
  type PokerResult
} from './pokerSettlement.ts';
import {
  parseBaccaratResult,
  isWinningBaccaratMainBet,
  isWinningBaccaratPairBet,
  isWinningBaccaratBigSmallBet,
  isBaccaratTable,
  type BaccaratResult
} from './baccaratSettlement.ts';
import {
  parseTeenResult,
  isWinningTeenMainBet,
  isWinningTeenSuitBet,
  isTeenTable,
  type TeenResult
} from './teenSettlement.ts';
import {
  parseAB4Result,
  isWinningAB4Bet,
  isAB4Table,
  type AB4Result
} from './ab4Settlement.ts';
import {
  parseABJResult,
  isWinningABJMain,
  isWinningABJJokerNumber,
  isWinningABJJokerSuit,
  isWinningABJJokerOddEven,
  isABJTable,
  type ABJResult
} from './abjSettlement.ts';
import {
  parseBaccarat2Result,
  isWinningBaccarat2MainBet,
  isWinningBaccarat2ScoreBet,
  isBaccarat2Table,
  type Baccarat2Result
} from './baccarat2Settlement.ts';
import {
  parseBTableResult,
  isWinningBTableBet,
  isBTable,
  type BTableResult
} from './btableSettlement.ts';
import {
  parseBTable2Result,
  isWinningBTable2Bet,
  isBTable2Table,
  type BTable2Result
} from './btable2Settlement.ts';
import {
  parseCard32Result,
  isWinningCard32Bet,
  isCard32Table,
  type Card32Result
} from './card32Settlement.ts';
import {
  parseCard32EUResult,
  isWinningCard32EUMatch,
  isCard32EUTable,
  type Card32EUResult
} from './card32euSettlement.ts';
import {
  parseCMatch20Result,
  isWinningCMatch20Bet,
  isCMatch20Table,
  type CMatch20Result
} from './cmatch20Settlement.ts';
import {
  parseCMeterResult,
  isWinningCMeterBet,
  isCMeterTable,
  type CMeterResult
} from './cmeterSettlement.ts';
import {
  parseCricketV3Result,
  isWinningCricketV3Bet,
  isCricketV3,
  type CricketV3Result
} from './cricketv3Settlement.ts';
import {
  parseDT20Result,
  isWinningDT20MainBet,
  isDT20Table,
  type DT20Result
} from './dt20Settlement.ts';
import {
  parseDTL20Result,
  isWinningDTL20WinnerBet,
  isDTL20Table,
  type DTL20Result
} from './dtl20Settlement.ts';
import {
  parseGoalResult,
  isWinningGoalBet,
  isGoalTable,
  type GoalResult
} from './goalSettlement.ts';
import {
  parseLucky15Result,
  isWinningLucky15Bet,
  isLucky15Table,
  type Lucky15Result
} from './lucky15Settlement.ts';
import {
  parseLucky7EUResult,
  isWinningLucky7EUMain,
  isLucky7EUTable,
  type Lucky7EUResult
} from './lucky7euSettlement.ts';
import {
  parseOurRouletteResult,
  isWinningOurRouletteBet,
  isOurRouletteTable,
  type OurRouletteResult
} from './ourRouletteSettlement.ts';
import {
  parsePoker20Result,
  isWinningPoker20WinnerBet,
  isPoker20Table,
  type Poker20Result
} from './poker20Settlement.ts';
import {
  parsePoker6Result,
  isWinningPoker6PlayerBet,
  isWinningPoker6HandBet,
  isPoker6Table,
  type Poker6Result
} from './poker6Settlement.ts';
import {
  parsePoisonResult,
  isWinningPoisonBet,
  isPoisonTable,
  type PoisonResult
} from './poisonSettlement.ts';
import {
  parseQueenResult,
  isWinningQueenBet,
  isQueenTable,
  type QueenResult
} from './queenSettlement.ts';
import {
  parseRace20Result,
  isWinningRace20Bet,
  isRace20Table,
  type Race20Result
} from './race20Settlement.ts';
import {
  parseSicBoResult,
  isWinningSicBoBet,
  isSicBoTable,
  type SicBoResult
} from './sicboSettlement.ts';
import {
  parseSicbo2Result,
  isWinningSicbo2Bet,
  isSicbo2Table,
  type Sicbo2Result
} from './sicbo2Settlement.ts';
import {
  parseSuperOver2Result,
  isWinningSuperOver2Bet,
  isSuperOver2Table,
  type SuperOver2Result
} from './superover2Settlement.ts';
import {
  parseSuperOver3Result,
  isWinningSuperOver3Bet,
  isSuperOver3Table,
  type SuperOver3Result
} from './superover3Settlement.ts';
import {
  parseTeen20CResult,
  isWinningTeen20CBet,
  isTeen20CTable,
  type Teen20CResult
} from './teen20cSettlement.ts';
import {
  parseTeen30Result,
  isWinningTeen30MainBet,
  isTeen30Table,
  type Teen30Result
} from './teen30Settlement.ts';
import {
  parseTeen32Result,
  isTeen32WinningBet,
  isTeen32Table,
  type Teen32Result
} from './teen32Settlement.ts';
import {
  parseTeen33Result,
  isWinningTeen33Bet,
  isTeen33Table,
  type Teen33Result
} from './teen33Settlement.ts';
import {
  parseTeen41Result,
  isWinningTeen41Bet,
  isTeen41Table,
  type Teen41Result
} from './teen41Settlement.ts';
import {
  parseTeen42Result,
  isWinningTeen42Bet,
  isTeen42Table,
  type Teen42Result
} from './teen42Settlement.ts';
import {
  parseTeen6Result,
  isWinningTeen6Match,
  isTeen6Table,
  type Teen6Result
} from './teen6Settlement.ts';
import {
  parseTeen9Result,
  isWinningTeen9WinnerBet,
  isWinningTeen9HandBet,
  isTeen9Table,
  type Teen9Result
} from './teen9Settlement.ts';
import {
  parseWarResult,
  isWinningWarBet,
  isWarTable,
  type WarResult
} from './warSettlement.ts';
import {
  parseWorliResult,
  isWinningWorliBet,
  isWorliTable,
  type WorliResult
} from './worliSettlement.ts';
import {
  parseWorli2Result,
  isWinningWorli2Bet,
  isWorli2Table,
  type Worli2Result
} from './worli2Settlement.ts';
import {
  parseBallByBallResult,
  isWinningBallByBallBet,
  isBallByBallTable,
  type BallByBallResult
} from './ballByBallSettlement.ts';
import {
  parse3CardJResult,
  isWinning3CardJBet,
  is3CardJTable,
  type ThreeCardJResult
} from './3cardjSettlement.ts';

// Constants
const TIMEOUTS = {
  ODDS_FETCH: 8000,
  TABLE_FETCH: 8000,
  STREAM_FETCH: 10000,
  TABLE_ID_FETCH: 5000,
} as const;

const HOSTINGER_PROXY_BASE = 'http://72.61.169.60:8000/api/casino';
const CASINO_IMAGE_BASE = 'https://sitethemedata.com/casino-games';

// CORS headers - use environment variable for production
const getAllowedOrigin = () => {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  return allowedOrigin || '*';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const CASINO_API_URL = Deno.env.get('DIAMOND_CASINO_API_URL')?.replace(/\/$/, '');
    const CASINO_API_KEY = Deno.env.get('DIAMOND_CASINO_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Whitelisted domain for stream server CORS
    const WHITELISTED_DOMAIN = Deno.env.get('WHITELISTED_STREAM_DOMAIN') || 'https://www.rrbexchange.com';

    // Note: CASINO_API_URL and CASINO_API_KEY are optional - bets can be recorded locally

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Handle GET requests (image proxy only - NO stream proxy)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const imagePath = url.searchParams.get('image');
      
      // Image proxy only - stream proxy removed (Edge Functions not suitable for video streaming)
      if (imagePath) {
        console.log(`🖼️ Proxying image: ${imagePath}`);
        
        // Try multiple image source URLs
        const urlVariations = [
          `https://sitethemedata.com/casino-games/${imagePath}`,
          `https://dzm0kbaskt4pv.cloudfront.net/v11/images/games/${imagePath}`,
          `https://dzm0kbaskt4pv.cloudfront.net/images/games/${imagePath}`,
        ];

        for (const imageUrl of urlVariations) {
          try {
            console.log(`📡 Trying image URL: ${imageUrl}`);
            const imageResponse = await fetch(imageUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
              }
            });

            if (imageResponse.ok) {
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
              const imageData = await imageResponse.arrayBuffer();
              
              return new Response(imageData, {
                headers: {
                  ...corsHeaders,
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=86400',
                }
              });
            }
          } catch (error) {
           // console.error(`Fetch error for ${imageUrl}:`, error);
          }
        }

        return new Response(JSON.stringify({ error: 'Image not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Missing stream or image parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Handle POST requests for API actions
    const reqBody = await req.json();
    const { action, tableId, betData, date } = reqBody;

    let result;

    // Helper function to fetch with timeout
    const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = TIMEOUTS.ODDS_FETCH) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Fetch timeout error for ${url}:`, errorMessage);
        throw error;
      }
    };

    // Get live tables from Hostinger VPS proxy
    if (action === 'get-tables') {
      const HOSTINGER_PROXY_URL = `${HOSTINGER_PROXY_BASE}/tableid`;
      //console.log(`📡 Fetching tables from: ${HOSTINGER_PROXY_URL}`);
      
      let tables: any[] = [];
      let fromCache = false;
      
      try {
        const response = await fetchWithTimeout(HOSTINGER_PROXY_URL, {
          headers: { 'Content-Type': 'application/json' }
        }, TIMEOUTS.TABLE_FETCH);

        if (!response.ok) {
          throw new Error(`Failed to fetch tables: ${response.status}`);
        }

        const apiData = await response.json();
        
        let rawTables: any[] = [];
        
        if (Array.isArray(apiData)) {
          rawTables = apiData;
        } else if (apiData?.data?.t1) {
          rawTables = apiData.data.t1;
        } else if (Array.isArray(apiData?.data)) {
          rawTables = apiData.data;
        }
        
        tables = rawTables.map((table: any) => {
          let imageUrl = '';
          if (table.imgpath) {
            imageUrl = `${CASINO_IMAGE_BASE}/${table.imgpath}`;
          } else if (table.imageUrl) {
            imageUrl = table.imageUrl;
          } else if (table.img) {
            imageUrl = table.img.startsWith('http') ? table.img : `${CASINO_IMAGE_BASE}/${table.img}`;
          }
          
          return {
            id: table.gmid || table.id || table.gtype || String(Math.random()),
            name: table.gname || table.name || table.gtype || 'Unknown Table',
            type: table.gmid || table.type || table.gtype,
            data: table,
            status: table.status || table.gstatus || 'active',
            players: table.players || 0,
            imageUrl
          };
        });

        // Update database cache
        for (const table of tables) {
          await supabase
            .from('diamond_casino_tables')
            .upsert({
              table_id: table.id,
              table_name: table.name,
              table_data: table.data,
              player_count: table.players,
              status: table.status,
              last_updated: new Date().toISOString()
            }, { onConflict: 'table_id' });
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        //console.log(`⚠️ VPS unreachable, falling back to cached tables:`, errorMessage);
        fromCache = true;
        
        // Fallback to cached data from database
        const { data: cachedTables } = await supabase
          .from('diamond_casino_tables')
          .select('*')
          .order('table_name');
        
        if (cachedTables && cachedTables.length > 0) {
          tables = cachedTables.map((t: any) => ({
            id: t.table_id,
            name: t.table_name,
            type: t.table_id,
            data: t.table_data,
            status: t.status || 'active',
            players: t.player_count || 0,
            imageUrl: t.table_data?.imgpath 
              ? `https://sitethemedata.com/casino-games/${t.table_data.imgpath}` 
              : ''
          }));
        }
      }

      result = { success: true, data: { tables }, fromCache };
    }

    // Get specific table details
    else if (action === 'get-table' && tableId) {
      const { data: cachedTable } = await supabase
        .from('diamond_casino_tables')
        .select('*')
        .eq('table_id', tableId)
        .single();
      
      result = cachedTable 
        ? { success: true, data: cachedTable.table_data || { id: tableId, name: cachedTable.table_name } }
        : { success: true, data: { id: tableId } };
    }

    // Get live stream URL
    else if (action === 'get-stream-url' && tableId) {
      try {
        // SIMPLE: Just return the stream URL from Hostinger proxy
        // NO PROXY - Edge Functions are not suitable for video streaming
        const hostingerStreamUrl = `${HOSTINGER_PROXY_BASE}/tv_url?id=${tableId}`;
        
        const response = await fetch(hostingerStreamUrl, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          //console.log(`📺 Stream URL response from Hostinger:`, JSON.stringify(data, null, 2));
          
          // Extract the actual stream URL from response
          const actualStreamUrl = data.url || data.tv_url || data.stream_url || data.data?.url || data.data?.tv_url || data.data || (typeof data === 'string' ? data : null);
          
          if (actualStreamUrl) {
            //console.log(`✅ Stream URL: ${actualStreamUrl}`);
            // Return direct URL - frontend will use it directly
            result = { 
              success: true, 
              streamUrl: actualStreamUrl,
            };
          } else {
            throw new Error('No stream URL found in response');
          }
        } else {
          throw new Error(`Hostinger proxy returned ${response.status}`);
        }
      } catch (error: any) {
        console.error('Error fetching stream URL:', error);
        result = { 
          success: false, 
          error: error?.message || 'Failed to fetch stream URL' 
        };
      }
    }

    // Get current result
    else if (action === 'get-result' && tableId) {
      try {
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/result?type=${tableId}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          result = { success: true, data };
        } else {
          result = { success: true, data: null };
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        // Connection errors are common - log but don't fail completely
        if (errorMessage.includes('Connection reset') || errorMessage.includes('connection error')) {
          console.warn(`⚠️ [get-result] Connection error for ${tableId}, API may be temporarily unavailable`);
        } else {
          console.error(`❌ [get-result] Error for ${tableId}:`, errorMessage);
        }
        result = { success: true, data: null };
      }
    }

    // Get result history
    else if (action === 'get-result-history' && tableId) {
      const targetDate = date || new Date().toISOString().split('T')[0];
      try {
        const response = await fetch(`${HOSTINGER_PROXY_BASE}/history?type=${tableId}&date=${targetDate}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          result = { success: true, data: Array.isArray(data) ? data : (data.data || data.history || []) };
        } else {
          result = { success: true, data: [] };
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        // Connection errors are common - log but don't fail completely
        if (errorMessage.includes('Connection reset') || errorMessage.includes('connection error')) {
          console.warn(`⚠️ [get-result-history] Connection error for ${tableId}, API may be temporarily unavailable`);
        } else {
          console.error(`❌ [get-result-history] Error for ${tableId}:`, errorMessage);
        }
        result = { success: true, data: [] };
      }
    }

    // Get table odds
    else if (action === 'get-odds' && tableId) {
      try {
        // Get gmid from tableid endpoint
        let gmid = tableId;
        
        try {
          const tableIdResponse = await fetchWithTimeout(`${HOSTINGER_PROXY_BASE}/tableid?id=${tableId}`, {
            headers: { 'Content-Type': 'application/json' }
          }, TIMEOUTS.TABLE_ID_FETCH);
          
          if (tableIdResponse.ok) {
            const tableIdData = await tableIdResponse.json();
            const extractedGmid = tableIdData?.data?.gmid || tableIdData?.gmid || 
                                 tableIdData?.data?.mid || tableIdData?.mid;
            if (extractedGmid) {
              gmid = extractedGmid;
              console.log(`✅ Extracted gmid: ${gmid} for tableId: ${tableId}`);
            }
          }
        } catch (tableIdError) {
          const errorMessage = tableIdError instanceof Error ? tableIdError.message : String(tableIdError);
          console.log(`⚠️ Could not fetch gmid, using tableId as gmid:`, errorMessage);
        }
        
        // Try multiple endpoints for odds
        const oddsEndpoints = [
          `${HOSTINGER_PROXY_BASE}/data?type=${tableId}&id=${gmid}`,
          `${HOSTINGER_PROXY_BASE}/data?type=${tableId}`,
          `${HOSTINGER_PROXY_BASE}/odds?type=${tableId}&id=${gmid}`,
          `${HOSTINGER_PROXY_BASE}/odds?type=${tableId}`,
        ];

        let oddsData: any = null;

        for (const endpoint of oddsEndpoints) {
          try {
            const response = await fetchWithTimeout(endpoint, {
              headers: { 'Content-Type': 'application/json' }
            }, TIMEOUTS.ODDS_FETCH);

            if (response && response.ok) {
              const data = await response.json();
              oddsData = data?.data || data;
              //console.log(`✅ Odds fetched successfully from: ${endpoint}`);
              break;
            }
          } catch (endpointError) {
            const errorMessage = endpointError instanceof Error ? endpointError.message : String(endpointError);
            // Timeout errors are common - log briefly and continue to next endpoint
            if (errorMessage.includes('signal has been aborted') || errorMessage.includes('timeout')) {
              // Silent - will try next endpoint
            } else {
              console.log(`⚠️ Endpoint failed: ${endpoint}`, errorMessage);
            }
            continue;
          }
        }

        if (oddsData) {
          const bettingOptions: any[] = [];
          
          // Parse sub, t1, t2, t3 arrays for betting options
          ['sub', 't1', 't2', 't3'].forEach((key) => {
            if (oddsData[key] && Array.isArray(oddsData[key])) {
              oddsData[key].forEach((item: any) => {
                if (item.nat || item.nation || item.name) {
                  const backVal = parseFloat(item.b1 || item.b || '0') || 0;
                  const layVal = parseFloat(item.l1 || item.l || '0') || 0;
                  
                  // Only add if there's a valid back or lay value
                  if (backVal > 0 || layVal > 0) {
                    bettingOptions.push({
                      type: item.nat || item.nation || item.name,
                      back: backVal,
                      lay: layVal,
                      status: item.gstatus === 'SUSPENDED' || item.gstatus === '0' ? 'suspended' : 'active',
                      min: item.min || 100,
                      max: item.max || 100000,
                      sid: item.sid,
                      mid: oddsData.mid || item.mid,
                      subtype: item.subtype,
                      etype: item.etype,
                    });
                  }
                }
              });
            }
          });
          
          // Also check if data is directly an array
          if (Array.isArray(oddsData) && oddsData.length > 0) {
            (oddsData as any[]).forEach((item: any) => {
              if (item.nat || item.nation || item.name) {
                const backVal = parseFloat(item.b1 || item.b || '0') || 0;
                const layVal = parseFloat(item.l1 || item.l || '0') || 0;
                
                if (backVal > 0 || layVal > 0) {
                  bettingOptions.push({
                    type: item.nat || item.nation || item.name,
                    back: backVal,
                    lay: layVal,
                    status: item.gstatus === 'SUSPENDED' || item.gstatus === '0' ? 'suspended' : 'active',
                    min: item.min || 100,
                    max: item.max || 100000,
                    sid: item.sid,
                    mid: item.mid,
                    subtype: item.subtype,
                    etype: item.etype,
                  });
                }
              }
            });
          }
          
          if (bettingOptions.length > 0) {
            //console.log(`✅ Found ${bettingOptions.length} betting options`);
            result = { success: true, data: { bets: bettingOptions, raw: oddsData } };
          } else {
            //console.log(`⚠️ No betting options found in odds data`);
            result = { success: true, data: { bets: [], raw: oddsData, noOdds: true } };
          }
        } else {
          //console.log(`⚠️ No odds data received from any endpoint`);
          result = { success: true, data: { bets: [], raw: null, noOdds: true } };
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorStack = fetchError instanceof Error ? fetchError.stack : undefined;
        console.error(`❌ Odds fetch error:`, {
          tableId,
          message: errorMessage,
          stack: errorStack
        });
        result = { success: true, data: { bets: [], raw: null, error: true } };
      }
    }

    // Get all casino table IDs
    else if (action === 'get-table-ids') {
      const response = await fetch('http://72.61.169.60:8000/api', {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch table IDs: ${response.status}`);
      }

      const data = await response.json();
      result = { success: true, data };
    }

    // Place bet - Only database, no external API
    else if (action === 'place-bet' && betData) {
      try {
        console.log('📝 Place bet request:', { 
          tableId: betData.tableId, 
          amount: betData.amount, 
          betType: betData.betType,
          side: betData.side,
          odds: betData.odds 
        });
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        console.error('❌ No authorization header');
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!user) {
        console.error('❌ No user found');
        throw new Error('Unauthorized');
      }

      // Validate bet data
      if (!betData.amount || betData.amount <= 0) {
        throw new Error('Invalid bet amount');
      }
      if (!betData.betType) {
        throw new Error('Bet type is required');
      }
      if (!betData.tableId) {
        throw new Error('Table ID is required');
      }

      // Check wallet balance
      const { data: wallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();

      if (walletFetchError) {
        console.error('❌ Wallet fetch error:', walletFetchError);
        throw new Error(`Failed to fetch wallet: ${walletFetchError.message}`);
      }

      if (!wallet) {
        throw new Error('Wallet not found. Please contact support.');
      }

      if (wallet.current_balance < betData.amount) {
        throw new Error(`Insufficient balance. You have ₹${wallet.current_balance}, but need ₹${betData.amount}`);
      }

      // Deduct from wallet
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: betData.amount,
        p_type: 'debit',
        p_reason: `Diamond Casino bet on ${betData.tableName}`,
        p_game_type: 'casino'
      });

      if (walletError) throw new Error(`Wallet update failed: ${walletError.message}`);

      // Normalize bet type: Add leading zero for single digit numbers (0-9)
      // This ensures "2" becomes "02" to match result format like "02"
      let normalizedBetType = betData.betType.trim();
      
      // Check if betType is a single digit number (0-9)
      if (/^\d$/.test(normalizedBetType)) {
        // Add leading zero: "2" -> "02", "5" -> "05", "0" -> "00"
        normalizedBetType = normalizedBetType.padStart(2, '0');
        console.log(`🔢 Normalized single digit bet: "${betData.betType}" → "${normalizedBetType}"`);
      }

      // Record bet in database
      // Build insert data - only include side if it's provided and valid
      let betInsertData: any = {
        user_id: user.id,
        table_id: betData.tableId,
        table_name: betData.tableName || null,
        bet_amount: betData.amount,
        bet_type: normalizedBetType, // Use normalized bet type
        odds: betData.odds || null,
        round_id: betData.roundId || null,
        status: 'pending',
      };

      // Only add side if it's provided and is a valid value
      if (betData.side && (betData.side === 'back' || betData.side === 'lay')) {
        betInsertData.side = betData.side;
      }

      console.log('📝 Inserting bet with data:', { ...betInsertData, user_id: '[hidden]' });

      // Try to insert - if side column doesn't exist, it will fail and we'll retry without it
      let { data: bet, error: betError } = await supabase
        .from('diamond_casino_bets')
        .insert(betInsertData)
        .select()
        .single();

      // If error is about missing side column, retry without it
      if (betError && betError.message && (
        betError.message.toLowerCase().includes('column') && betError.message.toLowerCase().includes('side') ||
        betError.message.toLowerCase().includes('does not exist') ||
        betError.code === '42703' // PostgreSQL error code for undefined column
      )) {
        console.log('⚠️ Side column not found, retrying without it');
        delete betInsertData.side;
        const retryResult = await supabase
          .from('diamond_casino_bets')
          .insert(betInsertData)
          .select()
          .single();
        bet = retryResult.data;
        betError = retryResult.error;
      }

      if (betError) {
        console.error('❌ Bet insert error:', betError);
        console.error('❌ Bet insert data:', betInsertData);
        console.error('❌ Error code:', betError.code);
        console.error('❌ Error message:', betError.message);
        console.error('❌ Error details:', betError);
        
        // Refund if database insert fails
        try {
          await supabase.rpc('update_wallet_balance', {
            p_user_id: user.id,
            p_amount: betData.amount,
            p_type: 'credit',
            p_reason: 'Bet refund - recording failed',
            p_game_type: 'casino'
          });
          console.log('✅ Refund processed');
        } catch (refundError) {
          console.error('❌ Refund failed:', refundError);
        }
        throw new Error(`Bet recording failed: ${betError.message || JSON.stringify(betError)}`);
      }

        console.log('✅ Bet inserted successfully:', bet?.id);

        result = { 
          success: true, 
          bet, 
          message: 'Bet placed successfully'
        };
      } catch (placeBetError: any) {
        console.error('❌ Place bet error in try block:', placeBetError);
        console.error('❌ Place bet error message:', placeBetError?.message);
        console.error('❌ Place bet error stack:', placeBetError?.stack);
        // Re-throw to be caught by outer catch block
        throw placeBetError;
      }
    }

    // ============================================
    // PRODUCTION-READY BET SETTLEMENT SYSTEM
    // ============================================
    // Priority: Detailed Result API (PRIMARY) → Result API (FALLBACK)
    // Matching: Name-based (winnat/cname) - NOT numeric codes
    // Safety: Round-based matching, duplicate prevention, transaction safety
    // ============================================
    else if (action === 'process-bets' && tableId) {
      let resultData: any = null;
      let resultMid: string | null = null;
      let winnat: string | null = null;
      let win: string | null = null;
      let resultSource = 'none';

      // ============================================
      // STEP 1: FETCH RESULT (Detailed API → Fallback API)
      // ============================================
      
      // Get mid from request body or extract from latest result
      let mid = reqBody?.mid || null;
      
      // If mid not provided, extract from latest result API
      if (!mid) {
        try {
          const resultResponse = await fetch(`${HOSTINGER_PROXY_BASE}/result?type=${tableId}`, {
            headers: { 'Content-Type': 'application/json' }
          });

          if (resultResponse.ok) {
            const resultJson = await resultResponse.json();
            const resData = resultJson?.data?.res || [];
            if (Array.isArray(resData) && resData.length > 0) {
              mid = resData[0]?.mid?.toString() || null;
              if (mid) {
                console.log(`✅ Extracted mid from latest result: ${mid}`);
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          // Connection errors are common - silently continue
          if (!errorMessage.includes('Connection reset') && !errorMessage.includes('connection error')) {
            console.warn(`⚠️ Could not extract mid from latest result: ${errorMessage}`);
          }
        }
      }
      
      console.log(`🚀 [PROCESS-BETS] Starting settlement for table: ${tableId}, mid: ${mid || 'not available'}`);

      // PRIMARY: Try Detailed Result API first (most reliable)
      if (mid) {
        try {
          const detailUrl = `${HOSTINGER_PROXY_BASE}/detail_result?mid=${mid}&type=${tableId}`;
          
          const detailResponse = await fetch(detailUrl, {
            headers: { 'Content-Type': 'application/json' }
          });

          if (detailResponse.ok) {
            const detailJson = await detailResponse.json();
            
            // Check if API returned an error
            if (detailJson?.error) {
              console.warn(`⚠️ [PRIMARY] API error: ${detailJson.error}`);
              throw new Error(`API error: ${detailJson.error}`);
            }
            
            // Extract result from t1 (most common structure)
            const t1Data = detailJson?.data?.t1 || detailJson?.t1;
            if (t1Data) {
              resultData = t1Data;
              winnat = t1Data?.winnat?.toString().trim() || null;
              win = t1Data?.win?.toString().trim() || null;
              resultMid = t1Data?.rid?.toString() || t1Data?.mid?.toString() || mid || null;
              resultSource = 'detailed_result_api';
              
              // Verify table name matches (safety check)
              const resultTableName = t1Data?.ename?.toLowerCase() || '';
              if (resultTableName && !resultTableName.includes(tableId.toLowerCase())) {
                console.warn(`⚠️ [PRIMARY] Table mismatch: requested ${tableId}, got result for ${resultTableName}`);
              }
            } else {
              // Fallback to old structure
              resultData = detailJson?.data || detailJson;
              winnat = resultData?.winnat?.toString().trim() || null;
              win = resultData?.win?.toString().trim() || null;
              resultMid = resultData?.mid?.toString() || mid;
              resultSource = 'detailed_result_api';
            }
            
            // Extract rdesc for industry-standard bet matching
            const rdesc = extractRdesc(resultData);
            if (!rdesc) {
              // Try extracting from detailJson directly (not just data)
              const rdescFromRoot = extractRdesc(detailJson);
              if (rdescFromRoot) {
                if (!resultData.rdesc) {
                  resultData = { ...resultData, rdesc: rdescFromRoot };
                }
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ [PRIMARY] Detailed result API failed: ${errorMessage}, trying fallback`);
        }
      }

      // FALLBACK: Use Regular Result API if detailed result not available
      if (!winnat && !win) {
        try {
          const resultResponse = await fetch(`${HOSTINGER_PROXY_BASE}/result?type=${tableId}`, {
            headers: { 'Content-Type': 'application/json' }
          });

          if (resultResponse.ok) {
            const resultJson = await resultResponse.json();
            
            // Check if API returned an error
            if (resultJson?.error) {
              console.warn(`⚠️ [FALLBACK] API error: ${resultJson.error}`);
              throw new Error(`API error: ${resultJson.error}`);
            }
            
            resultData = resultJson?.data || resultJson;
            
            // Extract from regular result API structure
            winnat = resultData?.res1?.cname?.toString().trim() || null;
            const resArray = resultData?.res || [];
            const latestRes = Array.isArray(resArray) && resArray.length > 0 ? resArray[0] : null;
            win = latestRes?.win?.toString().trim() || null;
            resultMid = latestRes?.mid?.toString() || mid;
            resultSource = 'result_api';
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          // Connection errors are common - log briefly
          if (errorMessage.includes('Connection reset') || errorMessage.includes('connection error')) {
            console.warn(`⚠️ [FALLBACK] Connection error for ${tableId}, API unavailable`);
          } else {
            console.error(`❌ [FALLBACK] Error fetching result: ${errorMessage}`);
          }
        }
      }

      // ============================================
      // STEP 2: VALIDATE RESULT DATA
      // ============================================
      
      // Use winnat as PRIMARY, win as FALLBACK (winnat is most reliable)
      const winningValue = winnat || win || '';

      if (!winningValue) {
        result = { 
          success: false, 
          error: 'No result available for settlement',
          debug: { resultData, winnat, win, resultSource, mid: resultMid }
        };
      } else {

        // ============================================
        // STEP 3: FETCH PENDING BETS (with round matching)
        // ============================================
        
        // Build query: pending bets for this table
        let betsQuery = supabase
          .from('diamond_casino_bets')
          .select('*')
          .eq('table_id', tableId)
          .eq('status', 'pending');

        // CRITICAL: Match by round_id (mid) if available to prevent wrong round settlement
        if (resultMid) {
          betsQuery = betsQuery.or(`round_id.eq.${resultMid},round_id.is.null`);
        }

        const { data: pendingBets, error: betsError } = await betsQuery;

        if (betsError) {
          throw new Error(`Failed to fetch pending bets: ${betsError.message}`);
        }

        if (!pendingBets || pendingBets.length === 0) {
          result = { 
            success: true, 
            message: 'No pending bets to process',
            processed: 0,
            winningValue,
            resultSource
          };
        } else {

          // ============================================
          // STEP 4: FILTER BETS (time-based safety check)
          // ============================================
          
          // Additional safety: Filter bets placed before result (if timestamp available)
          const resultTimestamp = resultData?.time || resultData?.timestamp || null;
          let betsToProcess = pendingBets;
          
          if (resultTimestamp) {
            const resultTime = new Date(resultTimestamp).getTime();
            betsToProcess = pendingBets.filter(bet => {
              const betTime = new Date(bet.created_at).getTime();
              const isValid = betTime < resultTime;
              if (!isValid) {
                console.log(`⏭️ Skipping bet ${bet.id} - placed after result timestamp`);
              }
              return isValid;
            });
            console.log(`📊 Time-filtered: ${pendingBets.length} → ${betsToProcess.length} bets`);
          }

          if (betsToProcess.length === 0) {
            result = {
              success: true,
              message: 'No valid bets to process',
              processed: 0,
              won: 0,
              lost: 0,
              totalPayouts: 0,
              winningValue,
              resultSource
            };
          } else {
            // ============================================
            // STEP 5: SETTLE BETS (Industry-Standard rdesc-based matching)
            // ============================================
            
            let processed = 0;
            let won = 0;
            let lost = 0;
            let totalPayouts = 0;
            const winningValueLower = winningValue.toLowerCase().trim();

            // Extract rdesc for bet matching
            let rdesc = extractRdesc(resultData);
            const parsedRdesc = rdesc ? parseRdesc(rdesc) : null;

            // Check if this is a roulette table
            const isRoulette = isRouletteTable(tableId);
            
            // Check if this is a lucky5 table
            let isLucky5 = false;
            try {
              isLucky5 = isLucky5Table(tableId);
            } catch (error) {
              isLucky5 = false;
            }
            
            // Check if this is a DT6 table
            let isDT6 = false;
            try {
              isDT6 = isDT6Table(tableId);
            } catch (error) {
              isDT6 = false;
            }
            
            // Check if this is a Teen3 table
            let isTeen3 = false;
            try {
              isTeen3 = isTeen3Table(tableId);
            } catch (error) {
              isTeen3 = false;
            }
            
            // Check if this is an AAA2 table
            let isAAA2 = false;
            try {
              isAAA2 = isAAA2Table(tableId);
            } catch (error) {
              isAAA2 = false;
            }
            
            // Check if this is a CMeter1 table
            let isCMeter1 = false;
            try {
              isCMeter1 = isCMeter1Table(tableId);
            } catch (error) {
              isCMeter1 = false;
            }
            
            // Check if this is a Mogambo table
            let isMogambo = false;
            try {
              isMogambo = isMogamboTable(tableId);
            } catch (error) {
              isMogambo = false;
            }
            
            // Check if this is a Dolidana table
            let isDolidana = false;
            try {
              isDolidana = isDolidanaTable(tableId);
            } catch (error) {
              isDolidana = false;
            }
            
            // Check if this is an AB20 table
            let isAB20 = false;
            try {
              isAB20 = isAB20Table(tableId);
            } catch (error) {
              isAB20 = false;
            }
            
            // Check if this is a Teen62 table
            let isTeen62 = false;
            try {
              isTeen62 = isTeen62Table(tableId);
            } catch (error) {
              isTeen62 = false;
            }
            
            // Check if this is an Ab3 table
            let isAb3 = false;
            try {
              isAb3 = isAb3Table(tableId);
            } catch (error) {
              isAb3 = false;
            }
            
            // Check if this is a DT202 table
            let isDT202 = false;
            try {
              // DT202 table check - using tableId pattern
              isDT202 = tableId?.toLowerCase() === 'dt202' || tableId?.toLowerCase().includes('dt202');
            } catch (error) {
              isDT202 = false;
            }
            
            // Check if this is a Dum10 table
            let isDum10 = false;
            try {
              isDum10 = isDum10Table(tableId);
            } catch (error) {
              isDum10 = false;
            }
            
            // Check if this is a Lottcard table
            let isLottcard = false;
            try {
              isLottcard = isLottcardTable(tableId);
            } catch (error) {
              isLottcard = false;
            }
            
            // Check if this is a Lucky7 table
            let isLucky7 = false;
            try {
              isLucky7 = isLucky7Table(tableId);
            } catch (error) {
              isLucky7 = false;
            }
            
            // Check if this is a Patti2 table
            let isPatti2 = false;
            try {
              isPatti2 = isPatti2Table(tableId);
            } catch (error) {
              isPatti2 = false;
            }
            
            // Check if this is a Race2 table
            let isRace2 = false;
            try {
              isRace2 = isRace2Table(tableId);
            } catch (error) {
              isRace2 = false;
            }
            
            // Check if this is a Joker120 table
            let isJoker120 = false;
            try {
              isJoker120 = isJoker120Table(tableId);
            } catch (error) {
              isJoker120 = false;
            }
            
            // Check if this is a Joker1 table
            let isJoker1 = false;
            try {
              isJoker1 = isJoker1Table(tableId);
            } catch (error) {
              isJoker1 = false;
            }
            
            // Check if this is a Joker20 table
            let isJoker20 = false;
            try {
              isJoker20 = isJoker20Table(tableId);
            } catch (error) {
              isJoker20 = false;
            }
            
            // Check if this is a Teen120 table
            let isTeen120 = false;
            try {
              isTeen120 = isTeen120Table(tableId);
            } catch (error) {
              isTeen120 = false;
            }
            
            // Check if this is a TeenUnique table
            let isTeenUnique = false;
            try {
              isTeenUnique = isTeenUniqueTable(tableId);
            } catch (error) {
              isTeenUnique = false;
            }
            
            // Check if this is a Teen20V1 table
            let isTeen20V1 = false;
            try {
              isTeen20V1 = isTeen20V1Table(tableId);
            } catch (error) {
              isTeen20V1 = false;
            }
            
            // Check if this is a Teen1 table
            let isTeen1 = false;
            try {
              isTeen1 = isTeen1Table(tableId);
            } catch (error) {
              isTeen1 = false;
            }
            
            // Check if this is a Roulette11 table
            let isRoulette11 = false;
            try {
              isRoulette11 = isRoulette11Table(tableId);
            } catch (error) {
              isRoulette11 = false;
            }
            
            // Check if this is a Roulette12 table
            let isRoulette12 = false;
            try {
              isRoulette12 = isRoulette12Table(tableId);
            } catch (error) {
              isRoulette12 = false;
            }
            
            // Check if this is a Roulette13 table
            let isRoulette13 = false;
            try {
              isRoulette13 = isRoulette13Table(tableId);
            } catch (error) {
              isRoulette13 = false;
            }
            
            // Check if this is a KBC table
            let isKBC = false;
            try {
              isKBC = isKBCTable(tableId);
            } catch (error) {
              isKBC = false;
            }
            
            // Check if this is a Poison20 table
            let isPoison20 = false;
            try {
              isPoison20 = isPoison20Table(tableId);
            } catch (error) {
              isPoison20 = false;
            }
            
            // Check if this is an AAA table
            let isAAA = false;
            try {
              isAAA = isAAATable(tableId);
            } catch (error) {
              isAAA = false;
            }
            
            // Check if this is a Poker table
            let isPoker = false;
            try {
              isPoker = isPokerTable(tableId);
            } catch (error) {
              isPoker = false;
            }
            
            // Check if this is a Baccarat table
            let isBaccarat = false;
            try {
              isBaccarat = isBaccaratTable(tableId);
            } catch (error) {
              isBaccarat = false;
            }
            
            // Check if this is a Teen table
            let isTeen = false;
            try {
              isTeen = isTeenTable(tableId);
            } catch (error) {
              isTeen = false;
            }
            
            // Check if this is an AB4 table
            let isAB4 = false;
            try {
              isAB4 = isAB4Table(tableId);
            } catch (error) {
              isAB4 = false;
            }
            
            // Check if this is an ABJ table
            let isABJ = false;
            try {
              isABJ = isABJTable(tableId);
            } catch (error) {
              isABJ = false;
            }
            
            // Check if this is a Baccarat2 table
            let isBaccarat2 = false;
            try {
              isBaccarat2 = isBaccarat2Table(tableId);
            } catch (error) {
              isBaccarat2 = false;
            }
            
            // Check if this is a BTable table
            let isBTable = false;
            try {
              isBTable = isBTable(tableId);
            } catch (error) {
              isBTable = false;
            }
            
            // Check if this is a BTable2 table
            let isBTable2 = false;
            try {
              isBTable2 = isBTable2Table(tableId);
            } catch (error) {
              isBTable2 = false;
            }
            
            // Check if this is a Card32 table
            let isCard32 = false;
            try {
              isCard32 = isCard32Table(tableId);
            } catch (error) {
              isCard32 = false;
            }
            
            // Check if this is a Card32EU table
            let isCard32EU = false;
            try {
              isCard32EU = isCard32EUTable(tableId);
            } catch (error) {
              isCard32EU = false;
            }
            
            // Check if this is a CMatch20 table
            let isCMatch20 = false;
            try {
              isCMatch20 = isCMatch20Table(tableId);
            } catch (error) {
              isCMatch20 = false;
            }
            
            // Check if this is a CMeter table
            let isCMeter = false;
            try {
              isCMeter = isCMeterTable(tableId);
            } catch (error) {
              isCMeter = false;
            }
            
            // Check if this is a CricketV3 table
            let isCricketV3 = false;
            try {
              isCricketV3 = isCricketV3(tableId);
            } catch (error) {
              isCricketV3 = false;
            }
            
            // Check if this is a DT20 table
            let isDT20 = false;
            try {
              isDT20 = isDT20Table(tableId);
            } catch (error) {
              isDT20 = false;
            }
            
            // Check if this is a DTL20 table
            let isDTL20 = false;
            try {
              isDTL20 = isDTL20Table(tableId);
            } catch (error) {
              isDTL20 = false;
            }
            
            // Check if this is a Goal table
            let isGoal = false;
            try {
              isGoal = isGoalTable(tableId);
            } catch (error) {
              isGoal = false;
            }
            
            // Check if this is a Lucky15 table
            let isLucky15 = false;
            try {
              isLucky15 = isLucky15Table(tableId);
            } catch (error) {
              isLucky15 = false;
            }
            
            // Check if this is a Lucky7EU table
            let isLucky7EU = false;
            try {
              isLucky7EU = isLucky7EUTable(tableId);
            } catch (error) {
              isLucky7EU = false;
            }
            
            // Check if this is an OurRoulette table
            let isOurRoulette = false;
            try {
              isOurRoulette = isOurRouletteTable(tableId);
            } catch (error) {
              isOurRoulette = false;
            }
            
            // Check if this is a Poker20 table
            let isPoker20 = false;
            try {
              isPoker20 = isPoker20Table(tableId);
            } catch (error) {
              isPoker20 = false;
            }
            
            // Check if this is a Poker6 table
            let isPoker6 = false;
            try {
              isPoker6 = isPoker6Table(tableId);
            } catch (error) {
              isPoker6 = false;
            }
            
            // Check if this is a Poison table
            let isPoison = false;
            try {
              isPoison = isPoisonTable(tableId);
            } catch (error) {
              isPoison = false;
            }
            
            // Check if this is a Queen table
            let isQueen = false;
            try {
              isQueen = isQueenTable(tableId);
            } catch (error) {
              isQueen = false;
            }
            
            // Check if this is a Race20 table
            let isRace20 = false;
            try {
              isRace20 = isRace20Table(tableId);
            } catch (error) {
              isRace20 = false;
            }
            
            // Check if this is a SicBo table
            let isSicBo = false;
            try {
              isSicBo = isSicBoTable(tableId);
            } catch (error) {
              isSicBo = false;
            }
            
            // Check if this is a SicBo2 table
            let isSicBo2 = false;
            try {
              isSicBo2 = isSicBo2Table(tableId);
            } catch (error) {
              isSicBo2 = false;
            }
            
            // Check if this is a SuperOver2 table
            let isSuperOver2 = false;
            try {
              isSuperOver2 = isSuperOver2Table(tableId);
            } catch (error) {
              isSuperOver2 = false;
            }
            
            // Check if this is a SuperOver3 table
            let isSuperOver3 = false;
            try {
              isSuperOver3 = isSuperOver3Table(tableId);
            } catch (error) {
              isSuperOver3 = false;
            }
            
            // Check if this is a Teen20C table
            let isTeen20C = false;
            try {
              isTeen20C = isTeen20CTable(tableId);
            } catch (error) {
              isTeen20C = false;
            }
            
            // Check if this is a Teen30 table
            let isTeen30 = false;
            try {
              isTeen30 = isTeen30Table(tableId);
            } catch (error) {
              isTeen30 = false;
            }
            
            // Check if this is a Teen32 table
            let isTeen32 = false;
            try {
              isTeen32 = isTeen32Table(tableId);
            } catch (error) {
              isTeen32 = false;
            }
            
            // Check if this is a Teen33 table
            let isTeen33 = false;
            try {
              isTeen33 = isTeen33Table(tableId);
            } catch (error) {
              isTeen33 = false;
            }
            
            // Check if this is a Teen41 table
            let isTeen41 = false;
            try {
              isTeen41 = isTeen41Table(tableId);
            } catch (error) {
              isTeen41 = false;
            }
            
            // Check if this is a Teen42 table
            let isTeen42 = false;
            try {
              isTeen42 = isTeen42Table(tableId);
            } catch (error) {
              isTeen42 = false;
            }
            
            // Check if this is a Teen6 table
            let isTeen6 = false;
            try {
              isTeen6 = isTeen6Table(tableId);
            } catch (error) {
              isTeen6 = false;
            }
            
            // Check if this is a Teen9 table
            let isTeen9 = false;
            try {
              isTeen9 = isTeen9Table(tableId);
            } catch (error) {
              isTeen9 = false;
            }
            
            // Check if this is a War table
            let isWar = false;
            try {
              isWar = isWarTable(tableId);
            } catch (error) {
              isWar = false;
            }
            
            // Check if this is a Worli table
            let isWorli = false;
            try {
              isWorli = isWorliTable(tableId);
            } catch (error) {
              isWorli = false;
            }
            
            // Check if this is a Worli2 table
            let isWorli2 = false;
            try {
              isWorli2 = isWorli2Table(tableId);
            } catch (error) {
              isWorli2 = false;
            }
            
            // Check if this is a BallByBall table
            let isBallByBall = false;
            try {
              isBallByBall = isBallByBallTable(tableId);
            } catch (error) {
              isBallByBall = false;
            }
            
            // Check if this is a 3CardJ table
            let is3CardJ = false;
            try {
              is3CardJ = is3CardJTable(tableId);
            } catch (error) {
              is3CardJ = false;
            }
            
            console.log(`🔍 [Table Detection] ${tableId}: ${isRoulette ? 'Roulette' : isLucky5 ? 'Lucky5' : isDT6 ? 'DT6' : isTeen3 ? 'Teen3' : isAAA2 ? 'AAA2' : isCMeter1 ? 'CMeter1' : isMogambo ? 'Mogambo' : isDolidana ? 'Dolidana' : isAB20 ? 'AB20' : isTeen62 ? 'Teen62' : isAb3 ? 'Ab3' : isDT202 ? 'DT202' : isDum10 ? 'Dum10' : isLottcard ? 'Lottcard' : isLucky7 ? 'Lucky7' : isPatti2 ? 'Patti2' : isRace2 ? 'Race2' : isJoker120 ? 'Joker120' : isJoker1 ? 'Joker1' : isJoker20 ? 'Joker20' : isTeen120 ? 'Teen120' : isTeenUnique ? 'TeenUnique' : isTeen20V1 ? 'Teen20V1' : isTeen1 ? 'Teen1' : isRoulette11 ? 'Roulette11' : isRoulette12 ? 'Roulette12' : isRoulette13 ? 'Roulette13' : isKBC ? 'KBC' : isPoison20 ? 'Poison20' : isAAA ? 'AAA' : isPoker ? 'Poker' : isBaccarat ? 'Baccarat' : isTeen ? 'Teen' : isAB4 ? 'AB4' : isABJ ? 'ABJ' : isBaccarat2 ? 'Baccarat2' : isBTable ? 'BTable' : isBTable2 ? 'BTable2' : isCard32 ? 'Card32' : isCard32EU ? 'Card32EU' : isCMatch20 ? 'CMatch20' : isCMeter ? 'CMeter' : isCricketV3 ? 'CricketV3' : isDT20 ? 'DT20' : isDTL20 ? 'DTL20' : isGoal ? 'Goal' : isLucky15 ? 'Lucky15' : isLucky7EU ? 'Lucky7EU' : isOurRoulette ? 'OurRoulette' : isPoker20 ? 'Poker20' : isPoker6 ? 'Poker6' : isPoison ? 'Poison' : isQueen ? 'Queen' : isRace20 ? 'Race20' : isSicBo ? 'SicBo' : isSicBo2 ? 'SicBo2' : isSuperOver2 ? 'SuperOver2' : isSuperOver3 ? 'SuperOver3' : isTeen20C ? 'Teen20C' : isTeen30 ? 'Teen30' : isTeen32 ? 'Teen32' : isTeen33 ? 'Teen33' : isTeen41 ? 'Teen41' : isTeen42 ? 'Teen42' : isTeen6 ? 'Teen6' : isTeen9 ? 'Teen9' : isWar ? 'War' : isWorli ? 'Worli' : isWorli2 ? 'Worli2' : isBallByBall ? 'BallByBall' : is3CardJ ? '3CardJ' : 'Generic'}`);
            
            // For roulette: Parse winning number and derive attributes
            let rouletteResult: RouletteResult | null = null;
            let rouletteParseError: string | null = null;
            
            if (isRoulette) {
              // FALLBACK: If rdesc not found, try to construct from winningValue
              if (!rdesc && winningValue) {
                // Roulette winning value is usually just the number (e.g., "20", "32")
                const numberMatch = winningValue.match(/^\d+$/);
                if (numberMatch) {
                  rdesc = winningValue; // Use winningValue as rdesc (roulette rdesc is just the number)
                  console.log(`🔄 [Roulette] Constructed rdesc from winningValue: "${rdesc}"`);
                }
              }
              
              if (!rdesc) {
                rouletteParseError = 'No rdesc available for roulette table';
                console.warn(`⚠️ [Roulette] No rdesc found for table ${tableId}`);
              } else {
                try {
                  const winningNumber = parseRouletteResult(rdesc);
                  if (winningNumber !== null) {
                    rouletteResult = deriveRouletteAttributes(winningNumber);
                    console.log(`✅ [Roulette] Parsed: number=${rouletteResult.number}, rdesc="${rdesc}"`);
                  } else {
                    rouletteParseError = `Could not parse winning number from rdesc: "${rdesc}"`;
                    console.warn(`⚠️ [Roulette] Parsing failed: "${rdesc}"`);
                  }
                } catch (error) {
                  rouletteParseError = error instanceof Error ? error.message : String(error);
                  console.error(`❌ [Roulette] Parse error:`, rouletteParseError);
                }
              }
            }
            
            // For lucky5: Parse result from rdesc
            let lucky5Result: Lucky5Result | null = null;
            let lucky5ParseError: string | null = null;
            
            if (isLucky5) {
              // FALLBACK: If rdesc not found, try to construct from winnat/win
              if (!rdesc && winningValue) {
                console.log(`⚠️ [Lucky5] No rdesc found, attempting to construct from winningValue: "${winningValue}"`);
                
                // Try to extract card number from winningValue
                // Example: "Lucky 6" -> "6", or "9" -> "9"
                const cardMatch = winningValue.match(/\d+/);
                if (cardMatch) {
                  const cardNum = cardMatch[0];
                  // Construct a basic rdesc format that parseLucky5Result can handle
                  // We'll use just the number, parser will handle it
                  rdesc = cardNum;
                  console.log(`🔄 [Lucky5] Constructed rdesc from winningValue: "${rdesc}"`);
                }
              }
              
              console.log(`🎴 [Lucky5] Table detected! Processing...`, {
                tableId,
                hasRdesc: !!rdesc,
                rdesc: rdesc || '(missing)',
                winningValue,
                resultDataKeys: resultData ? Object.keys(resultData) : []
              });
              
              if (!rdesc) {
                lucky5ParseError = 'No rdesc available for lucky5 table';
                console.warn(`⚠️ Lucky5 table ${tableId} but no rdesc found. ResultData:`, JSON.stringify(resultData, null, 2));
              } else {
                try {
                  console.log(`🎴 [Lucky5] Attempting to parse rdesc: "${rdesc}"`);
                  console.log(`🔍 [Lucky5] parseLucky5Result function type: ${typeof parseLucky5Result}`);
                  
                  // VERIFY: Test if function is callable
                  if (typeof parseLucky5Result !== 'function') {
                    throw new Error('parseLucky5Result is not a function! Import may have failed.');
                  }
                  
                  lucky5Result = parseLucky5Result(rdesc);
                  if (lucky5Result) {
                    console.log(`✅ [Lucky5] Result parsed successfully:`, {
                      cards: lucky5Result.cards,
                      winningCard: lucky5Result.winningCard,
                      cardNumber: lucky5Result.cardNumber,
                      attributes: Array.from(lucky5Result.attributes),
                      rdesc: rdesc
                    });
                  } else {
                    lucky5ParseError = `Could not parse lucky5 result from rdesc: "${rdesc}"`;
                    console.warn(`⚠️ [Lucky5] Parsing failed for rdesc:`, rdesc);
                  }
                } catch (error) {
                  lucky5ParseError = error instanceof Error ? error.message : String(error);
                  console.error(`❌ [Lucky5] Error parsing result:`, {
                    error: lucky5ParseError,
                    stack: error instanceof Error ? error.stack : undefined,
                    rdesc
                  });
                }
              }
            } else {
              console.log(`ℹ️ [Lucky5] Table ${tableId} is NOT detected as Lucky5`);
            }
            
            // For DT6: Parse result from rdesc
            let dt6Result: DT6Result | null = null;
            let dt6ParseError: string | null = null;
            
            if (isDT6) {
              // FALLBACK: If rdesc not found, try to construct from winnat/win
              if (!rdesc && winningValue) {
                const normalizedWinner = winningValue.toLowerCase().trim();
                if (normalizedWinner.includes('dragon') || normalizedWinner.includes('tiger') || normalizedWinner.includes('tie')) {
                  rdesc = winningValue;
                  console.log(`🔄 [DT6] Constructed rdesc from winningValue: "${rdesc}"`);
                }
              }
              
              if (!rdesc) {
                dt6ParseError = 'No rdesc available for DT6 table';
                console.warn(`⚠️ [DT6] No rdesc found for table ${tableId}`);
              } else {
                try {
                  dt6Result = parseDT6Result(rdesc);
                  if (dt6Result) {
                    console.log(`✅ [DT6] Parsed: winner=${dt6Result.winner}, rdesc="${rdesc}"`);
                  } else {
                    dt6ParseError = `Could not parse DT6 result from rdesc: "${rdesc}"`;
                    console.warn(`⚠️ [DT6] Parsing failed: "${rdesc}"`);
                  }
                } catch (error) {
                  dt6ParseError = error instanceof Error ? error.message : String(error);
                  console.error(`❌ [DT6] Parse error:`, dt6ParseError);
                }
              }
            }
            
            // For Teen3: Parse result from detail result data
            let teen3Result: Teen3Result | null = null;
            let teen3ParseError: string | null = null;
            
            if (isTeen3) {
              if (!resultData) {
                teen3ParseError = 'No result data available for Teen3 table';
                console.warn(`⚠️ [Teen3] No result data found for table ${tableId}`);
              } else {
                try {
                  // Teen3 uses detail result structure directly (not rdesc)
                  teen3Result = parseTeen3Result(resultData);
                  if (teen3Result) {
                    console.log(`✅ [Teen3] Parsed: winner=${teen3Result.winnerName} (${teen3Result.winnerId})`);
                  } else {
                    teen3ParseError = 'Could not parse Teen3 result from result data';
                    console.warn(`⚠️ [Teen3] Parsing failed`);
                  }
                } catch (error) {
                  teen3ParseError = error instanceof Error ? error.message : String(error);
                  console.error(`❌ [Teen3] Parse error:`, teen3ParseError);
                }
              }
            }
            
            // For AAA2: Parse result from detail result data
            let aaa2Result: AAA2Result | null = null;
            let aaa2ParseError: string | null = null;
            
            if (isAAA2) {
              if (!resultData) {
                aaa2ParseError = 'No result data available for AAA2 table';
                console.warn(`⚠️ [AAA2] No result data found for table ${tableId}`);
              } else {
                try {
                  // AAA2 uses detail result structure directly (not rdesc)
                  aaa2Result = parseAAA2Result(resultData);
                  if (aaa2Result) {
                    console.log(`✅ [AAA2] Parsed: winner=${aaa2Result.winnerName} (${aaa2Result.winnerId}), card=${aaa2Result.cardValue}`);
                  } else {
                    aaa2ParseError = 'Could not parse AAA2 result from result data';
                    console.warn(`⚠️ [AAA2] Parsing failed`);
                  }
                } catch (error) {
                  aaa2ParseError = error instanceof Error ? error.message : String(error);
                  console.error(`❌ [AAA2] Parse error:`, aaa2ParseError);
                }
              }
            }
            
            // For CMeter1: Parse result from detail result data
            let cmeter1Result: CMeter1Result | null = null;
            let cmeter1ParseError: string | null = null;
            
            if (isCMeter1) {
              if (!resultData) {
                cmeter1ParseError = 'No result data available for CMeter1 table';
                console.warn(`⚠️ [CMeter1] No result data found for table ${tableId}`);
              } else {
                try {
                  // CMeter1 uses detail result structure directly (not rdesc)
                  cmeter1Result = parseCMeter1Result(resultData);
                  if (cmeter1Result) {
                    console.log(`✅ [CMeter1] Parsed: winner=${cmeter1Result.winnerName} (${cmeter1Result.winnerId}), card=${cmeter1Result.cardValue}`);
                  } else {
                    cmeter1ParseError = 'Could not parse CMeter1 result from result data';
                    console.warn(`⚠️ [CMeter1] Parsing failed`);
                  }
                } catch (error) {
                  cmeter1ParseError = error instanceof Error ? error.message : String(error);
                  console.error(`❌ [CMeter1] Parse error:`, cmeter1ParseError);
                }
              }
            }
            
            // For Mogambo: Parse result from rdesc/winnat
            let mogamboResult: MogamboResult | null = null;
            let mogamboParseError: string | null = null;
            
            if (isMogambo) {
              try {
                mogamboResult = parseMogamboResult(rdesc, winnat, win);
                if (mogamboResult) {
                  console.log(`✅ [Mogambo] Parsed: winner=${mogamboResult.winner} (${mogamboResult.winCode})`);
                } else {
                  mogamboParseError = 'Could not parse Mogambo result from rdesc/winnat';
                  console.warn(`⚠️ [Mogambo] Parsing failed`);
                }
              } catch (error) {
                mogamboParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Mogambo] Parse error:`, mogamboParseError);
              }
            }
            
            // For Mogambo 3 Card Total: Parse card string
            let threeCardTotalResult: ThreeCardTotalResult | null = null;
            let threeCardTotalParseError: string | null = null;
            
            if (isMogambo) {
              try {
                // Extract card string from resultData (similar to AB20)
                const cardString = resultData?.card || resultData?.t1?.card || resultData?.data?.card || null;
                
                if (cardString) {
                  threeCardTotalResult = parseThreeCardTotal(cardString);
                  if (threeCardTotalResult) {
                    console.log(`✅ [Mogambo 3 Card Total] Parsed: total=${threeCardTotalResult.total}, isValid=${threeCardTotalResult.isValid}`);
                  } else {
                    threeCardTotalParseError = 'Could not parse 3 Card Total from card string';
                    console.warn(`⚠️ [Mogambo 3 Card Total] Parsing failed`);
                  }
                } else {
                  // Card string not available, but that's okay - it will be handled during settlement
                  console.log(`ℹ️ [Mogambo 3 Card Total] No card string available yet`);
                }
              } catch (error) {
                threeCardTotalParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Mogambo 3 Card Total] Parse error:`, threeCardTotalParseError);
              }
            }
            
            // For Dolidana: Parse result from card/win
            let dolidanaResult: DolidanaResult | null = null;
            let dolidanaParseError: string | null = null;
            
            if (isDolidana) {
              try {
                // Extract card and win from resultData
                const cardValue = resultData?.card || resultData?.t1?.card || null;
                const winValue = resultData?.win || resultData?.t1?.win || win || null;
                
                dolidanaResult = parseDolidanaResult(cardValue, winValue);
                if (dolidanaResult) {
                  console.log(`✅ [Dolidana] Parsed: dice=${dolidanaResult.dice.join(',')}, sum=${dolidanaResult.sum}`);
                } else {
                  dolidanaParseError = 'Could not parse Dolidana result from card/win';
                  console.warn(`⚠️ [Dolidana] Parsing failed`);
                }
              } catch (error) {
                dolidanaParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Dolidana] Parse error:`, dolidanaParseError);
              }
            }
            
            // For AB20: Parse result from card string
            let ab20Result: AB20Result | null = null;
            let ab20ParseError: string | null = null;
            
            if (isAB20) {
              try {
                // Extract card string from resultData
                const cardString = resultData?.card || resultData?.t1?.card || null;
                
                ab20Result = parseAB20Result(cardString);
                if (ab20Result) {
                  console.log(`✅ [AB20] Parsed: lastCard=${ab20Result.lastCard}, rank=${ab20Result.rank}`);
                } else {
                  ab20ParseError = 'Could not parse AB20 result from card string';
                  console.warn(`⚠️ [AB20] Parsing failed`);
                }
              } catch (error) {
                ab20ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [AB20] Parse error:`, ab20ParseError);
              }
            }
            
            // For Teen62: Parse result from rdesc/winnat/card
            let teen62Result: Teen62Result | null = null;
            let teen62ParseError: string | null = null;
            
            if (isTeen62) {
              try {
                // Extract card data from resultData if available
                const cardData = resultData?.card || resultData?.t1?.card || resultData?.data?.card || null;
                const resultMid = resultData?.mid || resultData?.t1?.mid || resultData?.data?.mid || null;
                
                teen62Result = parseTeen62Result(rdesc, winnat, win, resultMid, cardData);
                if (teen62Result) {
                  console.log(`✅ [Teen62] Parsed: winner=${teen62Result.winner} (${teen62Result.winCode}), cards=${teen62Result.cards?.join(',') || 'N/A'}`);
                } else {
                  teen62ParseError = 'Could not parse Teen62 result from rdesc/winnat/card';
                  console.warn(`⚠️ [Teen62] Parsing failed`);
                }
              } catch (error) {
                teen62ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Teen62] Parse error:`, teen62ParseError);
              }
            }
            
            // For Ab3: Parse result from win/winnat
            let ab3Result: Ab3Result | null = null;
            let ab3ParseError: string | null = null;
            
            if (isAb3) {
              try {
                ab3Result = parseAb3Result(win, winnat);
                if (ab3Result) {
                  console.log(`✅ [Ab3] Parsed: isWin=${ab3Result.isWin}`);
                } else {
                  ab3ParseError = 'Could not parse Ab3 result from win/winnat';
                  console.warn(`⚠️ [Ab3] Parsing failed`);
                }
              } catch (error) {
                ab3ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Ab3] Parse error:`, ab3ParseError);
              }
            }
            
            // For DT202: Parse result from rdesc
            let dt202Result: DT202Result | null = null;
            let dt202ParseError: string | null = null;
            
            if (isDT202) {
              if (!rdesc) {
                dt202ParseError = 'No rdesc available for DT202 table';
                console.warn(`⚠️ [DT202] No rdesc found for table ${tableId}`);
              } else {
                try {
                  dt202Result = parseDT202Result(rdesc);
                  if (dt202Result) {
                    console.log(`✅ [DT202] Parsed: winner=${dt202Result.winner}`);
                  } else {
                    dt202ParseError = `Could not parse DT202 result from rdesc: "${rdesc}"`;
                    console.warn(`⚠️ [DT202] Parsing failed: "${rdesc}"`);
                  }
                } catch (error) {
                  dt202ParseError = error instanceof Error ? error.message : String(error);
                  console.error(`❌ [DT202] Parse error:`, dt202ParseError);
                }
              }
            }
            
            // For Dum10: Parse result from win/rdesc/winnat
            let dum10Result: Dum10Result | null = null;
            let dum10ParseError: string | null = null;
            
            if (isDum10) {
              try {
                dum10Result = parseDum10Result(win, rdesc, winnat);
                if (dum10Result) {
                  console.log(`✅ [Dum10] Parsed: main=${dum10Result.main}, attributes=${Array.from(dum10Result.attributes).join(',')}`);
                } else {
                  dum10ParseError = 'Could not parse Dum10 result from win/rdesc/winnat';
                  console.warn(`⚠️ [Dum10] Parsing failed`);
                }
              } catch (error) {
                dum10ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Dum10] Parse error:`, dum10ParseError);
              }
            }
            
            // For Lottcard: Parse result from rdesc
            let lottcardResult: LottcardResult | null = null;
            let lottcardParseError: string | null = null;
            
            if (isLottcard) {
              if (!rdesc) {
                lottcardParseError = 'No rdesc available for Lottcard table';
                console.warn(`⚠️ [Lottcard] No rdesc found for table ${tableId}`);
              } else {
                try {
                  lottcardResult = parseLottcardResult(rdesc);
                  if (lottcardResult) {
                    console.log(`✅ [Lottcard] Parsed: digits=${lottcardResult.digits.join(',')}, type=${lottcardResult.type}`);
                  } else {
                    lottcardParseError = `Could not parse Lottcard result from rdesc: "${rdesc}"`;
                    console.warn(`⚠️ [Lottcard] Parsing failed: "${rdesc}"`);
                  }
                } catch (error) {
                  lottcardParseError = error instanceof Error ? error.message : String(error);
                  console.error(`❌ [Lottcard] Parse error:`, lottcardParseError);
                }
              }
            }
            
            // For Lucky7: Parse result from card string
            let lucky7Result: Lucky7Result | null = null;
            let lucky7ParseError: string | null = null;
            
            if (isLucky7) {
              try {
                // Extract card string from resultData
                const cardString = resultData?.card || resultData?.t1?.card || rdesc || null;
                
                lucky7Result = parseLucky7Result(cardString);
                if (lucky7Result) {
                  console.log(`✅ [Lucky7] Parsed: rank=${lucky7Result.rank}, value=${lucky7Result.value}, color=${lucky7Result.color}, line=${lucky7Result.line}`);
                } else {
                  lucky7ParseError = 'Could not parse Lucky7 result from card string';
                  console.warn(`⚠️ [Lucky7] Parsing failed`);
                }
              } catch (error) {
                lucky7ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Lucky7] Parse error:`, lucky7ParseError);
              }
            }
            
            // For Patti2: Parse result from win/winnat
            let patti2Result: Patti2Result | null = null;
            let patti2ParseError: string | null = null;
            
            if (isPatti2) {
              try {
                patti2Result = parsePatti2Result(win, winnat);
                if (patti2Result) {
                  console.log(`✅ [Patti2] Parsed: winner=${patti2Result.winner}`);
                } else {
                  patti2ParseError = 'Could not parse Patti2 result from win/winnat';
                  console.warn(`⚠️ [Patti2] Parsing failed`);
                }
              } catch (error) {
                patti2ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Patti2] Parse error:`, patti2ParseError);
              }
            }
            
            // For Race2: Parse result from win/winnat
            let race2Result: Race2Result | null = null;
            let race2ParseError: string | null = null;
            
            if (isRace2) {
              try {
                race2Result = parseRace2Result(win, winnat);
                if (race2Result) {
                  console.log(`✅ [Race2] Parsed: winnerSid=${race2Result.winnerSid}, winnerName=${race2Result.winnerName}`);
                } else {
                  race2ParseError = 'Could not parse Race2 result from win/winnat';
                  console.warn(`⚠️ [Race2] Parsing failed`);
                }
              } catch (error) {
                race2ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Race2] Parse error:`, race2ParseError);
              }
            }
            
            // For Joker120: Parse result from win
            let joker120Result: Joker120Result | null = null;
            let joker120ParseError: string | null = null;
            
            if (isJoker120) {
              try {
                joker120Result = parseJoker120Result(win);
                if (joker120Result) {
                  console.log(`✅ [Joker120] Parsed: winner=${joker120Result.winnerName} (${joker120Result.winnerId})`);
                } else {
                  joker120ParseError = 'Could not parse Joker120 result from win';
                  console.warn(`⚠️ [Joker120] Parsing failed`);
                }
              } catch (error) {
                joker120ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Joker120] Parse error:`, joker120ParseError);
              }
            }
            
            // For Joker1: Parse result from win
            let joker1Result: Joker1Result | null = null;
            let joker1ParseError: string | null = null;
            
            if (isJoker1) {
              try {
                joker1Result = parseJoker1Result(win);
                if (joker1Result) {
                  console.log(`✅ [Joker1] Parsed: winner=${joker1Result.winnerName} (${joker1Result.winnerId})`);
                } else {
                  joker1ParseError = 'Could not parse Joker1 result from win';
                  console.warn(`⚠️ [Joker1] Parsing failed`);
                }
              } catch (error) {
                joker1ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Joker1] Parse error:`, joker1ParseError);
              }
            }
            
            // For Joker20: Parse result from win/rdesc
            let joker20Result: Joker20Result | null = null;
            let joker20ParseError: string | null = null;
            
            if (isJoker20) {
              try {
                joker20Result = parseJoker20Result(win, rdesc);
                if (joker20Result) {
                  console.log(`✅ [Joker20] Parsed: winner=${joker20Result.winnerName} (${joker20Result.winnerId})`);
                } else {
                  joker20ParseError = 'Could not parse Joker20 result from win/rdesc';
                  console.warn(`⚠️ [Joker20] Parsing failed`);
                }
              } catch (error) {
                joker20ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Joker20] Parse error:`, joker20ParseError);
              }
            }
            
            // For Teen120: Parse result from win/winnat/rdesc
            let teen120Result: Teen120Result | null = null;
            let teen120ParseError: string | null = null;
            
            if (isTeen120) {
              try {
                teen120Result = parseTeen120Result(win, winnat, rdesc);
                if (teen120Result) {
                  console.log(`✅ [Teen120] Parsed: winner=${teen120Result.winner}, isPair=${teen120Result.isPair}`);
                } else {
                  teen120ParseError = 'Could not parse Teen120 result from win/winnat/rdesc';
                  console.warn(`⚠️ [Teen120] Parsing failed`);
                }
              } catch (error) {
                teen120ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Teen120] Parse error:`, teen120ParseError);
              }
            }
            
            // For TeenUnique: Parse result from win/rdesc
            let teenUniqueResult: TeenUniqueResult | null = null;
            let teenUniqueParseError: string | null = null;
            
            if (isTeenUnique) {
              try {
                teenUniqueResult = parseTeenUniqueResult(win, rdesc);
                if (teenUniqueResult) {
                  console.log(`✅ [TeenUnique] Parsed: isWin=${teenUniqueResult.isWin}`);
                } else {
                  teenUniqueParseError = 'Could not parse TeenUnique result from win/rdesc';
                  console.warn(`⚠️ [TeenUnique] Parsing failed`);
                }
              } catch (error) {
                teenUniqueParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [TeenUnique] Parse error:`, teenUniqueParseError);
              }
            }
            
            // For Teen20V1: Parse result from rdesc/cards
            let teen20V1Result: Teen20V1Result | null = null;
            let teen20V1ParseError: string | null = null;
            
            if (isTeen20V1) {
              try {
                const cardString = resultData?.card || resultData?.t1?.card || null;
                teen20V1Result = parseTeen20V1Result(rdesc, cardString);
                if (teen20V1Result) {
                  console.log(`✅ [Teen20V1] Parsed: winner=${teen20V1Result.winner}`);
                } else {
                  teen20V1ParseError = 'Could not parse Teen20V1 result from rdesc/cards';
                  console.warn(`⚠️ [Teen20V1] Parsing failed`);
                }
              } catch (error) {
                teen20V1ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Teen20V1] Parse error:`, teen20V1ParseError);
              }
            }
            
            // For Teen1: Parse result from win/winnat/rdesc
            let teen1Result: Teen1Result | null = null;
            let teen1ParseError: string | null = null;
            
            if (isTeen1) {
              try {
                teen1Result = parseTeen1Result(win, winnat, rdesc);
                if (teen1Result) {
                  console.log(`✅ [Teen1] Parsed: winner=${teen1Result.winner}`);
                } else {
                  teen1ParseError = 'Could not parse Teen1 result from win/winnat/rdesc';
                  console.warn(`⚠️ [Teen1] Parsing failed`);
                }
              } catch (error) {
                teen1ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Teen1] Parse error:`, teen1ParseError);
              }
            }
            
            // For Roulette11: Parse result from win
            let roulette11Result: Roulette11Result | null = null;
            let roulette11ParseError: string | null = null;
            
            if (isRoulette11) {
              try {
                roulette11Result = parseRoulette11Result(win);
                if (roulette11Result) {
                  console.log(`✅ [Roulette11] Parsed: number=${roulette11Result.number}, color=${roulette11Result.color}`);
                } else {
                  roulette11ParseError = 'Could not parse Roulette11 result from win';
                  console.warn(`⚠️ [Roulette11] Parsing failed`);
                }
              } catch (error) {
                roulette11ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Roulette11] Parse error:`, roulette11ParseError);
              }
            }
            
            // For Roulette12: Parse result from win
            let roulette12Result: Roulette12Result | null = null;
            let roulette12ParseError: string | null = null;
            
            if (isRoulette12) {
              try {
                roulette12Result = parseRoulette12Result(win);
                if (roulette12Result) {
                  console.log(`✅ [Roulette12] Parsed: number=${roulette12Result.number}, color=${roulette12Result.color}`);
                } else {
                  roulette12ParseError = 'Could not parse Roulette12 result from win';
                  console.warn(`⚠️ [Roulette12] Parsing failed`);
                }
              } catch (error) {
                roulette12ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Roulette12] Parse error:`, roulette12ParseError);
              }
            }
            
            // For Roulette13: Parse result from win
            let roulette13Result: Roulette13Result | null = null;
            let roulette13ParseError: string | null = null;
            
            if (isRoulette13) {
              try {
                roulette13Result = parseRoulette13Result(win);
                if (roulette13Result) {
                  console.log(`✅ [Roulette13] Parsed: number=${roulette13Result.number}, color=${roulette13Result.color}`);
                } else {
                  roulette13ParseError = 'Could not parse Roulette13 result from win';
                  console.warn(`⚠️ [Roulette13] Parsing failed`);
                }
              } catch (error) {
                roulette13ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Roulette13] Parse error:`, roulette13ParseError);
              }
            }
            
            // For KBC: Parse result from rdesc
            let kbcResult: KBCResult | null = null;
            let kbcParseError: string | null = null;
            
            if (isKBC) {
              try {
                kbcResult = parseKBCResult(rdesc);
                if (kbcResult) {
                  console.log(`✅ [KBC] Parsed: color=${kbcResult.color}, oddEven=${kbcResult.oddEven}`);
                } else {
                  kbcParseError = 'Could not parse KBC result from rdesc';
                  console.warn(`⚠️ [KBC] Parsing failed`);
                }
              } catch (error) {
                kbcParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [KBC] Parse error:`, kbcParseError);
              }
            }
            
            // For Poison20: Parse result from win/rdesc
            let poison20Result: Poison20Result | null = null;
            let poison20ParseError: string | null = null;
            
            if (isPoison20) {
              try {
                poison20Result = parsePoison20Result(win, rdesc);
                if (poison20Result) {
                  console.log(`✅ [Poison20] Parsed: winner=${poison20Result.winnerName} (${poison20Result.winnerId})`);
                } else {
                  poison20ParseError = 'Could not parse Poison20 result from win/rdesc';
                  console.warn(`⚠️ [Poison20] Parsing failed`);
                }
              } catch (error) {
                poison20ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Poison20] Parse error:`, poison20ParseError);
              }
            }
            
            // For AAA: Parse result from win/card
            let aaaResult: AAAResult | null = null;
            let aaaParseError: string | null = null;
            
            if (isAAA) {
              try {
                const cardValue = resultData?.card || resultData?.t1?.card || null;
                aaaResult = parseAAAResult(win, cardValue, resultMid);
                if (aaaResult) {
                  console.log(`✅ [AAA] Parsed: winner=${aaaResult.winnerName} (${aaaResult.winnerId}), card=${aaaResult.card}`);
                } else {
                  aaaParseError = 'Could not parse AAA result from win/card';
                  console.warn(`⚠️ [AAA] Parsing failed`);
                }
              } catch (error) {
                aaaParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [AAA] Parse error:`, aaaParseError);
              }
            }
            
            // For Poker: Parse result from win/card/rdesc
            let pokerResult: PokerResult | null = null;
            let pokerParseError: string | null = null;
            
            if (isPoker) {
              try {
                const cardValue = resultData?.card || resultData?.t1?.card || null;
                pokerResult = parsePokerResult(win, cardValue, rdesc);
                if (pokerResult) {
                  console.log(`✅ [Poker] Parsed: winner=${pokerResult.winnerName} (${pokerResult.winnerId})`);
                } else {
                  pokerParseError = 'Could not parse Poker result from win/card/rdesc';
                  console.warn(`⚠️ [Poker] Parsing failed`);
                }
              } catch (error) {
                pokerParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Poker] Parse error:`, pokerParseError);
              }
            }
            
            // For Baccarat: Parse result from win/card/rdesc
            let baccaratResult: BaccaratResult | null = null;
            let baccaratParseError: string | null = null;
            
            if (isBaccarat) {
              try {
                const cardValue = resultData?.card || resultData?.t1?.card || null;
                baccaratResult = parseBaccaratResult(win, cardValue, rdesc);
                if (baccaratResult) {
                  console.log(`✅ [Baccarat] Parsed: winner=${baccaratResult.winner}`);
                } else {
                  baccaratParseError = 'Could not parse Baccarat result from win/card/rdesc';
                  console.warn(`⚠️ [Baccarat] Parsing failed`);
                }
              } catch (error) {
                baccaratParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Baccarat] Parse error:`, baccaratParseError);
              }
            }
            
            // For Teen: Parse result from win/card/rdesc
            let teenResult: TeenResult | null = null;
            let teenParseError: string | null = null;
            
            if (isTeen) {
              try {
                const cardValue = resultData?.card || resultData?.t1?.card || null;
                teenResult = parseTeenResult(win, cardValue, rdesc);
                if (teenResult) {
                  console.log(`✅ [Teen] Parsed: winner=${teenResult.winnerName} (${teenResult.winnerId})`);
                } else {
                  teenParseError = 'Could not parse Teen result from win/card/rdesc';
                  console.warn(`⚠️ [Teen] Parsing failed`);
                }
              } catch (error) {
                teenParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [Teen] Parse error:`, teenParseError);
              }
            }
            
            // For AB4: Parse result from win/cards
            let ab4Result: AB4Result | null = null;
            let ab4ParseError: string | null = null;
            
            if (isAB4) {
              try {
                const cardsValue = resultData?.card || resultData?.t1?.card || null;
                ab4Result = parseAB4Result(win, cardsValue);
                if (ab4Result) {
                  console.log(`✅ [AB4] Parsed: winnerSide=${ab4Result.winnerSide}`);
                } else {
                  ab4ParseError = 'Could not parse AB4 result from win/cards';
                  console.warn(`⚠️ [AB4] Parsing failed`);
                }
              } catch (error) {
                ab4ParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [AB4] Parse error:`, ab4ParseError);
              }
            }
            
            // For ABJ: Parse result from win/card/rdesc
            let abjResult: ABJResult | null = null;
            let abjParseError: string | null = null;
            
            if (isABJ) {
              try {
                const cardValue = resultData?.card || resultData?.t1?.card || null;
                abjResult = parseABJResult(win, cardValue, rdesc, resultMid);
                if (abjResult) {
                  console.log(`✅ [ABJ] Parsed: winner=${abjResult.winner}`);
                } else {
                  abjParseError = 'Could not parse ABJ result from win/card/rdesc';
                  console.warn(`⚠️ [ABJ] Parsing failed`);
                }
              } catch (error) {
                abjParseError = error instanceof Error ? error.message : String(error);
                console.error(`❌ [ABJ] Parse error:`, abjParseError);
              }
            }
            
                       // For Baccarat2: Parse result from win/card/rdesc
                       let baccarat2Result: Baccarat2Result | null = null;
                       let baccarat2ParseError: string | null = null;
                       
                       if (isBaccarat2) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           baccarat2Result = parseBaccarat2Result(win, cardValue, rdesc);
                           if (baccarat2Result) {
                             console.log(`✅ [Baccarat2] Parsed: winner=${baccarat2Result.winner}`);
                           } else {
                             baccarat2ParseError = 'Could not parse Baccarat2 result from win/card/rdesc';
                             console.warn(`⚠️ [Baccarat2] Parsing failed`);
                           }
                         } catch (error) {
                           baccarat2ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Baccarat2] Parse error:`, baccarat2ParseError);
                         }
                       }
                       
                       // For BTable: Parse result from win/card/rdesc
                       let bTableResult: BTableResult | null = null;
                       let bTableParseError: string | null = null;
                       
                       if (isBTable) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           bTableResult = parseBTableResult(win, cardValue, rdesc);
                           if (bTableResult) {
                             console.log(`✅ [BTable] Parsed: winner=${bTableResult.winnerName}`);
                           } else {
                             bTableParseError = 'Could not parse BTable result from win/card/rdesc';
                             console.warn(`⚠️ [BTable] Parsing failed`);
                           }
                         } catch (error) {
                           bTableParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [BTable] Parse error:`, bTableParseError);
                         }
                       }
                       
                       // For BTable2: Parse result from win
                       let bTable2Result: BTable2Result | null = null;
                       let bTable2ParseError: string | null = null;
                       
                       if (isBTable2) {
                         try {
                           bTable2Result = parseBTable2Result(win);
                           if (bTable2Result) {
                             console.log(`✅ [BTable2] Parsed: winner=${bTable2Result.winnerName}`);
                           } else {
                             bTable2ParseError = 'Could not parse BTable2 result from win';
                             console.warn(`⚠️ [BTable2] Parsing failed`);
                           }
                         } catch (error) {
                           bTable2ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [BTable2] Parse error:`, bTable2ParseError);
                         }
                       }
                       
                       // For Card32: Parse result from win/card/rdesc
                       let card32Result: Card32Result | null = null;
                       let card32ParseError: string | null = null;
                       
                       if (isCard32) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           card32Result = parseCard32Result(win, cardValue, rdesc);
                           if (card32Result) {
                             console.log(`✅ [Card32] Parsed: winner=${card32Result.winner}`);
                           } else {
                             card32ParseError = 'Could not parse Card32 result from win/card/rdesc';
                             console.warn(`⚠️ [Card32] Parsing failed`);
                           }
                         } catch (error) {
                           card32ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Card32] Parse error:`, card32ParseError);
                         }
                       }
                       
                       // For Card32EU: Parse result from win/card/rdesc
                       let card32EUResult: Card32EUResult | null = null;
                       let card32EUParseError: string | null = null;
                       
                       if (isCard32EU) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           card32EUResult = parseCard32EUResult(win, cardValue, rdesc);
                           if (card32EUResult) {
                             console.log(`✅ [Card32EU] Parsed: winner=${card32EUResult.winner}`);
                           } else {
                             card32EUParseError = 'Could not parse Card32EU result from win/card/rdesc';
                             console.warn(`⚠️ [Card32EU] Parsing failed`);
                           }
                         } catch (error) {
                           card32EUParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Card32EU] Parse error:`, card32EUParseError);
                         }
                       }
                       
                       // For CMatch20: Parse result from win/rdesc
                       let cmatch20Result: CMatch20Result | null = null;
                       let cmatch20ParseError: string | null = null;
                       
                       if (isCMatch20) {
                         try {
                           cmatch20Result = parseCMatch20Result(win, rdesc);
                           if (cmatch20Result) {
                             console.log(`✅ [CMatch20] Parsed: winner=${cmatch20Result.winnerName}`);
                           } else {
                             cmatch20ParseError = 'Could not parse CMatch20 result from win/rdesc';
                             console.warn(`⚠️ [CMatch20] Parsing failed`);
                           }
                         } catch (error) {
                           cmatch20ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [CMatch20] Parse error:`, cmatch20ParseError);
                         }
                       }
                       
                       // For CMeter: Parse result from win/card/rdesc
                       let cmeterResult: CMeterResult | null = null;
                       let cmeterParseError: string | null = null;
                       
                       if (isCMeter) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           cmeterResult = parseCMeterResult(win, cardValue, rdesc);
                           if (cmeterResult) {
                             console.log(`✅ [CMeter] Parsed: winner=${cmeterResult.winnerName}`);
                           } else {
                             cmeterParseError = 'Could not parse CMeter result from win/card/rdesc';
                             console.warn(`⚠️ [CMeter] Parsing failed`);
                           }
                         } catch (error) {
                           cmeterParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [CMeter] Parse error:`, cmeterParseError);
                         }
                       }
                       
                       // For CricketV3: Parse result from win/rdesc
                       let cricketV3Result: CricketV3Result | null = null;
                       let cricketV3ParseError: string | null = null;
                       
                       if (isCricketV3) {
                         try {
                           cricketV3Result = parseCricketV3Result(win, rdesc);
                           if (cricketV3Result) {
                             console.log(`✅ [CricketV3] Parsed: winner=${cricketV3Result.winner}`);
                           } else {
                             cricketV3ParseError = 'Could not parse CricketV3 result from win/rdesc';
                             console.warn(`⚠️ [CricketV3] Parsing failed`);
                           }
                         } catch (error) {
                           cricketV3ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [CricketV3] Parse error:`, cricketV3ParseError);
                         }
                       }
                       
                       // For DT20: Parse result from win/card/rdesc
                       let dt20Result: DT20Result | null = null;
                       let dt20ParseError: string | null = null;
                       
                       if (isDT20) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           dt20Result = parseDT20Result(win, cardValue, rdesc);
                           if (dt20Result) {
                             console.log(`✅ [DT20] Parsed: winner=${dt20Result.winner}`);
                           } else {
                             dt20ParseError = 'Could not parse DT20 result from win/card/rdesc';
                             console.warn(`⚠️ [DT20] Parsing failed`);
                           }
                         } catch (error) {
                           dt20ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [DT20] Parse error:`, dt20ParseError);
                         }
                       }
                       
                       // For DTL20: Parse result from win/card/rdesc
                       let dtl20Result: DTL20Result | null = null;
                       let dtl20ParseError: string | null = null;
                       
                       if (isDTL20) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           dtl20Result = parseDTL20Result(win, cardValue, rdesc);
                           if (dtl20Result) {
                             console.log(`✅ [DTL20] Parsed: winner=${dtl20Result.winner}`);
                           } else {
                             dtl20ParseError = 'Could not parse DTL20 result from win/card/rdesc';
                             console.warn(`⚠️ [DTL20] Parsing failed`);
                           }
                         } catch (error) {
                           dtl20ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [DTL20] Parse error:`, dtl20ParseError);
                         }
                       }
                       
                       // For Goal: Parse result from win/rdesc
                       let goalResult: GoalResult | null = null;
                       let goalParseError: string | null = null;
                       
                       if (isGoal) {
                         try {
                           goalResult = parseGoalResult(win, rdesc);
                           if (goalResult) {
                             console.log(`✅ [Goal] Parsed: winner=${goalResult.winner}`);
                           } else {
                             goalParseError = 'Could not parse Goal result from win/rdesc';
                             console.warn(`⚠️ [Goal] Parsing failed`);
                           }
                         } catch (error) {
                           goalParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Goal] Parse error:`, goalParseError);
                         }
                       }
                       
                       // For Lucky15: Parse result from win
                       let lucky15Result: Lucky15Result | null = null;
                       let lucky15ParseError: string | null = null;
                       
                       if (isLucky15) {
                         try {
                           lucky15Result = parseLucky15Result(win);
                           if (lucky15Result) {
                             console.log(`✅ [Lucky15] Parsed: card=${lucky15Result.card}`);
                           } else {
                             lucky15ParseError = 'Could not parse Lucky15 result from win';
                             console.warn(`⚠️ [Lucky15] Parsing failed`);
                           }
                         } catch (error) {
                           lucky15ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Lucky15] Parse error:`, lucky15ParseError);
                         }
                       }
                       
                       // For Lucky7EU: Parse result from card
                       let lucky7EUResult: Lucky7EUResult | null = null;
                       let lucky7EUParseError: string | null = null;
                       
                       if (isLucky7EU) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           lucky7EUResult = parseLucky7EUResult(cardValue);
                           if (lucky7EUResult) {
                             console.log(`✅ [Lucky7EU] Parsed: card=${lucky7EUResult.card}`);
                           } else {
                             lucky7EUParseError = 'Could not parse Lucky7EU result from card';
                             console.warn(`⚠️ [Lucky7EU] Parsing failed`);
                           }
                         } catch (error) {
                           lucky7EUParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Lucky7EU] Parse error:`, lucky7EUParseError);
                         }
                       }
                       
                       // For OurRoulette: Parse result from win
                       let ourRouletteResult: OurRouletteResult | null = null;
                       let ourRouletteParseError: string | null = null;
                       
                       if (isOurRoulette) {
                         try {
                           ourRouletteResult = parseOurRouletteResult(win);
                           if (ourRouletteResult) {
                             console.log(`✅ [OurRoulette] Parsed: number=${ourRouletteResult.number}`);
                           } else {
                             ourRouletteParseError = 'Could not parse OurRoulette result from win';
                             console.warn(`⚠️ [OurRoulette] Parsing failed`);
                           }
                         } catch (error) {
                           ourRouletteParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [OurRoulette] Parse error:`, ourRouletteParseError);
                         }
                       }
                       
                       // For Poker20: Parse result from win/card/rdesc
                       let poker20Result: Poker20Result | null = null;
                       let poker20ParseError: string | null = null;
                       
                       if (isPoker20) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           poker20Result = parsePoker20Result(win, cardValue, rdesc);
                           if (poker20Result) {
                             console.log(`✅ [Poker20] Parsed: winner=${poker20Result.winnerName}`);
                           } else {
                             poker20ParseError = 'Could not parse Poker20 result from win/card/rdesc';
                             console.warn(`⚠️ [Poker20] Parsing failed`);
                           }
                         } catch (error) {
                           poker20ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Poker20] Parse error:`, poker20ParseError);
                         }
                       }
                       
                       // For Poker6: Parse result from win/card/rdesc
                       let poker6Result: Poker6Result | null = null;
                       let poker6ParseError: string | null = null;
                       
                       if (isPoker6) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           poker6Result = parsePoker6Result(win, cardValue, rdesc);
                           if (poker6Result) {
                             console.log(`✅ [Poker6] Parsed: winner=${poker6Result.winnerName}`);
                           } else {
                             poker6ParseError = 'Could not parse Poker6 result from win/card/rdesc';
                             console.warn(`⚠️ [Poker6] Parsing failed`);
                           }
                         } catch (error) {
                           poker6ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Poker6] Parse error:`, poker6ParseError);
                         }
                       }
                       
                       // For Poison: Parse result from rdesc
                       let poisonResult: PoisonResult | null = null;
                       let poisonParseError: string | null = null;
                       
                       if (isPoison) {
                         try {
                           poisonResult = parsePoisonResult(rdesc);
                           if (poisonResult) {
                             console.log(`✅ [Poison] Parsed: winner=${poisonResult.winnerName}`);
                           } else {
                             poisonParseError = 'Could not parse Poison result from rdesc';
                             console.warn(`⚠️ [Poison] Parsing failed`);
                           }
                         } catch (error) {
                           poisonParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Poison] Parse error:`, poisonParseError);
                         }
                       }
                       
                       // For Queen: Parse result from win/card/rdesc
                       let queenResult: QueenResult | null = null;
                       let queenParseError: string | null = null;
                       
                       if (isQueen) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           queenResult = parseQueenResult(win, cardValue, rdesc);
                           if (queenResult) {
                             console.log(`✅ [Queen] Parsed: winner=${queenResult.winner}`);
                           } else {
                             queenParseError = 'Could not parse Queen result from win/card/rdesc';
                             console.warn(`⚠️ [Queen] Parsing failed`);
                           }
                         } catch (error) {
                           queenParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Queen] Parse error:`, queenParseError);
                         }
                       }
                       
                       // For Race20: Parse result from win/winnat
                       let race20Result: Race20Result | null = null;
                       let race20ParseError: string | null = null;
                       
                       if (isRace20) {
                         try {
                           race20Result = parseRace20Result(win, winnat);
                           if (race20Result) {
                             console.log(`✅ [Race20] Parsed: winner=${race20Result.winner}`);
                           } else {
                             race20ParseError = 'Could not parse Race20 result from win/winnat';
                             console.warn(`⚠️ [Race20] Parsing failed`);
                           }
                         } catch (error) {
                           race20ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Race20] Parse error:`, race20ParseError);
                         }
                       }
                       
                       // For Roulette: Already handled above with rouletteResult
                       
                       // For SicBo: Parse result from card
                       let sicBoResult: SicBoResult | null = null;
                       let sicBoParseError: string | null = null;
                       
                       if (isSicBo) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           sicBoResult = parseSicBoResult(cardValue);
                           if (sicBoResult) {
                             console.log(`✅ [SicBo] Parsed: dice=${sicBoResult.dice.join(',')}`);
                           } else {
                             sicBoParseError = 'Could not parse SicBo result from card';
                             console.warn(`⚠️ [SicBo] Parsing failed`);
                           }
                         } catch (error) {
                           sicBoParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [SicBo] Parse error:`, sicBoParseError);
                         }
                       }
                       
                       // For SicBo2: Parse result from card
                       let sicBo2Result: Sicbo2Result | null = null;
                       let sicBo2ParseError: string | null = null;
                       
                       if (isSicBo2) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           sicBo2Result = parseSicbo2Result(cardValue);
                           if (sicBo2Result) {
                             console.log(`✅ [SicBo2] Parsed: dice=${sicBo2Result.dice.join(',')}`);
                           } else {
                             sicBo2ParseError = 'Could not parse SicBo2 result from card';
                             console.warn(`⚠️ [SicBo2] Parsing failed`);
                           }
                         } catch (error) {
                           sicBo2ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [SicBo2] Parse error:`, sicBo2ParseError);
                         }
                       }
                       
                       // For SuperOver2: Parse result from win/rdesc
                       let superOver2Result: SuperOver2Result | null = null;
                       let superOver2ParseError: string | null = null;
                       
                       if (isSuperOver2) {
                         try {
                           superOver2Result = parseSuperOver2Result(win, rdesc);
                           if (superOver2Result) {
                             console.log(`✅ [SuperOver2] Parsed: winner=${superOver2Result.winner}`);
                           } else {
                             superOver2ParseError = 'Could not parse SuperOver2 result from win/rdesc';
                             console.warn(`⚠️ [SuperOver2] Parsing failed`);
                           }
                         } catch (error) {
                           superOver2ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [SuperOver2] Parse error:`, superOver2ParseError);
                         }
                       }
                       
                       // For SuperOver3: Parse result from win/card/rdesc
                       let superOver3Result: SuperOver3Result | null = null;
                       let superOver3ParseError: string | null = null;
                       
                       if (isSuperOver3) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           superOver3Result = parseSuperOver3Result(win, cardValue, rdesc);
                           if (superOver3Result) {
                             console.log(`✅ [SuperOver3] Parsed: winner=${superOver3Result.winner}`);
                           } else {
                             superOver3ParseError = 'Could not parse SuperOver3 result from win/card/rdesc';
                             console.warn(`⚠️ [SuperOver3] Parsing failed`);
                           }
                         } catch (error) {
                           superOver3ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [SuperOver3] Parse error:`, superOver3ParseError);
                         }
                       }
                       
                       // For 3CardJ: Parse result from win/card
                       let threeCardJResult: ThreeCardJResult | null = null;
                       let threeCardJParseError: string | null = null;
                       
                       if (is3CardJ) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           threeCardJResult = parse3CardJResult(win, cardValue);
                           if (threeCardJResult) {
                             console.log(`✅ [3CardJ] Parsed: cards=${threeCardJResult.cards.join(',')}`);
                           } else {
                             threeCardJParseError = 'Could not parse 3CardJ result from win/card';
                             console.warn(`⚠️ [3CardJ] Parsing failed`);
                           }
                         } catch (error) {
                           threeCardJParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [3CardJ] Parse error:`, threeCardJParseError);
                         }
                       }
                       
                       // For BallByBall: Parse result from win
                       let ballByBallResult: BallByBallResult | null = null;
                       let ballByBallParseError: string | null = null;
                       
                       if (isBallByBall) {
                         try {
                           ballByBallResult = parseBallByBallResult(win);
                           if (ballByBallResult) {
                             console.log(`✅ [BallByBall] Parsed: result=${ballByBallResult.result}`);
                           } else {
                             ballByBallParseError = 'Could not parse BallByBall result from win';
                             console.warn(`⚠️ [BallByBall] Parsing failed`);
                           }
                         } catch (error) {
                           ballByBallParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [BallByBall] Parse error:`, ballByBallParseError);
                         }
                       }
                       
                       // For Teen20C: Parse result from win
                       let teen20CResult: Teen20CResult | null = null;
                       let teen20CParseError: string | null = null;
                       
                       if (isTeen20C) {
                         try {
                           teen20CResult = parseTeen20CResult(win);
                           if (teen20CResult) {
                             console.log(`✅ [Teen20C] Parsed: winner=${teen20CResult.winnerName} (${teen20CResult.winnerId})`);
                           } else {
                             teen20CParseError = 'Could not parse Teen20C result from win';
                             console.warn(`⚠️ [Teen20C] Parsing failed`);
                           }
                         } catch (error) {
                           teen20CParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Teen20C] Parse error:`, teen20CParseError);
                         }
                       }
                       
                       // For Teen30: Parse result from win/card/rdesc
                       let teen30Result: Teen30Result | null = null;
                       let teen30ParseError: string | null = null;
                       
                       if (isTeen30) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           teen30Result = parseTeen30Result(win, cardValue, rdesc);
                           if (teen30Result) {
                             console.log(`✅ [Teen30] Parsed: winner=${teen30Result.winnerName}`);
                           } else {
                             teen30ParseError = 'Could not parse Teen30 result from win/card/rdesc';
                             console.warn(`⚠️ [Teen30] Parsing failed`);
                           }
                         } catch (error) {
                           teen30ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Teen30] Parse error:`, teen30ParseError);
                         }
                       }
                       
                       // For Teen32: Parse result from win
                       let teen32Result: Teen32Result | null = null;
                       let teen32ParseError: string | null = null;
                       
                       if (isTeen32) {
                         try {
                           teen32Result = parseTeen32Result(win);
                           if (teen32Result) {
                             console.log(`✅ [Teen32] Parsed: winner=${teen32Result.winnerName} (${teen32Result.winnerId})`);
                           } else {
                             teen32ParseError = 'Could not parse Teen32 result from win';
                             console.warn(`⚠️ [Teen32] Parsing failed`);
                           }
                         } catch (error) {
                           teen32ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Teen32] Parse error:`, teen32ParseError);
                         }
                       }
                       
                       // For Teen33: Parse result from win
                       let teen33Result: Teen33Result | null = null;
                       let teen33ParseError: string | null = null;
                       
                       if (isTeen33) {
                         try {
                           teen33Result = parseTeen33Result(win);
                           if (teen33Result) {
                             console.log(`✅ [Teen33] Parsed: winner=${teen33Result.winnerName} (${teen33Result.winnerId})`);
                           } else {
                             teen33ParseError = 'Could not parse Teen33 result from win';
                             console.warn(`⚠️ [Teen33] Parsing failed`);
                           }
                         } catch (error) {
                           teen33ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Teen33] Parse error:`, teen33ParseError);
                         }
                       }
                       
                       // For Teen41: Parse result from win/card/rdesc
                       let teen41Result: Teen41Result | null = null;
                       let teen41ParseError: string | null = null;
                       
                       if (isTeen41) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           teen41Result = parseTeen41Result(win, cardValue, rdesc);
                           if (teen41Result) {
                             console.log(`✅ [Teen41] Parsed: winner=${teen41Result.winnerName}`);
                           } else {
                             teen41ParseError = 'Could not parse Teen41 result from win/card/rdesc';
                             console.warn(`⚠️ [Teen41] Parsing failed`);
                           }
                         } catch (error) {
                           teen41ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Teen41] Parse error:`, teen41ParseError);
                         }
                       }
                       
                       // For Teen42: Parse result from win/card/rdesc
                       let teen42Result: Teen42Result | null = null;
                       let teen42ParseError: string | null = null;
                       
                       if (isTeen42) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           teen42Result = parseTeen42Result(win, cardValue, rdesc);
                           if (teen42Result) {
                             console.log(`✅ [Teen42] Parsed: winner=${teen42Result.winnerName}`);
                           } else {
                             teen42ParseError = 'Could not parse Teen42 result from win/card/rdesc';
                             console.warn(`⚠️ [Teen42] Parsing failed`);
                           }
                         } catch (error) {
                           teen42ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Teen42] Parse error:`, teen42ParseError);
                         }
                       }
                       
                       // For Teen6: Parse result from win/card/rdesc
                       let teen6Result: Teen6Result | null = null;
                       let teen6ParseError: string | null = null;
                       
                       if (isTeen6) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           teen6Result = parseTeen6Result(win, cardValue, rdesc);
                           if (teen6Result) {
                             console.log(`✅ [Teen6] Parsed: winner=${teen6Result.winnerName}`);
                           } else {
                             teen6ParseError = 'Could not parse Teen6 result from win/card/rdesc';
                             console.warn(`⚠️ [Teen6] Parsing failed`);
                           }
                         } catch (error) {
                           teen6ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Teen6] Parse error:`, teen6ParseError);
                         }
                       }
                       
                       // For Teen9: Parse result from win/card/rdesc
                       let teen9Result: Teen9Result | null = null;
                       let teen9ParseError: string | null = null;
                       
                       if (isTeen9) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           teen9Result = parseTeen9Result(win, cardValue, rdesc);
                           if (teen9Result) {
                             console.log(`✅ [Teen9] Parsed: winner=${teen9Result.winnerName}`);
                           } else {
                             teen9ParseError = 'Could not parse Teen9 result from win/card/rdesc';
                             console.warn(`⚠️ [Teen9] Parsing failed`);
                           }
                         } catch (error) {
                           teen9ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Teen9] Parse error:`, teen9ParseError);
                         }
                       }
                       
                       // For War: Parse result from win/card/rdesc
                       let warResult: WarResult | null = null;
                       let warParseError: string | null = null;
                       
                       if (isWar) {
                         try {
                           const cardValue = resultData?.card || resultData?.t1?.card || null;
                           warResult = parseWarResult(win, cardValue, rdesc);
                           if (warResult) {
                             console.log(`✅ [War] Parsed: winner=${warResult.winner}`);
                           } else {
                             warParseError = 'Could not parse War result from win/card/rdesc';
                             console.warn(`⚠️ [War] Parsing failed`);
                           }
                         } catch (error) {
                           warParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [War] Parse error:`, warParseError);
                         }
                       }
                       
                       // For Worli: Parse result from win/rdesc
                       let worliResult: WorliResult | null = null;
                       let worliParseError: string | null = null;
                       
                       if (isWorli) {
                         try {
                           worliResult = parseWorliResult(win, rdesc);
                           if (worliResult) {
                             console.log(`✅ [Worli] Parsed: result=${worliResult.result}`);
                           } else {
                             worliParseError = 'Could not parse Worli result from win/rdesc';
                             console.warn(`⚠️ [Worli] Parsing failed`);
                           }
                         } catch (error) {
                           worliParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Worli] Parse error:`, worliParseError);
                         }
                       }
                       
                       // For Worli2: Parse result from win/rdesc
                       let worli2Result: Worli2Result | null = null;
                       let worli2ParseError: string | null = null;
                       
                       if (isWorli2) {
                         try {
                           worli2Result = parseWorli2Result(win, rdesc);
                           if (worli2Result) {
                             console.log(`✅ [Worli2] Parsed: result=${worli2Result.result}`);
                           } else {
                             worli2ParseError = 'Could not parse Worli2 result from win/rdesc';
                             console.warn(`⚠️ [Worli2] Parsing failed`);
                           }
                         } catch (error) {
                           worli2ParseError = error instanceof Error ? error.message : String(error);
                           console.error(`❌ [Worli2] Parse error:`, worli2ParseError);
                         }
                       }
                       
                      

            // Determine table type for logging
            let tableTypeForLog = 'Generic';
            if (isRoulette) tableTypeForLog = 'Roulette';
            else if (isLucky5) tableTypeForLog = 'Lucky5';
            else if (isDT6) tableTypeForLog = 'DT6';
            else if (isTeen3) tableTypeForLog = 'Teen3';
            else if (isAAA2) tableTypeForLog = 'AAA2';
            else if (isCMeter1) tableTypeForLog = 'CMeter1';
            else if (isMogambo) tableTypeForLog = 'Mogambo';
            else if (isDolidana) tableTypeForLog = 'Dolidana';
            else if (isAB20) tableTypeForLog = 'AB20';
            else if (isTeen62) tableTypeForLog = 'Teen62';
            else if (isAb3) tableTypeForLog = 'Ab3';
            else if (isDT202) tableTypeForLog = 'DT202';
            else if (isDum10) tableTypeForLog = 'Dum10';
            else if (isLottcard) tableTypeForLog = 'Lottcard';
            else if (isLucky7) tableTypeForLog = 'Lucky7';
            else if (isPatti2) tableTypeForLog = 'Patti2';
            else if (isRace2) tableTypeForLog = 'Race2';
            else if (isJoker120) tableTypeForLog = 'Joker120';
            else if (isJoker1) tableTypeForLog = 'Joker1';
            else if (isJoker20) tableTypeForLog = 'Joker20';
            else if (isTeen120) tableTypeForLog = 'Teen120';
            else if (isTeenUnique) tableTypeForLog = 'TeenUnique';
            else if (isTeen20V1) tableTypeForLog = 'Teen20V1';
            else if (isTeen1) tableTypeForLog = 'Teen1';
            else if (isRoulette11) tableTypeForLog = 'Roulette11';
            else if (isRoulette12) tableTypeForLog = 'Roulette12';
            else if (isRoulette13) tableTypeForLog = 'Roulette13';
            else if (isKBC) tableTypeForLog = 'KBC';
            else if (isPoison20) tableTypeForLog = 'Poison20';

            console.log(`\n📋 Bet Matching Setup:`, {
              tableType: tableTypeForLog,
              hasRdesc: !!rdesc,
              rdesc: rdesc || '(not found)',
              parsedWinner: parsedRdesc?.winner || '(not found)',
              parsedResultsCount: parsedRdesc?.results?.length || 0,
              fallbackWinningValue: winningValue || '(not found)',
              rouletteNumber: rouletteResult?.number ?? null,
              lucky5Cards: lucky5Result?.cards ?? null
            });

            for (const bet of betsToProcess) {
              try {
                // Skip if already processed (safety check)
                if (bet.status !== 'pending') {
                  continue;
                }

                const betSide = (bet.side || 'back') as 'back' | 'lay';
                const betType = (bet.bet_type || '').toString().trim();

                // ============================================
                // BET MATCHING FLOW
                // ============================================
                // For Roulette: Use specialized roulette matching
                // For Lucky5: Use specialized lucky5 matching
                // For DT6: Use specialized DT6 matching
                // For Others: Use generic rdesc matching
                // ============================================
                
                let betWon = false;
                let matchReason = '';
                let matchedResult: string | null = null;
                let matchingError: string | null = null;
                let specializedMatchingDone = false; // Track if specialized matching was completed

                try {
                  // PRIMARY: Roulette-specific matching (if roulette table)
                  if (isRoulette) {
                    if (rouletteResult) {
                      try {
                        betWon = isWinningBet(betType, rouletteResult, betSide);
                        matchReason = betWon
                          ? `Roulette bet "${betType}" matched number ${rouletteResult.number}`
                          : `Roulette bet "${betType}" did not match number ${rouletteResult.number}`;
                        matchedResult = rouletteResult.number.toString();
                        specializedMatchingDone = true;

                        console.log(`🎰 [Roulette] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (rouletteError) {
                        const errorMsg = rouletteError instanceof Error ? rouletteError.message : String(rouletteError);
                        matchingError = `roulette matching failed: ${errorMsg}`;
                        console.error(`  ❌ Error in roulette matching:`, errorMsg);
                        // Fall through to generic matching
                      }
                    } else {
                      // Roulette table but result parsing failed
                      matchingError = rouletteParseError || 'Roulette result not available';
                      console.warn(`  ⚠️ Roulette table but result parsing failed: ${matchingError}`);
                      // Fall through to generic matching as last resort
                    }
                  }
                  
                  // PRIMARY: Lucky5-specific matching (if lucky5 table and not roulette)
                  if (!isRoulette && isLucky5) {
                    console.log(`  🎴 [Lucky5] Attempting Lucky5-specific matching for bet ${bet.id}`, {
                      hasLucky5Result: !!lucky5Result,
                      betType,
                      betSide,
                      lucky5ParseError
                    });
                    
                    if (lucky5Result) {
                      try {
                        console.log(`  🎴 [Lucky5] Calling isLucky5WinningBet...`, {
                          betType,
                          winningCard: lucky5Result.winningCard,
                          cardNumber: lucky5Result.cardNumber,
                          attributes: Array.from(lucky5Result.attributes)
                        });
                        
                        betWon = isLucky5WinningBet(betType, lucky5Result, betSide);
                        matchReason = betWon
                          ? `Lucky5 bet "${betType}" matched card ${lucky5Result.winningCard}`
                          : `Lucky5 bet "${betType}" did not match card ${lucky5Result.winningCard}`;
                        matchedResult = lucky5Result.winningCard;
                        specializedMatchingDone = true; // Mark as done

                        console.log(`🎴 [Lucky5] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (lucky5Error) {
                        const errorMsg = lucky5Error instanceof Error ? lucky5Error.message : String(lucky5Error);
                        matchingError = `lucky5 matching failed: ${errorMsg}`;
                        console.error(`  ❌ [Lucky5] Error in matching:`, {
                          error: errorMsg,
                          stack: lucky5Error instanceof Error ? lucky5Error.stack : undefined,
                          betType,
                          lucky5Result
                        });
                        // Fall through to generic matching
                      }
                    } else {
                      // Lucky5 table but result parsing failed
                      matchingError = lucky5ParseError || 'Lucky5 result not available';
                      console.warn(`  ⚠️ [Lucky5] Result parsing failed: ${matchingError}`, {
                        tableId,
                        rdesc: rdesc || '(not found)',
                        resultData: resultData ? 'present' : 'missing'
                      });
                      // Fall through to generic matching as last resort
                    }
                  }
                  
                  // PRIMARY: DT6-specific matching (if DT6 table and not roulette/lucky5)
                  if (!isRoulette && !isLucky5 && isDT6) {
                    if (dt6Result) {
                      try {
                        betWon = isDT6WinningBet(betType, dt6Result, betSide);
                        matchReason = betWon
                          ? `DT6 bet "${betType}" matched winner ${dt6Result.winner}`
                          : `DT6 bet "${betType}" did not match winner ${dt6Result.winner}`;
                        matchedResult = dt6Result.winner;
                        specializedMatchingDone = true;
                        console.log(`🐉 [DT6] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (dt6Error) {
                        matchingError = dt6Error instanceof Error ? dt6Error.message : String(dt6Error);
                        console.error(`❌ [DT6] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = dt6ParseError || 'DT6 result not available';
                      console.warn(`⚠️ [DT6] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Teen3-specific matching (if Teen3 table and not roulette/lucky5/dt6)
                  if (!isRoulette && !isLucky5 && !isDT6 && isTeen3) {
                    if (teen3Result) {
                      try {
                        betWon = isTeen3WinningBet(betType, teen3Result, betSide);
                        matchReason = betWon
                          ? `Teen3 bet "${betType}" matched winner ${teen3Result.winnerName}`
                          : `Teen3 bet "${betType}" did not match winner ${teen3Result.winnerName}`;
                        matchedResult = teen3Result.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🃏 [Teen3] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (teen3Error) {
                        matchingError = teen3Error instanceof Error ? teen3Error.message : String(teen3Error);
                        console.error(`❌ [Teen3] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = teen3ParseError || 'Teen3 result not available';
                      console.warn(`⚠️ [Teen3] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: AAA2-specific matching (if AAA2 table and not roulette/lucky5/dt6/teen3)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && isAAA2) {
                    if (aaa2Result) {
                      try {
                        betWon = isAAA2WinningBet(betType, aaa2Result, betSide);
                        matchReason = betWon
                          ? `AAA2 bet "${betType}" matched winner ${aaa2Result.winnerName}`
                          : `AAA2 bet "${betType}" did not match winner ${aaa2Result.winnerName}`;
                        matchedResult = aaa2Result.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🎭 [AAA2] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (aaa2Error) {
                        matchingError = aaa2Error instanceof Error ? aaa2Error.message : String(aaa2Error);
                        console.error(`❌ [AAA2] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = aaa2ParseError || 'AAA2 result not available';
                      console.warn(`⚠️ [AAA2] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: CMeter1-specific matching (if CMeter1 table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && isCMeter1) {
                    if (cmeter1Result) {
                      try {
                        betWon = isCMeter1WinningBet(betType, cmeter1Result, betSide);
                        matchReason = betWon
                          ? `CMeter1 bet "${betType}" matched winner ${cmeter1Result.winnerName}`
                          : `CMeter1 bet "${betType}" did not match winner ${cmeter1Result.winnerName}`;
                        matchedResult = cmeter1Result.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🎨 [CMeter1] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (cmeter1Error) {
                        matchingError = cmeter1Error instanceof Error ? cmeter1Error.message : String(cmeter1Error);
                        console.error(`❌ [CMeter1] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = cmeter1ParseError || 'CMeter1 result not available';
                      console.warn(`⚠️ [CMeter1] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Mogambo-specific matching (if Mogambo table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && isMogambo) {
                    // Check if this is a 3 Card Total bet
                    const isThreeCardTotalBet = (bet.nat || '').toLowerCase().includes('3 card total') || 
                                                (betType || '').toLowerCase().includes('3 card total');
                    
                    if (isThreeCardTotalBet) {
                      // Handle 3 Card Total bet
                      try {
                        // Extract card string from resultData
                        const cardString = resultData?.card || resultData?.t1?.card || resultData?.data?.card || null;
                        
                        if (cardString) {
                          // Parse the bet value (should be a number)
                          const betValue = parseInt(betType, 10);
                          
                          if (isNaN(betValue)) {
                            matchingError = `Invalid 3 Card Total bet value: "${betType}"`;
                            console.warn(`⚠️ [Mogambo 3 Card Total] ${matchingError}`);
                          } else {
                            const result = isThreeCardTotalWinningBet(betValue, cardString);
                            
                            if (result === "RETURN") {
                              betWon = false; // Mark as not won, but will be returned
                              matchReason = `3 Card Total bet "${betType}" - Game ended early (RETURN)`;
                              matchedResult = "RETURN";
                              // Note: The bet will be returned (stake refunded) in the payout calculation
                              console.log(`🔄 [Mogambo 3 Card Total] Bet ${bet.id}: RETURN - ${matchReason}`);
                            } else if (result === "WIN") {
                              betWon = true;
                              const totalResult = parseThreeCardTotal(cardString);
                              matchReason = `3 Card Total bet "${betType}" matched total ${totalResult?.total || 'N/A'}`;
                              matchedResult = String(totalResult?.total || betValue);
                              console.log(`✅ [Mogambo 3 Card Total] Bet ${bet.id}: WIN - ${matchReason}`);
                            } else {
                              betWon = false;
                              const totalResult = parseThreeCardTotal(cardString);
                              matchReason = `3 Card Total bet "${betType}" did not match total ${totalResult?.total || 'N/A'}`;
                              matchedResult = String(totalResult?.total || 'N/A');
                              console.log(`❌ [Mogambo 3 Card Total] Bet ${bet.id}: LOSE - ${matchReason}`);
                            }
                            
                            specializedMatchingDone = true;
                          }
                        } else {
                          matchingError = 'Card string not available for 3 Card Total settlement';
                          console.warn(`⚠️ [Mogambo 3 Card Total] ${matchingError}`);
                        }
                      } catch (threeCardError) {
                        matchingError = threeCardError instanceof Error ? threeCardError.message : String(threeCardError);
                        console.error(`❌ [Mogambo 3 Card Total] Matching error:`, matchingError);
                      }
                    } else {
                      // Handle regular Mogambo/DagaTeja bet
                      if (mogamboResult) {
                        try {
                          betWon = isMogamboWinningBet(betType, mogamboResult, betSide);
                          matchReason = betWon
                            ? `Mogambo bet "${betType}" matched winner ${mogamboResult.winner}`
                            : `Mogambo bet "${betType}" did not match winner ${mogamboResult.winner}`;
                          matchedResult = mogamboResult.winner;
                          specializedMatchingDone = true;
                          console.log(`🎭 [Mogambo] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                        } catch (mogamboError) {
                          matchingError = mogamboError instanceof Error ? mogamboError.message : String(mogamboError);
                          console.error(`❌ [Mogambo] Matching error:`, matchingError);
                        }
                      } else {
                        matchingError = mogamboParseError || 'Mogambo result not available';
                        console.warn(`⚠️ [Mogambo] No result available: ${matchingError}`);
                      }
                    }
                  }
                  
                  // PRIMARY: Dolidana-specific matching (if Dolidana table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && isDolidana) {
                    if (dolidanaResult) {
                      try {
                        betWon = isDolidanaWinningBet(betType, dolidanaResult, betSide);
                        matchReason = betWon
                          ? `Dolidana bet "${betType}" matched dice ${dolidanaResult.dice.join(',')} (sum=${dolidanaResult.sum})`
                          : `Dolidana bet "${betType}" did not match dice ${dolidanaResult.dice.join(',')} (sum=${dolidanaResult.sum})`;
                        matchedResult = `${dolidanaResult.dice.join(',')} (sum=${dolidanaResult.sum})`;
                        specializedMatchingDone = true;
                        console.log(`🎲 [Dolidana] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (dolidanaError) {
                        matchingError = dolidanaError instanceof Error ? dolidanaError.message : String(dolidanaError);
                        console.error(`❌ [Dolidana] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = dolidanaParseError || 'Dolidana result not available';
                      console.warn(`⚠️ [Dolidana] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: AB20-specific matching (if AB20 table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && isAB20) {
                    if (ab20Result) {
                      try {
                        betWon = isAB20WinningBet(betType, ab20Result, betSide);
                        matchReason = betWon
                          ? `AB20 bet "${betType}" matched rank ${ab20Result.rank} (lastCard=${ab20Result.lastCard})`
                          : `AB20 bet "${betType}" did not match rank ${ab20Result.rank} (lastCard=${ab20Result.lastCard})`;
                        matchedResult = ab20Result.rank;
                        specializedMatchingDone = true;
                        console.log(`🃏 [AB20] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (ab20Error) {
                        matchingError = ab20Error instanceof Error ? ab20Error.message : String(ab20Error);
                        console.error(`❌ [AB20] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = ab20ParseError || 'AB20 result not available';
                      console.warn(`⚠️ [AB20] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Teen62-specific matching (if Teen62 table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && isTeen62) {
                    if (teen62Result) {
                      try {
                        // Extract betNat from bet object (bet_type contains the bet label)
                        const betNat = (bet as any).nat || betType || '';
                        const betSubtype = (bet as any).subtype || '';
                        
                        let settlementResult: "WIN" | "LOSS" | "PUSH" = "LOSS";
                        
                        // Determine which settlement function to use based on bet type
                        if (betType === "Player A" || betType === "Player B") {
                          // Main bet
                          settlementResult = settleTeen62MainBet(betNat, teen62Result, betSide);
                        } else if (betSubtype === "con" || betType.startsWith("Consecutive")) {
                          // Consecutive bet - extract player from betNat
                          const player = betNat.includes("Player A") || betType.includes("A") ? "A" : "B";
                          // For consecutive, we need to check if condition is met (simplified - always true for now)
                          settlementResult = settleTeen62Consecutive(player, true, teen62Result, betSide);
                        } else if (betType.includes("Card") && (betType.includes("Odd") || betType.includes("Even"))) {
                          // Card Odd/Even bet
                          const cardMatch = betType.match(/Card (\d+)\s*(Odd|Even)/i);
                          if (cardMatch) {
                            const cardIndex = parseInt(cardMatch[1]) - 1; // Convert to 0-based index
                            const betType_oe = cardMatch[2].toLowerCase() as "odd" | "even";
                            settlementResult = settleTeen62OddEven(cardIndex, betType_oe, teen62Result, betSide);
                          }
                        } else {
                          // Default: try main bet settlement
                          settlementResult = settleTeen62MainBet(betNat, teen62Result, betSide);
                        }
                        
                        betWon = settlementResult === "WIN";
                        matchReason = settlementResult === "WIN"
                          ? `Teen62 bet "${betType}" matched - ${settlementResult}`
                          : settlementResult === "PUSH"
                          ? `Teen62 bet "${betType}" pushed (Tie)`
                          : `Teen62 bet "${betType}" did not match - ${settlementResult}`;
                        matchedResult = settlementResult === "WIN" ? teen62Result.winner : settlementResult;
                        specializedMatchingDone = true;
                        console.log(`🃏 [Teen62] Bet ${bet.id}: ${betWon ? '✅ WIN' : settlementResult === 'PUSH' ? '⚪ PUSH' : '❌ LOSE'} - ${matchReason}`);
                      } catch (teen62Error) {
                        matchingError = teen62Error instanceof Error ? teen62Error.message : String(teen62Error);
                        console.error(`❌ [Teen62] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = teen62ParseError || 'Teen62 result not available';
                      console.warn(`⚠️ [Teen62] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Ab3-specific matching (if Ab3 table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && isAb3) {
                    if (ab3Result) {
                      try {
                        betWon = isAb3WinningBet(betType, ab3Result, betSide);
                        matchReason = betWon
                          ? `Ab3 bet "${betType}" matched result (isWin=${ab3Result.isWin})`
                          : `Ab3 bet "${betType}" did not match result (isWin=${ab3Result.isWin})`;
                        matchedResult = ab3Result.isWin ? 'Win' : 'No Result';
                        specializedMatchingDone = true;
                        console.log(`🎯 [Ab3] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (ab3Error) {
                        matchingError = ab3Error instanceof Error ? ab3Error.message : String(ab3Error);
                        console.error(`❌ [Ab3] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = ab3ParseError || 'Ab3 result not available';
                      console.warn(`⚠️ [Ab3] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: DT202-specific matching (if DT202 table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && isDT202) {
                    if (dt202Result) {
                      try {
                        betWon = isDT202WinningBet(betType, dt202Result, betSide);
                        matchReason = betWon
                          ? `DT202 bet "${betType}" matched winner ${dt202Result.winner}`
                          : `DT202 bet "${betType}" did not match winner ${dt202Result.winner}`;
                        matchedResult = dt202Result.winner;
                        specializedMatchingDone = true;
                        console.log(`🐉 [DT202] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (dt202Error) {
                        matchingError = dt202Error instanceof Error ? dt202Error.message : String(dt202Error);
                        console.error(`❌ [DT202] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = dt202ParseError || 'DT202 result not available';
                      console.warn(`⚠️ [DT202] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Dum10-specific matching (if Dum10 table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && isDum10) {
                    if (dum10Result) {
                      try {
                        betWon = isDum10WinningBet(betType, dum10Result, betSide);
                        matchReason = betWon
                          ? `Dum10 bet "${betType}" matched result (main=${dum10Result.main})`
                          : `Dum10 bet "${betType}" did not match result (main=${dum10Result.main})`;
                        matchedResult = dum10Result.main;
                        specializedMatchingDone = true;
                        console.log(`🎲 [Dum10] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (dum10Error) {
                        matchingError = dum10Error instanceof Error ? dum10Error.message : String(dum10Error);
                        console.error(`❌ [Dum10] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = dum10ParseError || 'Dum10 result not available';
                      console.warn(`⚠️ [Dum10] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Lottcard-specific matching (if Lottcard table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && isLottcard) {
                    if (lottcardResult) {
                      try {
                        betWon = isLottcardWinningBet(betType, lottcardResult, betSide);
                        matchReason = betWon
                          ? `Lottcard bet "${betType}" matched type ${lottcardResult.type}`
                          : `Lottcard bet "${betType}" did not match type ${lottcardResult.type}`;
                        matchedResult = lottcardResult.type;
                        specializedMatchingDone = true;
                        console.log(`🎴 [Lottcard] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (lottcardError) {
                        matchingError = lottcardError instanceof Error ? lottcardError.message : String(lottcardError);
                        console.error(`❌ [Lottcard] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = lottcardParseError || 'Lottcard result not available';
                      console.warn(`⚠️ [Lottcard] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Lucky7-specific matching (if Lucky7 table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && isLucky7) {
                    if (lucky7Result) {
                      try {
                        betWon = isLucky7WinningBet(betType, lucky7Result, betSide);
                        matchReason = betWon
                          ? `Lucky7 bet "${betType}" matched card ${lucky7Result.rank} (value=${lucky7Result.value})`
                          : `Lucky7 bet "${betType}" did not match card ${lucky7Result.rank} (value=${lucky7Result.value})`;
                        matchedResult = lucky7Result.rank;
                        specializedMatchingDone = true;
                        console.log(`🎰 [Lucky7] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (lucky7Error) {
                        matchingError = lucky7Error instanceof Error ? lucky7Error.message : String(lucky7Error);
                        console.error(`❌ [Lucky7] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = lucky7ParseError || 'Lucky7 result not available';
                      console.warn(`⚠️ [Lucky7] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Patti2-specific matching (if Patti2 table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && isPatti2) {
                    if (patti2Result) {
                      try {
                        betWon = isPatti2WinningBet(betType, patti2Result, betSide);
                        matchReason = betWon
                          ? `Patti2 bet "${betType}" matched winner ${patti2Result.winner}`
                          : `Patti2 bet "${betType}" did not match winner ${patti2Result.winner}`;
                        matchedResult = patti2Result.winner;
                        specializedMatchingDone = true;
                        console.log(`🃏 [Patti2] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (patti2Error) {
                        matchingError = patti2Error instanceof Error ? patti2Error.message : String(patti2Error);
                        console.error(`❌ [Patti2] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = patti2ParseError || 'Patti2 result not available';
                      console.warn(`⚠️ [Patti2] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Race2-specific matching (if Race2 table and not other specialized tables)
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && isRace2) {
                    if (race2Result) {
                      try {
                        // Race2 needs betSid (bet.sid) for matching
                        const betSid = (bet as any).sid || bet.id;
                        betWon = isRace2WinningBet(betType, betSid, race2Result, betSide);
                        matchReason = betWon
                          ? `Race2 bet "${betType}" matched winner ${race2Result.winnerName} (${race2Result.winnerSid})`
                          : `Race2 bet "${betType}" did not match winner ${race2Result.winnerName} (${race2Result.winnerSid})`;
                        matchedResult = race2Result.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🏁 [Race2] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (race2Error) {
                        matchingError = race2Error instanceof Error ? race2Error.message : String(race2Error);
                        console.error(`❌ [Race2] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = race2ParseError || 'Race2 result not available';
                      console.warn(`⚠️ [Race2] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Joker120-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && isJoker120) {
                    if (joker120Result) {
                      try {
                        betWon = isWinningJoker120Bet({ nat: betType }, joker120Result);
                        matchReason = betWon
                          ? `Joker120 bet "${betType}" matched winner ${joker120Result.winnerName}`
                          : `Joker120 bet "${betType}" did not match winner ${joker120Result.winnerName}`;
                        matchedResult = joker120Result.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🃏 [Joker120] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (joker120Error) {
                        matchingError = joker120Error instanceof Error ? joker120Error.message : String(joker120Error);
                        console.error(`❌ [Joker120] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = joker120ParseError || 'Joker120 result not available';
                      console.warn(`⚠️ [Joker120] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Joker1-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && isJoker1) {
                    if (joker1Result) {
                      try {
                        betWon = isWinningJoker1Bet({ nat: betType }, joker1Result);
                        matchReason = betWon
                          ? `Joker1 bet "${betType}" matched winner ${joker1Result.winnerName}`
                          : `Joker1 bet "${betType}" did not match winner ${joker1Result.winnerName}`;
                        matchedResult = joker1Result.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🃏 [Joker1] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (joker1Error) {
                        matchingError = joker1Error instanceof Error ? joker1Error.message : String(joker1Error);
                        console.error(`❌ [Joker1] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = joker1ParseError || 'Joker1 result not available';
                      console.warn(`⚠️ [Joker1] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Joker20-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && isJoker20) {
                    if (joker20Result) {
                      try {
                        betWon = isWinningJoker20Bet({ nat: betType }, joker20Result);
                        matchReason = betWon
                          ? `Joker20 bet "${betType}" matched winner ${joker20Result.winnerName}`
                          : `Joker20 bet "${betType}" did not match winner ${joker20Result.winnerName}`;
                        matchedResult = joker20Result.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🃏 [Joker20] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (joker20Error) {
                        matchingError = joker20Error instanceof Error ? joker20Error.message : String(joker20Error);
                        console.error(`❌ [Joker20] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = joker20ParseError || 'Joker20 result not available';
                      console.warn(`⚠️ [Joker20] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Teen120-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && isTeen120) {
                    if (teen120Result) {
                      try {
                        betWon = isTeen120WinningBet(betType, teen120Result, betSide);
                        matchReason = betWon
                          ? `Teen120 bet "${betType}" matched result`
                          : `Teen120 bet "${betType}" did not match result`;
                        matchedResult = teen120Result.winner || 'N/A';
                        specializedMatchingDone = true;
                        console.log(`🎯 [Teen120] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (teen120Error) {
                        matchingError = teen120Error instanceof Error ? teen120Error.message : String(teen120Error);
                        console.error(`❌ [Teen120] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = teen120ParseError || 'Teen120 result not available';
                      console.warn(`⚠️ [Teen120] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: TeenUnique-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && isTeenUnique) {
                    if (teenUniqueResult) {
                      try {
                        betWon = isWinningTeenUniqueBet(teenUniqueResult);
                        matchReason = betWon
                          ? `TeenUnique bet "${betType}" matched (won)`
                          : `TeenUnique bet "${betType}" did not match (lost)`;
                        matchedResult = teenUniqueResult.isWin ? 'Won' : 'Lost';
                        specializedMatchingDone = true;
                        console.log(`🧩 [TeenUnique] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (teenUniqueError) {
                        matchingError = teenUniqueError instanceof Error ? teenUniqueError.message : String(teenUniqueError);
                        console.error(`❌ [TeenUnique] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = teenUniqueParseError || 'TeenUnique result not available';
                      console.warn(`⚠️ [TeenUnique] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Teen20V1-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && isTeen20V1) {
                    if (teen20V1Result) {
                      try {
                        betWon = isTeen20V1WinningBet(betType, teen20V1Result, betSide);
                        matchReason = betWon
                          ? `Teen20V1 bet "${betType}" matched result`
                          : `Teen20V1 bet "${betType}" did not match result`;
                        matchedResult = teen20V1Result.winner || 'N/A';
                        specializedMatchingDone = true;
                        console.log(`🎯 [Teen20V1] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (teen20V1Error) {
                        matchingError = teen20V1Error instanceof Error ? teen20V1Error.message : String(teen20V1Error);
                        console.error(`❌ [Teen20V1] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = teen20V1ParseError || 'Teen20V1 result not available';
                      console.warn(`⚠️ [Teen20V1] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Teen1-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && isTeen1) {
                    if (teen1Result) {
                      try {
                        betWon = isTeen1WinningBet(betType, teen1Result, betSide);
                        matchReason = betWon
                          ? `Teen1 bet "${betType}" matched result`
                          : `Teen1 bet "${betType}" did not match result`;
                        matchedResult = teen1Result.winner || 'N/A';
                        specializedMatchingDone = true;
                        console.log(`🎯 [Teen1] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (teen1Error) {
                        matchingError = teen1Error instanceof Error ? teen1Error.message : String(teen1Error);
                        console.error(`❌ [Teen1] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = teen1ParseError || 'Teen1 result not available';
                      console.warn(`⚠️ [Teen1] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Roulette11-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && isRoulette11) {
                    if (roulette11Result) {
                      try {
                        betWon = isWinningRoulette11Bet(betType, roulette11Result);
                        matchReason = betWon
                          ? `Roulette11 bet "${betType}" matched number ${roulette11Result.number}`
                          : `Roulette11 bet "${betType}" did not match number ${roulette11Result.number}`;
                        matchedResult = roulette11Result.number.toString();
                        specializedMatchingDone = true;
                        console.log(`🎰 [Roulette11] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (roulette11Error) {
                        matchingError = roulette11Error instanceof Error ? roulette11Error.message : String(roulette11Error);
                        console.error(`❌ [Roulette11] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = roulette11ParseError || 'Roulette11 result not available';
                      console.warn(`⚠️ [Roulette11] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Roulette12-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && isRoulette12) {
                    if (roulette12Result) {
                      try {
                        betWon = isWinningRoulette12Bet(betType, roulette12Result);
                        matchReason = betWon
                          ? `Roulette12 bet "${betType}" matched number ${roulette12Result.number}`
                          : `Roulette12 bet "${betType}" did not match number ${roulette12Result.number}`;
                        matchedResult = roulette12Result.number.toString();
                        specializedMatchingDone = true;
                        console.log(`🎰 [Roulette12] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (roulette12Error) {
                        matchingError = roulette12Error instanceof Error ? roulette12Error.message : String(roulette12Error);
                        console.error(`❌ [Roulette12] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = roulette12ParseError || 'Roulette12 result not available';
                      console.warn(`⚠️ [Roulette12] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Roulette13-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && isRoulette13) {
                    if (roulette13Result) {
                      try {
                        betWon = isWinningRoulette13Bet(betType, roulette13Result);
                        matchReason = betWon
                          ? `Roulette13 bet "${betType}" matched number ${roulette13Result.number}`
                          : `Roulette13 bet "${betType}" did not match number ${roulette13Result.number}`;
                        matchedResult = roulette13Result.number.toString();
                        specializedMatchingDone = true;
                        console.log(`🎰 [Roulette13] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (roulette13Error) {
                        matchingError = roulette13Error instanceof Error ? roulette13Error.message : String(roulette13Error);
                        console.error(`❌ [Roulette13] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = roulette13ParseError || 'Roulette13 result not available';
                      console.warn(`⚠️ [Roulette13] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: KBC-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && isKBC) {
                    if (kbcResult) {
                      try {
                        betWon = isKBCWinningBet(betType, kbcResult, betSide);
                        matchReason = betWon
                          ? `KBC bet "${betType}" matched result`
                          : `KBC bet "${betType}" did not match result`;
                        matchedResult = kbcResult.color || kbcResult.oddEven || 'N/A';
                        specializedMatchingDone = true;
                        console.log(`🎯 [KBC] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (kbcError) {
                        matchingError = kbcError instanceof Error ? kbcError.message : String(kbcError);
                        console.error(`❌ [KBC] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = kbcParseError || 'KBC result not available';
                      console.warn(`⚠️ [KBC] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Poison20-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && isPoison20) {
                    if (poison20Result) {
                      try {
                        betWon = isWinningPoison20Bet({ nat: betType }, poison20Result);
                        matchReason = betWon
                          ? `Poison20 bet "${betType}" matched winner ${poison20Result.winnerName}`
                          : `Poison20 bet "${betType}" did not match winner ${poison20Result.winnerName}`;
                        matchedResult = poison20Result.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🧪 [Poison20] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (poison20Error) {
                        matchingError = poison20Error instanceof Error ? poison20Error.message : String(poison20Error);
                        console.error(`❌ [Poison20] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = poison20ParseError || 'Poison20 result not available';
                      console.warn(`⚠️ [Poison20] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: AAA-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && isAAA) {
                    if (aaaResult) {
                      try {
                        betWon = isWinningAAABet({ nat: betType, subtype: bet.bet_type }, aaaResult);
                        matchReason = betWon
                          ? `AAA bet "${betType}" matched winner ${aaaResult.winnerName}`
                          : `AAA bet "${betType}" did not match winner ${aaaResult.winnerName}`;
                        matchedResult = aaaResult.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🎯 [AAA] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (aaaError) {
                        matchingError = aaaError instanceof Error ? aaaError.message : String(aaaError);
                        console.error(`❌ [AAA] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = aaaParseError || 'AAA result not available';
                      console.warn(`⚠️ [AAA] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Poker-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && isPoker) {
                    if (pokerResult) {
                      try {
                        betWon = isWinningPokerMainBet({ nat: betType }, pokerResult);
                        matchReason = betWon
                          ? `Poker bet "${betType}" matched winner ${pokerResult.winnerName}`
                          : `Poker bet "${betType}" did not match winner ${pokerResult.winnerName}`;
                        matchedResult = pokerResult.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🂡 [Poker] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (pokerError) {
                        matchingError = pokerError instanceof Error ? pokerError.message : String(pokerError);
                        console.error(`❌ [Poker] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = pokerParseError || 'Poker result not available';
                      console.warn(`⚠️ [Poker] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Baccarat-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && isBaccarat) {
                    if (baccaratResult) {
                      try {
                        betWon = isWinningBaccaratMainBet({ nat: betType }, baccaratResult);
                        matchReason = betWon
                          ? `Baccarat bet "${betType}" matched winner ${baccaratResult.winner}`
                          : `Baccarat bet "${betType}" did not match winner ${baccaratResult.winner}`;
                        matchedResult = baccaratResult.winner;
                        specializedMatchingDone = true;
                        console.log(`🎴 [Baccarat] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (baccaratError) {
                        matchingError = baccaratError instanceof Error ? baccaratError.message : String(baccaratError);
                        console.error(`❌ [Baccarat] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = baccaratParseError || 'Baccarat result not available';
                      console.warn(`⚠️ [Baccarat] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Teen-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && isTeen) {
                    if (teenResult) {
                      try {
                        betWon = isWinningTeenMainBet({ nat: betType }, teenResult);
                        matchReason = betWon
                          ? `Teen bet "${betType}" matched winner ${teenResult.winnerName}`
                          : `Teen bet "${betType}" did not match winner ${teenResult.winnerName}`;
                        matchedResult = teenResult.winnerName;
                        specializedMatchingDone = true;
                        console.log(`🃏 [Teen] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (teenError) {
                        matchingError = teenError instanceof Error ? teenError.message : String(teenError);
                        console.error(`❌ [Teen] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = teenParseError || 'Teen result not available';
                      console.warn(`⚠️ [Teen] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: AB4-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && isAB4) {
                    if (ab4Result) {
                      try {
                        betWon = isWinningAB4Bet({ nat: betType }, ab4Result);
                        matchReason = betWon
                          ? `AB4 bet "${betType}" matched winner ${ab4Result.winnerSide}`
                          : `AB4 bet "${betType}" did not match winner ${ab4Result.winnerSide}`;
                        matchedResult = ab4Result.winnerSide;
                        specializedMatchingDone = true;
                        console.log(`🃏 [AB4] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (ab4Error) {
                        matchingError = ab4Error instanceof Error ? ab4Error.message : String(ab4Error);
                        console.error(`❌ [AB4] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = ab4ParseError || 'AB4 result not available';
                      console.warn(`⚠️ [AB4] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: ABJ-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && isABJ) {
                    if (abjResult) {
                      try {
                        betWon = isWinningABJMain({ nat: betType }, abjResult);
                        matchReason = betWon
                          ? `ABJ bet "${betType}" matched winner ${abjResult.winner}`
                          : `ABJ bet "${betType}" did not match winner ${abjResult.winner}`;
                        matchedResult = abjResult.winner;
                        specializedMatchingDone = true;
                        console.log(`🃏 [ABJ] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (abjError) {
                        matchingError = abjError instanceof Error ? abjError.message : String(abjError);
                        console.error(`❌ [ABJ] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = abjParseError || 'ABJ result not available';
                      console.warn(`⚠️ [ABJ] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: Baccarat2-specific matching
                  if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && isBaccarat2) {
                    if (baccarat2Result) {
                      try {
                        betWon = isWinningBaccarat2MainBet({ nat: betType }, baccarat2Result);
                        matchReason = betWon
                          ? `Baccarat2 bet "${betType}" matched winner ${baccarat2Result.winner}`
                          : `Baccarat2 bet "${betType}" did not match winner ${baccarat2Result.winner}`;
                        matchedResult = baccarat2Result.winner;
                        specializedMatchingDone = true;
                        console.log(`🎴 [Baccarat2] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (baccarat2Error) {
                        matchingError = baccarat2Error instanceof Error ? baccarat2Error.message : String(baccarat2Error);
                        console.error(`❌ [Baccarat2] Matching error:`, matchingError);
                      }
                    } else {
                      matchingError = baccarat2ParseError || 'Baccarat2 result not available';
                      console.warn(`⚠️ [Baccarat2] No result available: ${matchingError}`);
                    }
                  }
                  
                  // PRIMARY: BTable-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && isBTable) {
                                      if (bTableResult) {
                                        try {
                                          betWon = isWinningBTableBet({ nat: betType }, bTableResult);
                                          matchReason = betWon
                                            ? `BTable bet "${betType}" matched winner ${bTableResult.winnerName}`
                                            : `BTable bet "${betType}" did not match winner ${bTableResult.winnerName}`;
                                          matchedResult = bTableResult.winnerName;
                                          specializedMatchingDone = true;
                                          console.log(`🎴 [BTable] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (bTableError) {
                                          matchingError = bTableError instanceof Error ? bTableError.message : String(bTableError);
                                          console.error(`❌ [BTable] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = bTableParseError || 'BTable result not available';
                                        console.warn(`⚠️ [BTable] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: BTable2-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && isBTable2) {
                                      if (bTable2Result) {
                                        try {
                                          betWon = isWinningBTable2Bet({ nat: betType }, bTable2Result);
                                          matchReason = betWon
                                            ? `BTable2 bet "${betType}" matched winner ${bTable2Result.winnerName}`
                                            : `BTable2 bet "${betType}" did not match winner ${bTable2Result.winnerName}`;
                                          matchedResult = bTable2Result.winnerName;
                                          specializedMatchingDone = true;
                                          console.log(`🎴 [BTable2] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (bTable2Error) {
                                          matchingError = bTable2Error instanceof Error ? bTable2Error.message : String(bTable2Error);
                                          console.error(`❌ [BTable2] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = bTable2ParseError || 'BTable2 result not available';
                                        console.warn(`⚠️ [BTable2] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Card32-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && isCard32) {
                                      if (card32Result) {
                                        try {
                                          betWon = isWinningCard32Bet({ nat: betType }, card32Result);
                                          matchReason = betWon
                                            ? `Card32 bet "${betType}" matched result`
                                            : `Card32 bet "${betType}" did not match result`;
                                          matchedResult = card32Result.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🃏 [Card32] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (card32Error) {
                                          matchingError = card32Error instanceof Error ? card32Error.message : String(card32Error);
                                          console.error(`❌ [Card32] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = card32ParseError || 'Card32 result not available';
                                        console.warn(`⚠️ [Card32] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Card32EU-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && isCard32EU) {
                                      if (card32EUResult) {
                                        try {
                                          betWon = isWinningCard32EUMatch({ nat: betType }, card32EUResult);
                                          matchReason = betWon
                                            ? `Card32EU bet "${betType}" matched result`
                                            : `Card32EU bet "${betType}" did not match result`;
                                          matchedResult = card32EUResult.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🃏 [Card32EU] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (card32EUError) {
                                          matchingError = card32EUError instanceof Error ? card32EUError.message : String(card32EUError);
                                          console.error(`❌ [Card32EU] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = card32EUParseError || 'Card32EU result not available';
                                        console.warn(`⚠️ [Card32EU] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: CMatch20-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && isCMatch20) {
                                      if (cmatch20Result) {
                                        try {
                                          betWon = isWinningCMatch20Bet({ nat: betType }, cmatch20Result);
                                          matchReason = betWon
                                            ? `CMatch20 bet "${betType}" matched result`
                                            : `CMatch20 bet "${betType}" did not match result`;
                                          matchedResult = cmatch20Result.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🎯 [CMatch20] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (cmatch20Error) {
                                          matchingError = cmatch20Error instanceof Error ? cmatch20Error.message : String(cmatch20Error);
                                          console.error(`❌ [CMatch20] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = cmatch20ParseError || 'CMatch20 result not available';
                                        console.warn(`⚠️ [CMatch20] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: CMeter-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && isCMeter) {
                                      if (cmeterResult) {
                                        try {
                                          betWon = isWinningCMeterBet({ nat: betType }, cmeterResult);
                                          matchReason = betWon
                                            ? `CMeter bet "${betType}" matched result`
                                            : `CMeter bet "${betType}" did not match result`;
                                          matchedResult = cmeterResult.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🎨 [CMeter] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (cmeterError) {
                                          matchingError = cmeterError instanceof Error ? cmeterError.message : String(cmeterError);
                                          console.error(`❌ [CMeter] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = cmeterParseError || 'CMeter result not available';
                                        console.warn(`⚠️ [CMeter] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: CricketV3-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && isCricketV3) {
                                      if (cricketV3Result) {
                                        try {
                                          betWon = isWinningCricketV3Bet({ nat: betType }, cricketV3Result);
                                          matchReason = betWon
                                            ? `CricketV3 bet "${betType}" matched result`
                                            : `CricketV3 bet "${betType}" did not match result`;
                                          matchedResult = cricketV3Result.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🏏 [CricketV3] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (cricketV3Error) {
                                          matchingError = cricketV3Error instanceof Error ? cricketV3Error.message : String(cricketV3Error);
                                          console.error(`❌ [CricketV3] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = cricketV3ParseError || 'CricketV3 result not available';
                                        console.warn(`⚠️ [CricketV3] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: DT20-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && isDT20) {
                                      if (dt20Result) {
                                        try {
                                          betWon = isWinningDT20MainBet({ nat: betType }, dt20Result);
                                          matchReason = betWon
                                            ? `DT20 bet "${betType}" matched result`
                                            : `DT20 bet "${betType}" did not match result`;
                                          matchedResult = dt20Result.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🐉 [DT20] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (dt20Error) {
                                          matchingError = dt20Error instanceof Error ? dt20Error.message : String(dt20Error);
                                          console.error(`❌ [DT20] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = dt20ParseError || 'DT20 result not available';
                                        console.warn(`⚠️ [DT20] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: DTL20-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && isDTL20) {
                                      if (dtl20Result) {
                                        try {
                                          betWon = isWinningDTL20WinnerBet({ nat: betType }, dtl20Result);
                                          matchReason = betWon
                                            ? `DTL20 bet "${betType}" matched result`
                                            : `DTL20 bet "${betType}" did not match result`;
                                          matchedResult = dtl20Result.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🐉 [DTL20] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (dtl20Error) {
                                          matchingError = dtl20Error instanceof Error ? dtl20Error.message : String(dtl20Error);
                                          console.error(`❌ [DTL20] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = dtl20ParseError || 'DTL20 result not available';
                                        console.warn(`⚠️ [DTL20] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                     // PRIMARY: Goal-specific matching
                                     if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && isGoal) {
                                      if (goalResult) {
                                        try {
                                          betWon = isWinningGoalBet({ nat: betType }, goalResult);
                                          matchReason = betWon
                                            ? `Goal bet "${betType}" matched result`
                                            : `Goal bet "${betType}" did not match result`;
                                          matchedResult = goalResult.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`⚽ [Goal] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (goalError) {
                                          matchingError = goalError instanceof Error ? goalError.message : String(goalError);
                                          console.error(`❌ [Goal] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = goalParseError || 'Goal result not available';
                                        console.warn(`⚠️ [Goal] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Lucky15-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && isLucky15) {
                                      if (lucky15Result) {
                                        try {
                                          betWon = isWinningLucky15Bet({ nat: betType }, lucky15Result);
                                          matchReason = betWon
                                            ? `Lucky15 bet "${betType}" matched result`
                                            : `Lucky15 bet "${betType}" did not match result`;
                                          matchedResult = lucky15Result.card || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🍀 [Lucky15] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (lucky15Error) {
                                          matchingError = lucky15Error instanceof Error ? lucky15Error.message : String(lucky15Error);
                                          console.error(`❌ [Lucky15] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = lucky15ParseError || 'Lucky15 result not available';
                                        console.warn(`⚠️ [Lucky15] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Lucky7EU-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && isLucky7EU) {
                                      if (lucky7EUResult) {
                                        try {
                                          betWon = isWinningLucky7EUMain({ nat: betType }, lucky7EUResult);
                                          matchReason = betWon
                                            ? `Lucky7EU bet "${betType}" matched result`
                                            : `Lucky7EU bet "${betType}" did not match result`;
                                          matchedResult = lucky7EUResult.card || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🎰 [Lucky7EU] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (lucky7EUError) {
                                          matchingError = lucky7EUError instanceof Error ? lucky7EUError.message : String(lucky7EUError);
                                          console.error(`❌ [Lucky7EU] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = lucky7EUParseError || 'Lucky7EU result not available';
                                        console.warn(`⚠️ [Lucky7EU] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: OurRoulette-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && isOurRoulette) {
                                      if (ourRouletteResult) {
                                        try {
                                          betWon = isWinningOurRouletteBet({ n: betType }, ourRouletteResult);
                                          matchReason = betWon
                                            ? `OurRoulette bet "${betType}" matched number ${ourRouletteResult.winNumber}`
                                            : `OurRoulette bet "${betType}" did not match number ${ourRouletteResult.winNumber}`;
                                          matchedResult = ourRouletteResult.winNumber.toString();
                                          specializedMatchingDone = true;
                                          console.log(`🎰 [OurRoulette] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (ourRouletteError) {
                                          matchingError = ourRouletteError instanceof Error ? ourRouletteError.message : String(ourRouletteError);
                                          console.error(`❌ [OurRoulette] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = ourRouletteParseError || 'OurRoulette result not available';
                                        console.warn(`⚠️ [OurRoulette] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Poison-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && isPoison) {
                                      if (poisonResult) {
                                        try {
                                          betWon = isWinningPoisonBet({ nat: betType }, poisonResult);
                                          matchReason = betWon
                                            ? `Poison bet "${betType}" matched winner ${poisonResult.winnerName}`
                                            : `Poison bet "${betType}" did not match winner ${poisonResult.winnerName}`;
                                          matchedResult = poisonResult.winnerName;
                                          specializedMatchingDone = true;
                                          console.log(`🧪 [Poison] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (poisonError) {
                                          matchingError = poisonError instanceof Error ? poisonError.message : String(poisonError);
                                          console.error(`❌ [Poison] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = poisonParseError || 'Poison result not available';
                                        console.warn(`⚠️ [Poison] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Poker6-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && isPoker6) {
                                      if (poker6Result) {
                                        try {
                                          betWon = isWinningPoker6PlayerBet({ nat: betType }, poker6Result) || isWinningPoker6HandBet({ nat: betType }, poker6Result);
                                          matchReason = betWon
                                            ? `Poker6 bet "${betType}" matched result`
                                            : `Poker6 bet "${betType}" did not match result`;
                                          matchedResult = poker6Result.winnerName || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🂡 [Poker6] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (poker6Error) {
                                          matchingError = poker6Error instanceof Error ? poker6Error.message : String(poker6Error);
                                          console.error(`❌ [Poker6] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = poker6ParseError || 'Poker6 result not available';
                                        console.warn(`⚠️ [Poker6] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Poker20-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && isPoker20) {
                                      if (poker20Result) {
                                        try {
                                          betWon = isWinningPoker20WinnerBet({ nat: betType }, poker20Result);
                                          matchReason = betWon
                                            ? `Poker20 bet "${betType}" matched winner ${poker20Result.winnerName}`
                                            : `Poker20 bet "${betType}" did not match winner ${poker20Result.winnerName}`;
                                          matchedResult = poker20Result.winnerName;
                                          specializedMatchingDone = true;
                                          console.log(`🂡 [Poker20] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (poker20Error) {
                                          matchingError = poker20Error instanceof Error ? poker20Error.message : String(poker20Error);
                                          console.error(`❌ [Poker20] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = poker20ParseError || 'Poker20 result not available';
                                        console.warn(`⚠️ [Poker20] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Queen-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && isQueen) {
                                      if (queenResult) {
                                        try {
                                          betWon = isWinningQueenBet({ nat: betType }, queenResult);
                                          matchReason = betWon
                                            ? `Queen bet "${betType}" matched result`
                                            : `Queen bet "${betType}" did not match result`;
                                          matchedResult = queenResult.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`👑 [Queen] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (queenError) {
                                          matchingError = queenError instanceof Error ? queenError.message : String(queenError);
                                          console.error(`❌ [Queen] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = queenParseError || 'Queen result not available';
                                        console.warn(`⚠️ [Queen] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Race20-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && isRace20) {
                                      if (race20Result) {
                                        try {
                                          betWon = isWinningRace20Bet({ nat: betType }, race20Result);
                                          matchReason = betWon
                                            ? `Race20 bet "${betType}" matched result`
                                            : `Race20 bet "${betType}" did not match result`;
                                          matchedResult = race20Result.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🏁 [Race20] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (race20Error) {
                                          matchingError = race20Error instanceof Error ? race20Error.message : String(race20Error);
                                          console.error(`❌ [Race20] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = race20ParseError || 'Race20 result not available';
                                        console.warn(`⚠️ [Race20] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: SicBo-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && isSicBo) {
                                      if (sicBoResult) {
                                        try {
                                          betWon = isWinningSicBoBet({ nat: betType }, sicBoResult);
                                          matchReason = betWon
                                            ? `SicBo bet "${betType}" matched result`
                                            : `SicBo bet "${betType}" did not match result`;
                                          matchedResult = sicBoResult.dice.join(',') || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🎲 [SicBo] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (sicBoError) {
                                          matchingError = sicBoError instanceof Error ? sicBoError.message : String(sicBoError);
                                          console.error(`❌ [SicBo] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = sicBoParseError || 'SicBo result not available';
                                        console.warn(`⚠️ [SicBo] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: Sicbo2-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && isSicBo2) {
                                      if (sicBo2Result) {
                                        try {
                                          betWon = isWinningSicbo2Bet({ nat: betType }, sicBo2Result);
                                          matchReason = betWon
                                            ? `Sicbo2 bet "${betType}" matched result`
                                            : `Sicbo2 bet "${betType}" did not match result`;
                                          matchedResult = sicBo2Result.dice.join(',') || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🎲 [Sicbo2] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (sicBo2Error) {
                                          matchingError = sicBo2Error instanceof Error ? sicBo2Error.message : String(sicBo2Error);
                                          console.error(`❌ [Sicbo2] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = sicBo2ParseError || 'Sicbo2 result not available';
                                        console.warn(`⚠️ [Sicbo2] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: SuperOver2-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && isSuperOver2) {
                                      if (superOver2Result) {
                                        try {
                                          betWon = isWinningSuperOver2Bet({ nat: betType }, superOver2Result);
                                          matchReason = betWon
                                            ? `SuperOver2 bet "${betType}" matched result`
                                            : `SuperOver2 bet "${betType}" did not match result`;
                                          matchedResult = superOver2Result.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🏏 [SuperOver2] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (superOver2Error) {
                                          matchingError = superOver2Error instanceof Error ? superOver2Error.message : String(superOver2Error);
                                          console.error(`❌ [SuperOver2] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = superOver2ParseError || 'SuperOver2 result not available';
                                        console.warn(`⚠️ [SuperOver2] No result available: ${matchingError}`);
                                      }
                                    }
                                    
                                    // PRIMARY: SuperOver3-specific matching
                                    if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && isSuperOver3) {
                                      if (superOver3Result) {
                                        try {
                                          betWon = isWinningSuperOver3Bet({ nat: betType }, superOver3Result);
                                          matchReason = betWon
                                            ? `SuperOver3 bet "${betType}" matched result`
                                            : `SuperOver3 bet "${betType}" did not match result`;
                                          matchedResult = superOver3Result.winner || 'N/A';
                                          specializedMatchingDone = true;
                                          console.log(`🏏 [SuperOver3] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                        } catch (superOver3Error) {
                                          matchingError = superOver3Error instanceof Error ? superOver3Error.message : String(superOver3Error);
                                          console.error(`❌ [SuperOver3] Matching error:`, matchingError);
                                        }
                                      } else {
                                        matchingError = superOver3ParseError || 'SuperOver3 result not available';
                                        console.warn(`⚠️ [SuperOver3] No result available: ${matchingError}`);
                                      }
                                    }
                                        // PRIMARY: 3CardJ-specific matching
                                                                        if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && is3CardJ) {
                                                                          if (threeCardJResult) {
                                                                            try {
                                                                              betWon = isWinning3CardJBet({ nat: betType }, threeCardJResult);
                                                                              matchReason = betWon
                                                                                ? `3CardJ bet "${betType}" matched result`
                                                                                : `3CardJ bet "${betType}" did not match result`;
                                                                              matchedResult = threeCardJResult.cards.join(',') || 'N/A';
                                                                              specializedMatchingDone = true;
                                                                              console.log(`🃏 [3CardJ] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                            } catch (threeCardJError) {
                                                                              matchingError = threeCardJError instanceof Error ? threeCardJError.message : String(threeCardJError);
                                                                              console.error(`❌ [3CardJ] Matching error:`, matchingError);
                                                                            }
                                                                          } else {
                                                                            matchingError = threeCardJParseError || '3CardJ result not available';
                                                                            console.warn(`⚠️ [3CardJ] No result available: ${matchingError}`);
                                                                          }
                                                                        }
                                                                        
                                                                        // PRIMARY: BallByBall-specific matching
                                                                        if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && isBallByBall) {
                                                                          if (ballByBallResult) {
                                                                            try {
                                                                              betWon = isWinningBallByBallBet({ nat: betType }, ballByBallResult);
                                                                              matchReason = betWon
                                                                                ? `BallByBall bet "${betType}" matched result`
                                                                                : `BallByBall bet "${betType}" did not match result`;
                                                                              matchedResult = ballByBallResult.result || 'N/A';
                                                                              specializedMatchingDone = true;
                                                                              console.log(`⚾ [BallByBall] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                            } catch (ballByBallError) {
                                                                              matchingError = ballByBallError instanceof Error ? ballByBallError.message : String(ballByBallError);
                                                                              console.error(`❌ [BallByBall] Matching error:`, matchingError);
                                                                            }
                                                                          } else {
                                                                            matchingError = ballByBallParseError || 'BallByBall result not available';
                                                                            console.warn(`⚠️ [BallByBall] No result available: ${matchingError}`);
                                                                          }
                                                                        }
                                                                        
                                                                        // PRIMARY: Teen20C-specific matching
                                                                        if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && isTeen20C) {
                                                                          if (teen20CResult) {
                                                                            try {
                                                                              betWon = isWinningTeen20CBet({ nat: betType }, teen20CResult);
                                                                              matchReason = betWon
                                                                                ? `Teen20C bet "${betType}" matched result`
                                                                                : `Teen20C bet "${betType}" did not match result`;
                                                                              matchedResult = teen20CResult.winnerName || 'N/A';
                                                                              specializedMatchingDone = true;
                                                                              console.log(`🎴 [Teen20C] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                            } catch (teen20CError) {
                                                                              matchingError = teen20CError instanceof Error ? teen20CError.message : String(teen20CError);
                                                                              console.error(`❌ [Teen20C] Matching error:`, matchingError);
                                                                            }
                                                                          } else {
                                                                            matchingError = teen20CParseError || 'Teen20C result not available';
                                                                            console.warn(`⚠️ [Teen20C] No result available: ${matchingError}`);
                                                                          }
                                                                        }
                                                                        
                                                                        // PRIMARY: Teen30-specific matching
                                                                        if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && isTeen30) {
                                                                          if (teen30Result) {
                                                                            try {
                                                                              betWon = isWinningTeen30MainBet({ nat: betType }, teen30Result);
                                                                              matchReason = betWon
                                                                                ? `Teen30 bet "${betType}" matched result`
                                                                                : `Teen30 bet "${betType}" did not match result`;
                                                                              matchedResult = teen30Result.winnerName || 'N/A';
                                                                              specializedMatchingDone = true;
                                                                              console.log(`🎴 [Teen30] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                            } catch (teen30Error) {
                                                                              matchingError = teen30Error instanceof Error ? teen30Error.message : String(teen30Error);
                                                                              console.error(`❌ [Teen30] Matching error:`, matchingError);
                                                                            }
                                                                          } else {
                                                                            matchingError = teen30ParseError || 'Teen30 result not available';
                                                                            console.warn(`⚠️ [Teen30] No result available: ${matchingError}`);
                                                                          }
                                                                        }
                                                                        
                                                                        // PRIMARY: Teen32-specific matching
                                                                        if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && !isTeen30 && isTeen32) {
                                                                          if (teen32Result) {
                                                                            try {
                                                                              betWon = isTeen32WinningBet({ nat: betType }, teen32Result);
                                                                              matchReason = betWon
                                                                                ? `Teen32 bet "${betType}" matched result`
                                                                                : `Teen32 bet "${betType}" did not match result`;
                                                                              matchedResult = teen32Result.winnerName || 'N/A';
                                                                              specializedMatchingDone = true;
                                                                              console.log(`🎴 [Teen32] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                            } catch (teen32Error) {
                                                                              matchingError = teen32Error instanceof Error ? teen32Error.message : String(teen32Error);
                                                                              console.error(`❌ [Teen32] Matching error:`, matchingError);
                                                                            }
                                                                          } else {
                                                                            matchingError = teen32ParseError || 'Teen32 result not available';
                                                                            console.warn(`⚠️ [Teen32] No result available: ${matchingError}`);
                                                                          }
                                                                        }
                                                                        
                                                                        // PRIMARY: Teen33-specific matching
                                                                        if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && !isTeen30 && !isTeen32 && isTeen33) {
                                                                          if (teen33Result) {
                                                                            try {
                                                                              betWon = isWinningTeen33Bet({ nat: betType }, teen33Result);
                                                                              matchReason = betWon
                                                                                ? `Teen33 bet "${betType}" matched result`
                                                                                : `Teen33 bet "${betType}" did not match result`;
                                                                              matchedResult = teen33Result.winnerName || 'N/A';
                                                                              specializedMatchingDone = true;
                                                                              console.log(`🎴 [Teen33] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                            } catch (teen33Error) {
                                                                              matchingError = teen33Error instanceof Error ? teen33Error.message : String(teen33Error);
                                                                              console.error(`❌ [Teen33] Matching error:`, matchingError);
                                                                            }
                                                                          } else {
                                                                            matchingError = teen33ParseError || 'Teen33 result not available';
                                                                            console.warn(`⚠️ [Teen33] No result available: ${matchingError}`);
                                                                          }
                                                                        }
                                                                        
                                                                        // PRIMARY: Teen41-specific matching
                                                                        if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && !isTeen30 && !isTeen32 && !isTeen33 && isTeen41) {
                                                                          if (teen41Result) {
                                                                            try {
                                                                              betWon = isWinningTeen41Bet({ nat: betType }, teen41Result);
                                                                              matchReason = betWon
                                                                                ? `Teen41 bet "${betType}" matched result`
                                                                                : `Teen41 bet "${betType}" did not match result`;
                                                                              matchedResult = teen41Result.winnerName || 'N/A';
                                                                              specializedMatchingDone = true;
                                                                              console.log(`🎴 [Teen41] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                            } catch (teen41Error) {
                                                                              matchingError = teen41Error instanceof Error ? teen41Error.message : String(teen41Error);
                                                                              console.error(`❌ [Teen41] Matching error:`, matchingError);
                                                                            }
                                                                          } else {
                                                                            matchingError = teen41ParseError || 'Teen41 result not available';
                                                                            console.warn(`⚠️ [Teen41] No result available: ${matchingError}`);
                                                                          }
                                                                        }

                                                                                                                                               
                                                                                                                                                
                                                                                                                                                // PRIMARY: Teen42-specific matching
                                                                                                                                                if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && !isTeen30 && !isTeen32 && !isTeen33 && !isTeen41 && isTeen42) {
                                                                                                                                                  if (teen42Result) {
                                                                                                                                                    try {
                                                                                                                                                      betWon = isWinningTeen42Bet({ nat: betType }, teen42Result);
                                                                                                                                                      matchReason = betWon
                                                                                                                                                        ? `Teen42 bet "${betType}" matched result`
                                                                                                                                                        : `Teen42 bet "${betType}" did not match result`;
                                                                                                                                                      matchedResult = teen42Result.winnerName || 'N/A';
                                                                                                                                                      specializedMatchingDone = true;
                                                                                                                                                      console.log(`🎴 [Teen42] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                                                                                                    } catch (teen42Error) {
                                                                                                                                                      matchingError = teen42Error instanceof Error ? teen42Error.message : String(teen42Error);
                                                                                                                                                      console.error(`❌ [Teen42] Matching error:`, matchingError);
                                                                                                                                                    }
                                                                                                                                                  } else {
                                                                                                                                                    matchingError = teen42ParseError || 'Teen42 result not available';
                                                                                                                                                    console.warn(`⚠️ [Teen42] No result available: ${matchingError}`);
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                                
                                                                                                                                                // PRIMARY: Teen6-specific matching
                                                                                                                                                if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && !isTeen30 && !isTeen32 && !isTeen33 && !isTeen41 && !isTeen42 && isTeen6) {
                                                                                                                                                  if (teen6Result) {
                                                                                                                                                    try {
                                                                                                                                                      betWon = isWinningTeen6Match({ nat: betType }, teen6Result);
                                                                                                                                                      matchReason = betWon
                                                                                                                                                        ? `Teen6 bet "${betType}" matched result`
                                                                                                                                                        : `Teen6 bet "${betType}" did not match result`;
                                                                                                                                                      matchedResult = teen6Result.winnerName || 'N/A';
                                                                                                                                                      specializedMatchingDone = true;
                                                                                                                                                      console.log(`🎴 [Teen6] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                                                                                                    } catch (teen6Error) {
                                                                                                                                                      matchingError = teen6Error instanceof Error ? teen6Error.message : String(teen6Error);
                                                                                                                                                      console.error(`❌ [Teen6] Matching error:`, matchingError);
                                                                                                                                                    }
                                                                                                                                                  } else {
                                                                                                                                                    matchingError = teen6ParseError || 'Teen6 result not available';
                                                                                                                                                    console.warn(`⚠️ [Teen6] No result available: ${matchingError}`);
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                                
                                                                                                                                                // PRIMARY: Teen9-specific matching
                                                                                                                                                if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && !isTeen30 && !isTeen32 && !isTeen33 && !isTeen41 && !isTeen42 && !isTeen6 && isTeen9) {
                                                                                                                                                  if (teen9Result) {
                                                                                                                                                    try {
                                                                                                                                                      betWon = isWinningTeen9WinnerBet({ nat: betType }, teen9Result) || isWinningTeen9HandBet({ nat: betType }, teen9Result);
                                                                                                                                                      matchReason = betWon
                                                                                                                                                        ? `Teen9 bet "${betType}" matched result`
                                                                                                                                                        : `Teen9 bet "${betType}" did not match result`;
                                                                                                                                                      matchedResult = teen9Result.winnerName || 'N/A';
                                                                                                                                                      specializedMatchingDone = true;
                                                                                                                                                      console.log(`🎴 [Teen9] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                                                                                                    } catch (teen9Error) {
                                                                                                                                                      matchingError = teen9Error instanceof Error ? teen9Error.message : String(teen9Error);
                                                                                                                                                      console.error(`❌ [Teen9] Matching error:`, matchingError);
                                                                                                                                                    }
                                                                                                                                                  } else {
                                                                                                                                                    matchingError = teen9ParseError || 'Teen9 result not available';
                                                                                                                                                    console.warn(`⚠️ [Teen9] No result available: ${matchingError}`);
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                                
                                                                                                                                                // PRIMARY: War-specific matching
                                                                                                                                                if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && !isTeen30 && !isTeen32 && !isTeen33 && !isTeen41 && !isTeen42 && !isTeen6 && !isTeen9 && isWar) {
                                                                                                                                                  if (warResult) {
                                                                                                                                                    try {
                                                                                                                                                      betWon = isWinningWarBet({ nat: betType }, warResult);
                                                                                                                                                      matchReason = betWon
                                                                                                                                                        ? `War bet "${betType}" matched result`
                                                                                                                                                        : `War bet "${betType}" did not match result`;
                                                                                                                                                      matchedResult = warResult.winner || 'N/A';
                                                                                                                                                      specializedMatchingDone = true;
                                                                                                                                                      console.log(`⚔️ [War] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                                                                                                    } catch (warError) {
                                                                                                                                                      matchingError = warError instanceof Error ? warError.message : String(warError);
                                                                                                                                                      console.error(`❌ [War] Matching error:`, matchingError);
                                                                                                                                                    }
                                                                                                                                                  } else {
                                                                                                                                                    matchingError = warParseError || 'War result not available';
                                                                                                                                                    console.warn(`⚠️ [War] No result available: ${matchingError}`);
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                                
                                                                                                                                                // PRIMARY: Worli-specific matching
                                                                                                                                                if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && !isTeen30 && !isTeen32 && !isTeen33 && !isTeen41 && !isTeen42 && !isTeen6 && !isTeen9 && !isWar && isWorli) {
                                                                                                                                                  if (worliResult) {
                                                                                                                                                    try {
                                                                                                                                                      betWon = isWinningWorliBet({ nat: betType }, worliResult);
                                                                                                                                                      matchReason = betWon
                                                                                                                                                        ? `Worli bet "${betType}" matched result`
                                                                                                                                                        : `Worli bet "${betType}" did not match result`;
                                                                                                                                                      matchedResult = worliResult.result || 'N/A';
                                                                                                                                                      specializedMatchingDone = true;
                                                                                                                                                      console.log(`🎲 [Worli] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                                                                                                    } catch (worliError) {
                                                                                                                                                      matchingError = worliError instanceof Error ? worliError.message : String(worliError);
                                                                                                                                                      console.error(`❌ [Worli] Matching error:`, matchingError);
                                                                                                                                                    }
                                                                                                                                                  } else {
                                                                                                                                                    matchingError = worliParseError || 'Worli result not available';
                                                                                                                                                    console.warn(`⚠️ [Worli] No result available: ${matchingError}`);
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                                
                                                                                                                                                // PRIMARY: Worli2-specific matching
                                                                                                                                                if (!isRoulette && !isLucky5 && !isDT6 && !isTeen3 && !isAAA2 && !isCMeter1 && !isMogambo && !isDolidana && !isAB20 && !isTeen62 && !isAb3 && !isDT202 && !isDum10 && !isLottcard && !isLucky7 && !isPatti2 && !isRace2 && !isJoker120 && !isJoker1 && !isJoker20 && !isTeen120 && !isTeenUnique && !isTeen20V1 && !isTeen1 && !isRoulette11 && !isRoulette12 && !isRoulette13 && !isKBC && !isPoison20 && !isAAA && !isPoker && !isBaccarat && !isTeen && !isAB4 && !isABJ && !isBaccarat2 && !isBTable && !isBTable2 && !isCard32 && !isCard32EU && !isCMatch20 && !isCMeter && !isCricketV3 && !isDT20 && !isDTL20 && !isGoal && !isLucky15 && !isLucky7EU && !isOurRoulette && !isPoison && !isPoker6 && !isPoker20 && !isQueen && !isRace20 && !isSicBo && !isSicBo2 && !isSuperOver2 && !isSuperOver3 && !is3CardJ && !isBallByBall && !isTeen20C && !isTeen30 && !isTeen32 && !isTeen33 && !isTeen41 && !isTeen42 && !isTeen6 && !isTeen9 && !isWar && !isWorli && isWorli2) {
                                                                                                                                                  if (worli2Result) {
                                                                                                                                                    try {
                                                                                                                                                      betWon = isWinningWorli2Bet({ nat: betType }, worli2Result);
                                                                                                                                                      matchReason = betWon
                                                                                                                                                        ? `Worli2 bet "${betType}" matched result`
                                                                                                                                                        : `Worli2 bet "${betType}" did not match result`;
                                                                                                                                                      matchedResult = worli2Result.result || 'N/A';
                                                                                                                                                      specializedMatchingDone = true;
                                                                                                                                                      console.log(`🎲 [Worli2] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                                                                                                                                                    } catch (worli2Error) {
                                                                                                                                                      matchingError = worli2Error instanceof Error ? worli2Error.message : String(worli2Error);
                                                                                                                                                      console.error(`❌ [Worli2] Matching error:`, matchingError);
                                                                                                                                                    }
                                                                                                                                                  } else {
                                                                                                                                                    matchingError = worli2ParseError || 'Worli2 result not available';
                                                                                                                                                    console.warn(`⚠️ [Worli2] No result available: ${matchingError}`);
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                                
                                                                                                                                              
                                                                                                     
                                                                        
                                     
                  // FALLBACK: Generic rdesc-based matching (for non-roulette/non-lucky5/non-dt6 or if specialized matching failed)
                  // Only use fallback if:
                  // 1. Not a specialized table (roulette/lucky5/dt6), OR
                  // 2. Specialized table but matching failed (matchingError is set)
                  const specializedMatchingAttempted = (isRoulette && rouletteResult) || (isLucky5 && lucky5Result) || (isDT6 && dt6Result) || (isTeen3 && teen3Result) || (isAAA2 && aaa2Result) || (isCMeter1 && cmeter1Result) || (isMogambo && mogamboResult) || (isDolidana && dolidanaResult) || (isAB20 && ab20Result) || (isTeen62 && teen62Result) || (isAb3 && ab3Result) || (isDT202 && dt202Result) || (isDum10 && dum10Result) || (isLottcard && lottcardResult) || (isLucky7 && lucky7Result) || (isPatti2 && patti2Result) || (isRace2 && race2Result) || (isJoker120 && joker120Result) || (isJoker1 && joker1Result) || (isJoker20 && joker20Result) || (isTeen120 && teen120Result) || (isTeenUnique && teenUniqueResult) || (isTeen20V1 && teen20V1Result) || (isTeen1 && teen1Result) || (isRoulette11 && roulette11Result) || (isRoulette12 && roulette12Result) || (isRoulette13 && roulette13Result) || (isKBC && kbcResult) || (isPoison20 && poison20Result) || (isAAA && aaaResult) || (isPoker && pokerResult) || (isBaccarat && baccaratResult) || (isTeen && teenResult) || (isAB4 && ab4Result) || (isABJ && abjResult) || (isBaccarat2 && baccarat2Result) || (isBTable && bTableResult) || (isBTable2 && bTable2Result) || (isCard32 && card32Result) || (isCard32EU && card32EUResult) || (isCMatch20 && cmatch20Result) || (isCMeter && cmeterResult) || (isCricketV3 && cricketV3Result) || (isDT20 && dt20Result) || (isDTL20 && dtl20Result) || (isGoal && goalResult) || (isLucky15 && lucky15Result) || (isLucky7EU && lucky7EUResult) || (isOurRoulette && ourRouletteResult) || (isPoison && poisonResult) || (isPoker6 && poker6Result) || (isPoker20 && poker20Result) || (isQueen && queenResult) || (isRace20 && race20Result) || (isSicBo && sicBoResult) || (isSicBo2 && sicBo2Result) || (isSuperOver2 && superOver2Result) || (isSuperOver3 && superOver3Result) || (is3CardJ && threeCardJResult) || (isBallByBall && ballByBallResult) || (isTeen20C && teen20CResult) || (isTeen30 && teen30Result) || (isTeen32 && teen32Result) || (isTeen33 && teen33Result) || (isTeen41 && teen41Result) || (isTeen42 && teen42Result) || (isTeen6 && teen6Result) || (isTeen9 && teen9Result) || (isWar && warResult) || (isWorli && worliResult) || (isWorli2 && worli2Result);
                  const specializedMatchingSucceeded = specializedMatchingAttempted && !matchingError;
                  
                  if (!specializedMatchingSucceeded) {
                    if (parsedRdesc) {
                      try {
                        const matchResult = matchBetAgainstRdesc(betType, betSide, parsedRdesc);
                        betWon = matchResult.isWin;
                        matchReason = matchResult.reason;
                        matchedResult = matchResult.matchedResult;

                        console.log(`📊 [Generic] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (matchError) {
                        const errorMsg = matchError instanceof Error ? matchError.message : String(matchError);
                        matchingError = `rdesc matching failed: ${errorMsg}`;
                        console.error(`  ❌ Error in rdesc matching:`, errorMsg);
                        // Fall through to fallback matching
                      }
                    }
                  }
                  
                  // FALLBACK: Use traditional winnat/win matching (only if specialized matching not done)
                  if (!specializedMatchingDone && (!parsedRdesc || matchingError)) {
                    if (!winningValue) {
                      // No result available - bet loses
                      betWon = false;
                      matchReason = 'No result available for matching';
                      console.warn(`  ⚠️ No result available for bet ${bet.id}`);
                    } else {
                      try {
                        const betTypeLower = betType.toLowerCase().trim();
                        
                        if (betSide === 'back') {
                          betWon = betTypeLower === winningValueLower;
                          matchReason = betWon 
                            ? `BACK bet matched winning value: ${winningValue}`
                            : `BACK bet did not match winning value: ${winningValue}`;
                        } else {
                          betWon = betTypeLower !== winningValueLower;
                          matchReason = betWon
                            ? `LAY bet did not match winning value: ${winningValue}`
                            : `LAY bet matched winning value (loses): ${winningValue}`;
                        }

                        console.log(`📊 [Fallback] Bet ${bet.id}: ${betWon ? '✅ WIN' : '❌ LOSE'} - ${matchReason}`);
                      } catch (fallbackError) {
                        const errorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                        console.error(`  ❌ Error in fallback matching:`, errorMsg);
                        // Bet loses if matching completely fails
                        betWon = false;
                        matchReason = `Matching failed: ${errorMsg}`;
                      }
                    }
                  }
                } catch (error) {
                  // Catch-all for any unexpected errors
                  const errorMsg = error instanceof Error ? error.message : String(error);
                  console.error(`  ❌ Unexpected error in bet matching for bet ${bet.id}:`, errorMsg);
                  betWon = false;
                  matchReason = `Unexpected error: ${errorMsg}`;
                }

                // Check if this is a RETURN bet (stake refund)
                const isReturnBet = matchedResult === "RETURN";
                
                const newStatus = isReturnBet ? 'returned' : (betWon ? 'won' : 'lost');
                const payoutAmount = isReturnBet
                  ? bet.bet_amount // Refund the stake for RETURN bets
                  : (betWon && bet.odds 
                    ? parseFloat((bet.bet_amount * bet.odds).toFixed(2))
                    : 0);

                // ============================================
                // STEP 6: UPDATE BET STATUS (atomic operation)
                // ============================================
                
                // Use .eq('status', 'pending') to prevent duplicate settlement
                const { error: updateError } = await supabase
                  .from('diamond_casino_bets')
                  .update({
                    status: newStatus,
                    payout_amount: payoutAmount,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', bet.id)
                  .eq('status', 'pending'); // CRITICAL: Only update if still pending

                if (updateError) {
                  console.error(`❌ Error updating bet ${bet.id}:`, updateError);
                  continue;
                }

                // ============================================
                // STEP 7: CREDIT WALLET (if won or returned)
                // ============================================
                
                if ((betWon && payoutAmount > 0) || isReturnBet) {
                  const { error: walletError } = await supabase.rpc('update_wallet_balance', {
                    p_user_id: bet.user_id,
                    p_amount: payoutAmount,
                    p_type: 'credit',
                    p_reason: isReturnBet 
                      ? `Diamond Casino bet returned - ${bet.table_name || bet.table_id} (${bet.bet_type})`
                      : `Diamond Casino win - ${bet.table_name || bet.table_id} (${bet.bet_type})`,
                    p_game_type: 'casino'
                  });

                  if (walletError) {
                    console.error(`❌ Error crediting wallet for bet ${bet.id}:`, walletError);
                  } else {
                    totalPayouts += payoutAmount;
                    if (isReturnBet) {
                      console.log(`  🔄 Bet returned: ₹${payoutAmount} (stake refunded)`);
                    } else {
                      won++;
                      console.log(`  💰 Wallet credited: ₹${payoutAmount}`);
                    }
                  }
                } else {
                  lost++;
                }

                processed++;
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`❌ Error processing bet ${bet.id}:`, errorMessage);
              }
            }

            // ============================================
            // STEP 8: RETURN SETTLEMENT SUMMARY
            // ============================================
            
            const tableType = isRoulette ? 'Roulette' : (isLucky5 ? 'Lucky5' : (isDT6 ? 'DT6' : (isTeen3 ? 'Teen3' : (isAAA2 ? 'AAA2' : (isCMeter1 ? 'CMeter1' : (isMogambo ? 'Mogambo' : (isDolidana ? 'Dolidana' : (isAB20 ? 'AB20' : (isTeen62 ? 'Teen62' : (isAb3 ? 'Ab3' : (isDT202 ? 'DT202' : (isDum10 ? 'Dum10' : (isLottcard ? 'Lottcard' : (isLucky7 ? 'Lucky7' : (isPatti2 ? 'Patti2' : (isRace2 ? 'Race2' : 'Generic'))))))))))))))));
            const matchingMethod = isRoulette 
              ? 'roulette-specific' 
              : (isLucky5 
                ? 'lucky5-specific' 
                : (isDT6
                  ? 'dt6-specific'
                  : (isTeen3
                    ? 'teen3-specific'
                    : (isAAA2
                      ? 'aaa2-specific'
                      : (isCMeter1
                        ? 'cmeter1-specific'
                        : (isMogambo
                          ? 'mogambo-specific'
                          : (isDolidana
                            ? 'dolidana-specific'
                            : (isAB20
                              ? 'ab20-specific'
                              : (isTeen62
                                ? 'teen62-specific'
                                : (isAb3
                                  ? 'ab3-specific'
                                  : (isDT202
                                    ? 'dt202-specific'
                                    : (isDum10
                                      ? 'dum10-specific'
                                      : (isLottcard
                                        ? 'lottcard-specific'
                                        : (isLucky7
                                          ? 'lucky7-specific'
                                          : (isPatti2
                                            ? 'patti2-specific'
                                            : (isRace2
                                              ? 'race2-specific'
                                              : (rdesc ? 'rdesc-based (industry standard)' : 'fallback (winnat/win)')))))))))))))))));

            console.log(`\n📈 Settlement Summary:`, {
              processed,
              won,
              lost,
              totalPayouts,
              resultSource,
              winningValue,
              tableType,
              rdescUsed: !!rdesc,
              matchingMethod
            });

            result = {
              success: true,
              message: `Processed ${processed} bets`,
              processed,
              won,
              lost,
              totalPayouts,
              winnat: winnat || null,
              win: win || null,
              winningValue,
              resultSource,
              resultMid: resultMid || null,
              rdesc: rdesc || null,
              tableType,
              matchingMethod
            };
          }
        }
      }
    }
    else if (action === 'get-detail-result' && tableId) {
      // Get detailed result for a specific round
      const mid = reqBody?.mid;
      if (!mid) {
        result = { success: false, error: 'Missing mid parameter', data: null };
      } else {
        try {
          // Use the endpoint: detail_result?mid={mid}&type={type}
          // HOSTINGER_PROXY_BASE already includes /api/casino
          const detailUrl = `${HOSTINGER_PROXY_BASE}/detail_result?mid=${mid}&type=${tableId}`;
          console.log('📡 Fetching detail result from:', detailUrl);
          
          const response = await fetch(detailUrl, {
            headers: { 'Content-Type': 'application/json' }
          });

          console.log('📊 Detail result response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Detail result data received:', JSON.stringify(data, null, 2));
            result = { success: true, data };
          } else {
            const errorText = await response.text();
            console.error('❌ Detail result API error:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            });
            result = { success: false, error: `API returned ${response.status}`, data: null };
          }
        } catch (fetchError) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.error('❌ Error fetching detail result:', {
            tableId,
            mid,
            message: errorMessage
          });
          result = { success: false, error: errorMessage, data: null };
        }
      }
    }
    // Get casino rules (returns HTML content in JSON)
    else if (action === 'get-casino-rules' && tableId) {
      try {
        // Fetch rules from the Hostinger proxy
        // Endpoint: /casinorules?type={tableId}
        const rulesUrl = `${HOSTINGER_PROXY_BASE}/casinorules?type=${tableId}`;
        console.log('📡 Fetching casino rules from:', rulesUrl);
        
        const response = await fetchWithTimeout(rulesUrl, {
          headers: { 'Content-Type': 'application/json' }
        }, TIMEOUTS.TABLE_FETCH);

        console.log('📊 Rules response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Rules data received, success:', data?.success);
          
          // The API returns { success: true, data: [{ ctype, stype, rules: "<html>..." }] }
          // HTML content in the "rules" field is valid JSON (as a string)
          // JSON.stringify() will properly escape it when we return the response
          result = { success: true, data };
        } else {
          const errorText = await response.text();
          console.error('❌ Rules API error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText.substring(0, 200) // Limit error text length
          });
          result = { success: false, error: `API returned ${response.status}`, data: null };
        }
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        console.error('❌ Error fetching casino rules:', {
          tableId,
          message: errorMessage
        });
        result = { success: false, error: errorMessage, data: null };
      }
    }
    else {
      throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Diamond Casino API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details for debugging
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
