import { Card, CardContent } from "@/components/ui/card";
import { LiveStream } from "@/components/live-casino/LiveStream";
import { LiveCasinoTableConfig } from "../types";

interface VideoPlayerProps {
  table: LiveCasinoTableConfig;
  currentRoundId?: string | number | null;
}

export const VideoPlayer = ({ table, currentRoundId }: VideoPlayerProps) => {
  // Always use LiveStream to avoid switching between iframe and stream fetcher (prevents reload flicker)
  if (!table.streamUrl) {
    return (
      <LiveStream
        tableId={table.tableId}
        tableName={table.tableName}
        currentRoundId={currentRoundId || undefined}
      />
    );
  }

  return (
    <LiveStream
      tableId={table.tableId}
      tableName={table.tableName}
      currentRoundId={currentRoundId || undefined}
    />
  );
};

