// src/hooks/useDiamondCasino.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiamondTable {
  id: string;
  name: string;
  status: string;
  players: number;
  data: any;
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

  // ----------------- Helper: Fetch images from Supabase storage -----------------
  const fetchSupabaseImages = async (): Promise<{ imageMap: Map<string, string>, imageList: string[] }> => {
    const imageMap = new Map<string, string>();
    const imageList: string[] = [];
    
    try {
      // First, check if there are image URLs stored in diamond_casino_tables table
      const { data: cachedTables, error: dbError } = await supabase
        .from("diamond_casino_tables")
        .select("table_id, table_name, table_data")
        .eq("status", "active");
      
      if (!dbError && cachedTables) {
        for (const table of cachedTables) {
          const tableData = table.table_data as any;
          if (tableData?.imageUrl && typeof tableData.imageUrl === 'string') {
            // Check if it's a Supabase storage URL
            if (tableData.imageUrl.includes('supabase') || tableData.imageUrl.includes('storage')) {
              const tableId = table.table_id?.toLowerCase();
              const tableName = table.table_name?.toLowerCase();
              
              if (tableId) {
                imageMap.set(tableId, tableData.imageUrl);
                imageMap.set(tableId.replace(/[^a-z0-9]/g, ''), tableData.imageUrl);
              }
              if (tableName) {
                imageMap.set(tableName, tableData.imageUrl);
                imageMap.set(tableName.replace(/[^a-z0-9]/g, ''), tableData.imageUrl);
                imageMap.set(tableName.replace(/\s+/g, '-'), tableData.imageUrl);
              }
            }
          }
        }
      }
      
      // Also check game_assets table for live-casino images
      const { data: gameAssets, error: assetsError } = await supabase
        .from('game_assets')
        .select('*')
        .eq('game_type', 'live-casino')
        .eq('asset_type', 'cover_image')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (!assetsError && gameAssets && gameAssets.length > 0) {
        for (const asset of gameAssets) {
          imageList.push(asset.asset_url);
        }
      }
      
      // List all files in the casino-tables folder
      const { data: files, error } = await supabase.storage
        .from('game-assets')
        .list('casino-tables', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!error && files && files.length > 0) {
        // Create a map of table ID/name to image URL AND a list for sequential assignment
        for (const file of files) {
          if (file.name && (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png') || file.name.endsWith('.webp'))) {
            // Get public URL for the image
            const { data: { publicUrl } } = supabase.storage
              .from('game-assets')
              .getPublicUrl(`casino-tables/${file.name}`);

            // Add to list for sequential assignment
            imageList.push(publicUrl);

            // Extract potential table identifier from filename
            // Remove extension and use as key
            const key = file.name.replace(/\.(jpg|jpeg|png|webp)$/i, '').toLowerCase();
            
            // Only add if not already in map (database URLs take priority)
            if (!imageMap.has(key)) {
              imageMap.set(key, publicUrl);
            }

            // Also try matching with common variations
            const variations = [
              key.replace(/[_-]/g, ''),
              key.replace(/[_-]/g, '-'),
              key.replace(/[_-]/g, '_'),
            ];
            variations.forEach(variation => {
              if (variation !== key && !imageMap.has(variation)) {
                imageMap.set(variation, publicUrl);
              }
            });
          }
        }
      }
    } catch (error) {
      // Silent error handling
    }

    return { imageMap, imageList };
  };

  // ----------------- Helper: Match table to Supabase image -----------------
  const getSupabaseImageUrl = (table: any, imageMap: Map<string, string>): string | undefined => {
    if (!imageMap || imageMap.size === 0) {
      return undefined;
    }

    // Try matching by table ID
    if (table.id) {
      const idKey = table.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (imageMap.has(idKey)) {
        return imageMap.get(idKey);
      }

      // Try with original ID format
      const originalIdKey = table.id.toLowerCase();
      if (imageMap.has(originalIdKey)) {
        return imageMap.get(originalIdKey);
      }
    }

    // Try matching by table name
    if (table.name) {
      const nameKey = table.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (imageMap.has(nameKey)) {
        return imageMap.get(nameKey);
      }

      // Try with original name format
      const originalNameKey = table.name.toLowerCase().replace(/\s+/g, '-');
      if (imageMap.has(originalNameKey)) {
        return imageMap.get(originalNameKey);
      }
    }

    // Try matching by type if available
    if (table.type) {
      const typeKey = table.type.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (imageMap.has(typeKey)) {
        return imageMap.get(typeKey);
      }
    }
    
    return undefined;
  };

  // ----------------- Fetch live tables -----------------
  const fetchLiveTables = async () => {
    try {
      setLoading(true);
      
      // Fetch images from Supabase storage in parallel
      const imageMapPromise = fetchSupabaseImages();
      
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-tables" } });

      if (error) throw error;
      if (!data) throw new Error("No data received from casino API");
      if (!data.success) throw new Error(data.error || "Casino API request failed");

      // Wait for image map to be ready
      const { imageMap, imageList } = await imageMapPromise;

      if (data?.data?.tables && Array.isArray(data.data.tables) && data.data.tables.length > 0) {
        const tablesWithImages = data.data.tables.map((table: any, index: number) => {
          // First try to get image from Supabase storage (exact match)
          let supabaseImageUrl = getSupabaseImageUrl(table, imageMap);
          
          // If no exact match found, use sequential assignment from imageList
          if (!supabaseImageUrl && imageList.length > 0) {
            // Use modulo to cycle through images if there are fewer images than tables
            const imageIndex = index % imageList.length;
            supabaseImageUrl = imageList[imageIndex];
          }
          
          // If Supabase image found, use it; otherwise fall back to proxied image
          let imageUrl = supabaseImageUrl;
          
          if (!imageUrl) {
            // Fallback to proxied image
            let imgPath = "";
            if (table.imageUrl && typeof table.imageUrl === "string") {
              const parts = table.imageUrl.split("/");
              imgPath = parts[parts.length - 1];
            }
            imageUrl = imgPath
              ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/diamond-casino-proxy?image=${encodeURIComponent(imgPath)}`
              : undefined;
          }

          return {
            ...table,
            imageUrl,
          };
        });
        
        setLiveTables(tablesWithImages);
      } else {
        // fallback to cached tables in supabase
        const { data: cachedTables } = await supabase.from("diamond_casino_tables").select("*").eq("status", "active").order("last_updated", { ascending: false });
        if (cachedTables && cachedTables.length > 0) {
          const { imageMap: cachedImageMap, imageList: cachedImageList } = await imageMapPromise;
          const tables = cachedTables.map((ct: any, index: number) => {
            const table = {
              id: ct.table_id,
              name: ct.table_name,
              status: ct.status,
              players: ct.player_count,
              data: ct.table_data,
            };
            
            // Try to get image from Supabase storage (exact match)
            let supabaseImageUrl = getSupabaseImageUrl(table, cachedImageMap);
            
            // If no exact match, use sequential assignment
            if (!supabaseImageUrl && cachedImageList.length > 0) {
              const imageIndex = index % cachedImageList.length;
              supabaseImageUrl = cachedImageList[imageIndex];
            }
            
            const imageUrl = supabaseImageUrl || (ct.table_data as any)?.imageUrl;
            
            return {
              ...table,
              imageUrl,
            };
          });
          
          setLiveTables(tables);
        } else {
          setLiveTables([]);
        }
      }
    } catch (error: any) {
      console.error("❌ Error fetching live tables:", error);
      toast({ title: "Casino Connection Error", description: error?.message || "Failed to load live casino tables.", variant: "destructive" });
      setLiveTables([]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Fetch table details -----------------
  const fetchTableDetails = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-table", tableId } });
      if (error) throw error;
      if (data?.success && data?.data?.data) {
        setSelectedTable((prev) => (prev ? { ...prev, data: { ...prev.data, ...data.data.data } } : prev));
      }
    } catch (error) {
      console.error("Error fetching table details:", error);
    }
  };

  // ----------------- Fetch odds -----------------
  const fetchOdds = async (tableId: string) => {
    try {
      const { data: oddsResponse, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-odds", tableId } });
      if (error) {
        console.error("fetchOdds invoke error:", error);
        setOdds({ bets: [], rawData: {}, error: true });
        return;
      }

      let extractedBets: any[] = [];
      const payload = oddsResponse?.data || oddsResponse;

      if (payload?.bets && Array.isArray(payload.bets)) {
        extractedBets = payload.bets.map((bet: any) => ({
          type: bet.type,
          odds: bet.back > 0 ? bet.back : 1.98,
          back: bet.back,
          lay: bet.lay,
          status: bet.status,
          min: bet.min || 100,
          max: bet.max || 100000,
          sid: bet.sid,
          mid: bet.mid,
        }));
      } else {
        const rawData = payload?.raw || payload;
        ["t1", "t2", "t3", "sub"].forEach((key) => {
          if (rawData?.[key] && Array.isArray(rawData[key])) {
            rawData[key].forEach((item: any) => {
              if (item.nat || item.nation || item.name) {
                extractedBets.push({
                  type: item.nat || item.nation || item.name,
                  odds: parseFloat(item.b1 || item.b || item.rate || "1.98") || 1.98,
                  back: parseFloat(item.b1 || item.b || "0") || 0,
                  lay: parseFloat(item.l1 || item.l || "0") || 0,
                  status: item.gstatus === "0" ? "suspended" : "active",
                  min: item.min || 100,
                  max: item.max || 100000,
                  sid: item.sid,
                  mid: item.mid,
                });
              }
            });
          }
        });
      }

      if (extractedBets.length > 0) {
        setOdds({ bets: extractedBets, rawData: oddsResponse?.data || {} });
        return;
      }

      setOdds({ bets: [], rawData: {}, noOdds: true });
    } catch (error) {
      console.error("Error fetching odds:", error);
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

      // call edge function, pass token
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: { action: "place-bet", betData },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (!data) throw new Error("No response from bet API");
      if (!data?.success) {
        // provider may send descriptive message
        throw new Error(data?.message || data?.error || "Bet rejected by casino API");
      }

      // success: data.bet should be the inserted row (or null)
      toast({ title: "Bet Placed!", description: `You bet ₹${betData.amount} on ${betData.betType}` });
      fetchUserBets();
      return data.bet ?? data;
    } catch (error: any) {
      console.error("Error placing bet:", error);
      toast({ title: "Bet Failed", description: error.message || "Failed to place bet", variant: "destructive" });
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
      console.error("Error fetching bets:", error);
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
          console.warn("Error removing channel", e);
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
        console.error("fetchStreamUrl invoke error:", error);
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
      console.error("Error fetching stream URL:", e);
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

  // ----------------- Fetch current result -----------------
  const fetchCurrentResult = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-result", tableId } });
      if (error) {
        console.error("fetchCurrentResult invoke error:", error);
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
        const resultData = { tableName, latestResult: resData[0] || null, results: resData };
        setCurrentResult(resultData);
        setResults((prev) => ({ ...prev, [tableId]: resultData }));
        setResultHistory(resData);
      }
    } catch (error) {
      console.error("Error fetching result:", error);
    }
  };

  // ----------------- Fetch result history -----------------
  const fetchResultHistory = async (tableId: string, date?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-result-history", tableId, date } });
      if (error) {
        console.error("fetchResultHistory invoke error:", error);
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
      console.error("Error fetching result history:", error);
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
      console.error("Error fetching table IDs:", error);
      toast({ title: "Error", description: error.message || "Failed to fetch table IDs", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
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
  };
};
