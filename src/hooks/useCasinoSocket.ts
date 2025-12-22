import { useEffect, useRef, useState, useCallback } from "react";
import { getCasinoSocket } from "@/lib/socket";
     
/**
 * Casino Socket Hook
 * - Handles timer, odds, bet status, result
 * - Safe socket cleanup
 * - Smooth local timer countdown
 */
export const useCasinoSocket = (tableId?: string) => {
  /* ================= TIMER ================= */
  const [timer, setTimer] = useState(0);
  const timerRunningRef = useRef(false);

  // Smooth local countdown (UI purpose only)
  useEffect(() => {
    if (!timerRunningRef.current || timer <= 0) return;

    const intervalId = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timer]);

  /* ================= BET STATUS ================= */
  const [betStatus, setBetStatus] = useState<"OPEN" | "CLOSED">("CLOSED");

  /* ================= ODDS ================= */
  const [odds, setOdds] = useState<any>(null);

  /* ================= RESULT ================= */
  const [result, setResult] = useState<any>(null);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!tableId) return;

    const socket = getCasinoSocket();

    /* ---------- JOIN ROOM ---------- */
    socket.emit("join", { tableId });

    /* ---------- TIMER UPDATE ---------- */
    const onTimerUpdate = (payload: any) => {
      if (payload?.tableId !== tableId) return;

      const remaining = Number(payload?.remaining ?? 0);

      if (remaining > 0) {
        setTimer(remaining);
        timerRunningRef.current = true;
      } else {
        setTimer(0);
        timerRunningRef.current = false;
      }
    };

    /* ---------- BET STATUS ---------- */
    const onBetStatus = (payload: any) => {
      if (payload?.tableId !== tableId) return;
      setBetStatus(payload?.status === "OPEN" ? "OPEN" : "CLOSED");
    };

    /* ---------- ODDS UPDATE ---------- */
    const onOddsUpdate = (payload: any) => {
      if (payload?.tableId !== tableId) return;
      setOdds(payload?.data ?? null);
    };

    /* ---------- RESULT UPDATE ---------- */
    const onResultUpdate = (payload: any) => {
      if (payload?.tableId !== tableId) return;
      setResult(payload?.data ?? null);
    };

    /* ---------- REGISTER EVENTS ---------- */
    socket.on("timer:update", onTimerUpdate);
    socket.on("bet:status", onBetStatus);
    socket.on("odds:update", onOddsUpdate);
    socket.on("result:update", onResultUpdate);

    /* ---------- CLEANUP ---------- */
    return () => {
      socket.emit("leave", { tableId });

      socket.off("timer:update", onTimerUpdate);
      socket.off("bet:status", onBetStatus);
      socket.off("odds:update", onOddsUpdate);
      socket.off("result:update", onResultUpdate);
    };
  }, [tableId]);

  return {
    timer,
    betStatus,
    odds,
    result,
  };
};

