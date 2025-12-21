// src/components/live-casino/LiveStream.tsx
   
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CircularTimer } from "./CircularTimer";
import {
  useCasinoTimerSocket,
  useCasinoBetStatusSocket,
} from "@/hooks/useCasinoSocket";

interface LiveStreamProps {
  tableId: string;
  tableName?: string;
}

type BetStatus = "OPEN" | "CLOSED";

export const LiveStream = ({ tableId, tableName }: LiveStreamProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [betStatus, setBetStatus] = useState<BetStatus>("CLOSED");

  // 🔴 LIVE SOCKET DATA
  const { timer } = useCasinoTimerSocket(tableId);
  useCasinoBetStatusSocket(tableId, setBetStatus);

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
