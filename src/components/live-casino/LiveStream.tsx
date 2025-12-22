import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CircularTimer } from "./CircularTimer";

interface LiveStreamProps {
  tableId: string;
  tableName?: string;
  currentRoundId?: string | number;
}

type BetStatus = "OPEN" | "CLOSED";

export const LiveStream = ({ tableId, currentRoundId }: LiveStreamProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [betStatus, setBetStatus] = useState<BetStatus>("CLOSED");
  const [timer, setTimer] = useState(0);
  const [roundId, setRoundId] = useState<string | number | null>(null);

  const apiPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= FETCH ODDS + TIMER ================= */
  const fetchOddsAndTimer = async () => {
    if (!tableId) return;

    try {
      const { data } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-odds", tableId } }
      );

      const oddsData = data?.data || data;
      const rawData = oddsData?.raw || oddsData;

      // Extract round ID from odds data (current active round)
      // Check multiple possible locations in the response
      const extractedRoundId = rawData?.mid || rawData?.round_id || rawData?.round || 
                               rawData?.gmid || rawData?.game_id ||
                               oddsData?.mid || oddsData?.round_id || oddsData?.round ||
                               oddsData?.gmid || oddsData?.game_id ||
                               null;
      
      // Always update if we found a round ID (this is the current active round)
      // Only update if the value actually changed to avoid unnecessary re-renders
      if (extractedRoundId) {
        // Compare as strings to handle number/string mismatches
        const currentRoundIdStr = String(roundId || '');
        const extractedRoundIdStr = String(extractedRoundId);
        if (currentRoundIdStr !== extractedRoundIdStr) {
          setRoundId(extractedRoundId);
        }
      }

      let remaining =
        rawData?.remaining ||
        rawData?.timeRemaining ||
        rawData?.timer ||
        rawData?.time ||
        rawData?.lt ||
        0;

      const remainingSeconds = Number(remaining);

      if (remainingSeconds > 0 && remainingSeconds <= 60) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }

        setTimer(remainingSeconds);

        countdownIntervalRef.current = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      const subs = rawData?.sub || oddsData?.sub || [];
      const hasOpenMarket = Array.isArray(subs)
        ? subs.some((s: any) => s?.gstatus === "OPEN")
        : false;

      setBetStatus(hasOpenMarket ? "OPEN" : "CLOSED");
    } catch {}
  };

  /* ================= STREAM URL ================= */
  const fetchStreamUrl = async () => {
    try {
      const { data } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );

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

  /* ================= EFFECT ================= */
  useEffect(() => {
    if (!tableId) return;

    fetchStreamUrl();
    fetchOddsAndTimer();

    apiPollIntervalRef.current = setInterval(fetchOddsAndTimer, 3000);

    return () => {
      if (apiPollIntervalRef.current) clearInterval(apiPollIntervalRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [tableId]);

  /* ================= UI ================= */
  return (
    <Card className="border border-white/10 bg-gradient-to-b from-neutral-900 to-black">
      <CardContent className="p-0 sm:p-4">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
          
          {/* STREAM / ERROR */}
          {error || !streamUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <AlertCircle className="h-10 w-10 text-yellow-400" />
              <p className="text-sm text-muted-foreground">
                Live stream unavailable
              </p>
            </div>
          ) : (
            <iframe
              src={streamUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ border: 0 }}
            />
          )}

          {/* DARK OVERLAY FOR READABILITY */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" />

          {/* BET STATUS */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide shadow ${
                betStatus === "OPEN"
                  ? "bg-green-600 text-white animate-pulse"
                  : "bg-red-600 text-white"
              }`}
            >
              BETTING {betStatus}
            </span>
            {(roundId || currentRoundId) && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/60 text-white/90 backdrop-blur-sm">
                Round #{roundId || currentRoundId}
              </span>
            )}
          </div>

          {/* TIMER */}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-md p-1 shadow">
            <CircularTimer value={timer} max={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
