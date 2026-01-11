// src/features/live-casino/ui-templates/others/WarBetting.tsx

import { Lock, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";

/* ================= TYPES ================= */

interface WarBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
  resultHistory?: any[];
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => {
  if (!b) return true;
  if (b.gstatus === "SUSPENDED") return true;
  if (b.gstatus && b.gstatus !== "OPEN") return true;
  return false;
};

// Get odds from multiple possible fields
const getOdds = (bet: any, side: "back" | "lay" = "back") => {
  if (!bet) return 0;
  if (side === "lay") {
    return bet.lay ?? bet.l ?? 0;
  }
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? 0;
};

// Format odds value
const formatOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* ================= COMPONENT ================= */

export const WarBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
  resultHistory = [],
}: WarBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  // Extract bets from API structure (odds.data.sub)
  const actualBetTypes = useMemo(() => {
    // Priority 1: Check odds.data.sub (API structure)
    if (odds?.data?.sub && Array.isArray(odds.data.sub) && odds.data.sub.length > 0) {
      return odds.data.sub;
    }
    
    // Priority 2: Check betTypes if it's already an array
    if (Array.isArray(betTypes) && betTypes.length > 0) {
      return betTypes;
    }
    
    // Priority 3: Check odds.bets
    if (odds?.bets && Array.isArray(odds.bets) && odds.bets.length > 0) {
      return odds.bets;
    }
    
    // Priority 4: Check odds.sub
    if (odds?.sub && Array.isArray(odds.sub) && odds.sub.length > 0) {
      return odds.sub;
    }
    
    return betTypes || [];
  }, [betTypes, odds]);

  // Organize bets by round and type
  const organizedBets = useMemo(() => {
    const rounds = [1, 2, 3, 4, 5, 6];
    const betTypes = ["Winner", "Black", "Red", "Odd", "Even", "Spade", "Heart", "Club", "Diamond"];
    
    return rounds.map((round) => {
      const roundBets: any = {};
      betTypes.forEach((type) => {
        const bet = actualBetTypes.find(
          (b: any) => b.nat === `${type} ${round}`
        );
        roundBets[type] = bet || null;
      });
      return { round, bets: roundBets };
    });
  }, [actualBetTypes]);

  // Get bet by round and type
  const getBet = (round: number, type: string) => {
    return actualBetTypes.find(
      (b: any) => b.nat === `${type} ${round}`
    ) || null;
  };

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    await onPlaceBet({
      sid: selectedBet.sid,
      odds: getOdds(selectedBet, selectedSide),
      nat: selectedBet.nat,
      amount: parseFloat(amount),
      side: selectedSide,
    });

    setBetModalOpen(false);
    setSelectedBet(null);
    setAmount("100");
  };

  // Betting Cell Component
  const BettingCell = ({ bet, round, type }: { bet: any; round: number; type: string }) => {
    const odds = bet ? getOdds(bet, "back") : 0;
    const formattedOdds = formatOdds(odds);
    const suspended = !bet || isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => bet && openBetModal(bet, "back")}
        className={`
          h-10 w-full flex items-center justify-center
          text-xs font-semibold
          ${
            suspended
              ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-sky-400 text-white hover:bg-sky-500"
          }
        `}
      >
        {suspended ? <Lock size={12} /> : formattedOdds}
      </button>
    );
  };

  // Bet Type Labels
  const betTypeLabels = [
    { key: "Winner", label: "Winner" },
    { key: "Black", label: "Black" },
    { key: "Red", label: "Red" },
    { key: "Odd", label: "Odd" },
    { key: "Even", label: "Even" },
    { key: "Spade", label: "♠" },
    { key: "Heart", label: "♥" },
    { key: "Club", label: "♣" },
    { key: "Diamond", label: "♦" },
  ];

  // Process results for display
  const last10Results = useMemo(() => {
    if (!Array.isArray(resultHistory)) return [];
    return resultHistory.slice(0, 10).map((r: any) => ({
      mid: r.mid,
      win: r.win || "",
      display: r.win ? r.win.split(",").join(", ") : "",
    }));
  }, [resultHistory]);

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm sm:text-base font-semibold">Casino War</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-7 w-7 sm:h-8 sm:w-8">
          <Info size={14} className="sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* ================= BETTING GRID ================= */}
      <div className="mb-4 overflow-x-auto">
        <div className="min-w-full">
          {/* Header Row - Round Numbers */}
          <div className="grid grid-cols-10 gap-0 border-2 border-gray-300 dark:border-gray-600 rounded-t overflow-hidden">
            <div className="col-span-1 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold p-2 flex items-center justify-center border-r border-gray-400 dark:border-gray-600">
              Round
            </div>
            {[1, 2, 3, 4, 5, 6].map((round) => (
              <div
                key={round}
                className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold p-2 flex items-center justify-center border-r border-gray-400 dark:border-gray-600 last:border-r-0"
              >
                {round}
              </div>
            ))}
          </div>

          {/* Betting Rows */}
          {betTypeLabels.map((betType, idx) => (
            <div
              key={betType.key}
              className={`grid grid-cols-10 gap-0 border-l-2 border-r-2 border-gray-300 dark:border-gray-600 ${
                idx === betTypeLabels.length - 1 ? "border-b-2 rounded-b" : "border-b"
              } overflow-hidden`}
            >
              {/* Bet Type Label */}
              <div className="col-span-1 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-medium p-2 flex items-center justify-center border-r border-gray-400 dark:border-gray-600">
                {betType.label}
              </div>
              {/* Betting Cells for each round */}
              {[1, 2, 3, 4, 5, 6].map((round) => (
                <div
                  key={round}
                  className="border-r border-gray-400 dark:border-gray-600 last:border-r-0"
                >
                  <BettingCell
                    bet={getBet(round, betType.key)}
                    round={round}
                    type={betType.key}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ================= RESULTS ================= */}
      {last10Results.length > 0 && (
        <div className="mb-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
            Recent Results
          </div>
          <div className="grid grid-cols-5 gap-2">
            {last10Results.map((result: any, idx: number) => (
              <div
                key={idx}
                className="text-xs flex flex-col items-center justify-center p-2 rounded border-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400"
              >
                <span className="font-semibold">R{idx + 1}</span>
                <span className="text-xs mt-1">{result.display || "-"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full p-0">
          <DialogHeader className="bg-slate-800 text-white px-3 sm:px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-xs sm:text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)} className="p-1">
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          </DialogHeader>

          {selectedBet && (
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSide))}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: ₹{selectedBet.min || 100} Max: ₹{selectedBet.max || 0}
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded text-[10px] sm:text-xs font-medium ${
                      amount === String(amt)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-600 hover:bg-gray-700 text-white"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Amount Input */}
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min={selectedBet.min || 100}
                max={selectedBet.max || 0}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10"
              />

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Potential win" : "Liability"}: ₹
                  {(() => {
                    const oddsValue = Number(getOdds(selectedBet, selectedSide));
                    const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    if (selectedSide === "back") {
                      return (parseFloat(amount) * normalizedOdds).toFixed(2);
                    } else {
                      return (parseFloat(amount) * (normalizedOdds - 1)).toFixed(2);
                    }
                  })()}
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm h-9 sm:h-10"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                onClick={handlePlaceBet}
              >
                {loading ? "Placing..." : `Place Bet ₹${amount}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader className="px-3 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle className="text-sm sm:text-base">Casino War Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-[10px] sm:text-xs leading-relaxed text-gray-700 dark:text-gray-300 px-3 sm:px-6 pb-4 sm:pb-6">
            <p>
              Casino War is a card-based betting game where players can bet on different outcomes across 6 rounds.
            </p>
            
            <div className="mt-4">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Betting Options:</p>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <b>Winner:</b> Bet on which round will win
                </li>
                <li>
                  <b>Black:</b> Bet on black cards (Spades ♠, Clubs ♣)
                </li>
                <li>
                  <b>Red:</b> Bet on red cards (Hearts ♥, Diamonds ♦)
                </li>
                <li>
                  <b>Odd:</b> Bet on odd-numbered cards
                </li>
                <li>
                  <b>Even:</b> Bet on even-numbered cards
                </li>
                <li>
                  <b>Spade ♠:</b> Bet on Spade suit
                </li>
                <li>
                  <b>Heart ♥:</b> Bet on Heart suit
                </li>
                <li>
                  <b>Club ♣:</b> Bet on Club suit
                </li>
                <li>
                  <b>Diamond ♦:</b> Bet on Diamond suit
                </li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">How to Play:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Select your betting option from the grid (choose round and bet type)</li>
                <li>Enter your bet amount</li>
                <li>Confirm your bet</li>
                <li>Wait for the result</li>
                <li>If your selected bet matches the winning result, you win!</li>
              </ol>
            </div>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Betting Limits:</p>
              <p>Minimum Bet: ₹{actualBetTypes[0]?.min || 100}</p>
              <p>Maximum Bet: ₹{actualBetTypes[0]?.max || 100000}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
