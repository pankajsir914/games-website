// src/features/live-casino/ui-templates/others/Race20Betting.tsx

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

interface Race20BettingProps {
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

// Get size (liquidity) from bet
const getSize = (bet: any, side: "back" | "lay" = "back") => {
  if (!bet) return 0;
  if (side === "lay") {
    return bet.ls ?? bet.laySize ?? 0;
  }
  return bet.bs ?? bet.backSize ?? 0;
};

// Format odds value
const formatOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

// Format size (liquidity)
const formatSize = (val: any): string => {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "";
  if (num >= 100000) return (num / 100000).toFixed(2) + "L";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toFixed(0);
};

// King card suits
const KING_SUITS = [
  { nat: "K of spade", label: "K", suit: "♠", suitName: "Spade" },
  { nat: "K of heart", label: "K", suit: "♥", suitName: "Heart" },
  { nat: "K of club", label: "K", suit: "♣", suitName: "Club" },
  { nat: "K of diamond", label: "K", suit: "♦", suitName: "Diamond" },
];

/* ================= COMPONENT ================= */

export const Race20Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Race20BettingProps) => {
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

  // Find King card bets
  const kingBets = useMemo(() => {
    return KING_SUITS.map((suit) => ({
      ...suit,
      bet: find(actualBetTypes, suit.nat),
    }));
  }, [actualBetTypes]);

  const totalPointsBet = find(actualBetTypes, "Total points");
  const totalCardsBet = find(actualBetTypes, "Total cards");
  const winWith5Bet = find(actualBetTypes, "Win with 5");
  const winWith6Bet = find(actualBetTypes, "Win with 6");
  const winWith7Bet = find(actualBetTypes, "Win with 7");
  const winWith15Bet = find(actualBetTypes, "Win with 15");
  const winWith16Bet = find(actualBetTypes, "Win with 16");
  const winWith17Bet = find(actualBetTypes, "Win with 17");

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

  // King Card Cell Component
  const KingCardCell = ({ kingData }: { kingData: { bet: any; label: string; suit: string; suitName: string } }) => {
    const { bet, label, suit } = kingData;
    const backOdds = getOdds(bet, "back");
    const layOdds = getOdds(bet, "lay");
    const backSize = getSize(bet, "back");
    const laySize = getSize(bet, "lay");
    const formattedBackOdds = formatOdds(backOdds);
    const formattedLayOdds = formatOdds(layOdds);
    const formattedBackSize = formatSize(backSize);
    const formattedLaySize = formatSize(laySize);
    const suspended = isSuspended(bet);

    return (
      <div className="border-2 border-yellow-400 rounded p-2 bg-white dark:bg-gray-800">
        {/* Card Display */}
        <div className="flex flex-col items-center justify-center mb-2 min-h-[60px]">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{label}</div>
          <div className={`text-4xl font-bold ${suit === "♥" || suit === "♦" ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
            {suit}
          </div>
        </div>
        {/* Back and Lay Buttons */}
        <div className="grid grid-cols-2 gap-1">
          <button
            disabled={suspended || loading || formattedBackOdds === "0.00"}
            onClick={() => openBetModal(bet, "back")}
            className={`
              h-14 flex flex-col items-center justify-center
              text-sm font-semibold text-white rounded
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
              <>
                <div className="text-lg font-bold">{formattedBackOdds}</div>
                {formattedBackSize && (
                  <div className="text-xs opacity-90 mt-0.5">{formattedBackSize}</div>
                )}
              </>
            )}
          </button>
          <button
            disabled={suspended || loading || formattedLayOdds === "0.00"}
            onClick={() => openBetModal(bet, "lay")}
            className={`
              h-14 flex flex-col items-center justify-center
              text-sm font-semibold text-white rounded
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
              <>
                <div className="text-lg font-bold">{formattedLayOdds}</div>
                {formattedLaySize && (
                  <div className="text-xs opacity-90 mt-0.5">{formattedLaySize}</div>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Total Points/Cards Cell Component (No/Yes)
  const TotalCell = ({ bet, label }: { bet: any; label: string }) => {
    const backOdds = getOdds(bet, "back");
    const layOdds = getOdds(bet, "lay");
    const backSize = getSize(bet, "back");
    const laySize = getSize(bet, "lay");
    const formattedBackOdds = formatOdds(backOdds);
    const formattedLayOdds = formatOdds(layOdds);
    const formattedBackSize = formatSize(backSize);
    const formattedLaySize = formatSize(laySize);
    const suspended = isSuspended(bet);

    return (
      <div className="flex items-center gap-2 mb-3">
        {/* Label on the left */}
        <div className="text-sm font-bold text-gray-900 dark:text-white min-w-[100px]">
          {label}
        </div>
        {/* No and Yes buttons on the right */}
        <div className="grid grid-cols-2 gap-1 flex-1">
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold text-center mb-0.5 text-gray-700 dark:text-gray-300">No</div>
            <button
              disabled={suspended || loading || formattedLayOdds === "0.00"}
              onClick={() => openBetModal(bet, "lay")}
              className={`
                h-12 w-full flex flex-col items-center justify-center rounded
                text-xs font-semibold
                ${
                  suspended || formattedLayOdds === "0.00"
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-pink-400 hover:bg-pink-500 text-white"
                }
              `}
            >
              {suspended || formattedLayOdds === "0.00" ? (
                <Lock size={12} />
              ) : (
                <>
                  <div className="text-base font-bold">{formattedLayOdds}</div>
                  {formattedLaySize && (
                    <div className="text-[10px] opacity-90 mt-0.5">{formattedLaySize}</div>
                  )}
                </>
              )}
            </button>
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold text-center mb-0.5 text-gray-700 dark:text-gray-300">Yes</div>
            <button
              disabled={suspended || loading || formattedBackOdds === "0.00"}
              onClick={() => openBetModal(bet, "back")}
              className={`
                h-12 w-full flex flex-col items-center justify-center rounded
                text-xs font-semibold
                ${
                  suspended || formattedBackOdds === "0.00"
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }
              `}
            >
              {suspended || formattedBackOdds === "0.00" ? (
                <Lock size={12} />
              ) : (
                <>
                  <div className="text-base font-bold">{formattedBackOdds}</div>
                  {formattedBackSize && (
                    <div className="text-[10px] opacity-90 mt-0.5">{formattedBackSize}</div>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Win With Cell Component
  const WinWithCell = ({ bet, label }: { bet: any; label: string }) => {
    const backOdds = getOdds(bet, "back");
    const formattedOdds = formatOdds(backOdds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet, "back")}
        className={`
          h-14 w-full flex flex-col items-center justify-center rounded
          text-sm font-semibold text-white
          ${
            suspended
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }
        `}
      >
        {suspended ? (
          <Lock size={14} />
        ) : (
          <>
            <div className="text-xs font-bold mb-1">{label}</div>
            <div className="text-xl font-bold">{formattedOdds}</div>
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Race 20</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= TOP ROW - KING CARDS ================= */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        {kingBets.map((kingData) => (
          <KingCardCell key={kingData.nat} kingData={kingData} />
        ))}
      </div>

      {/* ================= MIDDLE SECTION - TOTAL POINTS/CARDS AND WIN WITH ================= */}
      <div className="grid grid-cols-2 gap-3">
        {/* LEFT SIDE - TOTAL POINTS AND TOTAL CARDS */}
        <div className="border rounded p-3 bg-white dark:bg-gray-800">
          <TotalCell bet={totalPointsBet} label="Total points" />
          <TotalCell bet={totalCardsBet} label="Total cards" />
        </div>

        {/* RIGHT SIDE - WIN WITH BETS */}
        <div className="border rounded p-3 bg-white dark:bg-gray-800">
          <div className="grid grid-cols-3 gap-2">
            <WinWithCell bet={winWith5Bet} label="Win with 5" />
            <WinWithCell bet={winWith6Bet} label="Win with 6" />
            <WinWithCell bet={winWith7Bet} label="Win with 7" />
            <WinWithCell bet={winWith15Bet} label="Win with 15" />
            <WinWithCell bet={winWith16Bet} label="Win with 16" />
            <WinWithCell bet={winWith17Bet} label="Win with 17" />
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
            <DialogTitle>Race 20 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <div className="mb-3">
              <p className="font-semibold text-yellow-500 mb-2">Game Overview:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>The game uses a total of <strong>48 cards</strong>, consisting of <strong>Ace to Queen of all four suits</strong>.</li>
                <li><strong>Kings' 4 cards are explicitly stated as "not counted"</strong> in this game.</li>
                <li>The game is described as "a race between four Kings to get 5 cards in their own suits."</li>
              </ul>
            </div>

            <div className="mb-3">
              <p className="font-semibold text-yellow-500 mb-2">MAIN BETS:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>The core rule for main bets is that <strong>"the 5 cards of the suit that open first will be considered as winners."</strong></li>
              </ul>
            </div>

            <div className="mb-3">
              <p className="font-semibold text-yellow-500 mb-2">FANCY BETS:</p>
              
              <div className="mb-2">
                <p className="font-semibold text-yellow-400 mb-1">TOTAL CARDS:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>This bet refers to the <strong>"total number of cards required to finish the round"</strong>.</li>
                  <li><strong>Example:</strong> If 11 cards are drawn at the end of a round, then "11" will be the "Total cards".</li>
                </ul>
              </div>

              <div className="mb-2">
                <p className="font-semibold text-yellow-400 mb-1">TOTAL POINT:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>This bet is based on <strong>"the total points based on the values on each cards drawn till the end of round"</strong>.</li>
                </ul>
                <div className="mt-2 pl-4">
                  <p className="font-medium mb-1">Card Point Values:</p>
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    <div>A = 1</div>
                    <div>2 = 2</div>
                    <div>3 = 3</div>
                    <div>4 = 4</div>
                    <div>5 = 5</div>
                    <div>6 = 6</div>
                    <div>7 = 7</div>
                    <div>8 = 8</div>
                    <div>9 = 9</div>
                    <div>10 = 10</div>
                    <div>J = 11</div>
                    <div>Q = 12</div>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <p className="font-semibold text-yellow-400 mb-1">WIN WITH (5, 6, 7, 15, 16 OR 17):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>This event is considered a win <strong>"only if the cards drawn at the end of round matches exactly"</strong> one of the specified numbers (5, 6, 7, 15, 16, or 17).</li>
                  <li><strong>Example:</strong> If the number of cards drawn at the end of the round is 6, then "only win with 6 will be considered as winning."</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
