import { Card, CardContent } from "@/components/ui/card";
import { LiveStream } from "@/components/live-casino/LiveStream";
import { LiveCasinoTableConfig } from "../types";

interface VideoPlayerProps {
  table: LiveCasinoTableConfig;
  currentRoundId?: string | number | null;
}

export const VideoPlayer = ({ table, currentRoundId }: VideoPlayerProps) => {
  if (!table.streamUrl) {
    // Fallback to existing streaming component which handles its own fetching + timers
    return (
      <LiveStream
        tableId={table.tableId}
        tableName={table.tableName}
        currentRoundId={currentRoundId || undefined}
      />
    );
  }

  return (
    <Card className="border border-white/10 bg-gradient-to-b from-neutral-900 to-black">
      <CardContent className="p-0 sm:p-4">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
          <iframe
            src={table.streamUrl}
            title={table.tableName}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ border: 0 }}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide shadow bg-emerald-600 text-white">
              LIVE STREAM
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/60 text-white/90 backdrop-blur-sm">
              {table.tableName}
            </span>
          </div>

          {currentRoundId && (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 shadow text-xs text-white/90">
              Round #{currentRoundId}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

