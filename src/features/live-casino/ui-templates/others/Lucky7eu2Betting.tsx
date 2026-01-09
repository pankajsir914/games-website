// src/features/live-casino/ui-templates/others/Lucky7eu2Betting.tsx

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

interface Lucky7eu2BettingProps {
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

// Card definitions for Line bets
const LINE_1_CARDS = ["A", "2", "3"];
const LINE_2_CARDS = ["4", "5", "6"];
const LINE_3_CARDS = ["8", "9", "10"];
const LINE_4_CARDS = ["J", "Q", "K"];

// Individual card order
const CARD_ORDER = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/* ================= COMPONENT ================= */

export const Lucky7eu2Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Lucky7eu2BettingProps) => {
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

  const lowCardBet = find(actualBetTypes, "Low Card");
  const highCardBet = find(actualBetTypes, "High Card");
  const evenBet = find(actualBetTypes, "Even");
  const oddBet = find(actualBetTypes, "Odd");
  const redBet = find(actualBetTypes, "Red");
  const blackBet = find(actualBetTypes, "Black");
  const line1Bet = find(actualBetTypes, "Line 1");
  const line2Bet = find(actualBetTypes, "Line 2");
  const line3Bet = find(actualBetTypes, "Line 3");
  const line4Bet = find(actualBetTypes, "Line 4");

  // Get individual card bets
  const cardBets = useMemo(() => {
    return CARD_ORDER.map((card) => {
      if (card === "A") return find(actualBetTypes, "Card 1");
      if (card === "J") return find(actualBetTypes, "Card J");
      if (card === "Q") return find(actualBetTypes, "Card Q");
      if (card === "K") return find(actualBetTypes, "Card K");
      return find(actualBetTypes, `Card ${card}`);
    });
  }, [actualBetTypes]);

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

  // Bet Button Component (only Back, no Lay)
  const BetButton = ({ bet, label, icon }: { bet: any; label: string; icon?: string }) => {
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
            w-full py-2 px-2 rounded
            text-sm font-semibold text-white
            bg-gradient-to-r from-sky-600 to-slate-700
            ${
              suspended
                ? "opacity-50 cursor-not-allowed bg-gray-400"
                : "hover:from-sky-700 hover:to-slate-800"
            }
          `}
        >
          {suspended ? (
            <Lock size={14} className="mx-auto" />
          ) : (
            <div className="flex items-center justify-center gap-1">
              {icon && <span className="text-lg">{icon}</span>}
              <span>{label}</span>
            </div>
          )}
        </button>
      </div>
    );
  };

  // Card Display Component
  const CardDisplay = ({ cards }: { cards: string[] }) => {
    return (
      <div className="flex items-center justify-center gap-1">
        {cards.map((card) => (
          <div key={card} className="flex flex-col items-center">
            <div className="text-sm font-bold text-gray-900 dark:text-white">{card}</div>
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

  // Individual Card Button Component
  const IndividualCardButton = ({ bet, cardValue }: { bet: any; cardValue: string }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";
    const isSeven = cardValue === "7";

    return (
      <div className="space-y-1">
        <div className="text-xs font-semibold text-center">{formattedOdds}</div>
        <button
          disabled={suspended || loading}
          onClick={() => openBetModal(bet, "back")}
          className={`
            w-full py-2 px-1 rounded
            text-xs font-bold text-gray-900
            bg-gray-100 dark:bg-gray-700
            ${
              suspended
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-200 dark:hover:bg-gray-600"
            }
            ${isSeven ? "border-2 border-yellow-400" : ""}
          `}
        >
          {suspended ? (
            <Lock size={12} className="mx-auto" />
          ) : (
            <>
              <div className="text-sm font-bold mb-1">{cardValue}</div>
              <div className="flex gap-0.5 text-[8px] justify-center">
                <span>♠</span>
                <span className="text-red-500">♥</span>
                <span>♣</span>
                <span className="text-red-500">♦</span>
              </div>
            </>
          )}
        </button>
      </div>
    );
  };

  // Line Bet Component (Card Range)
  const LineBetCard = ({ bet, cards, label }: { bet: any; cards: string[]; label: string }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <div className="border p-2 space-y-1">
        <div className="text-xs font-semibold text-center">{formattedOdds}</div>
        <button
          disabled={suspended || loading}
          onClick={() => openBetModal(bet, "back")}
          className={`
            w-full py-2 px-2 rounded
            text-xs font-semibold text-white
            bg-gradient-to-r from-sky-600 to-slate-700
            ${
              suspended
                ? "opacity-50 cursor-not-allowed bg-gray-400"
                : "hover:from-sky-700 hover:to-slate-800"
            }
          `}
        >
          {suspended ? (
            <Lock size={12} className="mx-auto" />
          ) : (
            <CardDisplay cards={cards} />
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Lucky 7 - C</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= ROW 1 - LOW CARD, 7 CARD, HIGH CARD ================= */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <BetButton bet={lowCardBet} label="Low Card" />
        <div className="flex flex-col items-center justify-center border-2 border-yellow-400 rounded p-2 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">7</div>
          <div className="flex gap-0.5 text-xs">
            <span>♠</span>
            <span className="text-red-500">♥</span>
            <span>♣</span>
            <span className="text-red-500">♦</span>
          </div>
        </div>
        <BetButton bet={highCardBet} label="High Card" />
      </div>

      {/* ================= ROW 2 - EVEN, ODD, RED, BLACK ================= */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <BetButton bet={evenBet} label="Even" />
        <BetButton bet={oddBet} label="Odd" />
        <BetButton bet={redBet} label="♥ ♦" icon="" />
        <BetButton bet={blackBet} label="♠ ♣" icon="" />
      </div>

      {/* ================= ROW 3 - LINE BETS (CARD RANGES) ================= */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <LineBetCard bet={line1Bet} cards={LINE_1_CARDS} label="Line 1" />
        <LineBetCard bet={line2Bet} cards={LINE_2_CARDS} label="Line 2" />
        <LineBetCard bet={line3Bet} cards={LINE_3_CARDS} label="Line 3" />
        <LineBetCard bet={line4Bet} cards={LINE_4_CARDS} label="Line 4" />
      </div>

      {/* ================= ROW 4 - INDIVIDUAL CARDS ================= */}
      <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
        {CARD_ORDER.map((card, idx) => (
          <IndividualCardButton
            key={card}
            bet={cardBets[idx]}
            cardValue={card}
          />
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
                  Back Odds:{" "}
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
                  Potential win: ₹
                  {(() => {
                    const oddsValue = Number(getOdds(selectedBet, selectedSide));
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
            <DialogTitle>Lucky 7 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <ul className="list-disc pl-4 space-y-1">
              <li>Lucky 7 is a 8 deck playing cards game, total 8 * 52 = 416 cards.</li>
              <li>If the card is from ACE to 6, LOW Wins.</li>
              <li>If the card is from 8 to KING, HIGH Wins.</li>
              <li>If the card is 7, bets on high and low will lose 50% of the bet amount.</li>
            </ul>
            <div className="mt-2">
              <p className="font-semibold text-yellow-500">LOW:</p>
              <p className="pl-4">1, 2, 3, 4, 5, 6</p>
              <p className="pl-4">Payout: 2.0</p>
            </div>
            <div className="mt-2">
              <p className="font-semibold text-yellow-500">HIGH:</p>
              <p className="pl-4">8, 9, 10, J, Q, K</p>
              <p className="pl-4">Payout: 2.0</p>
            </div>
            <div className="mt-2">
              <p className="font-semibold text-yellow-500">EVEN:</p>
              <p className="pl-4">2, 4, 6, 8, 10, Q</p>
              <p className="pl-4">Payout: 2.10</p>
            </div>
            <div className="mt-2">
              <p className="font-semibold text-yellow-500">ODD:</p>
              <p className="pl-4">1, 3, 5, 7, 9, J, K</p>
              <p className="pl-4">Payout: 1.79</p>
            </div>
            <div className="mt-2">
              <p className="font-semibold text-yellow-500">RED:</p>
              <p className="pl-4">Payout: 1.95</p>
            </div>
            <div className="mt-2">
              <p className="font-semibold text-yellow-500">BLACK:</p>
              <p className="pl-4">Payout: 1.95</p>
            </div>
            <div className="mt-2">
              <p className="font-semibold text-yellow-500">CARDS:</p>
              <p className="pl-4">1, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K</p>
              <p className="pl-4">Payout: 12.0</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
