// src/components/casino/LiveStream.tsx  

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, ExternalLink, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LiveStreamProps {
  tableId: string;
  tableName?: string;
}

export const LiveStream = ({ tableId, tableName }: LiveStreamProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStreamUrl = async () => {
    if (!tableId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        {
          body: {
            action: "get-stream-url",
            tableId,
          },
        }
      );

      if (error) throw error;

      const url = data?.data?.tv_url || null;

      console.log("🎥 Stream URL:", url);

      setStreamUrl(url);
      setIframeError(false);
    } catch (err) {
      console.error("❌ Stream fetch failed:", err);
      setStreamUrl(null);
      setIframeError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamUrl();

    // token refresh every 2 min
    const interval = setInterval(fetchStreamUrl, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tableId]);

  const openExternal = () => {
    if (streamUrl) {
      window.open(streamUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-red-500" />
          LIVE – {tableName}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {!streamUrl || iframeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-4">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
              <div>
                <p className="text-white font-semibold">
                  Live stream restricted
                </p>
                <p className="text-white/60 text-sm">
                  Click below to watch stream in a new tab
                </p>
              </div>

              <Button
                onClick={openExternal}
                disabled={!streamUrl}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Watch Live Stream
              </Button>
            </div>
          ) : (
            <iframe
              key={streamUrl}
              src={streamUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              referrerPolicy="no-referrer"
              onError={() => setIframeError(true)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
