// src/features/live-casino/ui-templates/others/Race17Betting.tsx

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

interface Race17BettingProps {
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

export const Race17Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Race17BettingProps) => {
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

  const race17Bet = find(actualBetTypes, "Race to 17");
  const bigCardBet = find(actualBetTypes, "Big Card");
  const zeroCardBet = find(actualBetTypes, "Zero Card");
  const anyZeroBet = find(actualBetTypes, "Any Zero");

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

  const OddsCell = ({ bet, side }: { bet: any; side: "back" | "lay" }) => {
    const odds = getOdds(bet, side);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet, side)}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold text-white
          ${
            suspended
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : side === "back"
              ? "bg-sky-400 hover:bg-sky-500"
              : "bg-pink-300 hover:bg-pink-400"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : formattedOdds}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Race to 17</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= HORIZONTAL BETTING ROW ================= */}
      <div className="grid grid-cols-4 gap-2">
        {/* Race to 17 */}
        <div className="border">
          <div className="p-2 text-xs font-semibold text-center bg-gray-50 dark:bg-gray-800">
            Race to 17
          </div>
          <div className="grid grid-cols-2">
            <OddsCell bet={race17Bet} side="back" />
            <OddsCell bet={race17Bet} side="lay" />
          </div>
        </div>

        {/* Big Card */}
        <div className="border">
          <div className="p-2 text-xs font-semibold text-center bg-gray-50 dark:bg-gray-800">
            {bigCardBet?.nat || "Big Card"}
          </div>
          <div className="grid grid-cols-2">
            <OddsCell bet={bigCardBet} side="back" />
            <OddsCell bet={bigCardBet} side="lay" />
          </div>
        </div>

        {/* Zero Card */}
        <div className="border">
          <div className="p-2 text-xs font-semibold text-center bg-gray-50 dark:bg-gray-800">
            {zeroCardBet?.nat || "Zero Card"}
          </div>
          <div className="grid grid-cols-2">
            <OddsCell bet={zeroCardBet} side="back" />
            <OddsCell bet={zeroCardBet} side="lay" />
          </div>
        </div>

        {/* Any Zero */}
        <div className="border">
          <div className="p-2 text-xs font-semibold text-center bg-gray-50 dark:bg-gray-800">
            Any Zero
          </div>
          <div className="grid grid-cols-2">
            <OddsCell bet={anyZeroBet} side="back" />
            <OddsCell bet={anyZeroBet} side="lay" />
          </div>
        </div>
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
                      // Total return for back bet
                      return (parseFloat(amount) * normalizedOdds).toFixed(2);
                    } else {
                      // Liability for lay bet = (odds - 1) * amount
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
            <DialogTitle>Race to 17 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-yellow-500 mb-2">Main:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>It is played with regular 52 card deck.</li>
                <li className="font-semibold mt-2">Value of Cards:</li>
                <li className="pl-4">Ace = 1, 2 = 2, 3 = 3, 4 = 4, 5 = 5, 6 = 6, 7 = 7, 8 = 8, 9 = 9</li>
                <li className="pl-4">10 = 0, Jack = 0, Queen = 0, King = 0</li>
                <li className="mt-2">Five (5) cards will be pulled from the deck.</li>
                <li>It is a race to reach 17 or plus.</li>
                <li className="mt-2">
                  <b>If you bet on 17 (Back):</b>
                  <ul className="list-disc pl-4 mt-1">
                    <li>Total of given (5) cards comes under seventeen (17) - you lose.</li>
                    <li>Total of (5) cards comes over sixteen (16) - you win.</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-yellow-500 mb-2">Fancy:</p>
              
              <div className="mb-2">
                <p className="font-semibold">Big Card (7, 8, 9):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Here 7, 8, 9 are named big card.</li>
                  <li>Back/Lay of big card rate is available to bet on every card.</li>
                </ul>
              </div>

              <div className="mb-2">
                <p className="font-semibold">Zero Card (10, Jack, Queen, King):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Here 10, Jack, Queen, King are named zero card.</li>
                  <li>Back & Lay rate to bet on zero card is available on every card.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Any Zero Card:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Here 10, Jack, Queen, King are named zero card.</li>
                  <li>It is a bet for having at least one zero card in game (not necessary game will go up to 5 cards).</li>
                  <li>You can bet on this before start of game only.</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
