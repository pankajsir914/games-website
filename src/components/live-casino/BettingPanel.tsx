import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lock,
} from "lucide-react";

import { DolidanaBetting } from "@/pages/tables/DolidanaBetting";
import { TeenPattiBetting } from "@/pages/tables/TeenPattiBetting";
import { Ab3Betting } from "@/pages/tables/Ab3Betting";
import { BettingLayout } from "./config";
import { RouletteOddsGrid } from "./roulette/RouletteOddsGrid";

/* =====================================================
   GAME IDS
===================================================== */
const DOLIDANA_TABLE_IDS = ["dolidana"];
const TEEN_PATTI_TABLE_IDS = ["teen62"];
const AB3_TABLE_IDS = ["ab3"];

const getTableId = (table: any, odds: any) =>
  odds?.tableId ||
  table?.id ||
  table?.gmid ||
  table?.data?.gmid ||
  "";

/* =====================================================
   TYPES
===================================================== */
interface BettingPanelProps {
  table: any;
  odds: any;
  onPlaceBet: (betData: any) => Promise<void>;
  loading: boolean;
  layout?: BettingLayout;
  betStatus?: "OPEN" | "CLOSED";
  isBettingClosed?: boolean;
}

/* =====================================================
   COMPONENT
===================================================== */
export const BettingPanel = ({
  table,
  odds,
  onPlaceBet,
  loading,
  layout,
  betStatus = "OPEN",
  isBettingClosed: isBettingClosedProp,
}: BettingPanelProps) => {
  const [amount, setAmount] = useState<string>("100");
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [betType, setBetType] = useState<"back" | "lay">("back");

  const quickAmounts = [100, 500, 1000, 5000];
  const betTypes = odds?.bets || [];

  /* ---------------- TABLE IDENTIFICATION ---------------- */
  const tableId = String(getTableId(table, odds)).toLowerCase();
  const fallbackLayout: BettingLayout =
    (DOLIDANA_TABLE_IDS.includes(tableId) && "dolidana") ||
    (TEEN_PATTI_TABLE_IDS.includes(tableId) && "teen-patti") ||
    (AB3_TABLE_IDS.includes(tableId) && "ab3") ||
    "default";

  const layoutKey: BettingLayout = layout || fallbackLayout;
  const isDolidana = layoutKey === "dolidana";
  const isTeenPatti = layoutKey === "teen-patti";
  const isAb3 = layoutKey === "ab3" || layoutKey === "andar-bahar";

  /* ---------------- FLAGS ---------------- */
  const isRestricted = table?.status === "restricted";
  const isBettingClosed =
    typeof isBettingClosedProp === "boolean"
      ? isBettingClosedProp
      : betStatus !== "OPEN" || isRestricted;

  const hasRealOdds =
    betTypes.length > 0 &&
    betTypes.some((b: any) => {
      const back = b?.back ?? b?.odds ?? 0;
      const lay = b?.lay ?? 0;
      return back > 0 || lay > 0 || (b?.type && b.type.trim() !== "");
    });

  const isBetSuspended = (bet: any) => {
    if (!bet) return false;
    const status = String(bet.status ?? "").toLowerCase().trim();
    const statusNum = Number(bet.status);
    const suspendedFlag =
      bet.suspended === true ||
      bet.suspended === 1 ||
      statusNum === 0;
    return (
      suspendedFlag ||
      status === "suspended" ||
      status === "suspend" ||
      status === "s"
    );
  };

  /* =====================================================
     HELPERS
  ===================================================== */
  const formatOdds = (val: any) => {
    if (val === null || val === undefined || val === "") return "0.00";
    const num = Number(val);
    if (isNaN(num) || num === 0) return "0.00";
    if (num > 1000) return (num / 100000).toFixed(2);
    return num.toFixed(2);
  };

  const getSelectedBetOdds = () => {
    const bet = betTypes.find((b: any) => b.type === selectedBet);
    if (!bet) return 1;
    const raw =
      betType === "back"
        ? bet?.back ?? bet?.odds
        : bet?.lay ?? bet?.back ?? bet?.odds;
    const num = Number(raw);
    if (!num || isNaN(num)) return 1;
    return num > 1000 ? num / 100000 : num;
  };

  const handleSelectBet = (bet: any, side: "back" | "lay") => {
    if (!bet) return;
    setSelectedBet(bet.type);
    setBetType(side);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    const bet = betTypes.find((b: any) => b.type === selectedBet);

    await onPlaceBet({
      tableId: table.id,
      tableName: table.name,
      amount: parseFloat(amount),
      betType: selectedBet,
      odds: getSelectedBetOdds(),
      roundId: bet?.mid,
      sid: bet?.sid,
      side: betType,
    });

    setAmount("100");
    setSelectedBet("");
  };

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Place Your Bet
          {hasRealOdds && (
            <Badge variant="outline" className="text-green-500 border-green-500">
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {(isRestricted || isBettingClosed) && (
          <div className="flex gap-2 p-2 bg-red-500/10 rounded text-xs text-red-500 items-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Betting closed
          </div>
        )}

        {!isRestricted && hasRealOdds && (
          <>
            {isDolidana ? (
              <DolidanaBetting
                betTypes={betTypes}
                selectedBet={selectedBet}
                betType={betType}
                onSelect={handleSelectBet}
                formatOdds={formatOdds}
              />
            ) : isTeenPatti ? (
              <TeenPattiBetting
                betTypes={betTypes}
                selectedBet={selectedBet}
                betType={betType}
                onSelect={handleSelectBet}
                formatOdds={formatOdds}
              />
            ) : isAb3 ? (
              <Ab3Betting
                betTypes={betTypes}
                selectedBet={selectedBet}
                betType={betType}
                onSelect={handleSelectBet}
                formatOdds={formatOdds}
              />
            ) : layoutKey === "roulette" ? (
              <div className="relative">
                <RouletteOddsGrid
                  bets={betTypes}
                  selectedBet={selectedBet}
                  betType={betType}
                  onSelect={handleSelectBet}
                  formatOdds={formatOdds}
                  isBettingClosed={isBettingClosed}
                />
              </div>
            ) : (
              <div className="relative">
                {isBettingClosed && (
                  <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white gap-2 rounded-md">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-semibold">Betting closed</span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {betTypes.map((bet: any, idx: number) => {
                    const back = formatOdds(
                      bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds
                    );
                    const lay = formatOdds(bet?.lay ?? bet?.l1 ?? bet?.l);
                    const isSelected = bet.type === selectedBet;
                    return (
                      <div
                        key={`${bet?.type}-${idx}`}
                        className={`
                          border rounded-md p-1.5 space-y-1 transition-all
                          ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "hover:border-primary/40"
                          }
                          ${isBetSuspended(bet) ? "opacity-50" : ""}
                        `}
                      >
                        <div className="text-[11px] font-medium truncate text-center">
                          {bet.type}
                        </div>

                        <div className="grid grid-cols-2 gap-1">
                          <Button
                            size="sm"
                            className={`
                              h-7 text-[11px] px-1
                              ${
                                isSelected && betType === "back"
                                  ? "ring-2 ring-green-500 scale-[1.02]"
                                  : ""
                              }
                            `}
                            onClick={() => handleSelectBet(bet, "back")}
                            disabled={
                              isBettingClosed ||
                              isBetSuspended(bet) ||
                              back === "0.00"
                            }
                          >
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            {back}
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            className={`
                              h-7 text-[11px] px-1
                              ${
                                isSelected && betType === "lay"
                                  ? "ring-2 ring-red-500 scale-[1.02]"
                                  : ""
                              }
                            `}
                            onClick={() => handleSelectBet(bet, "lay")}
                            disabled={
                              isBettingClosed ||
                              isBetSuspended(bet) ||
                              lay === "0.00"
                            }
                          >
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                            {lay}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="space-y-2">
          <Label className="text-xs">Quick Amount</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                size="sm"
                variant={amount === String(amt) ? "default" : "outline"}
                onClick={() => setAmount(String(amt))}
              >
                ₹{amt}
              </Button>
            ))}
          </div>

          <Input
            type="number"
            value={amount}
            className="h-9"
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <Button
          className="w-full h-9"
          disabled={!selectedBet || loading || isRestricted || isBettingClosed}
          onClick={handlePlaceBet}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Placing...
            </>
          ) : (
            `${betType.toUpperCase()} ₹${amount}`
          )}
        </Button>

        {selectedBet && (
          <div className="text-xs text-center text-muted-foreground">
            {betType === "back" ? "Potential win" : "Liability"}: ₹
            {(parseFloat(amount) * (getSelectedBetOdds() - 1)).toFixed(2)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