/* =====================================================
   TIMER SOCKET (TIMER ONLY) - PROPER API POLLING
===================================================== */
export const useCasinoTimerSocket = (tableId?: string) => {
  const [timer, setTimer] = useState(0);
  const timerRunningRef = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const apiPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastApiValueRef = useRef<number>(0);

  // Clean up all intervals
  const cleanup = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (apiPollIntervalRef.current) {
      clearInterval(apiPollIntervalRef.current);
      apiPollIntervalRef.current = null;
    }
  }, []);

  // Local countdown - only runs when timer > 0 and API isn't updating
  useEffect(() => {
    cleanup();

    if (!timerRunningRef.current || timer <= 0) {
      return;
    }

    // Start smooth countdown
    countdownIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          timerRunningRef.current = false;
          return 0;
        }
        return next;
      });
    }, 1000);

    return cleanup;
  }, [timer, cleanup]);

  // Fetch timer from API
  const fetchTimerFromAPI = useCallback(async () => {
    if (!tableId) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: { action: "get-odds", tableId }
      });

      if (error) return;

      // Extract timer from response
      const oddsData = data?.data || data;
      const rawData = oddsData?.raw || oddsData;
      
      // Try multiple locations for timer
      let remaining = rawData?.remaining || rawData?.timeRemaining || rawData?.timer || 
                       rawData?.time_remaining || rawData?.time || 
                       rawData?.rtime || rawData?.r_time ||
                       oddsData?.remaining || oddsData?.timeRemaining || oddsData?.timer || 
                       oddsData?.time_remaining || oddsData?.time || 0;

      // If not found, check numeric fields
      if (!remaining && rawData && typeof rawData === 'object') {
        for (const key in rawData) {
          const value = rawData[key];
          if (typeof value === 'number' && value > 0 && value <= 60) {
            remaining = value;
            break;
          }
        }
      }

      const remainingSeconds = Number(remaining);
      
      // Only update if value is valid and different
      if (remainingSeconds > 0 && remainingSeconds <= 60) {
        // If timer increased (new round) or difference is significant, update
        if (remainingSeconds !== lastApiValueRef.current) {
          // Stop countdown before updating
          cleanup();
          
          setTimer(remainingSeconds);
          timerRunningRef.current = true;
          lastApiValueRef.current = remainingSeconds;
        }
      } else if (remainingSeconds === 0 && timer > 0) {
        // Timer ended
        cleanup();
        setTimer(0);
        timerRunningRef.current = false;
        lastApiValueRef.current = 0;
      }
    } catch (error) {
      // Silent error
    }
  }, [tableId, cleanup]);

  useEffect(() => {
    if (!tableId) return;

    const socket = getCasinoSocket();
    socket.emit("join", { tableId });

    const onTimerUpdate = (payload: any) => {
      if (payload?.tableId !== tableId) return;
      const remaining = Number(payload?.remaining ?? 0);
      
      if (remaining > 0) {
        cleanup();
        setTimer(remaining);
        timerRunningRef.current = true;
        lastApiValueRef.current = remaining;
      } else {
        cleanup();
        setTimer(0);
        timerRunningRef.current = false;
        lastApiValueRef.current = 0;
      }
    };

    socket.on("timer:update", onTimerUpdate);

    // Initial fetch
    fetchTimerFromAPI();

    // Poll API every 3 seconds (reduced frequency to avoid conflicts)
    apiPollIntervalRef.current = setInterval(fetchTimerFromAPI, 3000);

    return () => {
      cleanup();
      socket.emit("leave", { tableId });
      socket.off("timer:update", onTimerUpdate);
    };
  }, [tableId, fetchTimerFromAPI, cleanup]);

  return { timer };
};

/* =====================================================
   BET STATUS SOCKET (BET STATUS ONLY)
===================================================== */
export const useCasinoBetStatusSocket = (
  tableId?: string,
  setBetStatus?: (status: "OPEN" | "CLOSED") => void
) => {
  useEffect(() => {
    if (!tableId || !setBetStatus) return;

    const socket = getCasinoSocket();
    socket.emit("join", { tableId });

    const onBetStatus = (payload: any) => {
      if (payload?.tableId !== tableId) return;
      setBetStatus(payload?.status === "OPEN" ? "OPEN" : "CLOSED");
    };

    socket.on("bet:status", onBetStatus);

    return () => {
      socket.emit("leave", { tableId });
      socket.off("bet:status", onBetStatus);
    };
  }, [tableId, setBetStatus]);
};

