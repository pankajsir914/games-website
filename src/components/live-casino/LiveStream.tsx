import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LiveStreamProps {
  tableId: string;
  tableName?: string;
}

export const LiveStream = ({ tableId, tableName }: LiveStreamProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchStreamUrl = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );

      if (error) throw error;

      // ✅ tv_url is the real playable URL
      const url = data?.data?.tv_url || null;

      setStreamUrl(url);
      setError(!url);
    } catch (err) {
      console.error("Stream URL error:", err);
      setStreamUrl(null);
      setError(true);
    }
  };

  useEffect(() => {
    if (!tableId) return;

    fetchStreamUrl();

    const interval = setInterval(fetchStreamUrl, 120000);
    return () => clearInterval(interval);
  }, [tableId]);

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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-yellow-500" />
              <p className="text-white text-sm">
                Live stream unavailable
              </p>
            </div>
          ) : (
            <iframe
              key={streamUrl}
              src={streamUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
