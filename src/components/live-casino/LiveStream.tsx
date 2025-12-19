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
  const [iframeLoaded, setIframeLoaded] = useState(false);

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
      
      console.log(`[LiveStream] Fetching stream URL for tableId: ${tableId}`);
      
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );

      console.log(`[LiveStream] Response received:`, { data, error });

      if (error) {
        console.error("[LiveStream] Error fetching stream URL:", error);
        setStreamUrl(null);
        setIframeError(true);
        return;
      }

      // Check for restricted status
      if (data?.code === "RESTRICTED" || data?.restricted === true) {
        console.warn("[LiveStream] Stream is restricted for this domain");
        setStreamUrl(null);
        setIframeError(true);
        return;
      }

      // The proxy returns { success: true, data, streamUrl }
      // Check streamUrl first (extracted by proxy)
      let url: string | null = null;
      
      // Validate streamUrl from proxy response
      if (data?.streamUrl && typeof data.streamUrl === 'string') {
        url = data.streamUrl.trim();
        if (url.length === 0) url = null;
      }
      
      // If streamUrl not found or invalid, try extracting from data object
      if (!url) {
        url = extractStreamUrl(data);
      }
      
      console.log(`[LiveStream] Extracted URL:`, url);
      
      if (url && typeof url === 'string') {
        console.log(`[LiveStream] Setting stream URL:`, url);
        setStreamUrl(url);
        setIframeError(false);
        setIframeLoaded(false); // Reset loaded state when URL changes
      } else {
        console.warn("[LiveStream] No valid stream URL found in response. Full response:", JSON.stringify(data, null, 2));
        setStreamUrl(null);
        setIframeError(true);
      }
    } catch (err) {
      console.error("[LiveStream] Error fetching stream URL:", err);
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
            <>
              <iframe
                key={streamUrl} // reload iframe when token changes
                src={streamUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={`Live stream for ${tableName}`}
                loading="lazy"
                onLoad={() => {
                  console.log("[LiveStream] Iframe loaded successfully");
                  setIframeLoaded(true);
                  setIframeError(false);
                }}
              />
              {/* Debug info - visible in dev mode */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded max-w-xs break-all z-10">
                  <div className="font-bold mb-1">Stream Debug Info:</div>
                  <div className="break-all">Table ID: {tableId}</div>
                  <div className="break-all mt-1">URL: {typeof streamUrl === 'string' ? streamUrl.substring(0, 100) + '...' : String(streamUrl)}</div>
                  <div className="mt-1">Loaded: {iframeLoaded ? 'Yes' : 'No'}</div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
