import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BetHistory } from "@/components/live-casino/BetHistory";
import { OddsDisplay } from "@/components/live-casino/OddsDisplay";
import { CurrentResult } from "@/components/live-casino/CurrentResult";
import { BetSlip } from "../../common/BetSlip";
import { VideoPlayer } from "../../common/VideoPlayer";
import { LiveCasinoTemplateProps } from "../../types";
import { deriveRoundMeta } from "../../common/roundUtils";

export const AndarBaharTemplate = ({
  table,
  odds,
  bets,
  loading,
  currentResult,
  resultHistory = [],
  onPlaceBet,
}: LiveCasinoTemplateProps) => {
  const variant =
    table.variant ||
    table.uiConfig?.variant ||
    table.uiConfig?.layoutVariant ||
    "classic";

  const limitsLabel =
    table.min !== undefined && table.max !== undefined
      ? `₹${table.min} - ₹${table.max}`
      : "Dynamic limits";

  const accentBar =
    variant === "vip"
      ? "bg-gradient-to-r from-fuchsia-500 to-amber-400"
      : variant === "speed"
        ? "bg-gradient-to-r from-sky-500 to-indigo-500"
        : "bg-gradient-to-r from-emerald-500 to-lime-500";

  const { remainingSeconds, status, roundId } = deriveRoundMeta({
    currentResult,
    odds,
    defaultStatus: "LIVE",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5">
      <div className="lg:col-span-2 space-y-3 md:space-y-5">
        <VideoPlayer
          table={table}
          currentRoundId={roundId}
        />

        <Card className="border border-white/10">
          <div className={`h-1 w-full ${accentBar}`} />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                {table.tableName} · Andar Bahar
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="uppercase">{variant}</span>
                <span className="text-white/60">•</span>
                <span>{table.provider || "Unknown provider"}</span>
                <span className="text-white/60">•</span>
                <span>{limitsLabel}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <OddsDisplay odds={odds} />
            <BetSlip
              table={table}
              odds={odds}
              loading={loading}
              onPlaceBet={onPlaceBet}
              resultHistory={resultHistory}
            />
          </CardContent>
        </Card>

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