/* =====================================================
   ODDS SOCKET (ODDS ONLY) - WITH API POLLING
===================================================== */
export const useCasinoOddsSocket = (
  tableId?: string,
  setOdds?: (odds: any) => void
) => {
  const apiPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format odds data (same logic as useDiamondCasino)
  const formatOddsData = useCallback((rawOdds: any) => {
    if (!rawOdds) return null;

    let extractedBets: any[] = [];
    const payload = rawOdds?.data || rawOdds;

    // Check if we have bets directly
    if (payload?.bets && Array.isArray(payload.bets)) {
      extractedBets = payload.bets
        .filter((bet: any) => {
          if (!bet) return false;
          const backVal = bet.back || bet.b1 || bet.b || bet.odds || 0;
          const layVal = bet.lay || bet.l1 || bet.l || 0;
          return (backVal > 0 || layVal > 0);
        })
        .map((bet: any) => {
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
    }

    // If no bets extracted, try parsing from raw data
    if (extractedBets.length === 0 && payload?.raw) {
      const rawData = payload.raw;
      ["t1", "t2", "t3", "sub", "grp", "bets", "options", "markets"].forEach((key) => {
        if (rawData[key] && Array.isArray(rawData[key])) {
          rawData[key].forEach((item: any) => {
            if (!item || typeof item !== 'object') return;
            
            const betType = item.nat || item.nation || item.name || item.type || item.label || 'Unknown';
            
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
            
            const rawBackVal = parseFloat(item.b1 || item.bs || item.b || item.back || item.odds || "0") || 0;
            const rawLayVal = parseFloat(item.l1 || item.ls || item.l || item.lay || "0") || 0;
            
            const backVal = convertToDecimal(rawBackVal);
            const layVal = convertToDecimal(rawLayVal);
            
            if (backVal > 0 || layVal > 0) {
              extractedBets.push({
                type: betType,
                odds: backVal > 0 ? backVal : layVal,
                back: backVal,
                lay: layVal,
                status: 'active',
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

    return extractedBets.length > 0 
      ? { bets: extractedBets, rawData: payload || {} }
      : null;
  }, []);

  // Fetch odds from API
  const fetchOddsFromAPI = useCallback(async () => {
    if (!tableId || !setOdds) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: { action: "get-odds", tableId }
      });

      if (error) return;

      // Format odds data properly
      const formatted = formatOddsData(data);
      if (formatted) {
        setOdds(formatted);
      }
    } catch (error) {
      // Silent error
    }
  }, [tableId, setOdds, formatOddsData]);

  useEffect(() => {
    if (!tableId || !setOdds) return;

    const socket = getCasinoSocket();
    socket.emit("join", { tableId });

    const onOddsUpdate = (payload: any) => {
      if (payload?.tableId !== tableId) return;
      setOdds(payload?.data ?? null);
    };

    socket.on("odds:update", onOddsUpdate);

    // Initial fetch
    fetchOddsFromAPI();

    // Poll API every 5 seconds for odds updates
    apiPollIntervalRef.current = setInterval(fetchOddsFromAPI, 5000);

    return () => {
      if (apiPollIntervalRef.current) {
        clearInterval(apiPollIntervalRef.current);
      }
      socket.emit("leave", { tableId });
      socket.off("odds:update", onOddsUpdate);
    };
  }, [tableId, setOdds, fetchOddsFromAPI]);
};

/* =====================================================
   RESULT SOCKET (RESULT ONLY) - WITH API POLLING
===================================================== */
export const useCasinoResultSocket = (
  tableId?: string,
  setResult?: (result: any) => void
) => {
  const apiPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch result from API
  const fetchResultFromAPI = useCallback(async () => {
    if (!tableId || !setResult) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: { action: "get-result", tableId }
      });

      if (error) {
        return;
      }

      // Format result data properly
      const resultData = data?.data || data;
      if (resultData) {
        const resData = resultData?.data?.res || resultData?.res || [];
        const tableName = resultData?.data?.data?.res1?.cname || resultData?.data?.res1?.cname || "";
        
        if (Array.isArray(resData) && resData.length > 0) {
          const latestResult = resData[0];
          const newResult = {
            tableName,
            latestResult,
            results: resData,
            _timestamp: Date.now() // Add timestamp to force update
          };
          // Always update to ensure UI refreshes
          setResult(newResult);
        }
      }
    } catch (error) {
      // Silent error
    }
  }, [tableId, setResult]);

  useEffect(() => {
    if (!tableId || !setResult) return;
    
    const socket = getCasinoSocket();
    
    // Socket connection handlers
    socket.on("connect", () => {
      socket.emit("join", { tableId });
    });

    socket.emit("join", { tableId });

    const onResultUpdate = (payload: any) => {
      if (payload?.tableId !== tableId) {
        return;
      }
      if (payload?.data) {
        setResult(payload.data);
      }
    };

    socket.on("result:update", onResultUpdate);

    // Initial fetch
    fetchResultFromAPI();

    // Poll API every 8 seconds for faster result updates
    apiPollIntervalRef.current = setInterval(() => {
      fetchResultFromAPI();
    }, 8000);

    return () => {
      if (apiPollIntervalRef.current) {
        clearInterval(apiPollIntervalRef.current);
      }
      socket.emit("leave", { tableId });
      socket.off("result:update", onResultUpdate);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, [tableId, setResult, fetchResultFromAPI]);
};

/* =====================================================
   TABLE LIST SOCKET (GLOBAL REFRESH)
===================================================== */
export const useCasinoTableSocket = (onRefresh: () => void) => {
  useEffect(() => {
    const socket = getCasinoSocket();

    const onTableUpdate = () => {
      onRefresh();
    };

    socket.on("table:update", onTableUpdate);

    return () => {
      socket.off("table:update", onTableUpdate);
    };
  }, [onRefresh]);
};
