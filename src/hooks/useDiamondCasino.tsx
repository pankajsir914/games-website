// src/hooks/useDiamondCasino.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LiveCasinoTableConfig } from "@/features/live-casino/types";

interface DiamondTable {
  id: string;
  name: string;
  status: string;
  imageUrl?: string;
} 

interface DiamondBet {
  id: string;
  table_id: string;
  table_name: string;
  bet_amount: number;
  bet_type: string;
  odds: number;
  status: string;
  payout_amount?: number;
  created_at: string;
}

// All data comes from diamond_casino_tables table - no caching needed

export const useDiamondCasino = () => {
  const [liveTables, setLiveTables] = useState<DiamondTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DiamondTable | null>(null);
  const [bets, setBets] = useState<DiamondBet[]>([]);
  const [loading, setLoading] = useState(false);
  const [odds, setOdds] = useState<any>(null);
  const [streamUrls, setStreamUrls] = useState<Record<string, string | null>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [resultHistory, setResultHistory] = useState<any[]>([]);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const { toast } = useToast();

  // ----------------- Helper: normalize possible stream objects -> string or null -----------------
  const extractStreamString = (maybe: any): string | null => {
    if (!maybe && maybe !== "") return null;

    // if it's a string already
    if (typeof maybe === "string") {
      const trimmed = maybe.trim();
      if (trimmed.length === 0) return null;
      // Only accept http(s) urls
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      // sometimes provider returns relative path; ignore unless starts with '//'
      if (/^\/\//.test(trimmed)) return "https:" + trimmed;
      return null;
    }

    // if it's an object, try common fields
    if (typeof maybe === "object") {
      const candidates = [
        maybe.url,
        maybe.streamUrl,
        maybe.tv_url,
        maybe.stream_url,
        maybe.data?.url,
        maybe.data?.streamUrl,
        maybe.data?.tv_url,
        maybe.data?.stream_url,
      ];
      for (const c of candidates) {
        if (typeof c === "string" && /^https?:\/\//i.test(c.trim())) return c.trim();
      }
    }

    return null;
  };

  const normalizeTableDetails = (
    raw: any,
    fallbackId: string
  ): LiveCasinoTableConfig | null => {
    const base =
      raw?.data?.data ||
      raw?.data ||
      raw?.table ||
      raw?.tableData ||
      raw?.table_data ||
      raw ||
      {};

    const tableId =
      base.table_id ||
      base.tableId ||
      base.id ||
      base.gmid ||
      base.slug ||
      fallbackId;

    if (!tableId) return null;

    const gameFamily =
      (base.game_family || base.family || base.gameFamily || "default")
        .toString()
        .toLowerCase();

    return {
      tableId,
      tableName: base.table_name || base.tableName || base.name || tableId,
      gameFamily,
      gameCode: base.game_code || base.gameCode || base.code,
      provider: base.provider || base.vendor || base.partner,
      variant: base.variant || base.ui_variant || base.theme,
      min:
        base.min ||
        base.min_bet ||
        base.minStake ||
        base.minAmount ||
        base.min_limit,
      max:
        base.max ||
        base.max_bet ||
        base.maxStake ||
        base.maxAmount ||
        base.max_limit,
      status: base.status || "active",
      streamUrl:
        base.stream_url || base.streamUrl || base.stream || base.streamURL,
      uiConfig: base.ui_config || base.uiConfig || base.config,
    };
  };

  // ----------------- Fetch live tables directly from diamond_casino_tables -----------------
  const fetchLiveTables = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch only required fields: table_id, table_name, status, image_url column, and image URL from table_data
      // Include both 'active' and 'maintenance' status tables
      const { data: tablesData, error } = await supabase
        .from("diamond_casino_tables")
        .select("table_id, table_name, status, image_url, table_data")
        .in("status", ["active", "maintenance"])
        .order("last_updated", { ascending: false });

      if (error) throw error;

      if (tablesData && tablesData.length > 0) {
        // Format tables - only fetch table_id, table_name, status, and imageUrl
        const tables = tablesData.map((ct: any) => {
          const tableData = ct.table_data || {};
          
          // Extract image URL with priority:
          // 1. image_url column (direct column)
          // 2. table_data.imageUrl
          // 3. table_data.imgpath
          // 4. table_data.img
          let imageUrl = '';
          
          if (ct.image_url && typeof ct.image_url === 'string' && ct.image_url.trim()) {
            imageUrl = ct.image_url.trim();
          } else if (tableData?.imageUrl && typeof tableData.imageUrl === 'string' && tableData.imageUrl.trim()) {
            imageUrl = tableData.imageUrl.trim();
          } else if (tableData?.imgpath && typeof tableData.imgpath === 'string' && tableData.imgpath.trim()) {
            imageUrl = `https://sitethemedata.com/casino-games/${tableData.imgpath.trim()}`;
          } else if (tableData?.img && typeof tableData.img === 'string' && tableData.img.trim()) {
            const imgValue = tableData.img.trim();
            imageUrl = imgValue.startsWith('http') 
              ? imgValue 
              : `https://sitethemedata.com/casino-games/${imgValue}`;
          }

          return {
            id: ct.table_id,
            name: ct.table_name || ct.table_id,
            status: ct.status || 'active',
            imageUrl: imageUrl || undefined
          };
        });
        
        setLiveTables(tables);
      } else {
        setLiveTables([]);
      }
    } catch (error: any) {
      toast({ title: "Casino Connection Error", description: error?.message || "Failed to load live casino tables.", variant: "destructive" });
      setLiveTables([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ----------------- Fetch table details -----------------
  const fetchTableDetails = async (
    tableId: string
  ): Promise<LiveCasinoTableConfig | null> => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-table", tableId } }
      );
      if (error) throw error;

      const normalized = normalizeTableDetails(data, tableId);

      if (normalized) {
        setSelectedTable({
          id: normalized.tableId,
          name: normalized.tableName,
          status: normalized.status || "active",
          imageUrl: normalized.uiConfig?.imageUrl,
        });
      }

      return normalized;
    } catch (error) {
      return null;
    }
  };

  // ----------------- Fetch odds -----------------
  const fetchOdds = async (tableId: string, silent = false) => {
    try {
      // Clear previous error state when retrying
      if (odds?.error || odds?.noOdds) {
        setOdds({ bets: [], rawData: {}, error: false, noOdds: false });
      }
      
      const { data: oddsResponse, error } = await supabase.functions.invoke("diamond-casino-proxy", { 
        body: { action: "get-odds", tableId } 
      });
      
      if (error) {
        setOdds({ bets: [], rawData: {}, error: true });
        return;
      }

      if (!oddsResponse) {
        setOdds({ bets: [], rawData: {}, noOdds: true });
        return;
      }

      let extractedBets: any[] = [];
      const payload = oddsResponse?.data || oddsResponse;
      // For Teen62, check payload.raw for sub array (API structure: data.raw.sub)
      const rawData = payload?.raw || payload; // Check raw data for sub array
      const isTeen62 = rawData?.gtype === "teen62" || payload?.gtype === "teen62" || tableId?.toLowerCase().includes("teen62");
      const isDt6 = tableId?.toLowerCase().includes("dt6") || rawData?.gtype === "dt6" || payload?.gtype === "dt6";

      // Debug: Log API response for DT6
      if (isDt6) {
        // console.log("🔍 [DT6] API Response:", {
        //   tableId,
        //   fullResponse: oddsResponse,
        //   payload: payload,
        //   rawData: rawData,
        //   hasBets: !!payload?.bets,
        //   betsLength: payload?.bets?.length,
        //   betsArray: payload?.bets,
        //   rawDataKeys: rawData ? Object.keys(rawData) : [],
        //   payloadKeys: payload ? Object.keys(payload) : [],
        // });
      }

      // Debug: Log API response for Teen62
      if (isTeen62) {
        // console.log("🔍 API Response for Teen62:", {
        //   fullResponse: oddsResponse,
        //   payload: payload,
        //   rawData: rawData,
        //   hasSubInPayload: !!payload?.sub,
        //   hasSubInRaw: !!rawData?.sub,
        //   subLength: rawData?.sub?.length,
        //   subArray: rawData?.sub,
        //   rawDataKeys: rawData ? Object.keys(rawData) : [],
        // });
      }

      // For Teen62, check 'sub' array first (API structure)
      // Check in rawData first, then payload
      const subArray = rawData?.sub || payload?.sub;
      if (isTeen62 && subArray && Array.isArray(subArray)) {
        extractedBets = subArray
          .filter((bet: any) => {
            // Include all bets for Teen62 (even with 0 odds, they might have odds array)
            return bet && bet.subtype;
          })
          .map((bet: any) => {
            const convert = (v: number) => (v > 1000 ? v / 100000 : v || 0);
            const back = convert(Number(bet.b || bet.back || bet.b1 || 0));
            const lay = convert(Number(bet.l || bet.lay || bet.l1 || 0));

            return {
              type: bet.type || bet.nat || bet.nation || "Unknown",
              nat: bet.nat || bet.type || bet.nation,
              odds: back || lay,
              back,
              lay,
              status: bet.status || (bet.gstatus === "OPEN" ? "active" : "suspended"),
              gstatus: bet.gstatus,
              min: bet.min || 100,
              max: bet.max || 100000,
              sid: bet.sid,
              mid: bet.mid || payload.mid,
              // Preserve ALL original fields for Teen62
              subtype: bet.subtype, // "teen", "con", "oddeven"
              b: bet.b, // Original back odds (decimal format from API)
              l: bet.l, // Original lay odds (decimal format from API)
              odds: bet.odds, // Odds array for card bets
            };
          });
      }
      // Check if we have bets directly (for other games)
      else if (payload?.bets && Array.isArray(payload.bets)) {
        extractedBets = payload.bets
          .filter((bet: any) => {
            if (!bet) return false;
            // Check multiple field names for back/lay values
            const backVal = bet.back || bet.b1 || bet.b || bet.odds || 0;
            const layVal = bet.lay || bet.l1 || bet.l || 0;
            return (backVal > 0 || layVal > 0);
          })
          .map((bet: any) => {
            // Try multiple field names for bet type
            const betType = bet.type || bet.nat || bet.nation || bet.name || bet.label || 'Unknown';
            
            // Convert odds from points format to decimal format
            const convertToDecimal = (value: number): number => {
              if (!value || value === 0) return 0;
              // If value is very large (like 300000), it's in points format
              // Convert to decimal odds (divide by 100000)
              if (value > 1000) {
                return value / 100000;
              }
              // Already in decimal format
              return value;
            };
            
            const rawBackVal = bet.back || bet.b1 || bet.b || bet.odds || 0;
            const rawLayVal = bet.lay || bet.l1 || bet.l || 0;
            
            const backVal = convertToDecimal(Number(rawBackVal));
            const layVal = convertToDecimal(Number(rawLayVal));
            
            return {
              type: betType,
              nat: bet.nat || betType, // Add nat field for compatibility
              odds: backVal > 0 ? backVal : (layVal > 0 ? layVal : 0),
              back: backVal || 0,
              lay: layVal || 0,
              status: bet.status || 'active',
              gstatus: bet.gstatus,
              min: bet.min || 100,
              max: bet.max || 100000,
              sid: bet.sid,
              mid: bet.mid,
              // Preserve original fields
              b: bet.b || bet.back || bet.b1,
              l: bet.l || bet.lay || bet.l1,
            };
          });
      }
      
      // If no bets extracted from bets array, try parsing from raw data
      if (extractedBets.length === 0 && payload?.raw) {
        const rawData = payload.raw;
        ["t1", "t2", "t3", "sub", "grp", "bets", "options", "markets"].forEach((key) => {
          if (rawData[key] && Array.isArray(rawData[key])) {
            rawData[key].forEach((item: any, index: number) => {
              if (!item || typeof item !== 'object') return;
              
              // Try multiple field names for bet type
              const betType = item.nat || item.nation || item.name || item.type || item.label || item.title || 
                             item.n || item.txt || item.text || item.val || item.value || 
                             `Option ${index + 1}`;
              
              // Try multiple field names for back/lay values - check all possible numeric fields
              // Note: Check bs/ls as well (might be the actual odds)
              const backVal = parseFloat(
                item.b1 || item.bs || item.b || item.back || item.odds || item.o || item.odd || 
                item.bet || item.bet1 || item.bet_back || item.back_odds || "0"
              ) || 0;
              const layVal = parseFloat(
                item.l1 || item.ls || item.l || item.lay || item.lay_odds || item.lay1 || "0"
              ) || 0;
              
              // Also check if there are nested objects with odds
              let nestedBack = 0;
              let nestedLay = 0;
              if (item.data && typeof item.data === 'object') {
                nestedBack = parseFloat(item.data.b1 || item.data.bs || item.data.b || item.data.back || item.data.odds || "0") || 0;
                nestedLay = parseFloat(item.data.l1 || item.data.ls || item.data.l || item.data.lay || "0") || 0;
              }
              
              const finalBack = backVal || nestedBack;
              const finalLay = layVal || nestedLay;
              
              // Check if item has a meaningful bet type (not just a generic "Option X")
              // If nat/nation/name exists, it's definitely a valid bet type
              const hasValidBetType = betType && 
                                     betType !== `Option ${index + 1}` && 
                                     betType.trim() !== '' &&
                                     (item.nat || item.nation || item.name || item.type || item.label || item.title);
              
              // Check if item should be visible
              // For items with valid bet types (like 'Player A'), include them even if visible is 0
              // because visible: 0 might just mean odds are not available yet, not that item is hidden
              const isExplicitlyHidden = item.visible === false;
              // If item has a valid bet type name, include it even if visible is 0 (odds might be loading)
              const shouldShow = hasValidBetType ? (item.visible !== false) : (!isExplicitlyHidden && item.visible !== 0 && item.visible !== '0');
              
              // Add if there's a valid back or lay value, OR if the item should be shown and has a valid bet type name
              // (some games might show options even with 0 odds initially - they'll update when odds become available)
              const shouldInclude = (finalBack > 0 || finalLay > 0) || (shouldShow && hasValidBetType);
              
              if (shouldInclude) {
                // Convert odds from points format to decimal format
                const convertToDecimal = (value: number): number => {
                  if (!value || value === 0) return 0;
                  // If value is very large (like 300000), it's in points format
                  // Convert to decimal odds (divide by 100000)
                  if (value > 1000) {
                    return value / 100000;
                  }
                  // Already in decimal format
                  return value;
                };
                
                const convertedBack = convertToDecimal(finalBack);
                const convertedLay = convertToDecimal(finalLay);
                
                // Only use actual odds, no dummy data
                // If both are 0, use 0 (don't show dummy odds)
                const oddsValue = convertedBack > 0 ? convertedBack : (convertedLay > 0 ? convertedLay : 0);
                
                extractedBets.push({
                  type: betType,
                  odds: oddsValue,
                  back: convertedBack,
                  lay: convertedLay,
                  status: (item.gstatus === "0" || item.gstatus === "SUSPENDED" || item.status === "suspended" || item.suspended) ? "suspended" : "active",
                  min: item.min || rawData.min || 100,
                  max: item.max || rawData.max || 100000,
                  sid: item.sid,
                  mid: item.mid || rawData.mid,
                });
              }
            });
          }
        });
      }
      // If still no bets, try direct payload parsing
      if (extractedBets.length === 0) {
        const rawData = payload;
        ["t1", "t2", "t3", "sub", "grp", "bets", "options", "markets"].forEach((key) => {
          if (rawData[key] && Array.isArray(rawData[key])) {
            rawData[key].forEach((item: any, index: number) => {
              if (!item || typeof item !== 'object') return;
              
              // Try multiple field names for bet type
              const betType = item.nat || item.nation || item.name || item.type || item.label || item.title || 
                             item.n || item.txt || item.text || item.val || item.value || 
                             `Option ${index + 1}`;
              
              // Try multiple field names for back/lay values - check bs/ls as well
              const backVal = parseFloat(
                item.b1 || item.bs || item.b || item.back || item.odds || item.o || item.odd || 
                item.bet || item.bet1 || item.bet_back || item.back_odds || "0"
              ) || 0;
              const layVal = parseFloat(
                item.l1 || item.ls || item.l || item.lay || item.lay_odds || item.lay1 || "0"
              ) || 0;
              
              // Also check if there are nested objects with odds
              let nestedBack = 0;
              let nestedLay = 0;
              if (item.data && typeof item.data === 'object') {
                nestedBack = parseFloat(item.data.b1 || item.data.bs || item.data.b || item.data.back || item.data.odds || "0") || 0;
                nestedLay = parseFloat(item.data.l1 || item.data.ls || item.data.l || item.data.lay || "0") || 0;
              }
              
              const finalBack = backVal || nestedBack;
              const finalLay = layVal || nestedLay;
              
              // Check if item has a meaningful bet type (not just a generic "Option X")
              // If nat/nation/name exists, it's definitely a valid bet type
              const hasValidBetType = betType && 
                                     betType !== `Option ${index + 1}` && 
                                     betType.trim() !== '' &&
                                     (item.nat || item.nation || item.name || item.type || item.label || item.title);
              
              // Check if item should be visible
              // For items with valid bet types (like 'Player A'), include them even if visible is 0
              // because visible: 0 might just mean odds are not available yet, not that item is hidden
              const isExplicitlyHidden = item.visible === false;
              // If item has a valid bet type name, include it even if visible is 0 (odds might be loading)
              const shouldShow = hasValidBetType ? (item.visible !== false) : (!isExplicitlyHidden && item.visible !== 0 && item.visible !== '0');
              
              // Check if this is Teen62
              const isTeen62 = rawData?.gtype === "teen62" || tableId?.toLowerCase().includes("teen62");
              
              // Add if there's a valid back or lay value, OR if the item should be shown and has a valid bet type name
              // (some games might show options even with 0 odds initially - they'll update when odds become available)
              // For Teen62, include bets with subtype even if odds are 0
              const shouldInclude = (finalBack > 0 || finalLay > 0) || (shouldShow && hasValidBetType) || (isTeen62 && item.subtype);
              
              if (shouldInclude) {
                // Convert odds from points format to decimal format
                const convertToDecimal = (value: number): number => {
                  if (!value || value === 0) return 0;
                  // If value is very large (like 300000), it's in points format
                  // Convert to decimal odds (divide by 100000)
                  if (value > 1000) {
                    return value / 100000;
                  }
                  // Already in decimal format
                  return value;
                };
                
                const convertedBack = convertToDecimal(finalBack);
                const convertedLay = convertToDecimal(finalLay);
                
                // Only use actual odds, no dummy data
                // If both are 0, use 0 (don't show dummy odds)
                const oddsValue = convertedBack > 0 ? convertedBack : (convertedLay > 0 ? convertedLay : 0);
                
                extractedBets.push({
                  type: betType,
                  nat: item.nat || item.nation || item.name || item.type || item.label, // Preserve nat
                  odds: oddsValue,
                  back: convertedBack,
                  lay: convertedLay,
                  status: (item.gstatus === "0" || item.gstatus === "SUSPENDED" || item.status === "suspended" || item.suspended) ? "suspended" : "active",
                  gstatus: item.gstatus, // Preserve gstatus
                  min: item.min || rawData.min || 100,
                  max: item.max || rawData.max || 100000,
                  sid: item.sid,
                  mid: item.mid || rawData.mid,
                  // Preserve ALL original fields for Teen62
                  ...(isTeen62 && {
                    subtype: item.subtype, // "teen", "con", "oddeven"
                    b: item.b, // Original back odds (decimal format)
                    l: item.l, // Original lay odds (decimal format)
                    odds: item.odds, // Odds array for card bets
                  }),
                });
              }
            });
          }
        });
      }

      if (extractedBets.length > 0) {
        // Debug: Log extracted bets for DT6
        if (isDt6) {
          console.log("🔍 [DT6] Extracted Bets:", {
            count: extractedBets.length,
            bets: extractedBets,
            sampleBet: extractedBets[0],
            allBetTypes: extractedBets.map(b => ({ type: b.type, nat: b.nat, back: b.back, b: b.b, sid: b.sid })),
          });
        }
        
        setOdds({ bets: extractedBets, rawData: payload || {}, error: false, noOdds: false });
      } else {
        setOdds({ bets: [], rawData: payload || {}, noOdds: true, error: false });
      }
    } catch (error) {
      setOdds({ bets: [], rawData: {}, error: true });
    }
  };

  // ----------------- Place bet -----------------
  const placeBet = async (betData: {
    tableId: string;
    tableName: string;
    amount: number;
    betType: string;
    odds: number;
    roundId?: string;
    sid?: string | number;
    side?: "back" | "lay";
  }) => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in to place bets");

      // Validate bet data
      if (!betData.amount || betData.amount <= 0) {
        throw new Error("Invalid bet amount");
      }
      if (!betData.betType) {
        throw new Error("Please select a bet option");
      }

      // call edge function, pass token
      // Use fetch directly to get better error messages
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/diamond-casino-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
          },
          body: JSON.stringify({ action: "place-bet", betData }),
          referrerPolicy: 'strict-origin-when-cross-origin'
        });

        const responseData = await response.json();

        if (!response.ok) {
          const errorMsg = responseData?.error || responseData?.message || `Server error: ${response.status}`;
          throw new Error(errorMsg);
        }

        if (!responseData?.success) {
          const errorMsg = responseData?.error || responseData?.message || "Bet rejected by casino API";
          throw new Error(errorMsg);
        }

        // success: data.bet should be the inserted row (or null)
        toast({ 
          title: "Bet Placed!", 
          description: `You bet ₹${betData.amount} on ${betData.betType}` 
        });
        fetchUserBets();
        return responseData.bet ?? responseData;
      } catch (fetchError: any) {
        // If it's already an Error with a message, re-throw it
        if (fetchError instanceof Error) {
          throw fetchError;
        }
        // Otherwise create a new error
        throw new Error(fetchError?.message || "Failed to place bet");
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || "Failed to place bet";
      toast({ 
        title: "Bet Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Fetch user's bets -----------------
  const fetchUserBets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("diamond_casino_bets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      setBets(data || []);
    } catch (error) {
      // Error handled silently
    }
  };

  useEffect(() => {
    fetchLiveTables();
    fetchUserBets();
  }, []);

  // realtime subscription (user-specific)
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel("diamond-casino-bets")
        .on("postgres_changes", { event: "*", schema: "public", table: "diamond_casino_bets", filter: `user_id=eq.${user.id}` }, () => {
          fetchUserBets();
        })
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // Error handled silently
        }
      };
    };

    setupSubscription();
  }, []);

  // ----------------- Fetch stream URL -----------------
  const fetchStreamUrl = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-stream-url", tableId } });

      if (error) {
        setStreamUrls((prev) => ({ ...prev, [tableId]: null }));
        return null;
      }

      if (!data) {
        setStreamUrls((prev) => ({ ...prev, [tableId]: null }));
        return null;
      }

      // provider may return a code for restricted
      if (data.code === "RESTRICTED") {
        setStreamUrls((prev) => ({ ...prev, [tableId]: null }));
        setResults((prev) => ({ ...prev, [tableId]: { restricted: true } }));
        return null;
      }

      // extract possible candidates
      const candidate = data.streamUrl ?? data.data ?? data;
      const streamStr = extractStreamString(candidate);

      if (streamStr) {
        setStreamUrls((prev) => ({ ...prev, [tableId]: streamStr }));
        return streamStr;
      }

      // none found => mark null (frontend will show not available)
      setStreamUrls((prev) => ({ ...prev, [tableId]: null }));
      return null;
    } catch (e) {
      setStreamUrls((prev) => ({ ...prev, [tableId]: null }));
      return null;
    }
  };

  useEffect(() => {
    if (!selectedTable) return;
    const refreshStream = () => { fetchStreamUrl(selectedTable.id); };
    refreshStream();
    const handleVisibility = () => { if (!document.hidden) refreshStream(); };
    const handleFocus = () => { refreshStream(); };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [selectedTable?.id]);

  // ----------------- Process/settle bets -----------------
  const processBets = async (tableId: string, mid?: string | number) => {
    try {
      const requestBody: any = { action: "process-bets", tableId };
      
      // Pass mid if available for more accurate round-based settlement
      if (mid) {
        requestBody.mid = mid.toString();
      }
      
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { 
        body: requestBody
      });
      
      if (error) {
        toast({
          title: "Settlement Error",
          description: error.message || "Failed to process bets",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.success) {
        // Refresh user bets after processing
        fetchUserBets();
        
        // Show user feedback
        if (data.processed > 0) {
          toast({
            title: "Bets Settled",
            description: `Processed ${data.processed} bet(s). ${data.won || 0} won, ${data.lost || 0} lost.`,
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Settlement Failed",
          description: data?.error || "No result available for settlement",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Settlement Error",
        description: error.message || "Failed to process bets",
        variant: "destructive"
      });
    }
  };

  // ----------------- Fetch current result -----------------
  const fetchCurrentResult = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-result", tableId } });
      if (error) {
        return;
      }
      if (!data) return;

      if (data.code === "RESTRICTED") {
        setResults((prev) => ({ ...prev, [tableId]: { restricted: true } }));
        return;
      }

      const resData = data?.data?.data?.res || data?.data?.res || data?.res || [];
      const tableName = data?.data?.data?.res1?.cname || data?.data?.res1?.cname || "";
      if (Array.isArray(resData) && resData.length > 0) {
        const latestResult = resData[0] || null;
        const resultData = { tableName, latestResult, results: resData };
        
        // Get previous result to check if it's actually new
        const previousResult = results[tableId]?.latestResult;
        const isNewResult = !previousResult || 
          (latestResult && (
            previousResult.win !== latestResult.win ||
            previousResult.time !== latestResult.time ||
            previousResult.round !== latestResult.round
          ));
        
        setCurrentResult(resultData);
        setResults((prev) => ({ ...prev, [tableId]: resultData }));
        setResultHistory(resData);
        
        // Only process bets if:
        // 1. We have a valid result with a winning value
        // 2. It's actually a new result (not the same one we just processed)
        // 3. The result has a timestamp/round info to validate against bets
        // Only process bets if we have a valid new result
        if (isNewResult && latestResult && (latestResult.win || tableName || latestResult.mid)) {
          // Extract mid from latest result for accurate round-based settlement
          const resultMid = latestResult.mid || latestResult.round || latestResult.round_id;
          
          // Small delay to ensure result is fully available
          setTimeout(() => {
            processBets(tableId, resultMid);
          }, 1000);
        }
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // ----------------- Fetch result history -----------------
  const fetchResultHistory = async (tableId: string, date?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-result-history", tableId, date } });
      if (error) {
        return;
      }
      if (!data) return;
      if (data?.code === "RESTRICTED") {
        setResults((prev) => ({ ...prev, [tableId]: { restricted: true } }));
        return;
      }
      const historyData = Array.isArray(data?.data) ? data.data : data?.data?.data || [];
      if (historyData && historyData.length > 0) setResultHistory(historyData);
    } catch (error) {
      // Error handled silently
    }
  };

  // ----------------- Fetch all table IDs -----------------
  const fetchAllTableIds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-table-ids" } });
      if (error) throw error;
      if (data?.success) return data.data;
      return null;
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch table IDs", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Fetch casino rules -----------------
    const fetchCasinoRules = async (tableId: string) => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "diamond-casino-proxy",
          {
            body: {
              action: "get-casino-rules",
              tableId,
            },
          }
        );

        if (error) {
          return { rules: [], error: error.message };
        }

        if (!data || !data.success) {
          return { rules: [], error: data?.error || "Rules not available" };
        }

        // Provider usually returns { success, data }
        const rulesArray =
          data?.data?.data || data?.data || [];

        return { rules: rulesArray, error: null };
      } catch (err: any) {
        return { rules: [], error: err.message };
      }
    };


  return {
    liveTables,
    selectedTable,
    odds,
    bets,
    loading,
    streamUrls,
    results,
    resultHistory,
    currentResult,
    fetchLiveTables,
    fetchTableDetails,
    fetchOdds,
    placeBet,
    setSelectedTable,
    fetchStreamUrl,
    fetchCurrentResult,
    fetchResultHistory,
    fetchAllTableIds,
    processBets,
    fetchCasinoRules,
  };
};
