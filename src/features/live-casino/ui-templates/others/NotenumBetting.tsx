// src/features/live-casino/ui-templates/others/NotenumBetting.tsx

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

interface NotenumBettingProps {
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

// Card definitions
const ODD_CARDS = ["A", "3", "5", "7", "9"];
const EVEN_CARDS = ["2", "4", "6", "8", "10"];
const LOW_CARDS = ["A", "2", "3", "4", "5"];
const HIGH_CARDS = ["6", "7", "8", "9", "10"];

/* ================= COMPONENT ================= */

export const NotenumBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: NotenumBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [selectedCardBet, setSelectedCardBet] = useState<any>(null);
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

  const oddCardBet = find(actualBetTypes, "Odd Card");
  const evenCardBet = find(actualBetTypes, "Even Card");
  const blackCardBet = find(actualBetTypes, "Black Card");
  const redCardBet = find(actualBetTypes, "Red Card");
  const lowCardBet = find(actualBetTypes, "Low Card");
  const highCardBet = find(actualBetTypes, "High Card");
  const baccarat1Bet = find(actualBetTypes, "Baccarat 1");
  const baccarat2Bet = find(actualBetTypes, "Baccarat 2");
  const card1Bet = find(actualBetTypes, "Card 1");

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedSide(side);
    setSelectedCardBet(null);
    setAmount("100");
    setBetModalOpen(true);
  };

  const openCardBetModal = (cardBet: any, parentBet: any) => {
    if (!cardBet || !parentBet || isSuspended(parentBet)) return;
    const oddsValue = getOdds(cardBet);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(parentBet);
    setSelectedCardBet(cardBet);
    setSelectedSide("back");
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    // For fixed point cards, use ssid from the card bet
    const payload: any = {
      sid: selectedBet.sid,
      odds: selectedCardBet ? getOdds(selectedCardBet) : getOdds(selectedBet, selectedSide),
      nat: selectedCardBet ? selectedCardBet.nat : selectedBet.nat,
      amount: parseFloat(amount),
      side: selectedSide,
    };

    if (selectedCardBet) {
      payload.ssid = selectedCardBet.ssid;
    }

    await onPlaceBet(payload);

    setBetModalOpen(false);
    setSelectedBet(null);
    setSelectedCardBet(null);
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

  const CardDisplay = ({ cards }: { cards: string[] }) => (
    <div className="flex gap-1 mb-2">
      {cards.map((card) => (
        <div
          key={card}
          className="border-2 border-yellow-400 bg-white px-2 py-1 text-xs font-semibold text-gray-900 rounded"
        >
          {card}
        </div>
      ))}
    </div>
  );

  const CardAttributeSection = ({
    title,
    bet,
    cards,
    showSuitIcons = false,
    suitType,
  }: {
    title: string;
    bet: any;
    cards?: string[];
    showSuitIcons?: boolean;
    suitType?: "black" | "red";
  }) => {
    const suspended = isSuspended(bet);

    return (
      <div className="border p-2">
        <div className="text-xs font-semibold mb-2">{title}</div>
        {cards && <CardDisplay cards={cards} />}
        {showSuitIcons && (
          <div className="flex gap-2 mb-2 justify-center">
            {suitType === "black" ? (
              <>
                <span className="text-2xl">♠</span>
                <span className="text-2xl">♣</span>
              </>
            ) : (
              <>
                <span className="text-2xl text-red-500">♥</span>
                <span className="text-2xl text-red-500">♦</span>
              </>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1">
          <OddsCell bet={bet} side="back" />
          <OddsCell bet={bet} side="lay" />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Note Number</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= TOP SECTION - CARD ATTRIBUTES ================= */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Left - Odd/Even */}
        <div className="space-y-2">
          <CardAttributeSection
            title="Odd Card 3"
            bet={oddCardBet}
            cards={ODD_CARDS}
          />
          <CardAttributeSection
            title="Even Card 3"
            bet={evenCardBet}
            cards={EVEN_CARDS}
          />
        </div>

        {/* Middle - Red/Black */}
        <div className="space-y-2">
          <CardAttributeSection
            title="Black Card"
            bet={blackCardBet}
            showSuitIcons={true}
            suitType="black"
          />
          <CardAttributeSection
            title="Red Card"
            bet={redCardBet}
            showSuitIcons={true}
            suitType="red"
          />
        </div>

        {/* Right - Low/High */}
        <div className="space-y-2">
          <CardAttributeSection
            title="Low Card 3"
            bet={lowCardBet}
            cards={LOW_CARDS}
          />
          <CardAttributeSection
            title="High Card 3"
            bet={highCardBet}
            cards={HIGH_CARDS}
          />
        </div>
      </div>

      {/* ================= BOTTOM SECTION ================= */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left - Baccarat */}
        <div className="space-y-2">
          <div className="border p-2">
            <div className="text-xs font-semibold mb-2">
              Baccarat 1 (1st, 2nd, 3rd card)
            </div>
            <button
              disabled={isSuspended(baccarat1Bet) || loading}
              onClick={() => openBetModal(baccarat1Bet, "back")}
              className={`
                w-full h-12
                flex items-center justify-center
                text-sm font-semibold
                ${
                  isSuspended(baccarat1Bet)
                    ? "bg-gray-600 text-white cursor-not-allowed"
                    : "bg-gray-700 text-white hover:bg-gray-800"
                }
              `}
            >
              {isSuspended(baccarat1Bet) ? (
                <Lock size={16} />
              ) : (
                formatOdds(getOdds(baccarat1Bet))
              )}
            </button>
          </div>
          <div className="border p-2">
            <div className="text-xs font-semibold mb-2">
              Baccarat 2 (4th, 5th, 6th card)
            </div>
            <button
              disabled={isSuspended(baccarat2Bet) || loading}
              onClick={() => openBetModal(baccarat2Bet, "back")}
              className={`
                w-full h-12
                flex items-center justify-center
                text-sm font-semibold
                ${
                  isSuspended(baccarat2Bet)
                    ? "bg-gray-600 text-white cursor-not-allowed"
                    : "bg-gray-700 text-white hover:bg-gray-800"
                }
              `}
            >
              {isSuspended(baccarat2Bet) ? (
                <Lock size={16} />
              ) : (
                formatOdds(getOdds(baccarat2Bet))
              )}
            </button>
          </div>
        </div>

        {/* Right - Fixed Point Cards */}
        <div className="border p-2">
          <div className="text-xs font-semibold mb-2">Fixed Point Card (Card 1)</div>
          {card1Bet && card1Bet.odds && Array.isArray(card1Bet.odds) ? (
            <div className="grid grid-cols-5 gap-1">
              {card1Bet.odds.map((cardOdds: any) => {
                const suspended = isSuspended(card1Bet) || formatOdds(getOdds(cardOdds)) === "0.00";
                const cardValue = cardOdds.nat.replace("Card ", "");

                return (
                  <button
                    key={cardOdds.ssid}
                    disabled={suspended || loading}
                    onClick={() => openCardBetModal(cardOdds, card1Bet)}
                    className={`
                      border-2 border-yellow-400 rounded p-1
                      flex flex-col items-center justify-center
                      text-xs
                      ${
                        suspended
                          ? "bg-gray-200 opacity-50 cursor-not-allowed"
                          : "bg-white hover:bg-gray-50"
                      }
                    `}
                  >
                    <div className="text-xs font-semibold text-gray-900 mb-1">
                      {formatOdds(getOdds(cardOdds))}
                    </div>
                    <div className="text-xs font-bold text-gray-900 mb-1">
                      {cardValue}
                    </div>
                    <div className="flex gap-0.5 text-[10px]">
                      <span>♠</span>
                      <span className="text-red-500">♥</span>
                      <span>♣</span>
                      <span className="text-red-500">♦</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-4">
              No card bets available
            </div>
          )}
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

          {(selectedBet || selectedCardBet) && (
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedCardBet ? selectedCardBet.nat : selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedCardBet ? "" : selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(
                      selectedCardBet
                        ? getOdds(selectedCardBet)
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
                  Potential win: ₹
                  {(() => {
                    const oddsValue = Number(
                      selectedCardBet
                        ? getOdds(selectedCardBet)
                        : getOdds(selectedBet, selectedSide)
                    );
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
            <DialogTitle>Note Number Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              This game is played with 80 cards containing two decks of fourty cards each.
            </p>
            <p>
              Each deck contains cards from Ace to 10 of all four suits (It means There is no Jack, No Queen and No King in this game).
            </p>
            <p>
              This game is for Fancy bet lovers.
            </p>

            <p className="font-semibold mt-2 text-yellow-500">Odd and Even Cards:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>To bet on odd card or even card, Betting odds are available on every cards.</li>
              <li>Both back and Lay price is available for both, odd and even.</li>
              <li>(Here 2, 4, 6, 8 and 10 are named Even Card.)</li>
              <li>(Here 1, 3, 5, 7, and 9 are named Odd Card.)</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">Red and Black Cards:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>To bet on Red card or Black Card bettings odds are available on every cards.</li>
              <li>(Here Heart and Diamond are named Red Card)</li>
              <li>(Spade and Club are named Black Card)</li>
              <li>Both Back and Lay price is available for both, Red card and Black Card.</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">Low and High cards:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>To bet on Low or High card bettings odds are available on every cards.</li>
              <li>(Here Ace, 2, 3, 4, and 5 are named low Card)</li>
              <li>(Here 6, 7, 8, 9 and 10 are named High card)</li>
              <li>Both back and lay price is available for both, Low card and High Card.</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">Baccarat:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>In this game six cards will open.</li>
              <li>For this bet this six cards are divided in two groups i.e. Baccarat 1 and Baccarat 2.</li>
              <li>Baccarat 1 is 1st, 2nd and 3rd cards to be open.</li>
              <li>Baccarat 2 is 4th, 5th and 6th cards to be open.</li>
              <li>This is a bet for comparison of Baccarat value of both the group i.e. Baccarat 1 and Baccarat 2.</li>
              <li>The group having higher baccarat value will win.</li>
              <li>To calculate baccarat value we will add point value of all three cards of that group and We will take last digit of that total as Baccarat value.</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">Point Value of cards:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Ace = 1</li>
              <li>2 = 2, 3 = 3, 4 = 4, 5 = 5, 6 = 6, 7 = 7, 8 = 8, 9 = 9</li>
              <li>10 = 0</li>
            </ul>

            <p className="font-semibold mt-2">Example:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Suppose three cards are 2, 5, 8</li>
              <li>2+5+8 = 15, Here last digit is 5 so baccarat value is 5.</li>
              <li>1, 2, 4</li>
              <li>1+2+4 = 7, In this case total is in single digit so we will take that single digit as baccarat value i.e. 7</li>
              <li className="font-semibold text-yellow-500">Note: In case If baccarat value of both the group is equal, In that case half of the betting amount will be returned.</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">FIX Point Card:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a bet for selecting any fix point card (Suits are irrelevant).</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
