import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HOSTINGER_BASE = "http://72.61.169.60:8001/api";
const FETCH_TIMEOUT = 10_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface MarketResult {
  marketId?: string;
  market_name?: string;
  selection?: string;
  result_value?: number;
  winning_selection?: string;
  result?: any;
  [key: string]: any;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { sportsid, gmid, market_id, auto_settle_all } = body;

    // Validate input
    if (!sportsid || !gmid) {
      return new Response(
        JSON.stringify({ success: false, error: "sportsid and gmid are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch result from API
    const apiUrl = `${HOSTINGER_BASE}/sports/posted-market-result?sportsid=${sportsid}&gmid=${gmid}`;
    console.log(`[Auto-Settle] Fetching result from: ${apiUrl}`);

    const apiResponse = await fetchWithTimeout(apiUrl);
    
    if (!apiResponse.ok) {
      throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();
    console.log(`[Auto-Settle] API Response:`, JSON.stringify(apiData).substring(0, 500));

    // Parse API result
    // API response structure may vary - adjust based on actual API response
    let resultData: MarketResult | MarketResult[];
    
    console.log(`[Auto-Settle] Parsing API response structure...`);
    console.log(`[Auto-Settle] API response keys:`, Object.keys(apiData));
    
    // Try multiple possible response structures
    if (Array.isArray(apiData)) {
      resultData = apiData;
      console.log(`[Auto-Settle] ✅ Found array with ${apiData.length} results`);
    } else if (apiData.markets && Array.isArray(apiData.markets)) {
      // Check for markets array first (most common structure from this API)
      resultData = apiData.markets;
      console.log(`[Auto-Settle] ✅ Found markets array with ${apiData.markets.length} results`);
    } else if (apiData.data) {
      if (Array.isArray(apiData.data)) {
        resultData = apiData.data;
        console.log(`[Auto-Settle] ✅ Found data array with ${apiData.data.length} results`);
      } else if (apiData.data.results && Array.isArray(apiData.data.results)) {
        resultData = apiData.data.results;
        console.log(`[Auto-Settle] ✅ Found data.results array with ${apiData.data.results.length} results`);
      } else if (apiData.data.markets && Array.isArray(apiData.data.markets)) {
        resultData = apiData.data.markets;
        console.log(`[Auto-Settle] ✅ Found data.markets array with ${apiData.data.markets.length} results`);
      } else {
        resultData = [apiData.data];
        console.log(`[Auto-Settle] ✅ Found single data object`);
      }
    } else if (apiData.results && Array.isArray(apiData.results)) {
      resultData = apiData.results;
      console.log(`[Auto-Settle] ✅ Found results array with ${apiData.results.length} results`);
    } else if (apiData.result && Array.isArray(apiData.result)) {
      resultData = apiData.result;
      console.log(`[Auto-Settle] ✅ Found result array with ${apiData.result.length} results`);
    } else {
      // Single object - wrap in array
      resultData = [apiData];
      console.log(`[Auto-Settle] ✅ Wrapped single object in array`);
    }

    // Ensure it's an array
    if (!Array.isArray(resultData)) {
      resultData = [resultData];
    }

    if (resultData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No result data found in API response",
          apiResponse: apiData 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Auto-Settle] ✅ Parsed ${resultData.length} result(s) from API`);

    // Cache result
    const { error: cacheError } = await supabase
      .from("market_result_cache")
      .upsert({
        sportsid,
        gmid,
        result_data: resultData,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }, {
        onConflict: "sportsid,gmid"
      });

    if (cacheError) {
      console.warn(`[Auto-Settle] Cache error:`, cacheError);
    }

    const settledMarkets: any[] = [];
    const failedMarkets: any[] = [];

    // If specific market_id provided, settle only that market
    if (market_id) {
      const market = await supabase
        .from("sports_markets")
        .select("*")
        .eq("id", market_id)
        .eq("status", "open")
        .single();

      if (market.error || !market.data) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Market not found or already settled: ${market.error?.message}` 
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find matching result for this market
      const marketResult = findMatchingResult(market.data, resultData);

      if (!marketResult) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `No matching result found for market: ${market.data.market_name}` 
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Settle the market
      const { data: settleResult, error: settleError } = await supabase.rpc(
        "auto_settle_market_from_result",
        {
          p_market_id: market_id,
          p_result_data: marketResult,
          p_settlement_notes: `Auto-settled from API (sportsid: ${sportsid}, gmid: ${gmid})`
        }
      );

      if (settleError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: settleError.message,
            market_id 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          market_id,
          settlement_result: settleResult
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-settle all markets for this event (including closed/suspended markets with placed bets)
    if (auto_settle_all) {
      // First, try to get all markets by sportsid and gmid
      let { data: allMarkets, error: allMarketsError } = await supabase
        .from("sports_markets")
        .select("*")
        .eq("sportsid", sportsid)
        .eq("gmid", gmid)
        .in("status", ["open", "closed", "suspended"]);

      if (allMarketsError) {
        throw new Error(`Failed to fetch markets: ${allMarketsError.message}`);
      }

      // If no markets found by sportsid/gmid, try by event_id (gmid) as fallback
      if (!allMarkets || allMarkets.length === 0) {
        console.log(`[Auto-Settle] No markets found by sportsid/gmid, trying event_id fallback: ${gmid}`);
        const { data: fallbackMarkets, error: fallbackError } = await supabase
          .from("sports_markets")
          .select("*")
          .eq("event_id", gmid) // Use gmid as event_id fallback
          .in("status", ["open", "closed", "suspended"]);

        if (fallbackError) {
          console.warn(`[Auto-Settle] Fallback query error: ${fallbackError.message}`);
        } else if (fallbackMarkets && fallbackMarkets.length > 0) {
          console.log(`[Auto-Settle] Found ${fallbackMarkets.length} market(s) by event_id fallback`);
          allMarkets = fallbackMarkets;
          
          // Update markets with sportsid and gmid for future queries
          const marketIds = fallbackMarkets.map((m: any) => m.id);
          await supabase
            .from("sports_markets")
            .update({ sportsid, gmid })
            .in("id", marketIds);
        }
      }

      if (!allMarkets || allMarkets.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "No markets found for this event",
            sportsid,
            gmid
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter markets that have placed bets
      const marketIds = allMarkets.map(m => m.id);
      const { data: betsWithPlacedStatus, error: betsError } = await supabase
        .from("sports_market_bets")
        .select("market_id")
        .in("market_id", marketIds)
        .eq("status", "placed")
        .limit(1000);

      if (betsError) {
        console.warn(`[Auto-Settle] Error checking bets: ${betsError.message}`);
      }

      // Get unique market IDs that have placed bets
      const marketsWithPlacedBets = new Set(
        (betsWithPlacedStatus || []).map((b: any) => b.market_id)
      );

      // Filter markets to only those with placed bets
      const markets = allMarkets.filter((m: any) => marketsWithPlacedBets.has(m.id));

      if (markets.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "No markets with placed bets found for this event",
            sportsid,
            gmid,
            total_markets: allMarkets.length
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Auto-Settle] Found ${markets.length} market(s) with placed bets out of ${allMarkets.length} total markets`);

      // Settle each market
      for (const market of markets) {
        try {
          console.log(`[Auto-Settle] Processing market: ${market.market_name} (${market.id}), type: ${market.market_type}, status: ${market.status}`);
          
          // For ODDS markets (like MATCH_ODDS), only settle if match is completed
          // For SESSION markets (like over/under), can settle during live match
          // Note: We assume the API only returns results when appropriate (completed for ODDS, available for SESSION)
          // The frontend should filter markets before calling this function
          
          const marketResult = findMatchingResult(market, resultData);

          if (!marketResult) {
            console.warn(`[Auto-Settle] No matching result found for market: ${market.market_name}`);
            failedMarkets.push({
              market_id: market.id,
              market_name: market.market_name,
              error: "No matching result found",
              market_status: market.status
            });
            continue;
          }

          console.log(`[Auto-Settle] Found matching result for market: ${market.market_name}`, JSON.stringify(marketResult).substring(0, 200));

          // Transform result data to ensure winning_selection is properly extracted
          // The API might return the result in different structures
          let transformedResult = marketResult;
          
          // If result is nested in a 'markets' array or has a different structure, extract it
          if (marketResult.markets && Array.isArray(marketResult.markets) && marketResult.markets.length > 0) {
            // Find the matching market in the array by market name
            const matchingMarket = marketResult.markets.find((m: any) => {
              const resultMarketName = (m.marketName || m.mname || m.market_name || '').toString().toLowerCase().trim();
              const dbMarketName = (market.market_name || '').toString().toLowerCase().trim();
              return resultMarketName && dbMarketName && 
                     (resultMarketName === dbMarketName || 
                      resultMarketName.includes(dbMarketName) || 
                      dbMarketName.includes(resultMarketName));
            });
            transformedResult = matchingMarket || marketResult.markets[0];
          }
          
          // Extract winning_selection from various possible field names
          // Check top-level fields first (most common)
          if (!transformedResult.winning_selection && !transformedResult.selection) {
            transformedResult.winning_selection = transformedResult.winning_selection || 
                                                 transformedResult.selection ||
                                                 transformedResult.winnerName ||
                                                 transformedResult.winner ||
                                                 transformedResult.winningTeam || 
                                                 transformedResult.winning_team ||
                                                 transformedResult.selected ||
                                                 transformedResult.outcome;
            
            // Try to extract from nested structures
            if (!transformedResult.winning_selection && transformedResult.result) {
              transformedResult.winning_selection = transformedResult.result.selection || 
                                                   transformedResult.result.winner || 
                                                   transformedResult.result.winning_selection ||
                                                   transformedResult.result.winnerName ||
                                                   transformedResult.result.winningTeam;
            }
            if (!transformedResult.winning_selection && transformedResult.data) {
              transformedResult.winning_selection = transformedResult.data.selection || 
                                                   transformedResult.data.winner || 
                                                   transformedResult.data.winning_selection ||
                                                   transformedResult.data.winnerName ||
                                                   transformedResult.data.winningTeam;
            }
          }
          
          // Log available fields for debugging
          if (!transformedResult.winning_selection) {
            console.warn(`[Auto-Settle] ⚠️ No winning_selection found. Available fields:`, Object.keys(transformedResult).join(', '));
            console.warn(`[Auto-Settle] Full result data:`, JSON.stringify(transformedResult).substring(0, 500));
          }
          
          console.log(`[Auto-Settle] Transformed result data:`, JSON.stringify(transformedResult).substring(0, 300));

          // Additional validation based on market type
          if (market.market_type === 'odds') {
            // For ODDS markets, we need winning_selection from the API result
            // DO NOT use market selection as fallback - this causes wrong settlements
            if (!transformedResult.winning_selection && !transformedResult.selection && !transformedResult.winnerName) {
              console.warn(`[Auto-Settle] ⚠️ ODDS market ${market.market_name} missing winning_selection in result, skipping`);
              console.warn(`[Auto-Settle] Result data for this market:`, JSON.stringify(transformedResult).substring(0, 500));
              failedMarkets.push({
                market_id: market.id,
                market_name: market.market_name,
                error: "Missing winning_selection for ODDS market - result may be for different market",
                market_status: market.status
              });
              continue;
            }
            
            // Validate that the result is actually for this market type
            // Check if result has gtype that matches (FANCY = SESSION, MATCH = ODDS)
            if (transformedResult.gtype && transformedResult.gtype === 'FANCY' && market.market_name?.toUpperCase().includes('MATCH_ODDS')) {
              console.warn(`[Auto-Settle] ⚠️ Result is for FANCY market but trying to settle ODDS market ${market.market_name}, skipping`);
              failedMarkets.push({
                market_id: market.id,
                market_name: market.market_name,
                error: "Result type mismatch - FANCY result cannot be used for ODDS market",
                market_status: market.status
              });
              continue;
            }
          } else if (market.market_type === 'session') {
            // For SESSION markets, we need result_value
            if (!transformedResult.result_value && transformedResult.value === undefined && transformedResult.score === undefined) {
              console.warn(`[Auto-Settle] ⚠️ SESSION market ${market.market_name} missing result_value, skipping`);
              failedMarkets.push({
                market_id: market.id,
                market_name: market.market_name,
                error: "Missing result_value for SESSION market",
                market_status: market.status
              });
              continue;
            }
          }

          const { data: settleResult, error: settleError } = await supabase.rpc(
            "auto_settle_market_from_result",
            {
              p_market_id: market.id,
              p_result_data: transformedResult,
              p_settlement_notes: `Auto-settled from API (sportsid: ${sportsid}, gmid: ${gmid}, market_type: ${market.market_type})`
            }
          );

          if (settleError) {
            console.error(`[Auto-Settle] Settlement error for market ${market.market_name}:`, settleError);
            failedMarkets.push({
              market_id: market.id,
              market_name: market.market_name,
              error: settleError.message,
              market_status: market.status
            });
          } else {
            console.log(`[Auto-Settle] ✅ Successfully settled market: ${market.market_name}`, settleResult);
            settledMarkets.push({
              market_id: market.id,
              market_name: market.market_name,
              settlement_result: settleResult,
              market_status: market.status
            });
          }
        } catch (error: any) {
          console.error(`[Auto-Settle] Exception settling market ${market.market_name}:`, error);
          failedMarkets.push({
            market_id: market.id,
            market_name: market.market_name,
            error: error.message || String(error),
            market_status: market.status
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          sportsid,
          gmid,
          settled_count: settledMarkets.length,
          failed_count: failedMarkets.length,
          settled_markets: settledMarkets,
          failed_markets: failedMarkets
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: return result data without settling
    return new Response(
      JSON.stringify({
        success: true,
        sportsid,
        gmid,
        result_data: resultData,
        message: "Result fetched successfully. Use market_id or auto_settle_all to settle markets."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Auto-Settle] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Find matching result for a market from API result data
 * Enhanced matching with multiple strategies
 */
function findMatchingResult(market: any, resultData: MarketResult[]): MarketResult | null {
  if (!resultData || resultData.length === 0) {
    return null;
  }

  // Strategy 1: Exact market_name match (case-insensitive)
  for (const result of resultData) {
    const resultMarketName = result.market_name?.toString().toLowerCase().trim();
    const marketName = market.market_name?.toString().toLowerCase().trim();
    
    if (resultMarketName && marketName && resultMarketName === marketName) {
      console.log(`[Auto-Settle] ✅ Matched by exact market_name: ${market.market_name}`);
      return result;
    }
  }

  // Strategy 2: Market ID match
  for (const result of resultData) {
    if (result.marketId === market.id || result.market_id === market.id) {
      console.log(`[Auto-Settle] ✅ Matched by market ID: ${market.id}`);
      return result;
    }
  }

  // Strategy 3: Partial market_name match (contains)
  for (const result of resultData) {
    const resultMarketName = result.market_name?.toString().toLowerCase().trim();
    const marketName = market.market_name?.toString().toLowerCase().trim();
    
    if (resultMarketName && marketName && 
        (resultMarketName.includes(marketName) || marketName.includes(resultMarketName))) {
      console.log(`[Auto-Settle] ⚠️ Matched by partial market_name: ${market.market_name} ≈ ${result.market_name}`);
      return result;
    }
  }

  // Strategy 4: Match by event_id or gmid if available
  if (market.event_id || market.gmid) {
    for (const result of resultData) {
      if ((result.event_id && result.event_id === market.event_id) ||
          (result.gmid && result.gmid === market.gmid) ||
          (result.eventId && result.eventId === market.event_id)) {
        console.log(`[Auto-Settle] ✅ Matched by event_id/gmid: ${market.event_id || market.gmid}`);
        return result;
      }
    }
  }

  // Strategy 5: Check if result has marketName or mname field (API structure)
  // This is the most important strategy for this API
  for (const result of resultData) {
    // API returns mname field (e.g., "MATCH_ODDS"), database has market_name
    const resultMname = (result.mname || result.marketName || result.market_name || '').toString().toLowerCase().trim();
    const marketName = market.market_name?.toString().toLowerCase().trim();
    
    if (resultMname && marketName && resultMname === marketName) {
      console.log(`[Auto-Settle] ✅ Matched by mname/marketName: ${market.market_name} = ${result.mname || result.marketName}`);
      return result;
    }
  }

  // Strategy 6: Match by mname partial match (for cases where names are similar)
  for (const result of resultData) {
    const resultMname = (result.mname || result.marketName || result.market_name || '').toString().toLowerCase().trim();
    const marketName = market.market_name?.toString().toLowerCase().trim();
    
    if (resultMname && marketName && 
        (resultMname.includes(marketName) || marketName.includes(resultMname))) {
      console.log(`[Auto-Settle] ⚠️ Matched by mname partial: ${market.market_name} ≈ ${result.mname || result.marketName}`);
      return result;
    }
  }

  // DO NOT use fallback - if no match found, return null
  // This prevents settling wrong markets with wrong results
  console.warn(`[Auto-Settle] ❌ No match found for market: ${market.market_name} (ID: ${market.id}, Type: ${market.market_type})`);
  console.warn(`[Auto-Settle] Available results:`, resultData.map((r: any) => ({
    marketName: r.marketName,
    mname: r.mname,
    market_name: r.market_name,
    gtype: r.gtype,
    gmid: r.gmid
  })));
  console.warn(`[Auto-Settle] Looking for market_name: "${market.market_name}"`);
  return null;
}

