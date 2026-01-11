// src/features/live-casino/ui-templates/others/LottcardBetting.tsx

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

interface LottcardBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
}

type BetType = "Single" | "Double" | "Triple";

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED" || b?.gstatus !== "OPEN";

const find = (bets: any[], nat: string) =>
  bets.find((b) => {
    const betNat = (b.nat || "").toLowerCase();
    const searchTerm = nat.toLowerCase();
    return betNat === searchTerm || betNat.includes(searchTerm);
  });

// Get odds from multiple possible fields (only back odds for lottcard)
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

// Card value mapping: A = 1, 2-9 = 2-9, 10 = 0
const getCardValue = (card: string): string => {
  if (card === "A") return "1";
  if (card === "10") return "0";
  return card;
};

/* ================= COMPONENT ================= */

export const LottcardBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: LottcardBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBetType, setSelectedBetType] = useState<BetType>("Single");
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const [amount, setAmount] = useState("10");

  // Quick bet amounts from image: 5, 10, 15, 20, 25, 50, 75
  const quickAmounts = [5, 10, 15, 20, 25, 50, 75];

  // Cards displayed: A, 2, 3, 4, 5, 6, 7, 8, 9, 10
  const cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

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

  // Find Single, Double, Triple bets
  const singleBet = find(actualBetTypes, "Single");
  const doubleBet = find(actualBetTypes, "Double");
  const tripleBet = find(actualBetTypes, "Triple");

  // Get current bet based on selected type
  const currentBet = useMemo(() => {
    if (selectedBetType === "Single") return singleBet;
    if (selectedBetType === "Double") return doubleBet;
    if (selectedBetType === "Triple") return tripleBet;
    return null;
  }, [selectedBetType, singleBet, doubleBet, tripleBet]);

  // Handle card click - build the number based on bet type
  const handleCardClick = (card: string) => {
    if (loading || !currentBet || isSuspended(currentBet)) return;
    
    const cardValue = getCardValue(card);
    
    if (selectedBetType === "Single") {
      // Single: just set the one digit (0-9)
      setSelectedNumber(cardValue);
    } else if (selectedBetType === "Double") {
      // Double: build two-digit number (00-99)
      if (selectedNumber.length === 0) {
        setSelectedNumber(cardValue);
      } else if (selectedNumber.length === 1) {
        setSelectedNumber(selectedNumber + cardValue);
      } else {
        // Reset and start new
        setSelectedNumber(cardValue);
      }
    } else if (selectedBetType === "Triple") {
      // Triple: build three-digit number (000-999)
      if (selectedNumber.length < 3) {
        setSelectedNumber(selectedNumber + cardValue);
      } else {
        // Reset and start new
        setSelectedNumber(cardValue);
      }
    }
  };

  const openBetModal = () => {
    if (!currentBet || isSuspended(currentBet)) return;
    const oddsValue = getOdds(currentBet);
    if (formatOdds(oddsValue) === "0.00") return;
    
    // Validate number length based on bet type
    if (selectedBetType === "Single" && selectedNumber.length !== 1) return;
    if (selectedBetType === "Double" && selectedNumber.length !== 2) return;
    if (selectedBetType === "Triple" && selectedNumber.length !== 3) return;
    
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!currentBet || !selectedNumber || !amount || parseFloat(amount) <= 0) return;

    // Validate number length based on bet type
    if (selectedBetType === "Single" && selectedNumber.length !== 1) return;
    if (selectedBetType === "Double" && selectedNumber.length !== 2) return;
    if (selectedBetType === "Triple" && selectedNumber.length !== 3) return;

    await onPlaceBet({
      sid: currentBet.sid,
      odds: getOdds(currentBet),
      nat: `${selectedBetType} ${selectedNumber}`,
      amount: parseFloat(amount),
      side: "back",
      number: selectedNumber,
      betType: selectedBetType,
    });

    setBetModalOpen(false);
    setSelectedNumber("");
    setAmount("10");
  };

  // Get bet count for display (this would come from user's placed bets - for now showing 0)
  const getBetCount = (type: BetType): number => {
    // TODO: Count actual placed bets for this type
    return 0;
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Lottery Card</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-7 w-7 sm:h-8 sm:w-8">
          <Info size={14} className="sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* ================= BETTING CATEGORY TABS ================= */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(["Single", "Double", "Triple"] as BetType[]).map((type) => {
          const bet = type === "Single" ? singleBet : type === "Double" ? doubleBet : tripleBet;
          const isActive = selectedBetType === type;
          const isSuspendedBet = isSuspended(bet);
          const betCount = getBetCount(type);

          return (
            <button
              key={type}
              onClick={() => {
                setSelectedBetType(type);
                setSelectedNumber(""); // Reset selection when switching types
              }}
              className={`
                px-3 py-2 rounded text-sm font-semibold transition-colors
                ${
                  isActive
                    ? "bg-gray-800 dark:bg-gray-700 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }
                ${isSuspendedBet ? "opacity-50 cursor-not-allowed" : ""}
              `}
              disabled={isSuspendedBet || loading}
            >
              {type} ({betCount})
            </button>
          );
        })}
      </div>

      {/* ================= CARD SELECTION ================= */}
      <div className="mb-4">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {cards.map((card) => (
            <button
              key={card}
              onClick={() => handleCardClick(card)}
              disabled={loading || !currentBet || isSuspended(currentBet)}
              className={`
                aspect-square bg-white dark:bg-gray-800 border-2 rounded-lg
                flex flex-col items-center justify-center
                transition-all hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  selectedNumber.includes(getCardValue(card))
                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                    : "border-yellow-400 dark:border-yellow-600"
                }
              `}
            >
              {/* Card Value */}
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {card}
              </div>
              {/* Suit Symbols (as shown in image) */}
              <div className="flex gap-1 mt-1">
                <span className="text-[10px]">♣</span>
                <span className="text-[10px] text-red-600">♦</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Number Display */}
        {selectedNumber && selectedNumber.length > 0 && (
          <div className="mt-3 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Selected: <span className="font-bold text-lg text-gray-900 dark:text-white">
                {selectedBetType === "Single" 
                  ? selectedNumber 
                  : selectedBetType === "Double"
                  ? selectedNumber.padStart(2, "0")
                  : selectedNumber.padStart(3, "0")}
              </span>
            </div>
            {currentBet && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Min: ₹{currentBet.min || 10} Max: ₹{currentBet.max || 0} | Odds: {formatOdds(getOdds(currentBet))}
              </div>
            )}
            {/* Show message for incomplete selection */}
            {(selectedBetType === "Double" && selectedNumber.length < 2) || 
             (selectedBetType === "Triple" && selectedNumber.length < 3) ? (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                Select {selectedBetType === "Double" ? "one more" : `${3 - selectedNumber.length} more`} card{selectedBetType === "Triple" && (3 - selectedNumber.length) > 1 ? "s" : ""}
              </div>
            ) : (
              <Button
                onClick={openBetModal}
                disabled={loading || !currentBet || isSuspended(currentBet)}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Place Bet
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ================= RANDOM BETS PANEL ================= */}
      <div className="bg-gray-800 dark:bg-gray-700 rounded-lg p-3 mb-4">
        <div className="text-sm font-bold text-white text-center mb-2">Random Bets</div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setAmount(String(amt));
                    // Auto-open modal if valid selection is made
                    if (selectedNumber && 
                        ((selectedBetType === "Single" && selectedNumber.length === 1) ||
                        (selectedBetType === "Double" && selectedNumber.length === 2) ||
                        (selectedBetType === "Triple" && selectedNumber.length === 3)) &&
                        currentBet && !isSuspended(currentBet)) {
                      setTimeout(() => openBetModal(), 100);
                    }
                  }}
                  className={`
                    py-2 px-2 rounded text-sm font-medium text-white transition-colors
                    ${
                      amount === String(amt)
                        ? "bg-blue-600 ring-2 ring-blue-400"
                        : "bg-blue-500 hover:bg-blue-600"
                    }
                  `}
                  disabled={loading || !currentBet || isSuspended(currentBet)}
                >
                  ₹{amt}
                </button>
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

          {currentBet && (
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedBetType} - {selectedNumber}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Odds: <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(currentBet))}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: ₹{currentBet.min || 10} Max: ₹{currentBet.max || 0}
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
                min={currentBet.min || 10}
                max={currentBet.max || 0}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10"
              />

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">
                  Potential win: ₹
                  {(() => {
                    const oddsValue = Number(getOdds(currentBet));
                    const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    return (parseFloat(amount) * normalizedOdds).toFixed(2);
                  })()}
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm h-9 sm:h-10"
                disabled={loading || !amount || parseFloat(amount) <= 0 || !selectedNumber ||
                  (selectedBetType === "Single" && selectedNumber.length !== 1) ||
                  (selectedBetType === "Double" && selectedNumber.length !== 2) ||
                  (selectedBetType === "Triple" && selectedNumber.length !== 3)}
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
            <DialogTitle className="text-sm sm:text-base">Lottery Card Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-[10px] sm:text-xs leading-relaxed text-gray-700 dark:text-gray-300 px-3 sm:px-6 pb-4 sm:pb-6">
            {/* Game Play Section */}
            <div>
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Game Play:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Single:</strong> Singles play can be placed between 0-9</li>
                <li><strong>Double:</strong> Singles play can be placed between 00-99</li>
                <li><strong>Triple:</strong> Singles play can be placed between 000-999</li>
              </ul>
            </div>

            {/* Card Values */}
            <div className="mt-4">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Card Values:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Ace (A) = 1</li>
                <li>2, 3, 4, 5, 6, 7, 8, 9 = Same value</li>
                <li>10 = 0</li>
              </ul>
            </div>

            {/* Payout Section */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Payout:</p>
              <div className="grid grid-cols-4 gap-2 text-[9px] sm:text-[10px]">
                <div className="font-semibold">Game Play</div>
                <div className="font-semibold">Card</div>
                <div className="font-semibold">Payout</div>
                <div className="font-semibold">Point</div>
                <div>Play Single</div>
                <div>First Card</div>
                <div>1 to 9.5</div>
                <div>-</div>
                <div>Play Double</div>
                <div>First Second Card</div>
                <div>1 to 95</div>
                <div>-</div>
                <div>Play Tripple</div>
                <div>First Second Third Card</div>
                <div>1 to 900</div>
                <div>-</div>
              </div>
            </div>

            {/* Play Limits */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Play Limit:</p>
              <div className="grid grid-cols-3 gap-2 text-[9px] sm:text-[10px]">
                <div className="font-semibold">Play</div>
                <div className="font-semibold">Minimum Play</div>
                <div className="font-semibold">Maximum Play</div>
                <div>Singles Play</div>
                <div>₹10</div>
                <div>₹20K</div>
                <div>Doubles Play</div>
                <div>₹10</div>
                <div>₹5K</div>
                <div>Tripples Play</div>
                <div>₹10</div>
                <div>₹3K</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
