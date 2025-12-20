// src/components/casino/LiveStream.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Timer, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  tableId: string;
  tableName?: string;
}
  
export const LiveStream = ({ tableId, tableName }: Props) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [bettingOpen, setBettingOpen] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  /** 🔁 Fetch round status from API (SYNC ONLY) */
  const syncFromServer = async () => {
    try {
      const { data } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        {
          body: { action: "get-odds", tableId },
        }
      );

      const raw = data?.data?.raw;
      const lt = Number(raw?.lt || 0);

      const isOpen =
        lt > 0 && raw?.sub?.some((s: any) => s.gstatus === "OPEN");

      setSecondsLeft(lt);
      setBettingOpen(isOpen);
    } catch (err) {
      console.error("Status sync failed", err);
    }
  };

  /** ⏱️ Local countdown (REAL TIMER) */
  const startLocalTimer = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setBettingOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!tableId) return;

    syncFromServer();
    startLocalTimer();

    // 🔄 resync every 10 sec
    const syncInterval = setInterval(syncFromServer, 10000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      clearInterval(syncInterval);
    };
  }, [tableId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="text-red-500" />
          LIVE – {tableName}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="relative aspect-video rounded-lg bg-gradient-to-br from-black via-neutral-900 to-black overflow-hidden">

          {/* STATUS BADGE */}
          <div className="absolute top-3 left-3 z-10">
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

          {/* LIVE PLACEHOLDER (REAL CASINO STYLE) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-6">
            <div className="relative">
              <span className="absolute -inset-2 rounded-full bg-red-500/20 animate-ping" />
              <PlayCircle className="relative w-16 h-16 text-red-500" />
            </div>

            <div>
              <p className="text-white font-semibold text-lg">
                Live Game in Progress
              </p>
            </div>

            {!bettingOpen && (
              <div className="flex items-center gap-2 text-yellow-400 text-xs">
                <AlertCircle className="w-4 h-4" />
                Waiting for next round
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
