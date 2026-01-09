// src/features/live-casino/ui-templates/others/TrioBetting.tsx

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

interface TrioBettingProps {
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

export const TrioBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: TrioBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [sessionRulesOpen, setSessionRulesOpen] = useState(false);
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

  const sessionBet = find(actualBetTypes, "Session");
  const judgement124Bet = find(actualBetTypes, "3 Card Judgement(1 2 4)");
  const judgementJQKBet = find(actualBetTypes, "3 Card Judgement(J Q K)");
  const twoRedBet = find(actualBetTypes, "Two Red Only");
  const twoBlackBet = find(actualBetTypes, "Two Black Only");
  const twoOddBet = find(actualBetTypes, "Two Odd Only");
  const twoEvenBet = find(actualBetTypes, "Two Even Only");
  const pairBet = find(actualBetTypes, "Pair");
  const flushBet = find(actualBetTypes, "Flush");
  const straightBet = find(actualBetTypes, "Straight");
  const trioBet = find(actualBetTypes, "Trio");
  const straightFlushBet = find(actualBetTypes, "Straight Flush");

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

  const SessionCell = ({ bet, side }: { bet: any; side: "back" | "lay" }) => {
    const odds = getOdds(bet, side);
    const formattedOdds = formatOdds(odds);
    const havValue = side === "back" ? (bet?.bbhav || 0) : (bet?.lbhav || 0);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet, side)}
        className={`
          h-12 w-full flex flex-col items-center justify-center
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : side === "back"
              ? "bg-sky-400 text-white hover:bg-sky-500"
              : "bg-pink-300 text-gray-900 hover:bg-pink-400"
          }
        `}
      >
        {suspended ? (
          <Lock size={14} />
        ) : (
          <>
            <div className="text-lg font-bold">{formattedOdds}</div>
            {havValue > 0 && (
              <div className="text-xs font-medium opacity-90">{havValue}</div>
            )}
          </>
        )}
      </button>
    );
  };

  const SingleOddsCell = ({ bet }: { bet: any }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet, "back")}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-sky-400 text-white hover:bg-sky-500"
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
        <h3 className="text-sm font-semibold">Trio</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= ROW 1 - MAIN JUDGEMENT BETS ================= */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {/* Session */}
        <div className="border">
          <div className="p-2 text-xs font-semibold flex items-center gap-1">
            Session
            <button
              onClick={() => setSessionRulesOpen(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Info size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2">
            <SessionCell bet={sessionBet} side="back" />
            <SessionCell bet={sessionBet} side="lay" />
          </div>
        </div>

        {/* 3 Card Judgement(1 2 4) */}
        <div className="border">
          <div className="p-2 text-xs font-semibold">3 Card Judgement(1 2 4)</div>
          <div className="grid grid-cols-2">
            <OddsCell bet={judgement124Bet} side="back" />
            <OddsCell bet={judgement124Bet} side="lay" />
          </div>
        </div>

        {/* 3 Card Judgement(J Q K) */}
        <div className="border">
          <div className="p-2 text-xs font-semibold">3 Card Judgement(J Q K)</div>
          <div className="grid grid-cols-2">
            <OddsCell bet={judgementJQKBet} side="back" />
            <OddsCell bet={judgementJQKBet} side="lay" />
          </div>
        </div>
      </div>

      {/* ================= ROW 2 - TWO CARD COMBINATION BETS ================= */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <div className="border">
          <div className="p-2 text-xs font-semibold">Two Red Only</div>
          <div className="grid grid-cols-2">
            <OddsCell bet={twoRedBet} side="back" />
            <OddsCell bet={twoRedBet} side="lay" />
          </div>
        </div>

        <div className="border">
          <div className="p-2 text-xs font-semibold">Two Black Only</div>
          <div className="grid grid-cols-2">
            <OddsCell bet={twoBlackBet} side="back" />
            <OddsCell bet={twoBlackBet} side="lay" />
          </div>
        </div>

        <div className="border">
          <div className="p-2 text-xs font-semibold">Two Odd Only</div>
          <div className="grid grid-cols-2">
            <OddsCell bet={twoOddBet} side="back" />
            <OddsCell bet={twoOddBet} side="lay" />
          </div>
        </div>

        <div className="border">
          <div className="p-2 text-xs font-semibold">Two Even Only</div>
          <div className="grid grid-cols-2">
            <OddsCell bet={twoEvenBet} side="back" />
            <OddsCell bet={twoEvenBet} side="lay" />
          </div>
        </div>
      </div>

      {/* ================= ROW 3 - POKER-STYLE HAND BETS ================= */}
      <div className="grid grid-cols-5 gap-2">
        <div className="border">
          <div className="p-2 text-xs font-semibold">Pair</div>
          <SingleOddsCell bet={pairBet} />
        </div>

        <div className="border">
          <div className="p-2 text-xs font-semibold">Flush</div>
          <SingleOddsCell bet={flushBet} />
        </div>

        <div className="border">
          <div className="p-2 text-xs font-semibold">Straight</div>
          <SingleOddsCell bet={straightBet} />
        </div>

        <div className="border">
          <div className="p-2 text-xs font-semibold">Trio</div>
          <SingleOddsCell bet={trioBet} />
        </div>

        <div className="border">
          <div className="p-2 text-xs font-semibold">Straight Flush</div>
          <SingleOddsCell bet={straightFlushBet} />
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

      {/* ================= SESSION RULES MODAL ================= */}
      <Dialog open={sessionRulesOpen} onOpenChange={setSessionRulesOpen}>
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              It is a total of point value of all three cards.
            </p>
            <p className="font-semibold">Point Value of Cards (Suits doesn't matter):</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Ace = 1</li>
              <li>2 = 2, 3 = 3, 4 = 4, 5 = 5, 6 = 6, 7 = 7, 8 = 8, 9 = 9</li>
              <li>10 = 10</li>
              <li>Jack = 11</li>
              <li>Queen = 12</li>
              <li>King = 13</li>
            </ul>
            <p>
              <b>Example:</b> 1+10+13 = 24, Here session is 24.
            </p>
            <p>
              It is a bet for having session 21 Yes or No.
            </p>
            <p>
              Both back and lay rate of session 21 is available.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trio Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p className="font-semibold text-yellow-500">Session:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a total of point value of all three cards.</li>
              <li>Point Value of Cards (Suits doesn't matter): Ace = 1, 2 = 2, 3 = 3, 4 = 4, 5 = 5, 6 = 6, 7 = 7, 8 = 8, 9 = 9, 10 = 10, Jack = 11, Queen = 12, King = 13</li>
              <li>Example: 1+10+13 = 24, Here session is 24.</li>
              <li>It is a bet for having session 21 Yes or No.</li>
              <li>Both back and lay rate of session 21 is available.</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">3 card Judgement:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>In this bet you are offered set of three cards from which atleast one card must come in game.</li>
              <li>Both Back and Lay rate is available for 3 card judgement.</li>
              <li>Two sets of three cards are offered for "3 card Judgement".</li>
              <li>Set One: (1, 2, 4)</li>
              <li>Set 2: (Jack, Queen, King)</li>
              <li>Suits doesn't matter.</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">Two Red Only:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a bet for having two red cards only in the game (not more not less)</li>
              <li>(Here Heart and Diamond are named Red card).</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">Two Black only:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a bet for having two black cards only in the game (not more not less)</li>
              <li>(Here Spade and Club are named Black card).</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">Two Odd only:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a bet for having two odd cards only in the game (not more not less).</li>
              <li>1, 3, 5, 7, 9, Jack and King are named odd cards.</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">Two Even only:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a bet for having two even cards only in the game (not more not less).</li>
              <li>2, 4, 6, 8, 10 and Queen are named even cards.</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">Pair:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a bet for having Two cards of same rank.</li>
              <li>(Trio is also valid for Pair).</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">Flush:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is bet for having all three cards of same suits.</li>
              <li>(If straight Flush come Flush is valid.)</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">Straight:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is bet for having all three cards in the sequence.</li>
              <li>Eg: 4, 5, 6 | Jack, Queen, King</li>
              <li>(If Straight Flush come Straight is valid.)</li>
              <li className="font-semibold">Note: King, Ace, 2 is not valid for straight.</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">Trio:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a bet for having all three cards of same rank.</li>
              <li>Eg: 4 Heart, 4 Spade, 4 Diamond | J Heart, J Club, J Diamond</li>
            </ul>

            <p className="font-semibold text-yellow-500 mt-2">Straight Flush:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a bet for having all three cards in a sequence and also of same suits.</li>
              <li>Eg: Jack (Heart), Queen (Heart), King (Heart) | 4 (Club), 5 (Club), 6 (Club)</li>
              <li className="font-semibold">Note: King, Ace and 2 is not valid for Straight Flush.</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
