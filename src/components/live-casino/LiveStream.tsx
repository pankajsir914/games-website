import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Hls from "hls.js";

interface LiveStreamProps {
  tableId: string;
  tableName?: string;

  /** NEW */
  roundTimeLeft?: number; // seconds (lt)
}

export const LiveStream = ({
  tableId,
  tableName,
  roundTimeLeft = 0,
}: LiveStreamProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(roundTimeLeft);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // ================= STREAM URL =================
  const fetchStreamUrl = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );

      if (error) throw error;

      const url = data?.data?.data?.tv_url || null;
      setStreamUrl(url);
      setError(false);
    } catch (err) {
      console.error("Stream URL error:", err);
      setError(true);
      setStreamUrl(null);
    }
  };

  useEffect(() => {
    if (!tableId) return;

    fetchStreamUrl();
    const interval = setInterval(fetchStreamUrl, 60 * 1000);
    return () => clearInterval(interval);
  }, [tableId]);

  // ================= HLS ATTACH =================
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        liveDurationInfinity: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, () => {
        setError(true);
      });

      hlsRef.current = hls;
    } else {
      setError(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // ================= TIMER LOGIC (NEW) =================
  useEffect(() => {
    setSecondsLeft(roundTimeLeft);
  }, [roundTimeLeft]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [secondsLeft]);

  const openExternal = () => {
    if (streamUrl) window.open(streamUrl, "_blank");
  };

  const bettingClosed = secondsLeft <= 0;

  // ================= UI =================
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          LIVE – {tableName}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {error || !streamUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
              <p className="text-white">Stream unavailable</p>
              <Button onClick={openExternal} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Stream
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full"
                muted
                autoPlay
                playsInline
                controls={false}
              />

              {/* ===== LEFT BOTTOM MESSAGE ===== */}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs sm:text-sm px-3 py-1.5 rounded-md">
                {bettingClosed
                  ? "Betting closed. Waiting for next round…"
                  : "Place your bets now"}
              </div>

              {/* ===== RIGHT BOTTOM TIMER ===== */}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs sm:text-sm px-3 py-1.5 rounded-md font-mono">
                {bettingClosed
                  ? "Next round soon"
                  : `Time left: ${secondsLeft}s`}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
