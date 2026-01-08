import { useState } from "react";
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
import { Ab3Betting } from "@/features/live-casino/ui-templates/andar-bahar/Ab3Betting";
import { AbjBetting } from "@/features/live-casino/ui-templates/andar-bahar/AbjBetting";
import { Ab4Betting } from "@/features/live-casino/ui-templates/andar-bahar/Ab4Betting";
import { Ab20Betting } from "@/features/live-casino/ui-templates/andar-bahar/Ab20Betting";
import { Teen3BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen3BettingBoard";
import { Teen6BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen6BettingBoard";
import { Teen20BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen20BettingBoard";
import { Teen20BBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen20BBettingBoard";
import { Teen20CBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen20CBettingBoard";
import { Teen42BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen42BettingBoard";
import { Teen8BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen8BettingBoard";
import { TeenUniqueBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/TeenUniqueBettingBoard";
import { Teen9BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen9BettingBoard";
import { TeenBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/TeenBettingBoard";
import { Teen62BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen62BettingBoard";
import { Joker1BettingBoard } from "@/features/live-casino/ui-templates/joker/Joker1BettingBoard";
import { Joker20BettingBoard } from "@/features/live-casino/ui-templates/joker/Joker20BettingBoard";


/* =====================================================
   GAME IDS
===================================================== */

const DOLIDANA_TABLE_IDS = ["dolidana"];
const TEEN_PATTI_TABLE_IDS = ["teen62"];
const TEEN62_TABLE_IDS = ["teen62", "teen 62", "teen-62"];
const AB3_TABLE_IDS = ["ab3"];
const ABJ_TABLE_IDS = ["abj"];
const AB4_TABLE_IDS = ["ab4"];
const AB20_TABLE_IDS = ["ab20"];
const TEEN3_TABLE_IDS = ["teen3", "teen 3", "teen-3", "instant teen", "teen32", "teen 32", "teen-32", "teen33", "teen 33", "teen-33"];
const TEEN6_TABLE_IDS = ["teen6", "teen 6", "teen-6"];
const TEEN20_TABLE_IDS = ["teen20", "teen 20", "teen-20"];
const TEEN20B_TABLE_IDS = ["teen20b", "teen 20b", "teen-20b"];
const TEEN20C_TABLE_IDS = ["teen20c", "teen 20c", "teen-20c"];
const TEEN42_TABLE_IDS = ["teen42", "teen 42", "teen-42", "teen41", "teen 41", "teen-41"];
const TEEN8_TABLE_IDS = ["teen8", "teen 8", "teen-8"];
const TEEN_TABLE_IDS = ["teen"];
const TEEN9_TABLE_IDS = ["teen9", "teen 9", "teen-9"];
const TEENUNIQUE_TABLE_IDS = ["teenunique", "teen unique", "teen-unique"];
const JOKER1_TABLE_IDS = ["joker1", "joker 1", "joker-1"];
const JOKER20_TABLE_IDS = ["joker20", "joker 20", "joker-20"];



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
  resultHistory?: any[]; // Last 10 results for display
}

/* =====================================================
   COMPONENT
===================================================== */

export const BettingPanel = ({
  table,
  odds,
  onPlaceBet,
  loading,
  resultHistory = [],
}: BettingPanelProps) => {
  /* ---------------- STATE ---------------- */
  const [amount, setAmount] = useState<string>("100");
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [betType, setBetType] = useState<"back" | "lay">("back");

  const quickAmounts = [100, 500, 1000, 5000];
  const betTypes = odds?.bets || [];
const hasLayOdds = betTypes.some(
  (b: any) => b?.lay || b?.l1 || b?.l || b?.side === "lay"
);

  /* ---------------- TABLE IDENTIFICATION ---------------- */
  const tableId = String(getTableId(table, odds)).toLowerCase();
  const isDolidana = DOLIDANA_TABLE_IDS.includes(tableId);
  const isTeenPatti = TEEN_PATTI_TABLE_IDS.includes(tableId);
  const isAb3 = AB3_TABLE_IDS.includes(tableId);
  const isAbj = ABJ_TABLE_IDS.includes(tableId);
  const isAb4 = AB4_TABLE_IDS.includes(tableId);
  const isAb20 = AB20_TABLE_IDS.includes(tableId);
  const isTeen3 = TEEN3_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen6 = TEEN6_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen20 = TEEN20_TABLE_IDS.some(id => tableId.includes(id) && !tableId.includes("teen20c") && !tableId.includes("teen20v1") && !tableId.includes("teen20b"));
  const isTeen20B = TEEN20B_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen20C = TEEN20C_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen42 = TEEN42_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen8 = TEEN8_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen9 = TEEN9_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen62 = TEEN62_TABLE_IDS.some(id => tableId.includes(id));
  const isJoker1 = JOKER1_TABLE_IDS.some(id => tableId.includes(id));
  const isJoker20 = JOKER20_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen = TEEN_TABLE_IDS.some(id => tableId === id || tableId.includes(id)) && 
    !tableId.includes("teen3") && !tableId.includes("teen6") && !tableId.includes("teen8") && 
    !tableId.includes("teen9") && !tableId.includes("teen20") && !tableId.includes("teen42") &&
    !tableId.includes("teen62") && !tableId.includes("teen120") && !tableId.includes("teenunique");
  const isTeenUnique = TEENUNIQUE_TABLE_IDS.some(id => tableId.includes(id));
  /* ---------------- AB4 BET NORMALIZER (TEMPORARY FIX) ---------------- */
  // If AB4 API returns only 1 generic bet, normalize it to 26 card-wise bets
  let normalizedBetTypes = betTypes;
  if (isAb4 && betTypes.length === 1 && betTypes[0]?.nat?.includes("Card")) {
    const baseBet = betTypes[0];
    const baseOdds = baseBet.back || baseBet.b || baseBet.b1 || baseBet.odds || baseBet.l || 0;
    const baseSid = baseBet.sid || 1; 
    
    const CARD_ORDER = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    normalizedBetTypes = [];
    
    // Generate Andar bets (sid 1-13)
    CARD_ORDER.forEach((card, idx) => {
      normalizedBetTypes.push({
        ...baseBet,
        sid: baseSid + idx,
        nat: `Andar ${card}`,
        type: `Andar ${card}`,
        back: baseOdds,
        b: baseOdds,
        b1: baseOdds,
        odds: baseOdds,
        l: baseOdds,
      });
    });
    
    // Generate Bahar bets (sid 14-26)
    CARD_ORDER.forEach((card, idx) => {
      normalizedBetTypes.push({
        ...baseBet,
        sid: baseSid + 13 + idx,
        nat: `Bahar ${card}`,
        type: `Bahar ${card}`,
        back: baseOdds,
        b: baseOdds,
        b1: baseOdds,
        odds: baseOdds,
        l: baseOdds,
      });
    });
    
    console.log("🔄 [AB4 Normalizer] Generated 26 bets from 1 bet:", {
      original: baseBet.nat,
      generated: normalizedBetTypes.length,
      sample: normalizedBetTypes.slice(0, 3).map((b: any) => b.nat),
    });
  }

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
    
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Place Your Bet
          {hasRealOdds && (
            <Badge
              variant="outline"
              className="text-green-500 border-green-500"
            >
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* RESTRICTED */}
        {isRestricted && (
          <div className="flex gap-2 p-2 bg-red-500/10 rounded text-xs text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Betting disabled
          </div>
        )}

        {/* ================= BETTING UI ================= */}
        {!isRestricted && hasRealOdds && (
          <>
            {isTeen ? (
              <TeenBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen result", r)}
              />
            ) : isTeen9 ? (
              <Teen9BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen9 result", r)}
              />
            ) : isTeenUnique ? (
              <TeenUniqueBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
              />
            ) : isTeen8 ? (
              <Teen8BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen8 result", r)}
              />
            ) : isTeen42 ? (
              <Teen42BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen42 result", r)}
              />
            ) : isTeen20 ? (
              <Teen20BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen20 result", r)}
              />
            ) : isTeen20B ? (
              <Teen20BBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen20B result", r)}
              />
            ) : isTeen20C ? (
              <Teen20CBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen20C result", r)}
              />
            ) : isTeen6 ? (
              <Teen6BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen6 result", r)}
              />
            ) : isTeen3 ? (
              <Teen3BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen3 result", r)}
              />
            ) : isJoker1 ? (
              <Joker1BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Joker1 result", r)}
              />
            ) : isJoker20 ? (
              <Joker20BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Joker20 result", r)}
              />
            ) : isTeen62 ? (
              <Teen62BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen62 result", r)}
              />
            ) : isDolidana ? (
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
                resultHistory={resultHistory}
                amount={amount}
                onAmountChange={setAmount}
                onPlaceBet={handlePlaceBet}
                loading={loading}
              />
            ) : isAbj ? (
              <AbjBetting
                betTypes={betTypes}
                selectedBet={selectedBet}
                onSelect={(b) => setSelectedBet(b.type)}
                formatOdds={formatOdds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("ABJ result", r)}
                amount={amount}
                onAmountChange={setAmount}
                onPlaceBet={onPlaceBet}
                loading={loading}
                odds={odds}
              />
            ) : isAb4 ? (   
              <Ab4Betting
                betTypes={normalizedBetTypes}
                formatOdds={formatOdds}
                resultHistory={resultHistory}
                onPlaceBet={onPlaceBet}
                loading={loading}
              />
            ) : isAb20 ? (
              <Ab20Betting
                betTypes={betTypes}
                selectedBet={selectedBet}
                formatOdds={formatOdds}
                resultHistory={resultHistory}
                onPlaceBet={onPlaceBet}
                loading={loading}
              />
            ) : (
            
              /* ===== DEFAULT BET UI (IMPROVED SELECTION) ===== */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {betTypes.map((bet: any, idx: number) => {
                  const back = formatOdds(
                    bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds
                  );
                  const lay = hasLayOdds
                    ? formatOdds(bet?.lay ?? bet?.l1 ?? bet?.l)
                    : "0.00";

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
                        ${bet.status === "suspended" ? "opacity-50" : ""}
                      `}
                    >
                      <div className="text-[11px] font-medium truncate text-center">
                        {bet.type}
                      </div>

                      <div
                        className={`grid ${
                          hasLayOdds ? "grid-cols-2" : "grid-cols-1"
                        } gap-1`}
                      >
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
                            bet.status === "suspended" || back === "0.00"
                          }
                        >
                          {bet.status === "suspended" || back === "0.00" ? (
                            <Lock className="w-3 h-3 mr-0.5" />
                          ) : (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                          )}
                          Back {back}
                        </Button>

                        {hasLayOdds && (
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
                              bet.status === "suspended" || lay === "0.00"
                            }
                          >
                            {bet.status === "suspended" || lay === "0.00" ? (
                              <Lock className="w-3 h-3 mr-0.5" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-0.5" />
                            )}
                            Lay {lay}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= AMOUNT ================= */}
        {/* Only show amount/place bet controls for games that don't have their own betting UI */}
        {!isTeen && !isTeen3 && !isTeen6 && !isTeen20 && !isTeen20C && !isTeen42 && !isTeen8 && !isTeen9 && !isTeenUnique && (
          <>
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

            {/* ================= PLACE BET ================= */}
            <Button
              className="w-full h-9"
              disabled={!selectedBet || loading || isRestricted}
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

            {/* ================= CALC ================= */}
            {selectedBet && (
              <div className="text-xs text-center text-muted-foreground">
                {betType === "back" ? "Potential win" : "Liability"}: ₹
                {(parseFloat(amount) * (getSelectedBetOdds() - 1)).toFixed(2)}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
