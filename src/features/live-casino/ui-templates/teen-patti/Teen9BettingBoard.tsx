import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Teen9BettingBoardProps {
  bets: any[];
  locked?: boolean;
  min?: number;
  max?: number;
  onPlaceBet: (betData: {
    betType: string;
    amount: number;
    odds: number;
    roundId?: string;
    sid?: string | number;
    side?: "back" | "lay";
  }) => Promise<void>;
  odds?: any;
  resultHistory?: Array<{
    mid: string | number;
    win: string;
    winnerId?: string;
  }>;
  onResultClick?: (result: any) => void;
}

const QUICK_CHIPS = [10, 50, 100, 500, 1000];

const BET_TYPES = [
  "Winner",
  "Pair",
  "Flush",
  "Straight",
  "Trio",
  "Straight Flush",
];

const ANIMALS = ["Tiger", "Lion", "Dragon"];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const isSuspended = (bet: any) =>
  !bet || bet?.gstatus === "SUSPENDED" || bet?.status === "suspended";

const findBet = (bets: any[], animal: string, betType: string) => {
  if (!bets || bets.length === 0) return null;
  
  const normalizedAnimal = animal.toLowerCase().trim();
  const normalizedBetType = betType.toLowerCase().trim();
  
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase().trim();
    return (
      betName.includes(normalizedAnimal) &&
      betName.includes(normalizedBetType)
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;

export const Teen9BettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: Teen9BettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

  const handleBetClick = (bet: any, animal: string, betType: string) => {
    if (!bet || isSuspended(bet)) return;
    setSelectedBetData({ ...bet, animal, betType });
    setSelectedBet(`${animal}-${betType}`);
    setModalOpen(true);
  };

  const handlePlace = async () => {
    if (!selectedBetData || !amount || parseFloat(amount) <= 0 || locked) return;
    
    const amt = parseFloat(amount);
    const oddsValue = Number(getBackOdds(selectedBetData));
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
    
    // Extract roundId
    const roundIdFromBet = selectedBetData?.mid || selectedBetData?.round_id || selectedBetData?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds = raw?.mid || raw?.round_id || raw?.round || raw?.gmid || raw?.game_id ||
                           odds?.mid || odds?.round_id || odds?.round || odds?.gmid || odds?.game_id;
    const roundIdFromFirstBet = bets.length > 0 && (bets[0]?.mid || bets[0]?.round_id || bets[0]?.round);
    const finalRoundId = roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;

    await onPlaceBet({
      betType: selectedBetData?.nat || selectedBetData?.type || `${selectedBetData?.animal} ${selectedBetData?.betType}`,
      amount: Math.min(Math.max(amt, min), max),
      odds: finalOdds,
      roundId: finalRoundId,
      sid: selectedBetData?.sid,
      side: "back",
    });
    
    setModalOpen(false);
    setSelectedBet("");
    setAmount(String(min));
    setSelectedBetData(null);
  };

  const last10 = resultHistory.slice(0, 10);

  return (
    <>
      <Card className="border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Teen9 Bets
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {QUICK_CHIPS.map((chip) => (
                <Button
                  key={chip}
                  size="sm"
                  variant="outline"
                  disabled={locked}
                  onClick={() =>
                    setAmount((prev) => {
                      const current = Number(prev) || 0;
                      const next = current + chip;
                      return String(next);
                    })
                  }
                  className="text-[10px] sm:text-xs px-2 sm:px-3"
                >
                  ₹{chip}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Betting Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs sm:text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-blue-400/30">
                  <th className="px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold bg-gray-200/50">
                    Bet Type
                  </th>
                  {ANIMALS.map((animal) => (
                    <th
                      key={animal}
                      className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-semibold text-white"
                    >
                      {animal}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BET_TYPES.map((betType) => (
                  <tr key={betType} className="border-b border-border/50">
                    {/* Bet Type Column */}
                    <td className="px-2 sm:px-3 py-2 sm:py-3 bg-gray-100/30 font-bold text-[10px] sm:text-xs">
                      {betType}
                    </td>

                    {/* Animal Columns */}
                    {ANIMALS.map((animal) => {
                      const bet = findBet(bets, animal, betType);
                      const disabled = locked || isSuspended(bet);
                      const backOdds = formatOdds(getBackOdds(bet));
                      const isDisabled = disabled || backOdds === "0.00";

                      return (
                        <td
                          key={animal}
                          className="px-2 sm:px-3 py-2 sm:py-3 bg-gray-700/50 text-center"
                        >
                          {isDisabled ? (
                            <div className="flex flex-col items-center justify-center gap-1">
                              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              {backOdds !== "0.00" && (
                                <span className="text-[9px] sm:text-[10px] text-gray-400 opacity-50">
                                  {backOdds}
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBetClick(bet, animal, betType)}
                              className="w-full px-2 sm:px-3 py-2 sm:py-3 rounded bg-blue-400 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold transition-all shadow-md hover:shadow-lg"
                            >
                              {backOdds}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount Input and Place Bet */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked}
                className="flex-1 sm:max-w-[160px]"
                placeholder="Enter amount"
              />
              <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                Min ₹{min} · Max ₹{max}
              </div>
            </div>
            <div className="text-xs sm:text-sm text-center sm:text-left">
              Total: <span className="font-semibold">₹{parseFloat(amount) || 0}</span>
            </div>
          </div>

          {/* Last 10 Results */}
          {last10.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs mb-2 text-muted-foreground">Last 10 Results</p>
              <div className="flex gap-1 flex-wrap">
                {last10.map((r, i) => {
                  const winner = r.win || "?";
                  const isTiger = winner.toLowerCase().includes("tiger");
                  const isLion = winner.toLowerCase().includes("lion");
                  const isDragon = winner.toLowerCase().includes("dragon");
                  
                  let bgColor = "bg-blue-500";
                  if (isTiger) bgColor = "bg-orange-500";
                  else if (isLion) bgColor = "bg-yellow-500";
                  else if (isDragon) bgColor = "bg-red-500";

                  return (
                    <Button
                      key={i}
                      size="sm"
                      variant="outline"
                      className={`w-9 h-9 p-0 font-bold text-white border ${bgColor}`}
                      onClick={() => onResultClick?.(r)}
                    >
                      {winner.charAt(0).toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bet Confirmation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Bet Type</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold">
                {selectedBetData?.animal} {selectedBetData?.betType}
              </div>
            </div>

            <div>
              <Label>Odds</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold">
                {formatOdds(getBackOdds(selectedBetData))}
              </div>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked}
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Potential Win</div>
              <div className="text-lg font-bold">
                ₹{(
                  (parseFloat(amount) || 0) *
                  (() => {
                    const oddsValue = Number(getBackOdds(selectedBetData));
                    return oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                  })()
                ).toFixed(2)}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={locked || !selectedBetData || parseFloat(amount) <= 0}
              onClick={handlePlace}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Place Bet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

