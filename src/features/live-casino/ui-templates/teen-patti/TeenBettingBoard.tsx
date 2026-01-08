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

interface TeenBettingBoardProps {
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
    win: "Player A" | "Player B" | "A" | "B";
    winnerId?: string;
  }>;
  onResultClick?: (result: any) => void;
}

const QUICK_CHIPS = [10, 50, 100, 500, 1000];
const CARDS = [1, 2, 3, 4, 5, 6];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const isSuspended = (bet: any) =>
  !bet || bet?.gstatus === "SUSPENDED" || bet?.status === "suspended";

const findBet = (bets: any[], searchTerm: string) => {
  if (!bets || bets.length === 0) return null;
  
  const normalized = searchTerm.toLowerCase().trim();
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase().trim();
    return (
      betName === normalized ||
      betName.includes(normalized) ||
      betName.includes(`player ${normalized}`) ||
      betName.includes(`${normalized} player`) ||
      betName.includes(`card ${normalized}`) ||
      betName.includes(`${normalized} card`)
    );
  });
};

const findCardBet = (bets: any[], cardNum: number, betType: "odd" | "even") => {
  if (!bets || bets.length === 0) return null;
  
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase().trim();
    return (
      (betName.includes(`card ${cardNum}`) || betName.includes(`card${cardNum}`)) &&
      betName.includes(betType)
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

export const TeenBettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: TeenBettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

  // Find Player A and Player B bets
  const playerA = findBet(bets, "player a") || findBet(bets, "a");
  const playerB = findBet(bets, "player b") || findBet(bets, "b");

  // Find consecutive bets (if any)
  const consecutiveA = findBet(bets, "consecutive a") || findBet(bets, "con a");
  const consecutiveB = findBet(bets, "consecutive b") || findBet(bets, "con b");

  const handleBetClick = (bet: any, betName: string, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    setSelectedBetData({ ...bet, side });
    setSelectedBet(`${betName}-${side}`);
    setModalOpen(true);
  };

  const handlePlace = async () => {
    if (!selectedBetData || !amount || parseFloat(amount) <= 0 || locked) return;
    
    const amt = parseFloat(amount);
    const side = selectedBetData?.side || "back";
    const oddsValue = side === "back" 
      ? Number(getBackOdds(selectedBetData))
      : Number(getLayOdds(selectedBetData));
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
    
    // Extract roundId
    const roundIdFromBet = selectedBetData?.mid || selectedBetData?.round_id || selectedBetData?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds = raw?.mid || raw?.round_id || raw?.round || raw?.gmid || raw?.game_id ||
                           odds?.mid || odds?.round_id || odds?.round || odds?.gmid || odds?.game_id;
    const roundIdFromFirstBet = bets.length > 0 && (bets[0]?.mid || bets[0]?.round_id || bets[0]?.round);
    const finalRoundId = roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;

    await onPlaceBet({
      betType: selectedBetData?.nat || selectedBetData?.type || selectedBet.split("-")[0],
      amount: Math.min(Math.max(amt, min), max),
      odds: finalOdds,
      roundId: finalRoundId,
      sid: selectedBetData?.sid,
      side: side,
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
              Teen Bets
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
          {/* Player A and Player B Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { label: "Player A", mainBet: playerA, consecutiveBet: consecutiveA },
              { label: "Player B", mainBet: playerB, consecutiveBet: consecutiveB },
            ].map(({ label, mainBet, consecutiveBet }) => {
              const disabled = locked || isSuspended(mainBet);
              const backOdds = formatOdds(getBackOdds(mainBet));
              const layOdds = formatOdds(getLayOdds(mainBet));
              const backDisabled = disabled || backOdds === "0.00";
              const layDisabled = disabled || layOdds === "0.00";

              const consecutiveDisabled = locked || isSuspended(consecutiveBet);
              const consecutiveBackOdds = formatOdds(getBackOdds(consecutiveBet));
              const consecutiveLayOdds = formatOdds(getLayOdds(consecutiveBet));
              const consecutiveBackDisabled = consecutiveDisabled || consecutiveBackOdds === "0.00";
              const consecutiveLayDisabled = consecutiveDisabled || consecutiveLayOdds === "0.00";

              return (
                <div key={label} className="border rounded-lg overflow-hidden bg-muted/20">
                  {/* Header */}
                  <div className="bg-gray-200/50 text-gray-800 font-bold text-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm">
                    {label}
                  </div>

                  {/* Back/Lay Headers */}
                  <div className="grid grid-cols-2 gap-0">
                    <div className="bg-blue-400 text-white font-semibold text-center py-1 text-[10px] sm:text-xs">
                      Back
                    </div>
                    <div className="bg-pink-400 text-white font-semibold text-center py-1 text-[10px] sm:text-xs">
                      Lay
                    </div>
                  </div>

                  {/* Main Row */}
                  <div className="grid grid-cols-2 gap-0">
                    {/* Back Cell */}
                    <div className="bg-blue-400/20 p-1.5 sm:p-2">
                      {backDisabled ? (
                        <div className="flex items-center justify-center h-[40px] sm:h-[50px] bg-gray-700 text-gray-400 rounded">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBetClick(mainBet, `${label} Main`, "back")}
                          className="w-full h-[40px] sm:h-[50px] bg-blue-400 hover:bg-blue-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                        >
                          {backOdds === "0.00" ? "0" : backOdds}
                        </button>
                      )}
                    </div>

                    {/* Lay Cell */}
                    <div className="bg-pink-400/20 p-1.5 sm:p-2">
                      {layDisabled ? (
                        <div className="flex items-center justify-center h-[40px] sm:h-[50px] bg-gray-700 text-gray-400 rounded">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBetClick(mainBet, `${label} Main`, "lay")}
                          className="w-full h-[40px] sm:h-[50px] bg-pink-400 hover:bg-pink-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                        >
                          {layOdds === "0.00" ? "0" : layOdds}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Consecutive Row (if exists) */}
                  {consecutiveBet && (
                    <div className="grid grid-cols-2 gap-0 border-t border-border/30">
                      {/* Back Cell */}
                      <div className="bg-blue-400/20 p-1.5 sm:p-2">
                        {consecutiveBackDisabled ? (
                          <div className="flex items-center justify-center h-[40px] sm:h-[50px] bg-gray-700 text-gray-400 rounded">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBetClick(consecutiveBet, `${label} Consecutive`, "back")}
                            className="w-full h-[40px] sm:h-[50px] bg-blue-400 hover:bg-blue-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                          >
                            {consecutiveBackOdds === "0.00" ? "0" : consecutiveBackOdds}
                          </button>
                        )}
                      </div>

                      {/* Lay Cell */}
                      <div className="bg-pink-400/20 p-1.5 sm:p-2">
                        {consecutiveLayDisabled ? (
                          <div className="flex items-center justify-center h-[40px] sm:h-[50px] bg-gray-700 text-gray-400 rounded">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBetClick(consecutiveBet, `${label} Consecutive`, "lay")}
                            className="w-full h-[40px] sm:h-[50px] bg-pink-400 hover:bg-pink-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                          >
                            {consecutiveLayOdds === "0.00" ? "0" : consecutiveLayOdds}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Card Bets Section */}
          <div className="pt-2 border-t border-border/50">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-xs sm:text-sm border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-gray-200/50">
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-semibold">
                      Card
                    </th>
                    {CARDS.map((cardNum) => (
                      <th
                        key={cardNum}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-semibold"
                      >
                        Card {cardNum}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Odd Row */}
                  <tr>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-200/50 font-bold text-[10px] sm:text-xs">
                      Odd
                    </td>
                    {CARDS.map((cardNum) => {
                      const cardBet = findCardBet(bets, cardNum, "odd");
                      const disabled = locked || isSuspended(cardBet);
                      const backOdds = formatOdds(getBackOdds(cardBet));
                      const isDisabled = disabled || backOdds === "0.00";

                      return (
                        <td
                          key={`odd-${cardNum}`}
                          className="px-1 sm:px-2 py-1.5 sm:py-2 bg-blue-400/20 text-center"
                        >
                          {isDisabled ? (
                            <div className="flex items-center justify-center h-[35px] sm:h-[40px] bg-gray-700 rounded">
                              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBetClick(cardBet, `Card ${cardNum} Odd`, "back")}
                              className="w-full h-[35px] sm:h-[40px] bg-blue-400 hover:bg-blue-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-[10px] sm:text-xs"
                            >
                              {backOdds === "0.00" ? "0" : backOdds}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Even Row */}
                  <tr>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-200/50 font-bold text-[10px] sm:text-xs">
                      Even
                    </td>
                    {CARDS.map((cardNum) => {
                      const cardBet = findCardBet(bets, cardNum, "even");
                      const disabled = locked || isSuspended(cardBet);
                      const backOdds = formatOdds(getBackOdds(cardBet));
                      const isDisabled = disabled || backOdds === "0.00";

                      return (
                        <td
                          key={`even-${cardNum}`}
                          className="px-1 sm:px-2 py-1.5 sm:py-2 bg-blue-400/20 text-center"
                        >
                          {isDisabled ? (
                            <div className="flex items-center justify-center h-[35px] sm:h-[40px] bg-gray-700 rounded">
                              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBetClick(cardBet, `Card ${cardNum} Even`, "back")}
                              className="w-full h-[35px] sm:h-[40px] bg-blue-400 hover:bg-blue-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-[10px] sm:text-xs"
                            >
                              {backOdds === "0.00" ? "0" : backOdds}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
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
                  const winner = r.win === "Player A" || r.win === "A" ? "A" : "B";
                  const isPlayerA = winner === "A";
                  return (
                    <Button
                      key={i}
                      size="sm"
                      variant="outline"
                      className={`w-9 h-9 p-0 font-bold ${
                        isPlayerA
                          ? "bg-blue-500 text-white border-blue-600"
                          : "bg-red-500 text-white border-red-600"
                      }`}
                      onClick={() => onResultClick?.(r)}
                    >
                      {winner}
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
                {selectedBetData?.nat || selectedBetData?.type || selectedBet.split("-")[0]}
              </div>
            </div>

            <div>
              <Label>Side</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold uppercase">
                {selectedBetData?.side || "back"}
              </div>
            </div>

            <div>
              <Label>Odds</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold">
                {selectedBetData?.side === "lay"
                  ? formatOdds(getLayOdds(selectedBetData))
                  : formatOdds(getBackOdds(selectedBetData))}
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
                    const side = selectedBetData?.side || "back";
                    const oddsValue = side === "back"
                      ? Number(getBackOdds(selectedBetData))
                      : Number(getLayOdds(selectedBetData));
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

