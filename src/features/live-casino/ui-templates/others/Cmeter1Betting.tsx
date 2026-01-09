// src/features/live-casino/ui-templates/others/Cmeter1Betting.tsx

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

interface Cmeter1BettingProps {
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
const getOdds = (bet: any) => {
  if (!bet) return 0;
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

// Boxing glove icon SVG
const BoxingGloveIcon = ({ direction = "right" }: { direction?: "left" | "right" }) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="white"
    className={direction === "left" ? "rotate-180" : ""}
  >
    {/* Boxing glove shape */}
    <path d="M12 2C8.5 2 6 4.5 6 8c0 1.5.5 2.8 1.3 3.8L5 16h14l-2.3-4.2c.8-1 1.3-2.3 1.3-3.8 0-3.5-2.5-6-6-6z" />
    <path d="M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="white" strokeWidth="1" fill="none" />
    <circle cx="10" cy="9" r="1" fill="white" />
    <circle cx="14" cy="9" r="1" fill="white" />
  </svg>
);

/* ================= COMPONENT ================= */

export const Cmeter1Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Cmeter1BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  // Extract bets from multiple possible sources (similar to KBC/Dum10)
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

  const fighterA = find(actualBetTypes, "Fighter A");
  const fighterB = find(actualBetTypes, "Fighter B");

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    await onPlaceBet({
      sid: selectedBet.sid,
      odds: getOdds(selectedBet),
      nat: selectedBet.nat,
      amount: parseFloat(amount),
    });

    setBetModalOpen(false);
    setSelectedBet(null);
    setAmount("100");
  };

  const FighterButton = ({ bet, fighter, borderColor }: { bet: any; fighter: "A" | "B"; borderColor: string }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          w-full py-6 px-4 rounded-lg
          bg-sky-200 hover:bg-sky-300
          border-4 ${borderColor}
          flex items-center justify-center gap-3
          transition-all
          ${suspended ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"}
        `}
      >
        {suspended ? (
          <Lock size={24} className="text-gray-500" />
        ) : (
          <>
            {fighter === "A" && <BoxingGloveIcon direction="right" />}
            <span className="text-lg font-bold text-gray-900 uppercase">
              FIGHTER {fighter}
            </span>
            {fighter === "B" && <BoxingGloveIcon direction="left" />}
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">1 Card Meter</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= FIGHTER BUTTONS ================= */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <FighterButton 
          bet={fighterA} 
          fighter="A" 
          borderColor="border-red-500" 
        />
        <FighterButton 
          bet={fighterB} 
          fighter="B" 
          borderColor="border-yellow-500" 
        />
      </div>

      {/* ================= ODDS DISPLAY ================= */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Fighter A Odds</div>
          <div className="text-lg font-bold text-gray-900">
            {fighterA ? formatOdds(getOdds(fighterA)) : "0.00"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Fighter B Odds</div>
          <div className="text-lg font-bold text-gray-900">
            {fighterB ? formatOdds(getOdds(fighterB)) : "0.00"}
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
                  Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet))}
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
                  Potential win: ₹
                  {(() => {
                    const oddsValue = Number(getOdds(selectedBet));
                    const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    return (parseFloat(amount) * normalizedOdds).toFixed(2);
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
            <DialogTitle>1 Card Meter Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <h6 className="font-semibold text-yellow-500 text-sm mb-2">Low Zone:</h6>
              <ul className="list-disc pl-4 space-y-1">
                <li>The Player who bet on Low Zone will have all cards from Ace to 8 of all suits 3 cards of 9, Heart, Club & Diamond.</li>
              </ul>
            </div>

            <div>
              <h6 className="font-semibold text-yellow-500 text-sm mb-2">High Zone:</h6>
              <ul className="list-disc pl-4 space-y-1">
                <li>The Player who bet on high Zone will have all the cards of JQK of all suits plus 3 cards of 10, Heart, Club & Diamond.</li>
              </ul>
            </div>

            <div>
              <h6 className="font-semibold text-yellow-500 text-sm mb-2">Spade 9 & Spade 10:</h6>
              <ul className="list-disc pl-4 space-y-1">
                <li>If you Bet on Low Card, Spade of 9 & 10 will calculated along with High Cards.</li>
                <li>If you Bet on High Card, Spade of 9 & 10 will calculated along with Low Cards.</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
