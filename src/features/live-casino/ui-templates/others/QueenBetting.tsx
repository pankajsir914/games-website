// src/features/live-casino/ui-templates/others/QueenBetting.tsx

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

interface QueenBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string) =>
  bets.find((b) => {
    const betNat = (b.nat || "").toLowerCase();
    const searchTerm = nat.toLowerCase();
    return betNat === searchTerm || betNat.includes(searchTerm);
  });

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

export const QueenBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: QueenBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  // Extract bets from multiple possible sources
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

  const total0Bet = find(actualBetTypes, "Total 0");
  const total1Bet = find(actualBetTypes, "Total 1");
  const total2Bet = find(actualBetTypes, "Total 2");
  const total3Bet = find(actualBetTypes, "Total 3");

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

  // Total Cell Component
  const TotalCell = ({ bet, label }: { bet: any; label: string }) => {
    const backOdds = getOdds(bet, "back");
    const layOdds = getOdds(bet, "lay");
    const formattedBackOdds = formatOdds(backOdds);
    const formattedLayOdds = formatOdds(layOdds);
    const suspended = isSuspended(bet);

    return (
      <div className="flex flex-col items-center space-y-1">
        {/* Title */}
        <div className="text-sm font-bold text-gray-900 dark:text-white text-center">
          {label}
        </div>
        {/* Back and Lay Buttons */}
        <div className="grid grid-cols-2 gap-1 w-full">
          <button
            disabled={suspended || loading || formattedBackOdds === "0.00"}
            onClick={() => openBetModal(bet, "back")}
            className={`
              h-12 w-full flex items-center justify-center rounded
              text-base font-bold text-white
              ${
                suspended || formattedBackOdds === "0.00"
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }
            `}
          >
            {suspended || formattedBackOdds === "0.00" ? (
              <Lock size={14} />
            ) : (
              formattedBackOdds
            )}
          </button>
          <button
            disabled={suspended || loading || formattedLayOdds === "0.00"}
            onClick={() => openBetModal(bet, "lay")}
            className={`
              h-12 w-full flex items-center justify-center rounded
              text-base font-bold text-white
              ${
                suspended || formattedLayOdds === "0.00"
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-pink-400 hover:bg-pink-500"
              }
            `}
          >
            {suspended || formattedLayOdds === "0.00" ? (
              <Lock size={14} />
            ) : (
              formattedLayOdds
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Queen</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= MAIN BETTING GRID - 4 COLUMNS ================= */}
      <div className="grid grid-cols-4 gap-3">
        <TotalCell bet={total0Bet} label="Total 0" />
        <TotalCell bet={total1Bet} label="Total 1" />
        <TotalCell bet={total2Bet} label="Total 2" />
        <TotalCell bet={total3Bet} label="Total 3" />
      </div>

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="bg-slate-800 text-white px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          {selectedBet && (
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSide))}
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className={`py-2 px-2 rounded text-xs font-medium ${
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
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
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
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Queen Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p className="font-semibold text-yellow-500 mb-2">Game Overview:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>This is a <strong>21 cards game</strong>: <strong>2, 3, 4, 5, 6 x 4 = 20 cards</strong> and <strong>1 Queen</strong>.</li>
              <li><strong>Minimum total 10 or queen is required to win</strong>.</li>
            </ul>
            
            <div className="mt-3">
              <p className="font-semibold text-yellow-500 mb-2">Betting Options:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Total 0:</strong> Bet on total being 0</li>
                <li><strong>Total 1:</strong> Bet on total being 1</li>
                <li><strong>Total 2:</strong> Bet on total being 2</li>
                <li><strong>Total 3:</strong> Bet on total being 3</li>
              </ul>
              <p className="mt-2 pl-4 text-gray-600 dark:text-gray-400">
                Each bet has both <strong>Back</strong> (blue) and <strong>Lay</strong> (pink) options available.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
