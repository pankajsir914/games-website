// src/features/live-casino/ui-templates/others/Worli2Betting.tsx

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

interface Worli2BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
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

export const Worli2Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Worli2BettingProps) => {
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

  // Get base bet from API (usually only one entry)
  const baseBet = actualBetTypes[0] || null;

  // Define all betting options
  const bettingOptions = useMemo(() => {
    // Create virtual bet objects for each betting option
    // Since API returns only one sub entry, we'll use it as base for all options
    const createBetOption = (label: string, nat: string) => {
      if (!baseBet) return null;
      return {
        ...baseBet,
        nat: nat,
        label: label,
        sid: baseBet.sid, // Use same sid or create unique identifier
      };
    };

    const options: Array<{ label: string; nat: string; subText?: string }> = [
      // Top row
      { label: "1", nat: "1" },
      { label: "2", nat: "2" },
      { label: "3", nat: "3" },
      { label: "4", nat: "4" },
      { label: "5", nat: "5" },
      { label: "LINE 1", nat: "LINE 1", subText: "1|2|3|4|5" },
      { label: "ODD", nat: "ODD", subText: "1|3|5|7|9" },
      // Bottom row
      { label: "6", nat: "6" },
      { label: "7", nat: "7" },
      { label: "8", nat: "8" },
      { label: "9", nat: "9" },
      { label: "0", nat: "0" },
      { label: "LINE 2", nat: "LINE 2", subText: "6|7|8|9|0" },
      { label: "EVEN", nat: "EVEN", subText: "2|4|6|8|0" },
    ];
    return options.map((opt) => ({
      ...opt,
      bet: createBetOption(opt.label, opt.nat),
    }));
  }, [baseBet]);

  const openBetModal = (option: any) => {
    if (!option.bet || isSuspended(option.bet)) return;
    const oddsValue = getOdds(option.bet, "back");
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(option.bet);
    setSelectedSide("back");
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
  const BettingCell = ({ option, index }: { option: any; index: number }) => {
    const bet = option?.bet || null;
    const odds = bet ? getOdds(bet, "back") : 0;
    const formattedOdds = formatOdds(odds);
    const suspended = !bet || isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => option && openBetModal(option)}
        className={`
          aspect-square bg-sky-200 dark:bg-sky-300 border border-white
          flex flex-col items-center justify-center
          transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
          ${suspended ? "opacity-60" : "hover:bg-sky-300 dark:hover:bg-sky-400"}
        `}
      >
        {/* Main Label - Dark grey, bold, textured effect */}
        <div className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-900 drop-shadow-sm">
          {option?.label || ""}
        </div>
        {/* Sub Text - Smaller, regular dark grey */}
        {option?.subText && (
          <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-800 mt-1 font-normal">
            {option.subText}
          </div>
        )}
        {/* Odds Display (optional, can be shown on hover or always) */}
        {!suspended && formattedOdds !== "0.00" && (
          <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-700 mt-1">
            {formattedOdds}
          </div>
        )}
        {suspended && (
          <Lock size={12} className="mt-1 text-gray-500" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm sm:text-base font-semibold">Instant Worli</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-7 w-7 sm:h-8 sm:w-8">
          <Info size={14} className="sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* ================= BETTING GRID ================= */}
      <div className="mb-4">
        {/* Header Row with "9" labels */}
        <div className="grid grid-cols-7 gap-0 mb-0">
          <div className="col-span-5 text-center text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 py-1">
            9
          </div>
          <div className="col-span-2 text-center text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 py-1">
            9
          </div>
        </div>

        {/* Betting Grid - 2 rows × 7 columns */}
        <div className="grid grid-cols-7 gap-0 border-2 border-white rounded overflow-hidden">
          {bettingOptions.map((option, idx) => (
            <BettingCell key={idx} option={option} index={idx} />
          ))}
        </div>
      </div>

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
                  Back Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSide))}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: ₹{selectedBet.min || 10} Max: ₹{selectedBet.max || 0}
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
                min={selectedBet.min || 10}
                max={selectedBet.max || 0}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10"
              />

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">
                  Potential win: ₹
                  {(() => {
                    const oddsValue = Number(getOdds(selectedBet, selectedSide));
                    const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    return (parseFloat(amount) * normalizedOdds).toFixed(2);
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
            <DialogTitle className="text-sm sm:text-base">Instant Worli Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-[10px] sm:text-xs leading-relaxed text-gray-700 dark:text-gray-300 px-3 sm:px-6 pb-4 sm:pb-6">
            <p>
              Instant Worli is a number-based betting game where players can bet on individual numbers, lines, or odd/even outcomes.
            </p>
            
            <div className="mt-4">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Betting Options:</p>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <b>Individual Numbers:</b> Bet on any single number from 0-9
                </li>
                <li>
                  <b>LINE 1:</b> Bet on numbers 1, 2, 3, 4, or 5
                </li>
                <li>
                  <b>LINE 2:</b> Bet on numbers 6, 7, 8, 9, or 0
                </li>
                <li>
                  <b>ODD:</b> Bet on odd numbers (1, 3, 5, 7, 9)
                </li>
                <li>
                  <b>EVEN:</b> Bet on even numbers (2, 4, 6, 8, 0)
                </li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">How to Play:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Select your betting option from the grid</li>
                <li>Enter your bet amount</li>
                <li>Confirm your bet</li>
                <li>Wait for the result</li>
                <li>If your selected number/line/odd/even matches the winning result, you win!</li>
              </ol>
            </div>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Betting Limits:</p>
              <p>Minimum Bet: ₹{baseBet?.min || 10}</p>
              <p>Maximum Bet: ₹{baseBet?.max || 50000}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
