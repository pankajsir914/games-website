import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lock,
} from "lucide-react";

import { DolidanaBetting } from "@/pages/tables/DolidanaBetting";
import { Ab3Betting } from "@/features/live-casino/ui-templates/andar-bahar/Ab3Betting";
import { AbjBetting } from "@/features/live-casino/ui-templates/andar-bahar/AbjBetting";
import { Ab4Betting } from "@/features/live-casino/ui-templates/andar-bahar/Ab4Betting";
import { Ab20Betting } from "@/features/live-casino/ui-templates/andar-bahar/Ab20Betting";
import { Teen62Betting } from "@/features/live-casino/ui-templates/teen-patti/Teen62Betting";
import { MogamboBetting } from "@/features/live-casino/ui-templates/teen-patti/MogamboBetting";
import { Dt6Betting } from "@/features/live-casino/ui-templates/dragon-tiger/Dt6Betting";
import { Dtl20Betting } from "@/features/live-casino/ui-templates/dragon-tiger/Dtl20Betting";
import { Dt202Betting } from "@/features/live-casino/ui-templates/dragon-tiger/Dt202Betting";
import { Dt20Betting } from "@/features/live-casino/ui-templates/dragon-tiger/Dt20Betting";
import { PokerBettingBoard } from "@/features/live-casino/ui-templates/poker/PokerBetting";
import { Poker6BettingBoard } from "@/features/live-casino/ui-templates/poker/Poker6Betting";
import { Poker20BettingBoard } from "@/features/live-casino/ui-templates/poker/Poker20Betting";


/* =====================================================
   GAME IDS
===================================================== */

const DOLIDANA_TABLE_IDS = ["dolidana"];
const AB3_TABLE_IDS = ["ab3"];
const ABJ_TABLE_IDS = ["abj"];
const AB4_TABLE_IDS = ["ab4"];
const AB20_TABLE_IDS = ["ab20"];
const TEEN62_TABLE_IDS = ["teen62"]; 
const MOGAMBO_TABLE_IDS = ["mogambo"];
const DT6_TABLE_IDS = ["dt6"];
const DTL20_TABLE_IDS = ["dtl20"];
const DT202_TABLE_IDS = ["dt202"];
const DT20_TABLE_IDS = ["dt20"];



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

  const betTypes = odds?.bets || [];
