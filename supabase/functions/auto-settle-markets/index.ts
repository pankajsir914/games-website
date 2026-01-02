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
    
    if (Array.isArray(apiData)) {
      resultData = apiData;
    } else if (apiData.data) {
      resultData = Array.isArray(apiData.data) ? apiData.data : [apiData.data];
    } else {
      resultData = [apiData];
    }

    if (!Array.isArray(resultData) || resultData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No result data found in API response",
          apiResponse: apiData 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Auto-settle all open markets for this event
    if (auto_settle_all) {
      const { data: markets, error: marketsError } = await supabase
        .from("sports_markets")
        .select("*")
        .eq("sportsid", sportsid)
        .eq("gmid", gmid)
        .eq("status", "open");

      if (marketsError) {
        throw new Error(`Failed to fetch markets: ${marketsError.message}`);
      }

      if (!markets || markets.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "No open markets found for this event",
            sportsid,
            gmid
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Settle each market
      for (const market of markets) {
        try {
          const marketResult = findMatchingResult(market, resultData);

          if (!marketResult) {
            failedMarkets.push({
              market_id: market.id,
              market_name: market.market_name,
              error: "No matching result found"
            });
            continue;
          }

          const { data: settleResult, error: settleError } = await supabase.rpc(
            "auto_settle_market_from_result",
            {
              p_market_id: market.id,
              p_result_data: marketResult,
              p_settlement_notes: `Auto-settled from API (sportsid: ${sportsid}, gmid: ${gmid})`
            }
          );

          if (settleError) {
            failedMarkets.push({
              market_id: market.id,
              market_name: market.market_name,
              error: settleError.message
            });
          } else {
            settledMarkets.push({
              market_id: market.id,
              market_name: market.market_name,
              settlement_result: settleResult
            });
          }
        } catch (error: any) {
          failedMarkets.push({
            market_id: market.id,
            market_name: market.market_name,
            error: error.message
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
 * This function needs to be customized based on actual API response structure
 */
function findMatchingResult(market: any, resultData: MarketResult[]): MarketResult | null {
  // Try to match by market_name
  for (const result of resultData) {
    if (result.market_name === market.market_name || 
        result.marketId === market.id ||
        result.market_name?.toLowerCase() === market.market_name?.toLowerCase()) {
      return result;
    }
  }

  // If no exact match, return first result (may need more sophisticated matching)
  // This is a fallback - you should customize based on your API structure
  if (resultData.length > 0) {
    return resultData[0];
  }

  return null;
}

