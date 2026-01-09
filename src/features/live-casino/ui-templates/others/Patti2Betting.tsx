// src/features/live-casino/ui-templates/others/Patti2Betting.tsx

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

interface Patti2BettingProps {
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

export const Patti2Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Patti2BettingProps) => {
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

  const playerABet = find(actualBetTypes, "Player A");
  const playerBBet = find(actualBetTypes, "Player B");
  const miniBaccaratABet = find(actualBetTypes, "Mini Baccarat A");
  const miniBaccaratBBet = find(actualBetTypes, "Mini Baccarat B");
  const totalABet = find(actualBetTypes, "Total A");
  const totalBBet = find(actualBetTypes, "Total B");
  const colorPlusBet = find(actualBetTypes, "Color Plus");

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

  // Mini Baccarat - only Back button
  const MiniBaccaratCell = ({ bet }: { bet: any }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet, "back")}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold text-white
          ${
            suspended
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-sky-400 hover:bg-sky-500"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : formattedOdds}
      </button>
    );
  };

  // Total Cell with two numbers (odds on top, bbhav/lbhav on bottom)
  const TotalCell = ({ bet, side }: { bet: any; side: "back" | "lay" }) => {
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
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : side === "back"
              ? "bg-sky-400 hover:bg-sky-500 text-white"
              : "bg-pink-300 hover:bg-pink-400 text-gray-900"
          }
        `}
      >
        {suspended ? (
          <Lock size={14} />
        ) : (
          <>
            <div className="text-xs font-medium">{formattedOdds}</div>
            {havValue > 0 && (
              <div className="text-sm font-bold">{havValue}</div>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">2 Cards Teenpatti</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= TOP SECTION - PLAYER A & B GRID ================= */}
      <div className="border mb-2">
        {/* Header Row */}
        <div className="grid grid-cols-3 text-sm font-semibold border-b">
          <div className="h-10 flex items-center px-2 bg-gray-50 dark:bg-gray-800"></div>
          <div className="h-10 flex items-center justify-center px-2 bg-gray-50 dark:bg-gray-800 border-l">
            Player A
          </div>
          <div className="h-10 flex items-center justify-center px-2 bg-gray-50 dark:bg-gray-800 border-l">
            Player B
          </div>
        </div>

        {/* Row 1: Player A & Player B */}
        <div className="grid grid-cols-3 border-b">
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

        {/* Row 2: Mini Baccarat A & B */}
        <div className="grid grid-cols-3 border-b">
          <div className="h-10 flex items-center px-2 text-xs font-semibold bg-gray-50 dark:bg-gray-800">
            Mini Baccarat
          </div>
          <div className="border-l">
            <MiniBaccaratCell bet={miniBaccaratABet} />
          </div>
          <div className="border-l">
            <MiniBaccaratCell bet={miniBaccaratBBet} />
          </div>
        </div>

        {/* Row 3: Total A & B */}
        <div className="grid grid-cols-3">
          <div className="h-12 flex items-center px-2 text-xs font-semibold bg-gray-50 dark:bg-gray-800">
            Total
          </div>
          <div className="grid grid-cols-2 border-l">
            <TotalCell bet={totalABet} side="lay" />
            <TotalCell bet={totalABet} side="back" />
          </div>
          <div className="grid grid-cols-2 border-l">
            <TotalCell bet={totalBBet} side="lay" />
            <TotalCell bet={totalBBet} side="back" />
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION - COLOR PLUS ================= */}
      <div className="mb-2">
        <button
          disabled={isSuspended(colorPlusBet) || loading || formatOdds(getOdds(colorPlusBet)) === "0.00"}
          onClick={() => openBetModal(colorPlusBet, "back")}
          className={`
            w-full h-10 flex items-center justify-center
            text-sm font-semibold text-white
            ${
              isSuspended(colorPlusBet) || formatOdds(getOdds(colorPlusBet)) === "0.00"
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-sky-400 hover:bg-sky-500"
            }
          `}
        >
          {isSuspended(colorPlusBet) || formatOdds(getOdds(colorPlusBet)) === "0.00" ? (
            <Lock size={14} />
          ) : (
            `Color Plus ${formatOdds(getOdds(colorPlusBet))}`
          )}
        </button>
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
            <DialogTitle>2 Cards Teenpatti Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-yellow-500 mb-2">Main:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>In case of consecutive cards, the third card is to be considered in ascending order only.</li>
                <li className="mt-2"><b>Example:</b> If the first two cards are king & ace then the third card is 2, so it becomes: K, A & 2 (which is not sequence).</li>
                <li>If the first two cards are 2 & 3, then third card is 4, so it becomes 2, 3, 4 (it will not be 1, 2, 3).</li>
                <li className="mt-2 font-semibold">The sequence in order from 1st to last:</li>
                <li className="pl-4">Queen & King - 1st</li>
                <li className="pl-4">Ace & 2 - 2nd</li>
                <li className="pl-4">Jack & Queen - 3rd</li>
                <li className="pl-4">10 & Jack - 4th</li>
                <li className="pl-4">9 & 10 - 5th</li>
                <li className="pl-4">8 & 9 - 6th</li>
                <li className="pl-4">7 & 8 - 7th</li>
                <li className="pl-4">6 & 7 - 8th</li>
                <li className="pl-4">5 & 6 - 9th</li>
                <li className="pl-4">4 & 5 - 10th</li>
                <li className="pl-4">3 & 4 - 11th</li>
                <li className="pl-4">2 & 3 - 12th</li>
                <li className="mt-2">If it is alternative cards (e.g., 6 & 8, or 2 & 4, or Q & A), this type of alternative game will not be considered as a sequence.</li>
                <li>If it comes 4 & 4, this will be considered as a trio of 4.</li>
                <li>Another example is Ace & Ace, which will be considered as trio of Ace.</li>
                <li className="mt-2 font-semibold">Best combination of games in order of 1st to last:</li>
                <li className="pl-4">1. Pure sequence (1st best combination)</li>
                <li className="pl-4">2. Trio (3 of a kind) (2nd best combination)</li>
                <li className="pl-4">3. Sequence (straight) (3rd best combination)</li>
                <li className="pl-4">4. Colour (suits) (4th best combination)</li>
                <li>After that, all the games will be valued of higher card.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-yellow-500 mb-2">Mini Baccarat:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>It is a comparison between the last digit of Total of both the sides.</li>
                <li className="font-semibold mt-2">Value of cards for baccarat:</li>
                <li className="pl-4">Ace = 1 point, 2 = 2 point, 3 = 3 point, 4 = 4 point, 5 = 5 point</li>
                <li className="pl-4">6 = 6 point, 7 = 7 point, 8 = 8 point, 9 = 9 point</li>
                <li className="pl-4">10 = 0 point, Jack = 0 point, Queen = 0 point, King = 0 point</li>
                <li className="mt-2">Total of two cards can be ranged between 0 to 18.</li>
                <li>If total is in single digit, then the same will be considered as baccarat value.</li>
                <li>If the total is of double digit, then the last digit will be considered as baccarat value.</li>
                <li>Higher value baccarat will win.</li>
                <li>If baccarat value of both the sides are equal, then both side's will lose their bets.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-yellow-500 mb-2">Total:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Session is total of 2 cards value.</li>
                <li className="font-semibold mt-2">Value of each cards:</li>
                <li className="pl-4">Ace = 1 point, 2 = 2 point, 3 = 3 point, 4 = 4 point, 5 = 5 point</li>
                <li className="pl-4">6 = 6 point, 7 = 7 point, 8 = 8 point, 9 = 9 point</li>
                <li className="pl-4">10 = 10 point, Jack = 11 point, Queen = 12 point, King = 13 point</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-yellow-500 mb-2">Color Plus:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>It contains seven circumstances to bet on simultaneously, however you can only win prize money on the item which has the higher rate.</li>
                <li className="mt-2 font-semibold">The seven outcomes on which you can bet are listed below:</li>
                <li className="pl-4">1. 3 card sequence (E.g: 2, 3, 4)</li>
                <li className="pl-4">2. 3 of a Kind (E.g: 3, 3, 3)</li>
                <li className="pl-4">3. 3 card pure sequence (E.g: 2, 3, 4 of same suit)</li>
                <li className="pl-4">4. 4 card colour (E.g: 2, 6, 7, 9 of same suit)</li>
                <li className="pl-4">5. 4 card sequence (E.g: 2, 3, 4, 5)</li>
                <li className="pl-4">6. 4 card pure sequence (E.g: 2, 3, 4, 5 of same suit)</li>
                <li className="pl-4">7. 4 of a kind (E.g: 3, 3, 3, 3)</li>
                <li className="mt-2"><b>Example 1:</b> If your card is 6, 7, 8, 9, here you will win prize in case there is a 4 card pure sequence only. Hence you will not receive the prize of: 3 card sequence, 4 card sequence, 4 card color, 3 card pure sequence.</li>
                <li className="mt-2"><b>Example 2:</b> If the cards are King of Spades, King of Clubs, King of Diamonds, King of Hearts, in this instance you will only receive the prize of 4 of a kind, therefore you will not win prize of 3 of a kind.</li>
                <li className="mt-2 font-semibold">You will only be able to win one prize, the one which is the most beneficial to you.</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