const hasLayOdds = betTypes.some(
  (b: any) => b?.lay || b?.l1 || b?.l || b?.side === "lay"
);

  /* ---------------- TABLE IDENTIFICATION ---------------- */
  const tableId = String(getTableId(table, odds)).toLowerCase();
  const isDolidana = DOLIDANA_TABLE_IDS.includes(tableId);
  const isAb3 = AB3_TABLE_IDS.includes(tableId);
  const isAbj = ABJ_TABLE_IDS.includes(tableId);
  const isAb4 = AB4_TABLE_IDS.includes(tableId);
  const isAb20 = AB20_TABLE_IDS.includes(tableId);
  const isTeen62 = TEEN62_TABLE_IDS.includes(tableId);
  const isMogambo = MOGAMBO_TABLE_IDS.includes(tableId);
  const isDt6 = DT6_TABLE_IDS.includes(tableId);
  const isDt202 = DT202_TABLE_IDS.includes(tableId);
  const isDt20 = DT20_TABLE_IDS.includes(tableId);
  // DTL20 matching - flexible to catch variations
  const isDtl20 = DTL20_TABLE_IDS.includes(tableId) || 
                  tableId.includes("dtl20") || 
                  // tableId.includes("dt20") ||
                  tableId === "dtl20";
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
    // Try to find bet by type first
    let bet = betTypes.find((b: any) => b.type === selectedBet);
    
    // If not found, try to find by nat (for Teen62Betting)
    if (!bet && selectedBet) {
      if (selectedBet === "Player A" || selectedBet === "Player B") {
        bet = betTypes.find((b: any) => 
          (b.nat || "").toLowerCase() === selectedBet.toLowerCase()
        );
      } else if (selectedBet.startsWith("Consecutive")) {
        const player = selectedBet.includes("A") ? "Player A" : "Player B";
        bet = betTypes.find((b: any) => 
          b.subtype === "con" && (b.nat || "").toLowerCase() === player.toLowerCase()
        );
      } else if (selectedBet.startsWith("Card")) {
        // Extract card number from "Card X Odd" or "Card X Even"
        const match = selectedBet.match(/Card (\d+)/);
        if (match) {
          const cardNo = parseInt(match[1]);
          bet = betTypes.find((b: any) => b.nat === `Card ${cardNo}`);
          if (bet && bet.odds) {
            const type = selectedBet.includes("Odd") ? "Odd" : "Even";
            const oddsObj = bet.odds.find((x: any) => x.nat === type);
            if (oddsObj) {
              const raw = oddsObj.b;
              const num = Number(raw);
              if (!num || isNaN(num)) return 1;
              return num > 1000 ? num / 100000 : num;
            }
          }
        }
      }
    }

    if (!bet) return 1;

    const raw =
      betType === "back"
        ? bet?.back ?? bet?.b ?? bet?.odds
        : bet?.lay ?? bet?.l ?? bet?.back ?? bet?.b ?? bet?.odds;

    const num = Number(raw);
    if (!num || isNaN(num)) return 1;
    return num > 1000 ? num / 100000 : num;
  };

  const handleSelectBet = (bet: any, side: "back" | "lay") => {
    if (!bet || bet.status === "suspended" || bet.gstatus === "SUSPENDED") return;
    
    // Use bet.type if available, otherwise construct from bet data
    const betTypeLabel = bet.type || bet.nat || "";
    if (!betTypeLabel) return;
    
    setSelectedBet(betTypeLabel);
    setBetType(side);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    // Find bet - handle Card bets specially
    let bet = betTypes.find((b: any) => b.type === selectedBet);
    
    // If not found, try to find by nat (for Teen62Betting)
    if (!bet && selectedBet) {
      if (selectedBet === "Player A" || selectedBet === "Player B") {
        bet = betTypes.find((b: any) => 
          (b.nat || "").toLowerCase() === selectedBet.toLowerCase()
        );
      } else if (selectedBet.startsWith("Consecutive")) {
        const player = selectedBet.includes("A") ? "Player A" : "Player B";
        bet = betTypes.find((b: any) => 
          b.subtype === "con" && (b.nat || "").toLowerCase() === player.toLowerCase()
        );
      } else if (selectedBet.startsWith("Card")) {
        // Extract card number from "Card X Odd" or "Card X Even"
        const match = selectedBet.match(/Card (\d+)/);
        if (match) {
          const cardNo = parseInt(match[1]);
          bet = betTypes.find((b: any) => (b.nat || b.type) === `Card ${cardNo}`);
        }
      }
    }

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
        {!isRestricted && (hasRealOdds || isDtl20) && (
          <>
            {isDolidana ? (
              <DolidanaBetting
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
            ) : isTeen62 ? (
              <Teen62Betting
                betTypes={betTypes}
                selectedBet={selectedBet}
                betType={betType}
                onSelect={handleSelectBet}
                formatOdds={formatOdds}
                table={table}
                onPlaceBet={onPlaceBet}
                loading={loading}
              />
            ) : isMogambo ? (
              <MogamboBetting
                betTypes={betTypes}
                onPlaceBet={onPlaceBet}
                loading={loading}
                table={table}
                formatOdds={formatOdds}
                odds={odds}
              />
            ) : isDt6 ? (
              <Dt6Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Dt6Betting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
              />
            ) : isDtl20 ? (
              <Dtl20Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Dtl20Betting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
                formatOdds={formatOdds}
              />
            ) : isDt202 ? (
              <Dt202Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Dt202Betting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
              />
            ) : isDt20 ? (
              <Dt20Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Dt20Betting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
              />
            ): (
            
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
                            h-7 text-[11px] px-1 text-white font-medium
                            ${
                              isSelected && betType === "back"
                                ? "ring-2 ring-green-500 scale-[1.02] bg-green-600 hover:bg-green-700"
                                : "bg-green-600 hover:bg-green-700"
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
                            className={`
                              h-7 text-[11px] px-1 text-white font-medium
                              ${
                                isSelected && betType === "lay"
                                  ? "ring-2 ring-red-500 scale-[1.02] bg-red-600 hover:bg-red-700"
                                  : "bg-red-600 hover:bg-red-700"
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

        {/* ================= CALC ================= */}
        {!isAbj && selectedBet && (
          <div className="text-xs text-center text-muted-foreground">
            {betType === "back" ? "Potential win" : "Liability"}: ₹
            {(parseFloat(amount) * (getSelectedBetOdds() - 1)).toFixed(2)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
