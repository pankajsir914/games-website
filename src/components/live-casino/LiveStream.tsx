// src/components/casino/LiveStream.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, ExternalLink, AlertCircle, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  tableId: string;
  tableName?: string;
}

export const LiveStream = ({ tableId, tableName }: Props) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // ✅ NEW (display only)
  const [bettingOpen, setBettingOpen] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!tableId) return;

    // 🎥 stream
    supabase.functions
      .invoke("diamond-casino-proxy", {
        body: { action: "get-stream-url", tableId },
      })
      .then(({ data }) => {
        setStreamUrl(data?.streamUrl || null);
      });

    // ⏱️ timer + betting status (display only)
    const fetchStatus = () => {
      supabase.functions
        .invoke("diamond-casino-proxy", {
          body: { action: "get-odds", tableId },
        })
        .then(({ data }) => {
          const raw = data?.data?.raw;
          const lt = Number(raw?.lt || 0);
          const open =
            lt > 0 &&
            raw?.sub?.some((s: any) => s.gstatus === "OPEN");

          setSecondsLeft(lt);
          setBettingOpen(open);
        });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);

    return () => clearInterval(interval);
  }, [tableId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <PlayCircle className="text-red-500" />
          LIVE – {tableName}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
          {/* 🔔 STATUS OVERLAY */}
          <div className="absolute top-2 left-2 z-10">
            {bettingOpen ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-600/90 text-white text-xs font-semibold shadow">
                <Timer className="w-4 h-4" />
                {secondsLeft}s • Betting Open
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-md bg-red-600/90 text-white text-xs font-semibold shadow">
                Betting Closed
              </div>
            )}
          </div>

          {!streamUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="text-yellow-500 h-10 w-10" />
              <Button disabled variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Stream Unavailable
              </Button>
            </div>
          ) : (
            <iframe
              src={streamUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
