import { BetHistory } from "@/components/live-casino/BetHistory";
import { CurrentResult } from "@/components/live-casino/CurrentResult";
import { BetSlip } from "../common/BetSlip";
import { VideoPlayer } from "../common/VideoPlayer";
import { LiveCasinoTemplateProps } from "../types";

export const FallbackTemplate = ({
  table,
  odds,
  bets,
  loading,
  currentResult,
  resultHistory,
  onPlaceBet,
}: LiveCasinoTemplateProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5">
      <div className="lg:col-span-2 space-y-3 md:space-y-5">
        <VideoPlayer
          table={table}
          currentRoundId={null}
        />

        <BetSlip
          table={table}
          odds={odds}
          loading={loading}
          onPlaceBet={onPlaceBet}
        />
      </div>

      <div className="lg:col-span-1 space-y-3 md:space-y-4">
        {currentResult && (
          <CurrentResult
            result={currentResult}
            tableName={table.tableName}
            tableId={table.tableId}
          />
        )}
        <BetHistory bets={bets} />
      </div>
    </div>
  );
};

