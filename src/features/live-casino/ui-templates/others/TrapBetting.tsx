// src/features/live-casino/ui-templates/others/TrapBetting.tsx

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

interface TrapBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string, subtype?: string) =>
  bets.find((b) => {
    const betNat = (b.nat || "").toLowerCase();
    const searchTerm = nat.toLowerCase();
    const matchesNat = betNat === searchTerm || betNat.includes(searchTerm);
    if (subtype) {
      return matchesNat && (b.subtype || "").toLowerCase() === subtype.toLowerCase();
    }
    return matchesNat;
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

export const TrapBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: TrapBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedNestedBet, setSelectedNestedBet] = useState<any>(null);
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

  const playerABet = find(actualBetTypes, "Player A");
  const playerBBet = find(actualBetTypes, "Player B");
  const highLowCardBet = find(actualBetTypes, "Card 1", "highlow");
  const jqkCardBet = find(actualBetTypes, "Card 1", "jqk");

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedNestedBet(null);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const openNestedBetModal = (nestedBet: any, parentBet: any, side: "back" | "lay" = "back") => {
    if (!nestedBet || !parentBet || isSuspended(parentBet)) return;
    const oddsValue = getOdds(nestedBet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(parentBet);
    setSelectedNestedBet(nestedBet);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    const payload: any = {
      sid: selectedBet.sid,
      odds: selectedNestedBet ? getOdds(selectedNestedBet, selectedSide) : getOdds(selectedBet, selectedSide),
      nat: selectedNestedBet ? selectedNestedBet.nat : selectedBet.nat,
      amount: parseFloat(amount),
      side: selectedSide,
    };

    if (selectedNestedBet) {
      payload.ssid = selectedNestedBet.sid;
    }

    await onPlaceBet(payload);

    setBetModalOpen(false);
    setSelectedBet(null);
    setSelectedNestedBet(null);
    setAmount("100");
  };

  // Standard OddsCell for Player A/B
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

  // Low/High Button Component
  const LowHighButton = ({ nestedBet, label, parentBet }: { nestedBet: any; label: string; parentBet: any }) => {
    const odds = getOdds(nestedBet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(parentBet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openNestedBetModal(nestedBet, parentBet, "back")}
        className={`
          flex flex-col items-center justify-center
          h-16 w-full
          text-sm font-semibold text-white
          ${
            suspended
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-sky-400 hover:bg-sky-500"
          }
        `}
      >
        {suspended ? (
          <Lock size={14} />
        ) : (
          <>
            <div className="text-sm font-bold mb-1">{formattedOdds}</div>
            <div className="text-xs">{label}</div>
          </>
        )}
      </button>
    );
  };

  // J Q K Card Display Component
  const JQKCardDisplay = () => {
    return (
      <div className="flex items-center gap-2">
        {["J", "Q", "K"].map((card) => (
          <div key={card} className="flex flex-col items-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">{card}</div>
            <div className="flex gap-0.5 text-[10px]">
              <span>♠</span>
              <span className="text-red-500">♥</span>
              <span>♣</span>
              <span className="text-red-500">♦</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">The Trap</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= TOP ROW - PLAYER A & B ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-3 text-sm font-semibold border-b">
          <div className="h-10 flex items-center px-2 bg-gray-50 dark:bg-gray-800"></div>
          <div className="h-10 flex items-center justify-center px-2 bg-gray-50 dark:bg-gray-800 border-l">
            Player A
          </div>
          <div className="h-10 flex items-center justify-center px-2 bg-gray-50 dark:bg-gray-800 border-l">
            Player B
          </div>
        </div>

        <div className="grid grid-cols-3">
          <div className="h-10 flex items-center px-2 text-xs font-semibold bg-gray-50 dark:bg-gray-800">
            Player
          </div>
          <div className="grid grid-cols-2 border-l">
            <OddsCell bet={playerABet} side="back" />
            <OddsCell bet={playerABet} side="lay" />
          </div>
          <div className="grid grid-cols-2 border-l">
            <OddsCell bet={playerBBet} side="back" />
            <OddsCell bet={playerBBet} side="lay" />
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ROW - SIDE BETS ================= */}
      <div className="grid grid-cols-2 gap-2">
        {/* Low/High Section */}
        <div className="border border-sky-300 p-2 relative">
          <div className="text-xs font-semibold mb-2 text-center">Low/High</div>
          <div className="grid grid-cols-2 gap-1">
            {highLowCardBet && highLowCardBet.odds && Array.isArray(highLowCardBet.odds) ? (
              <>
                {highLowCardBet.odds.find((o: any) => (o.nat || "").toLowerCase().includes("high")) && (
                  <LowHighButton
                    nestedBet={highLowCardBet.odds.find((o: any) => (o.nat || "").toLowerCase().includes("high"))}
                    label="High"
                    parentBet={highLowCardBet}
                  />
                )}
                {highLowCardBet.odds.find((o: any) => (o.nat || "").toLowerCase().includes("low")) && (
                  <LowHighButton
                    nestedBet={highLowCardBet.odds.find((o: any) => (o.nat || "").toLowerCase().includes("low"))}
                    label="Low"
                    parentBet={highLowCardBet}
                  />
                )}
              </>
            ) : (
              <>
                <div className="h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                  <Lock size={14} />
                </div>
                <div className="h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                  <Lock size={14} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* J Q K Section */}
        <div className="border p-2">
          <div className="text-xs font-semibold mb-2 text-center">J Q K</div>
          <div className="flex items-center justify-between gap-2">
            <JQKCardDisplay />
            {jqkCardBet && jqkCardBet.odds && Array.isArray(jqkCardBet.odds) && jqkCardBet.odds.length > 0 ? (
              <div className="grid grid-cols-2 gap-1 flex-1">
                <button
                  disabled={isSuspended(jqkCardBet) || loading || formatOdds(getOdds(jqkCardBet.odds[0])) === "0.00"}
                  onClick={() => openNestedBetModal(jqkCardBet.odds[0], jqkCardBet, "back")}
                  className={`
                    h-10 flex items-center justify-center
                    text-sm font-semibold text-white
                    ${
                      isSuspended(jqkCardBet) || formatOdds(getOdds(jqkCardBet.odds[0])) === "0.00"
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-sky-400 hover:bg-sky-500"
                    }
                  `}
                >
                  {isSuspended(jqkCardBet) || formatOdds(getOdds(jqkCardBet.odds[0])) === "0.00" ? (
                    <Lock size={14} />
                  ) : (
                    formatOdds(getOdds(jqkCardBet.odds[0], "back"))
                  )}
                </button>
                <button
                  disabled={isSuspended(jqkCardBet) || loading || formatOdds(getOdds(jqkCardBet.odds[0], "lay")) === "0.00"}
                  onClick={() => openNestedBetModal(jqkCardBet.odds[0], jqkCardBet, "lay")}
                  className={`
                    h-10 flex items-center justify-center
                    text-sm font-semibold text-white
                    ${
                      isSuspended(jqkCardBet) || formatOdds(getOdds(jqkCardBet.odds[0], "lay")) === "0.00"
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-pink-300 hover:bg-pink-400"
                    }
                  `}
                >
                  {isSuspended(jqkCardBet) || formatOdds(getOdds(jqkCardBet.odds[0], "lay")) === "0.00" ? (
                    <Lock size={14} />
                  ) : (
                    formatOdds(getOdds(jqkCardBet.odds[0], "lay"))
                  )}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 flex-1">
                <div className="h-10 bg-gray-200 flex items-center justify-center text-gray-500">
                  <Lock size={14} />
                </div>
                <div className="h-10 bg-gray-200 flex items-center justify-center text-gray-500">
                  <Lock size={14} />
                </div>
              </div>
            )}
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
                  {selectedNestedBet ? selectedNestedBet.nat : selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(
                      selectedNestedBet
                        ? getOdds(selectedNestedBet, selectedSide)
                        : getOdds(selectedBet, selectedSide)
                    )}
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
                    const oddsValue = Number(
                      selectedNestedBet
                        ? getOdds(selectedNestedBet, selectedSide)
                        : getOdds(selectedBet, selectedSide)
                    );
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
            <DialogTitle>The Trap Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <ul className="list-disc pl-4 space-y-1">
              <li>Trap is a 52 card deck game.</li>
              <li>
                Keeping Ace = 1 point, 2 = 2 points, 3 = 3 points, 4 = 4 points, 5 = 5 points, 6 = 6 points, 7 = 7 points, 8 = 8 Points, 9 = 9 points, 10 = 10 points, Jack = 11 points, Queen = 12 points and King = 13 points.
              </li>
              <li>Here there are two sides in TRAP. A and B respectively.</li>
              <li>First card that will open in the game would be from side 'A', next card will open in the game from Side 'B'. Likewise till the end of the game.</li>
              <li>Any side that crosses a total score of 15 would be the winner of the game. For Example: the total score should be 16 or above.</li>
              <li>But if at any stage your score is at 13, 14, 15 then you will get into the trap which ideally means you lose.</li>
              <li>Hence there are only two conditions from which you can decide the winner here either your opponent has to be trapped in the score of 13, 14, 15 or your total score should be above 15.</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
