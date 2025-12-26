import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

import { DolidanaBetting } from "@/pages/tables/DolidanaBetting";
import { TeenPattiBetting } from "@/pages/tables/TeenPattiBetting";

/* =====================================================
   GAME IDS
===================================================== */

const DOLIDANA_TABLE_IDS = ["dolidana"];
const TEEN_PATTI_TABLE_IDS = ["teen62"];

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
}

/* =====================================================
   COMPONENT
===================================================== */

export const BettingPanel = ({
  table,
  odds,
  onPlaceBet,
  loading,
}: BettingPanelProps) => {
  /* ---------------- STATE ---------------- */
  const [amount, setAmount] = useState<string>("100");
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [betType, setBetType] = useState<"back" | "lay">("back");

  const quickAmounts = [100, 500, 1000, 5000];
  const betTypes = odds?.bets || [];

  /* ---------------- TABLE IDENTIFICATION ---------------- */
  const tableId = String(getTableId(table, odds)).toLowerCase();
  const isDolidana = DOLIDANA_TABLE_IDS.includes(tableId);
  const isTeenPatti = TEEN_PATTI_TABLE_IDS.includes(tableId);

  /* ---------------- FLAGS ---------------- */
  const isRestricted = table?.status === "restricted";

  const hasRealOdds =
    betTypes.length > 0 &&
    betTypes.some((b: any) => {
      const back = b?.back ?? b?.odds ?? 0;
      const lay = b?.lay ?? 0;
      return back > 0 || lay > 0 || (b?.type && b.type.trim() !== "");
    });

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
    if (!bet || bet.status === "suspended") return;
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex gap-2">
          Place Your Bet
          {hasRealOdds && (
            <Badge variant="outline" className="text-green-500 border-green-500">
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* RESTRICTED */}
        {isRestricted && (
          <div className="flex gap-2 p-2 bg-red-500/10 rounded text-xs text-red-500">
            <AlertCircle className="w-4 h-4" />
            Betting disabled
          </div>
        )}

        {/* ================= BETTING UI ================= */}
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
            ) : (
              /* ========= DEFAULT UI (ALL OTHER GAMES) ========= */
              <div className="grid grid-cols-4 gap-1">
                {betTypes.map((bet: any, idx: number) => {
                  const back = formatOdds(
                    bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds
                  );
                  const lay = formatOdds(bet?.lay ?? bet?.l1 ?? bet?.l);

                  return (
                    <div
                      key={`${bet?.type}-${idx}`}
                      className={`border rounded p-1 ${
                        bet.status === "suspended"
                          ? "opacity-60"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="text-[10px] text-center truncate">
                        {bet.type}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-5 w-full text-[10px]"
                          onClick={() => handleSelectBet(bet, "back")}
                          disabled={bet.status === "suspended" || back === "0.00"}
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {back}
                        </Button>

                        <Button
                          size="sm"
                          className="h-5 w-full text-[10px]"
                          onClick={() => handleSelectBet(bet, "lay")}
                          disabled={bet.status === "suspended" || lay === "0.00"}
                        >
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {lay}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= AMOUNT ================= */}
        <div>
          <Label className="text-xs">Quick Amount</Label>
          <div className="grid grid-cols-4 gap-1 mt-1">
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
        </div>

        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Button
          disabled={!selectedBet || loading || isRestricted}
          onClick={handlePlaceBet}
        >
          {loading ? "Placing..." : `${betType.toUpperCase()} ₹${amount}`}
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
