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

  // Fetch fresh token from Supabase function
  const fetchStreamUrl = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );
      if (error) throw error;
      const url = data?.data?.data?.tv_url || null;
      setStreamUrl(url);
      setIframeError(false); // reset iframe error on new URL
    } catch (err) {
      console.error("Error fetching stream URL:", err);
      setStreamUrl(null);
      setIframeError(true);
    }
  };

  // Fetch token on mount and tableId change
  useEffect(() => {
    if (!tableId) return;
    fetchStreamUrl();

    // Optional: auto-refresh token every 2 minutes for long streams
    const interval = setInterval(fetchStreamUrl, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tableId]);

  const handleWatchExternal = () => {
    if (streamUrl) {
      window.open(streamUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base sm:text-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            LIVE - {tableName}
          </div>
         
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {iframeError || !streamUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
              <div>
                <p className="text-white font-medium mb-2">Stream Restricted</p>
                <p className="text-white/60 text-sm mb-4">
                  Token expired or domain restriction. Click below to watch the stream.
                </p>
              </div>
              <Button onClick={handleWatchExternal} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Watch Live Stream
              </Button>
            </div>
          ) : (
            <iframe
              key={streamUrl} // reload iframe when token changes
              src={streamUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              title={`Live stream for ${tableName}`}
              onError={() => setIframeError(true)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
