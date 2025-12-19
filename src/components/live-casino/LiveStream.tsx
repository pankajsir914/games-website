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
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Helper to extract stream URL from response
  const extractStreamUrl = (data: any): string | null => {
    if (!data) return null;

    // The proxy function returns { success: true, data, streamUrl }
    // So we check streamUrl first, then fallback to data paths
    const candidates = [
      data.streamUrl, // Direct streamUrl from proxy
      data.data?.url,
      data.data?.tv_url,
      data.data?.stream_url,
      data.url,
      data.tv_url,
      data.stream_url,
      data.data?.data?.url,
      data.data?.data?.tv_url,
      data.data?.data?.stream_url,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        // Check if it's a valid URL
        const trimmed = candidate.trim();
        if (/^https?:\/\//i.test(trimmed)) {
          return trimmed;
        }
        // Handle relative URLs starting with //
        if (/^\/\//.test(trimmed)) {
          return 'https:' + trimmed;
        }
      }
    }

    return null;
  };

  // Fetch fresh token from Supabase function
  const fetchStreamUrl = async () => {
    try {
      setLoading(true);
      setIframeError(false);
      
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );

      if (error) {
        console.error("Error fetching stream URL:", error);
        setStreamUrl(null);
        setIframeError(true);
        return;
      }

      // Check for restricted status
      if (data?.code === "RESTRICTED" || data?.restricted === true) {
        console.warn("Stream is restricted for this domain");
        setStreamUrl(null);
        setIframeError(true);
        return;
      }

      // Extract stream URL from response
      const url = extractStreamUrl(data);
      
      if (url) {
        setStreamUrl(url);
        setIframeError(false);
      } else {
        console.warn("No valid stream URL found in response:", data);
        setStreamUrl(null);
        setIframeError(true);
      }
    } catch (err) {
      console.error("Error fetching stream URL:", err);
      setStreamUrl(null);
      setIframeError(true);
    } finally {
      setLoading(false);
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

  const handleWatchExternal = async () => {
    // Try to fetch a fresh URL before opening
    try {
      setLoading(true);
      const { data: freshData, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );

      if (error) throw error;

      const freshUrl = extractStreamUrl(freshData);
      
      if (freshUrl) {
        window.open(freshUrl, "_blank", "noopener,noreferrer");
      } else {
        // Fallback to current streamUrl if available
        if (streamUrl) {
          window.open(streamUrl, "_blank", "noopener,noreferrer");
        } else {
          alert("Stream URL is not available. Please try again later.");
        }
      }
    } catch (err) {
      console.error("Error fetching stream URL for external view:", err);
      // Fallback to current streamUrl if available
      if (streamUrl) {
        window.open(streamUrl, "_blank", "noopener,noreferrer");
      } else {
        alert("Stream URL is not available. Please try again later.");
      }
    } finally {
      setLoading(false);
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
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white/60 text-sm">Loading stream...</p>
            </div>
          ) : iframeError || !streamUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
              <div>
                <p className="text-white font-medium mb-2">Stream Not Available</p>
                <p className="text-white/60 text-sm mb-4">
                  The stream may be restricted or unavailable. Click below to try watching externally.
                </p>
              </div>
              <Button onClick={handleWatchExternal} className="gap-2" disabled={loading}>
                <ExternalLink className="h-4 w-4" />
                Watch Live Stream
              </Button>
              <Button 
                onClick={fetchStreamUrl} 
                variant="outline" 
                className="gap-2 mt-2"
                disabled={loading}
              >
                <PlayCircle className="h-4 w-4" />
                Retry
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
              onError={() => {
                console.error("Iframe load error");
                setIframeError(true);
              }}
              onLoad={() => {
                setIframeError(false);
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
