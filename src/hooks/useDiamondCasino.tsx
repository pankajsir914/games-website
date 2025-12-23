// src/hooks/useDiamondCasino.ts
import { useState, useEffect, useCallback } from "react";
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

// Cache for image map to avoid refetching on every load
let cachedImageMap: Map<string, string> | null = null;
let cachedImageList: string[] = [];
let imageCacheTimestamp: number = 0;
const IMAGE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
      
      if (dbError) {
        console.warn('⚠️ Error fetching cached tables:', dbError);
      }
      
      if (!dbError && cachedTables) {
        console.log(`📊 Found ${cachedTables.length} cached tables in database`);
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
                console.log(`✅ Added image from database for table ID: ${tableId}`);
              }
              if (tableName) {
                imageMap.set(tableName, tableData.imageUrl);
                imageMap.set(tableName.replace(/[^a-z0-9]/g, ''), tableData.imageUrl);
                imageMap.set(tableName.replace(/\s+/g, '-'), tableData.imageUrl);
                console.log(`✅ Added image from database for table name: ${tableName}`);
              }
            }
          }
        }
      } else {
        console.log('⚠️ No cached tables found in database');
      }
      
      // Also check game_assets table for live-casino images
      const { data: gameAssets, error: assetsError } = await supabase
        .from('game_assets')
        .select('*')
        .eq('game_type', 'live-casino')
        .eq('asset_type', 'cover_image')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (assetsError) {
        console.warn('⚠️ Error fetching game_assets:', assetsError);
      }
      
      if (!assetsError && gameAssets && gameAssets.length > 0) {
        console.log(`📦 Found ${gameAssets.length} images in game_assets table`);
        for (const asset of gameAssets) {
          imageList.push(asset.asset_url);
        }
      } else {
        console.log('⚠️ No images found in game_assets table');
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

  // ----------------- Helper: Update tables with images -----------------
  const updateTablesWithImages = (tables: any[], imageMap: Map<string, string>, imageList: string[]): DiamondTable[] => {
    return tables.map((table: any, index: number) => {
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
  };

  // ----------------- Helper: Match table to Supabase image -----------------
  const getSupabaseImageUrl = (table: any, imageMap: Map<string, string>): string | undefined => {
    if (!imageMap || imageMap.size === 0) {
      return undefined;
    }

    // Try matching by table ID (multiple variations)
    if (table.id) {
      const variations = [
        table.id.toLowerCase().replace(/[^a-z0-9]/g, ''), // alphanumeric only
        table.id.toLowerCase(), // original lowercase
        table.id.toLowerCase().replace(/[_-]/g, ''), // no dashes/underscores
        table.id.toLowerCase().replace(/[_-]/g, '-'), // dashes
        table.id.toLowerCase().replace(/[_-]/g, '_'), // underscores
      ];
      
      for (const key of variations) {
        if (imageMap.has(key)) {
          console.log(`✅ Matched image for table ${table.id} using key: ${key}`);
          return imageMap.get(key);
        }
      }
    }

    // Try matching by table name (multiple variations)
    if (table.name) {
      const variations = [
        table.name.toLowerCase().replace(/[^a-z0-9]/g, ''), // alphanumeric only
        table.name.toLowerCase(), // original lowercase
        table.name.toLowerCase().replace(/\s+/g, '-'), // spaces to dashes
        table.name.toLowerCase().replace(/\s+/g, '_'), // spaces to underscores
        table.name.toLowerCase().replace(/[_-]/g, ''), // no dashes/underscores
      ];
      
      for (const key of variations) {
        if (imageMap.has(key)) {
          console.log(`✅ Matched image for table ${table.name} using key: ${key}`);
          return imageMap.get(key);
        }
      }
    }

    // Try matching by type if available
    if (table.type) {
      const typeKey = table.type.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (imageMap.has(typeKey)) {
        console.log(`✅ Matched image for table type ${table.type} using key: ${typeKey}`);
        return imageMap.get(typeKey);
      }
    }
    
    return undefined;
  };

  // ----------------- Fetch live tables -----------------
  const fetchLiveTables = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we have cached images (within cache duration)
      const now = Date.now();
      let imageMap: Map<string, string>;
      let imageList: string[];
      
      if (cachedImageMap && (now - imageCacheTimestamp) < IMAGE_CACHE_DURATION) {
        // Use cached images
        imageMap = cachedImageMap;
        imageList = cachedImageList;
        console.log('✅ Using cached image map', { size: imageMap.size, listLength: imageList.length });
      } else {
        // Fetch images FIRST (blocking) to ensure images are available when tables load
        console.log('📸 Fetching images from database and storage...');
        try {
          const { imageMap: newImageMap, imageList: newImageList } = await fetchSupabaseImages();
          cachedImageMap = newImageMap;
          cachedImageList = newImageList;
          imageCacheTimestamp = now;
          imageMap = newImageMap;
          imageList = newImageList;
          console.log('✅ Images fetched successfully', { 
            mapSize: imageMap.size, 
            listLength: imageList.length,
            sampleKeys: Array.from(imageMap.keys()).slice(0, 5)
          });
        } catch (err) {
          console.warn('⚠️ Error fetching images:', err);
          // Use empty map if fetch fails
          imageMap = cachedImageMap || new Map();
          imageList = cachedImageList || [];
        }
      }
      
      // Fetch tables from API (don't wait for images)
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { body: { action: "get-tables" } });

      if (error) throw error;
      if (!data) throw new Error("No data received from casino API");
      if (!data.success) throw new Error(data.error || "Casino API request failed");

      if (data?.data?.tables && Array.isArray(data.data.tables) && data.data.tables.length > 0) {
        // Show tables immediately with available images (don't wait for full image load)
        const tablesWithImages = updateTablesWithImages(data.data.tables, imageMap, imageList);
        
        setLiveTables(tablesWithImages);
      } else {
        // fallback to cached tables in supabase
        const { data: cachedTables } = await supabase.from("diamond_casino_tables").select("*").eq("status", "active").order("last_updated", { ascending: false });
        if (cachedTables && cachedTables.length > 0) {
          const tables = cachedTables.map((ct: any) => ({
            id: ct.table_id,
            name: ct.table_name,
            status: ct.status,
            players: ct.player_count,
            data: ct.table_data,
            imageUrl: (ct.table_data as any)?.imageUrl,
          }));
          
          // Update with images if available
          const tablesWithImages = updateTablesWithImages(tables, imageMap, imageList);
          setLiveTables(tablesWithImages);
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
  }, [toast]);

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
  const fetchOdds = async (tableId: string, silent = false) => {
    try {
      if (!silent) {
        console.log(`📡 Fetching odds for table: ${tableId}`);
      }
      
      // Clear previous error state when retrying
      if (odds?.error || odds?.noOdds) {
        setOdds({ bets: [], rawData: {}, error: false, noOdds: false });
      }
      
      const { data: oddsResponse, error } = await supabase.functions.invoke("diamond-casino-proxy", { 
        body: { action: "get-odds", tableId } 
      });
      
      if (error) {
        if (!silent) {
          console.error("fetchOdds invoke error:", error);
        }
        setOdds({ bets: [], rawData: {}, error: true });
        return;
      }

      if (!oddsResponse) {
        if (!silent) {
          console.warn("No response from odds API");
        }
        setOdds({ bets: [], rawData: {}, noOdds: true });
        return;
      }

      let extractedBets: any[] = [];
      const payload = oddsResponse?.data || oddsResponse;

      // Check if we have bets directly
      if (payload?.bets && Array.isArray(payload.bets)) {
        if (!silent) {
          console.log(`📊 Found bets array with ${payload.bets.length} items`);
        }
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
              odds: backVal > 0 ? backVal : (layVal > 0 ? layVal : 0),
              back: backVal || 0,
              lay: layVal || 0,
              status: bet.status || 'active',
              min: bet.min || 100,
              max: bet.max || 100000,
              sid: bet.sid,
              mid: bet.mid,
            };
          });
        
        if (!silent && extractedBets.length === 0 && payload.bets.length > 0) {
          console.log(`⚠️ Bets array has ${payload.bets.length} items but none passed filter. Sample:`, payload.bets[0]);
        }
      }
      
      // If no bets extracted from bets array, try parsing from raw data
      if (extractedBets.length === 0 && payload?.raw) {
        if (!silent) {
          console.log(`📊 Trying to parse from raw data`);
        }
        const rawData = payload.raw;
        ["t1", "t2", "t3", "sub", "grp", "bets", "options", "markets"].forEach((key) => {
          if (rawData[key] && Array.isArray(rawData[key])) {
            if (!silent && rawData[key].length > 0) {
              console.log(`📊 Found ${rawData[key].length} items in ${key} array. Sample:`, rawData[key][0]);
            }
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
              } else if (!silent && index === 0) {
                // Log first item structure for debugging
                console.log(`⚠️ Item in ${key} excluded. Keys:`, Object.keys(item), 
                  'betType:', betType, 
                  'shouldShow:', shouldShow, 
                  'hasValidBetType:', hasValidBetType,
                  'visible:', item.visible,
                  'nat:', item.nat);
              }
            });
          }
        });
      }
      // If still no bets, try direct payload parsing
      if (extractedBets.length === 0) {
        if (!silent) {
          console.log(`📊 Trying direct payload parsing`);
        }
        const rawData = payload;
        ["t1", "t2", "t3", "sub", "grp", "bets", "options", "markets"].forEach((key) => {
          if (rawData[key] && Array.isArray(rawData[key])) {
            if (!silent && rawData[key].length > 0) {
              console.log(`📊 Found ${rawData[key].length} items in ${key} array. Sample:`, rawData[key][0]);
            }
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
              } else if (!silent && index === 0) {
                // Log first item structure for debugging
                console.log(`⚠️ Item in ${key} has no valid odds. Item keys:`, Object.keys(item), 'Item:', item, 'shouldShow:', shouldShow, 'hasValidBetType:', hasValidBetType);
              }
            });
          }
        });
      }

      if (extractedBets.length > 0) {
        if (!silent) {
          console.log(`✅ Successfully extracted ${extractedBets.length} betting options`);
        }
        
        // Log odds data for debugging
        console.log("🎲 useDiamondCasino - Odds Data Extracted:", {
          tableId,
          totalBets: extractedBets.length,
          bets: extractedBets,
          rawPayload: payload,
          sampleBet: extractedBets[0] || null
        });
        
        setOdds({ bets: extractedBets, rawData: payload || {}, error: false, noOdds: false });
      } else {
        if (!silent) {
          console.warn(`⚠️ No betting options extracted for table ${tableId}. Payload keys:`, Object.keys(payload || {}));
          if (payload?.bets && Array.isArray(payload.bets)) {
            console.warn(`📊 Bets array length: ${payload.bets.length}, Sample item:`, payload.bets[0]);
          }
          if (payload?.raw) {
            console.warn(`📊 Raw data keys:`, Object.keys(payload.raw));
          }
        }
        setOdds({ bets: [], rawData: payload || {}, noOdds: true, error: false });
      }
    } catch (error) {
      if (!silent) {
        console.error("Error fetching odds:", error);
      }
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

      console.log("Placing bet:", { tableId: betData.tableId, amount: betData.amount, betType: betData.betType });

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
          console.error("Edge function error response:", responseData);
          throw new Error(errorMsg);
        }

        if (!responseData?.success) {
          const errorMsg = responseData?.error || responseData?.message || "Bet rejected by casino API";
          console.error("Bet placement failed:", responseData);
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
        console.error("Fetch error:", fetchError);
        // If it's already an Error with a message, re-throw it
        if (fetchError instanceof Error) {
          throw fetchError;
        }
        // Otherwise create a new error
        throw new Error(fetchError?.message || "Failed to place bet");
      }
    } catch (error: any) {
      console.error("Error placing bet:", error);
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

  // ----------------- Process/settle bets -----------------
  const processBets = async (tableId: string, mid?: string | number) => {
    try {
      const requestBody: any = { action: "process-bets", tableId };
      
      // Pass mid if available for more accurate round-based settlement
      if (mid) {
        requestBody.mid = mid.toString();
        console.log(`📊 Processing bets with mid: ${mid}`);
      }
      
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", { 
        body: requestBody
      });
      
      if (error) {
        console.error("processBets invoke error:", error);
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
        
        console.log(`✅ Processed bets for ${tableId}:`, {
          processed: data.processed,
          won: data.won,
          lost: data.lost,
          totalPayouts: data.totalPayouts,
          winningValue: data.winningValue,
          resultSource: data.resultSource
        });
      } else {
        toast({
          title: "Settlement Failed",
          description: data?.error || "No result available for settlement",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error processing bets:", error);
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
        if (isNewResult && latestResult && (latestResult.win || tableName)) {
          console.log('🔄 New result detected, processing bets for table:', tableId);
          
          // Extract mid from latest result for accurate round-based settlement
          const resultMid = latestResult.mid || latestResult.round || latestResult.round_id;
          
          // Small delay to ensure result is fully available
          setTimeout(() => {
            processBets(tableId, resultMid);
          }, 1000);
        } else {
          console.log('⏸️ Skipping bet processing - no new valid result');
        }
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
    processBets,
  };
};
