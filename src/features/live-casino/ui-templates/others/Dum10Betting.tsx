// src/features/live-casino/ui-templates/others/Dum10Betting.tsx

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

interface Dum10BettingProps {
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
    return betNat === searchTerm;
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

export const Dum10Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Dum10BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  // Extract bets from multiple possible sources (similar to KBC)
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

  // Find bets - get the OPEN one for "Next Total" (gval === "0")
  const nextTotalBet = actualBetTypes.find(
    (b: any) => 
      (b.nat || "").includes("Next Total") && 
      b.gval === "0" && 
      b.gstatus === "OPEN"
  ) || actualBetTypes.find((b: any) => (b.nat || "").includes("Next Total"));

  const redBet = find(actualBetTypes, "Red");
  const blackBet = find(actualBetTypes, "Black");
  const evenBet = find(actualBetTypes, "Even");
  const oddBet = find(actualBetTypes, "Odd");

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

  const Cell = ({ bet, side = "back" }: { bet: any; side?: "back" | "lay" }) => {
    const odds = getOdds(bet, side);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet, side)}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : side === "back"
              ? "bg-sky-400 text-white hover:bg-sky-500"
              : "bg-pink-300 text-gray-900 hover:bg-pink-400"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : formattedOdds}
      </button>
    );
  };

  const SideBetCard = ({ bet, label, icon }: { bet: any; label: string; icon?: string }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <div className="space-y-1">
        <div className="text-sm font-semibold text-center">{formattedOdds}</div>
        <button
          disabled={suspended || loading}
          onClick={() => openBetModal(bet, "back")}
          className={`
            w-full py-3 px-2 rounded
            bg-gradient-to-r from-slate-700 to-slate-800
            text-white font-semibold text-sm
            ${
              suspended
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-slate-800 hover:to-slate-900"
            }
          `}
        >
          {suspended ? (
            <Lock size={14} className="mx-auto" />
          ) : (
            <div className="flex items-center justify-center gap-1">
              {icon && <span className="text-lg">{icon}</span>}
              <span className={icon ? "" : "text-lg"}>{label}</span>
            </div>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Dus ka Dum</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= NEXT TOTAL ================= */}
      {nextTotalBet && (
        <div className="border mb-3">
          <div className="grid grid-cols-3 text-sm font-semibold">
            <div className="h-10 flex items-center" />
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">
              Back
            </div>
            <div className="text-center bg-pink-300 text-gray-900 h-10 flex items-center justify-center">
              Lay
            </div>
          </div>

          <div className="grid grid-cols-3 border-t">
            <div className="p-2 text-sm flex items-center">
              {nextTotalBet.nat || "Next Total"}
            </div>
            <Cell bet={nextTotalBet} side="back" />
            <Cell bet={nextTotalBet} side="lay" />
          </div>
        </div>
      )}

      {/* ================= SIDE BETS ================= */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Column - Even/Odd */}
        <div className="space-y-3">
          <SideBetCard bet={evenBet} label="Even" />
          <SideBetCard bet={oddBet} label="Odd" />
        </div>

        {/* Right Column - Red/Black */}
        <div className="space-y-3">
          <SideBetCard bet={redBet} label="♥ ♦" icon="" />
          <SideBetCard bet={blackBet} label="♠ ♣" icon="" />
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
        <DialogContent className="max-w-md text-sm">
          <DialogHeader>
            <DialogTitle>Dus ka Dum Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              Dus Ka Dum is an unique and instant result game.
            </p>
            <p>
              It is played with a regular single deck of 52 cards.
            </p>
            <p>
              In this game each card has point value:
            </p>
            <p className="font-semibold">
              Ace = 1, 2 = 2, 3 = 3, 4 = 4, 5 = 5, 6 = 6, 7 = 7, 8 = 8, 9 = 9, 10 = 10, J = 11, Q = 12, K = 13
            </p>
            <p className="text-xs text-gray-600">
              (Suit of card is irrelevant in point value)
            </p>
            <p>
              Dus ka Dum is a one card game. The dealer will draw a single card every time which will decide the result of the game. Hence that particular game will be over.
            </p>
            <p>
              Now always the last drawn card will be removed and kept aside. Thereafter a new game will commence from the remaining cards. Then the same process will continue till there is a winning chance or otherwise up to 35 cards or so.
            </p>
            <p>
              All the drawn cards will be added to current total.
            </p>
            <p className="font-semibold mt-2">Examples:</p>
            <p>
              • If first four drawn cards are: 7, 9, J, 4<br />
              So current total is 31, now on opening of 5th card bet will be for next total 40 or more.
            </p>
            <p>
              • If the current total of first 11 drawn cards is 84 the bet will open for next total 90 or more.
            </p>
            <p>
              • The current total of first 12 drawn cards is 79 the bet will open for next total 90 or more (because on opening of any cards 80 is certainty).
            </p>
            <p className="font-semibold mt-2">Side Bets:</p>
            <p>
              <b>Odd even:</b> Here you can bet on every card whether it will be an odd card or an even card.
            </p>
            <p>
              <b>Odd cards:</b> A, 3, 5, 7, 9, J, K
            </p>
            <p>
              <b>Even cards:</b> 2, 4, 6, 8, 10, Q
            </p>
            <p>
              <b>Red Black:</b> Here you can bet on every card whether it will be a red card or a black card.
            </p>
            <p>
              <b>Red cards:</b> Hearts (♥), Diamonds (♦)
            </p>
            <p>
              <b>Black cards:</b> Spades (♠), Clubs (♣)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
