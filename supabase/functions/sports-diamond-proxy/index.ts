import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const HOSTINGER_BASE = "http://72.61.169.60:8001/api";
const FETCH_TIMEOUT = 10_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/* ------------------ utils ------------------ */

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

/* ------------------ handler ------------------ */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Try to get params from body first (for POST requests), then fallback to URL params
    let bodyParams: any = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        bodyParams = JSON.parse(bodyText);
      }
    } catch {
      // Body parsing failed, will use URL params
    }

    /**
     * Frontend will call like:
     * /functions/v1/sports-proxy?action=esid&sid=4
     * OR with body: { action: "esid", sid: "4" }
     */
    const action = bodyParams.action || url.searchParams.get("action");

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let targetUrl = "";

    /* ------------------ ROUTE MAP ------------------ */

    switch (action) {
      case "esid": {
        const sid = bodyParams.sid || url.searchParams.get("sid");
        if (!sid) throw new Error("sid required");
        targetUrl = `${HOSTINGER_BASE}/sports/esid?sid=${sid}`;
        break;
      }

      case "tree":
        targetUrl = `${HOSTINGER_BASE}/sports/tree`;
        break;

      case "details": {
        const sid = bodyParams.sid || url.searchParams.get("sid");
        const gmid = bodyParams.gmid || url.searchParams.get("gmid");
        if (!sid || !gmid) throw new Error("sid & gmid required");
        targetUrl = `${HOSTINGER_BASE}/sports/getDetailsData?sid=${sid}&gmid=${gmid}`;
        break;
      }

      case "private": {
        const sid = bodyParams.sid || url.searchParams.get("sid");
        const gmid = bodyParams.gmid || url.searchParams.get("gmid");
        if (!sid || !gmid) throw new Error("sid & gmid required");
        targetUrl = `${HOSTINGER_BASE}/sports/getPriveteData?sid=${sid}&gmid=${gmid}`;
        break;
      }

      case "score-tv": {
        const eventId = bodyParams.gmid || url.searchParams.get("gmid");
        const sid = bodyParams.sid || url.searchParams.get("sid");
        if (!eventId || !sid) throw new Error("gmid & sid required");
        targetUrl =
          `${HOSTINGER_BASE}/sports/betfairscorecardandtv?` +
          `diamondeventid=${eventId}&diamondsportsid=${sid}`;
        break;
      }

      case "virtual-tv": {
        const gmid = bodyParams.gmid || url.searchParams.get("gmid");
        if (!gmid) throw new Error("gmid required");
        targetUrl = `${HOSTINGER_BASE}/sports/virtual/tvurl?gmid=${gmid}`;
        break;
      }

      case "banner":
        targetUrl = `${HOSTINGER_BASE}/sports/welcomebanner`;
        break;

      case "top-events":
        targetUrl = `${HOSTINGER_BASE}/sports/topevents`;
        break;

      case "market-result": {
        const eventId = bodyParams.eventid || url.searchParams.get("eventid");
        if (!eventId) throw new Error("eventid required");
        targetUrl = `${HOSTINGER_BASE}/sports/posted-market-result?eventid=${eventId}`;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    /* ------------------ FETCH ------------------ */

    const response = await fetchWithTimeout(targetUrl);

    const contentType = response.headers.get("content-type") || "";
    let data: any;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Non-JSON response: ${text.substring(0, 100)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: "hostinger",
        action,
        data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Edge error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
