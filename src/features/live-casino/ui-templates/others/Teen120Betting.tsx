// src/features/live-casino/ui-templates/others/Teen120Betting.tsx

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

interface Teen120BettingProps {
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

/* ================= COMPONENT ================= */

export const Teen120Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Teen120BettingProps) => {
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

  const playerBet = find(actualBetTypes, "Player");
  const dealerBet = find(actualBetTypes, "Dealer");
  const tieBet = find(actualBetTypes, "Tie");
  const pairBet = find(actualBetTypes, "Pair");

  const bettingOptions = [
    { bet: playerBet, label: "Player" },
    { bet: tieBet, label: "Tie" },
    { bet: dealerBet, label: "Dealer" },
    { bet: pairBet, label: "Pair" },
  ];

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

  const BettingOption = ({ bet, label }: { bet: any; label: string }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <div className="w-full flex flex-col items-center space-y-1">
        {/* Odds Display */}
        <div className="text-sm font-semibold text-gray-900">
          {formattedOdds}
        </div>
        
        {/* Betting Button */}
        <button
          disabled={suspended || loading}
          onClick={() => openBetModal(bet)}
          className={`
            w-full py-3 px-4 rounded
            bg-gradient-to-r from-sky-600 to-slate-700
            text-white font-bold text-sm
            transition-all shadow-sm
            ${
              suspended
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-sky-700 hover:to-slate-800 hover:shadow-md"
            }
          `}
        >
          {suspended ? <Lock size={16} /> : label}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">1 CARD 20-20</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= BETTING OPTIONS ================= */}
      <div className="grid grid-cols-4 gap-2 relative">
        {bettingOptions.map((option, index) => (
          <div
            key={option.label}
            className={`relative ${index === 2 ? "border-l-2 border-gray-500 pl-2 ml-1" : ""}`}
          >
            <BettingOption
              bet={option.bet}
              label={option.label}
            />
          </div>
        ))}
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
            <DialogTitle>1 CARD 20-20 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              Teenpatti is an indian origin three cards game.
            </p>
            <p>
              This game is played with a regular 52 cards deck between Player A and Player B.
            </p>
            <p>
              The objective of the game is to make the best three cards hand as per the hand rankings and win.
            </p>
            <p>
              You have a betting option of Back and Lay for the main bet.
            </p>
            
            <p className="font-semibold mt-2">Rankings of the card hands from highest to lowest:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Straight Flush (pure Sequence)</li>
              <li>Trail (Three of a Kind)</li>
              <li>Straight (Sequence)</li>
              <li>Flush (Color)</li>
              <li>Pair (Two of a kind)</li>
              <li>High Card</li>
            </ol>

            <p className="font-semibold mt-2">Side bets:</p>
            <p>
              <b>CONSECUTIVE CARDS:</b> It is a bet of having two or more consecutive cards in the game.
            </p>
            <p className="text-xs text-gray-600">
              eg: 2,3,5 | 10,3,9 | Q,5,K | 6,7,8 | A,K,7
            </p>
            <p>
              For both the players Back and Lay odds are available, you can bet on either or both the players.
            </p>
            
            <p className="font-semibold mt-2">Odd - Even:</p>
            <p>
              Here you can bet on every card whether it will be an odd card or an even card.
            </p>
            <p>
              <b>ODD CARDS:</b> A, 3, 5, 7, 9, J, K
            </p>
            <p>
              <b>EVEN CARDS:</b> 2, 4, 6, 8, 10, Q
            </p>

            <p className="font-semibold mt-2 text-yellow-500">
              NOTE: In case of a Tie between the player A and player B bets placed on player A and player B (Main bets) will be returned. (Pushed)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
