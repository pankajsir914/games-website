// src/components/live-casino/LiveStream.tsx
   
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ExternalLink } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CircularTimer } from "./CircularTimer";

interface LiveStreamProps {
  tableId: string;
  tableName?: string;
}

type BetStatus = "OPEN" | "CLOSED";

export const LiveStream = ({ tableId, tableName }: LiveStreamProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [betStatus, setBetStatus] = useState<BetStatus>("CLOSED");
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const apiPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch timer from API
  const fetchTimerFromAPI = async () => {
    if (!tableId) return;
    
    try {
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
      
      // Update timer if value is valid
      if (remainingSeconds > 0 && remainingSeconds <= 60) {
        // Stop countdown before updating
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        
        setTimer(remainingSeconds);
        
        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setTimer((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              return 0;
            }
            return next;
          });
        }, 1000);
      } else if (remainingSeconds === 0 && timer > 0) {
        // Timer ended
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setTimer(0);
      }

      // Update bet status based on timer
      if (remainingSeconds > 0) {
        setBetStatus("OPEN");
      } else {
        setBetStatus("CLOSED");
      }
    } catch (error) {
      // Silent error
    }
  };

  /* ================= STREAM URL ================= */
  const fetchStreamUrl = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );

      if (error) throw error;

      const url = data?.streamUrl || data?.data?.streamUrl || null;
      if (!url || !url.startsWith("http")) {
        setError(true);
        setStreamUrl(null);
        return;
      }

      setStreamUrl(url);
      setError(false);
    } catch {
      setError(true);
      setStreamUrl(null);
    }
  };

  useEffect(() => {
    if (!tableId) return;
    fetchStreamUrl();

    // Initial timer fetch
    fetchTimerFromAPI();

    // Poll API every 3 seconds for timer updates
    apiPollIntervalRef.current = setInterval(fetchTimerFromAPI, 3000);

    return () => {
      if (apiPollIntervalRef.current) {
        clearInterval(apiPollIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [tableId]);

  const openExternal = () => {
    if (streamUrl) window.open(streamUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          LIVE – {tableName}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {error || !streamUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <AlertCircle className="h-10 w-10 text-yellow-500" />
              <p className="text-white">Stream unavailable</p>
            </div>
          ) : (
            <>
              <iframe
                src={streamUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ border: 0 }}
              />

              {/* <Button
                onClick={openExternal}
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button> */}
            </>
          )}

          {/* BET STATUS */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                betStatus === "OPEN"
                  ? "bg-green-600 text-white animate-pulse"
                  : "bg-red-600 text-white"
              }`}
            >
              BETTING {betStatus}
            </span>
          </div>

          {/* TIMER */}
          <div className="absolute bottom-3 right-3">
            <CircularTimer value={timer} max={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
