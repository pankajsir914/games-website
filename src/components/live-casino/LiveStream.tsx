import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface LiveStreamProps {
  tableId: string;
  tableName?: string;
}

export const LiveStream = ({ tableId, tableName }: LiveStreamProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // ================= FETCH STREAM URL =================
  const fetchStreamUrl = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );

      if (error) throw error;

      const url =
        data?.streamUrl ||
        data?.data?.streamUrl ||
        null;

      if (!url || !url.startsWith("http")) {
        setError(true);
        setStreamUrl(null);
        return;
      }

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
  }, [tableId]);

  const openExternal = () => {
    if (streamUrl) window.open(streamUrl, "_blank");
  };

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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-4">
              <AlertCircle className="h-10 w-10 text-yellow-500" />
              <p className="text-white font-semibold">
                Stream unavailable
              </p>
              <p className="text-white/60 text-sm">
                Stream server blocked the request (403 / CORS).
              </p>
            </div>
          ) : (
            <>
              {/* ✅ ONLY CORRECT WAY FOR TURNKEY STREAM */}
              <iframe
                src={streamUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ border: 0 }}
              />

              {/* OPEN IN NEW TAB */}
              <Button
                onClick={openExternal}
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
