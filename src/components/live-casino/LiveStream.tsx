import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CircularTimer } from "./CircularTimer";

interface LiveStreamProps {
  tableId: string;
  tableName?: string;
}
   
type BetStatus = "OPEN" | "CLOSED";

export const LiveStream = ({ tableId }: LiveStreamProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [betStatus, setBetStatus] = useState<BetStatus>("CLOSED");
  const [timer, setTimer] = useState(0);

  const apiPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= FETCH ODDS + TIMER ================= */
  const fetchOddsAndTimer = async () => {
    if (!tableId) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        {
          body: { action: "get-odds", tableId },
        }
      );

      if (error) return;

      const oddsData = data?.data || data;
      const rawData = oddsData?.raw || oddsData;

      /* ================= TIMER (UI ONLY) ================= */
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

      /* ================= BET STATUS (SOURCE OF TRUTH) ================= */
      const subs = rawData?.sub || oddsData?.sub || [];

      const hasOpenMarket = Array.isArray(subs)
        ? subs.some((s: any) => s?.gstatus === "OPEN")
        : false;

      setBetStatus(hasOpenMarket ? "OPEN" : "CLOSED");

    } catch {
      // silent fail
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

  /* ================= EFFECT ================= */
  useEffect(() => {
    if (!tableId) return;

    fetchStreamUrl();
    fetchOddsAndTimer();

    apiPollIntervalRef.current = setInterval(fetchOddsAndTimer, 3000);

    return () => {
      if (apiPollIntervalRef.current) {
        clearInterval(apiPollIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [tableId]);

  /* ================= UI ================= */
  return (
    <Card>
      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {error || !streamUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="h-10 w-10 text-yellow-500" />
              <p className="text-white text-sm">Stream unavailable</p>
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

          {/* TIMER (UI ONLY) */}
          <div className="absolute bottom-3 right-3">
            <CircularTimer value={timer} max={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
