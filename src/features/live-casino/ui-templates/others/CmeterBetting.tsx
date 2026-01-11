// src/features/live-casino/ui-templates/others/CmeterBetting.tsx

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

interface CmeterBettingProps {
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

// Parse card string (e.g., "7HH,QSS,2CC,2DD,1,1,1,1,1,1,1")
// Format: "7HH" = 7 of Hearts, "QSS" = Queen of Spades, "1" = unrevealed
const parseCards = (cardString: string): Array<{ value: string; suit: string; revealed: boolean; raw: string }> => {
  if (!cardString) return [];
  const cards = cardString.split(",");
  return cards.map((cardRaw) => {
    const card = cardRaw.trim();
    if (card === "1" || !card || card === "") {
      return { value: "", suit: "", revealed: false, raw: card };
    }
    // Format: "7HH" = 7 of Hearts, "QSS" = Queen of Spades, "ADD" = Ace of Diamonds
    const match = card.match(/^([A-Z0-9]+)([HSCD]{2})$/);
    if (match) {
      const [, value, suitCode] = match;
      const suitMap: { [key: string]: string } = {
        HH: "♥", SS: "♠", CC: "♣", DD: "♦"
      };
      let cardValue = value;
      if (value === "A") cardValue = "A";
      else if (value === "J") cardValue = "J";
      else if (value === "Q") cardValue = "Q";
      else if (value === "K") cardValue = "K";
      
      return {
        value: cardValue,
        suit: suitMap[suitCode] || "",
        revealed: true,
        raw: card,
      };
    }
    return { value: "", suit: "", revealed: false, raw: card };
  });
};

// Parse rdesc (e.g., "11,12,0,0") to get totals
const parseTotals = (rdesc: string): { lowTotal: number; highTotal: number } => {
  if (!rdesc) return { lowTotal: 0, highTotal: 0 };
  const parts = rdesc.split(",");
  return {
    lowTotal: parseInt(parts[0] || "0") || 0,
    highTotal: parseInt(parts[1] || "0") || 0,
  };
};

// Card definitions
const LOW_CARDS = ["A", "2", "3", "4", "5", "6", "7", "8", "9"];
const HIGH_CARDS = ["10", "J", "Q", "K"];

// Get suit symbol from card code
const getSuitSymbol = (cardCode: string): string => {
  if (cardCode.includes("HH")) return "♥";
  if (cardCode.includes("SS")) return "♠";
  if (cardCode.includes("CC")) return "♣";
  if (cardCode.includes("DD")) return "♦";
  return "";
};

// Get card value from card code
const getCardValue = (cardCode: string): string => {
  if (!cardCode || cardCode === "1") return "";
  const match = cardCode.match(/^([A-Z0-9]+)/);
  if (match) {
    const val = match[1];
    if (val === "A") return "A";
    if (val === "J") return "J";
    if (val === "Q") return "Q";
    if (val === "K") return "K";
    return val;
  }
  return "";
};

/* ================= COMPONENT ================= */

export const CmeterBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: CmeterBettingProps) => {
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

  // Parse card string and totals
  const cardString = odds?.data?.card || odds?.card || "";
  const rdesc = odds?.data?.rdesc || odds?.rdesc || "";
  const allCards = useMemo(() => parseCards(cardString), [cardString]);
  const revealedCards = useMemo(() => allCards.filter((c) => c.revealed), [allCards]);
  const totals = useMemo(() => parseTotals(rdesc), [rdesc]);

  // Separate cards into Low and High based on rules:
  // Low: A-8 all suits, 9 of Hearts/Clubs/Diamonds (not Spades)
  // High: 10, J, Q, K all suits, 3 cards of 10 (Heart, Club, Diamond), 9 of Spades
  const lowCards = useMemo(() => {
    return revealedCards.filter((c) => {
      if (!c.revealed) return false;
      const val = parseInt(c.value);
      // Ace to 8 are always low
      if (c.value === "A" || (!isNaN(val) && val >= 2 && val <= 8)) return true;
      // 9 is low if it's Heart, Club, or Diamond (not Spade)
      if (c.value === "9" && c.suit !== "♠") return true;
      return false;
    });
  }, [revealedCards]);

  const highCards = useMemo(() => {
    return revealedCards.filter((c) => {
      if (!c.revealed) return false;
      // 10, J, Q, K are always high
      if (c.value === "10" || c.value === "J" || c.value === "Q" || c.value === "K") return true;
      // 9 of Spades is high
      if (c.value === "9" && c.suit === "♠") return true;
      return false;
    });
  }, [revealedCards]);

  // Find Low and High bets
  const lowBet = find(actualBetTypes, "Low");
  const highBet = find(actualBetTypes, "High");

  // Create individual card bets - check if they exist in API or create structure
  // Note: API might have individual card bets nested or separate
  const individualCardBets = useMemo(() => {
    const cards: { [key: string]: any } = {};
    
    // Check if individual cards exist in API (e.g., "Card A", "Card 2", etc.)
    LOW_CARDS.forEach((card) => {
      const bet = find(actualBetTypes, `Card ${card}`) || find(actualBetTypes, card);
      if (bet) {
        cards[card] = bet;
      } else {
        // Create a placeholder bet structure using Low bet as base
        cards[card] = lowBet ? { ...lowBet, nat: `Card ${card}`, sid: lowBet.sid } : null;
      }
    });
    
    HIGH_CARDS.forEach((card) => {
      const bet = find(actualBetTypes, `Card ${card}`) || find(actualBetTypes, card);
      if (bet) {
        cards[card] = bet;
      } else {
        // Create a placeholder bet structure using High bet as base
        cards[card] = highBet ? { ...highBet, nat: `Card ${card}`, sid: highBet.sid } : null;
      }
    });
    
    return cards;
  }, [actualBetTypes, lowBet, highBet]);

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

  // Card Display Component (for revealed cards)
  const RevealedCard = ({ card }: { card: { value: string; suit: string; revealed: boolean } }) => {
    const isRed = card.suit === "♥" || card.suit === "♦";
    return (
      <div className="border-2 border-yellow-400 rounded p-2 bg-white dark:bg-gray-800 flex flex-col items-center justify-center min-w-[50px] min-h-[70px]">
        <div className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</div>
        <div className={`text-2xl font-bold ${isRed ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
          {card.suit}
        </div>
      </div>
    );
  };

  // Individual Card Bet Button Component
  const CardBetButton = ({ cardValue, bet }: { cardValue: string; bet: any }) => {
    const backOdds = getOdds(bet, "back");
    const layOdds = getOdds(bet, "lay");
    const formattedBackOdds = formatOdds(backOdds);
    const formattedLayOdds = formatOdds(layOdds);
    const suspended = isSuspended(bet) || (formattedBackOdds === "0.00" && formattedLayOdds === "0.00");
    const hasBack = formattedBackOdds !== "0.00";
    const hasLay = formattedLayOdds !== "0.00";

    return (
      <div className="border-2 border-yellow-400 rounded p-2 bg-white dark:bg-gray-800 flex flex-col items-center justify-center min-w-[60px] min-h-[90px]">
        {suspended || (!hasBack && !hasLay) ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Lock size={20} className="text-gray-500 mb-2" />
          </div>
        ) : (
          <>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">{cardValue}</div>
            <div className="flex gap-0.5 text-[10px] mb-2">
              <span>♠</span>
              <span className="text-red-500">♥</span>
              <span>♣</span>
              <span className="text-red-500">♦</span>
            </div>
            {hasBack && (
              <button
                disabled={loading}
                onClick={() => openBetModal(bet, "back")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-1 rounded mb-1"
              >
                {formattedBackOdds}
              </button>
            )}
            {hasLay && (
              <button
                disabled={loading}
                onClick={() => openBetModal(bet, "lay")}
                className="w-full bg-pink-400 hover:bg-pink-500 text-white text-xs font-bold py-1 px-1 rounded"
              >
                {formattedLayOdds}
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Casino Meter</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= UPPER SECTION - REVEALED CARDS AND TOTALS ================= */}
      <div className="bg-slate-700 rounded p-3 mb-3 space-y-3">
        {/* Low Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[80px]">
            <span className="text-yellow-400 font-bold">Low</span>
            <span className="text-green-400 font-bold text-lg">{totals.lowTotal || 0}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {lowCards.length > 0 ? (
              lowCards.map((card, idx) => (
                <RevealedCard key={`low-${idx}`} card={card} />
              ))
            ) : (
              <div className="text-gray-400 text-xs">No cards revealed yet</div>
            )}
          </div>
        </div>

        {/* High Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[80px]">
            <span className="text-yellow-400 font-bold">High</span>
            <span className="text-green-400 font-bold text-lg">{totals.highTotal || 0}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {highCards.length > 0 ? (
              highCards.map((card, idx) => (
                <RevealedCard key={`high-${idx}`} card={card} />
              ))
            ) : (
              <div className="text-gray-400 text-xs">No cards revealed yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ================= LOWER SECTION - BETTING OPTIONS ================= */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Panel - Low Zone */}
        <div className="border rounded p-3 bg-gray-800">
          <div className="text-center font-bold text-yellow-400 mb-3">Low</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {LOW_CARDS.map((card) => (
              <CardBetButton
                key={card}
                cardValue={card}
                bet={individualCardBets[card]}
              />
            ))}
          </div>
        </div>

        {/* Right Panel - High Zone */}
        <div className="border rounded p-3 bg-gray-800">
          <div className="text-center font-bold text-yellow-400 mb-3">High</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {HIGH_CARDS.map((card) => (
              <CardBetButton
                key={card}
                cardValue={card}
                bet={individualCardBets[card]}
              />
            ))}
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
            <DialogTitle>Casino Meter Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="mt-2">
              <img 
                src="https://sitethemedata.com/v3/static/front/img/casino-rules/cmeter.jpg" 
                alt="Casino Meter Rules" 
                className="w-full h-auto rounded"
              />
            </div>

            <div className="mt-3">
              <p className="font-semibold text-yellow-500 mb-2">Low Zone:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>The Player who bet on Low Zone will have all cards from Ace to 8 of all suits 3 cards of 9, Heart, Club & Diamond.</li>
              </ul>
            </div>

            <div className="mt-3">
              <p className="font-semibold text-yellow-500 mb-2">High Zone:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>The Player who bet on high Zone will have all the cards of JQK of all suits plus 3 cards of 10, Heart, Club & Diamond.</li>
              </ul>
            </div>

            <div className="mt-3">
              <p className="font-semibold text-yellow-500 mb-2">Spade 9 & Spade 10:</p>
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
