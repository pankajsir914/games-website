// src/features/live-casino/ui-templates/others/BtableBetting.tsx

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

interface BtableBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED" || b?.gstatus !== "OPEN" || b?.visible === 0;

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

export const BtableBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: BtableBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

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

  // Separate bets by type
  const matchBets = useMemo(() => {
    return actualBetTypes
      .filter((b: any) => b.etype === "match" && (b.visible === 1 || b.visible === undefined))
      .sort((a: any, b: any) => (a.sr || a.sid || 0) - (b.sr || b.sid || 0))
      .slice(0, 6);
  }, [actualBetTypes]);

  const oddBet = find(actualBetTypes, "Odd");
  const redBet = find(actualBetTypes, "Red");
  const blackBet = find(actualBetTypes, "Black");
  const cardJBet = find(actualBetTypes, "Card J");
  const cardQBet = find(actualBetTypes, "Card Q");
  const cardKBet = find(actualBetTypes, "card K");
  const cardABet = find(actualBetTypes, "card A");
  const dulhaDulhanBet = find(actualBetTypes, "Dulha Dulhan K-Q");
  const baratiBet = find(actualBetTypes, "Barati J-A");

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

  // Match Bet Cell Component (with header)
  const MatchBetCell = ({ bet, label }: { bet: any; label: string }) => {
    const backOdds = getOdds(bet, "back");
    const layOdds = getOdds(bet, "lay");
    const backFormatted = formatOdds(backOdds);
    const layFormatted = formatOdds(layOdds);
    const suspended = isSuspended(bet) || (backFormatted === "0.00" && layFormatted === "0.00");

    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
        {/* Header - Dark Blue */}
        <div className="bg-blue-800 dark:bg-blue-900 text-white text-center py-1.5 px-2 text-xs sm:text-sm font-semibold uppercase">
          {label}
        </div>
        {/* Odds Buttons - Light Blue (Back) and Pink (Lay) */}
        <div className="grid grid-cols-2">
          <button
            disabled={suspended || loading || backFormatted === "0.00"}
            onClick={() => openBetModal(bet, "back")}
            className={`
              h-10 sm:h-12 flex items-center justify-center text-sm sm:text-base font-semibold text-white
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${
                suspended || backFormatted === "0.00"
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-sky-400 hover:bg-sky-500"
              }
            `}
          >
            {suspended || backFormatted === "0.00" ? <Lock size={14} /> : backFormatted}
          </button>
          <button
            disabled={suspended || loading || layFormatted === "0.00"}
            onClick={() => openBetModal(bet, "lay")}
            className={`
              h-10 sm:h-12 flex items-center justify-center text-sm sm:text-base font-semibold text-white
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${
                suspended || layFormatted === "0.00"
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-pink-400 hover:bg-pink-500"
              }
            `}
          >
            {suspended || layFormatted === "0.00" ? <Lock size={14} /> : layFormatted}
          </button>
        </div>
      </div>
    );
  };

  // Odd Bet Component (with light grey header)
  const OddBetComponent = () => {
    const backOdds = getOdds(oddBet, "back");
    const layOdds = getOdds(oddBet, "lay");
    const backFormatted = formatOdds(backOdds);
    const layFormatted = formatOdds(layOdds);
    const suspended = isSuspended(oddBet) || (backFormatted === "0.00" && layFormatted === "0.00");

    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
        {/* Header - Light Grey */}
        <div className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white text-center py-1.5 px-2 text-xs sm:text-sm font-semibold">
          Odd
        </div>
        {/* Odds Buttons */}
        <div className="grid grid-cols-2">
          <button
            disabled={suspended || loading || backFormatted === "0.00"}
            onClick={() => openBetModal(oddBet, "back")}
            className={`
              h-10 sm:h-12 flex items-center justify-center text-sm sm:text-base font-semibold text-white
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${
                suspended || backFormatted === "0.00"
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-sky-400 hover:bg-sky-500"
              }
            `}
          >
            {suspended || backFormatted === "0.00" ? <Lock size={14} /> : backFormatted}
          </button>
          <button
            disabled={suspended || loading || layFormatted === "0.00"}
            onClick={() => openBetModal(oddBet, "lay")}
            className={`
              h-10 sm:h-12 flex items-center justify-center text-sm sm:text-base font-semibold text-white
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${
                suspended || layFormatted === "0.00"
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-pink-400 hover:bg-pink-500"
              }
            `}
          >
            {suspended || layFormatted === "0.00" ? <Lock size={14} /> : layFormatted}
          </button>
        </div>
      </div>
    );
  };

  // Fancy Bet Component (dark blue button with odds above)
  const FancyBetButton = ({ bet, label }: { bet: any; label: string }) => {
    const odds = getOdds(bet, "back");
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    if (!bet) return null;

    return (
      <div className="space-y-1">
        {/* Odds Display - White text on transparent */}
        <div className="text-center text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
          {suspended ? "0.00" : formattedOdds}
        </div>
        {/* Bet Button - Dark Blue */}
        <button
          disabled={suspended || loading}
          onClick={() => openBetModal(bet, "back")}
          className={`
            w-full py-2 sm:py-3 px-2 rounded text-xs sm:text-sm font-semibold text-white
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            ${
              suspended
                ? "bg-gray-400 dark:bg-gray-700"
                : "bg-blue-800 dark:bg-blue-900 hover:bg-blue-900 dark:hover:bg-blue-950"
            }
          `}
        >
          {suspended ? <Lock size={14} className="mx-auto" /> : label}
        </button>
      </div>
    );
  };

  // Suit Bet Component (Red or Black with suit icons)
  const SuitBetButton = ({ bet, label, icons }: { bet: any; label: string; icons: string[] }) => {
    const odds = getOdds(bet, "back");
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    if (!bet) return null;

    return (
      <div className="space-y-1">
        {/* Odds Display */}
        <div className="text-center text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
          {suspended ? "0.00" : formattedOdds}
        </div>
        {/* Bet Button - Dark Blue with suit icons */}
        <button
          disabled={suspended || loading}
          onClick={() => openBetModal(bet, "back")}
          className={`
            w-full py-2 sm:py-3 px-2 rounded text-xs sm:text-sm font-semibold text-white
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
            ${
              suspended
                ? "bg-gray-400 dark:bg-gray-700"
                : "bg-blue-800 dark:bg-blue-900 hover:bg-blue-900 dark:hover:bg-blue-950"
            }
          `}
        >
          {suspended ? (
            <Lock size={14} />
          ) : (
            <>
              {icons.map((icon, idx) => (
                <span key={idx} className="text-base sm:text-lg">{icon}</span>
              ))}
            </>
          )}
        </button>
      </div>
    );
  };

  // Card Panel Component (J, Q, K, A cards)
  const CardPanel = () => {
    const cards = [
      { bet: cardJBet, label: "J" },
      { bet: cardQBet, label: "Q" },
      { bet: cardKBet, label: "K" },
      { bet: cardABet, label: "A" },
    ];

    // Get average or first available odds
    const avgOdds = cards.find((c) => c.bet)?.bet 
      ? formatOdds(getOdds(cards.find((c) => c.bet)?.bet, "back"))
      : "0.00";

    return (
      <div className="space-y-1">
        {/* Odds Display - Black text */}
        <div className="text-center text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
          {avgOdds}
        </div>
        {/* Card Panel - Light Grey */}
        <div className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 sm:p-3">
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {cards.map((card, idx) => {
              const bet = card.bet;
              const odds = bet ? getOdds(bet, "back") : 0;
              const formattedOdds = formatOdds(odds);
              const suspended = !bet || isSuspended(bet) || formattedOdds === "0.00";

              return (
                <button
                  key={idx}
                  disabled={suspended || loading}
                  onClick={() => bet && openBetModal(bet, "back")}
                  className={`
                    aspect-square border-2 rounded
                    flex flex-col items-center justify-center
                    transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      suspended
                        ? "border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
                        : "border-yellow-400 dark:border-yellow-600 bg-white dark:bg-gray-800 hover:scale-105"
                    }
                  `}
                >
                  <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                    {card.label}
                  </div>
                  <div className="flex gap-0.5 mt-0.5">
                    <span className="text-[8px] sm:text-[10px] text-black">♠</span>
                    <span className="text-[8px] sm:text-[10px] text-red-600">♥</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm sm:text-base font-semibold">Bollywood Table</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-7 w-7 sm:h-8 sm:w-8">
          <Info size={14} className="sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* ================= MATCH BETS SECTION (Top 3x2 Grid) ================= */}
      <div className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {matchBets.map((bet: any, idx: number) => {
            const labels = ["A.DON", "B.AMAR AKBAR ANTHONY", "C.SAHIB BIBI AUR GHULAM", "D.DHARAM VEER", "E.KIS KIS KO PYAAR KAROON", "F.GHULAM"];
            return (
              <MatchBetCell
                key={bet.sid || idx}
                bet={bet}
                label={labels[idx] || bet.nat?.toUpperCase() || ""}
              />
            );
          })}
        </div>
      </div>

      {/* ================= MIDDLE SECTION ROW 1 ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        {/* Odd Bet */}
        <OddBetComponent />

        {/* Dulha Dulhan K-Q */}
        <FancyBetButton bet={dulhaDulhanBet} label="Dulha Dulhan K-Q" />

        {/* Barati J-A */}
        <FancyBetButton bet={baratiBet} label="Barati J-A" />
      </div>

      {/* ================= MIDDLE SECTION ROW 2 ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        {/* Red Suits */}
        <SuitBetButton bet={redBet} label="Red" icons={["♥", "♦"]} />

        {/* Black Suits */}
        <SuitBetButton bet={blackBet} label="Black" icons={["♠", "♣"]} />

        {/* J/Q/K/A Cards Panel */}
        <CardPanel />
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

          {selectedBet && (
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSide))}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: ₹{selectedBet.min || 100} Max: ₹{selectedBet.max || 0}
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
                min={selectedBet.min || 100}
                max={selectedBet.max || 0}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10"
              />

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm h-9 sm:h-10"
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
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader className="px-3 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle className="text-sm sm:text-base">Bollywood Table Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-[10px] sm:text-xs leading-relaxed text-gray-700 dark:text-gray-300 px-3 sm:px-6 pb-4 sm:pb-6">
            <ul className="list-disc pl-4 space-y-2">
              <li>
                The bollywood table game will be played with a total of 16 cards including (J, Q, K, A) these cards and 2 deck that means game is playing with total 16*2 = 32 cards
              </li>
              <li>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 inline-block mt-1">
                  <span>If the card is </span>
                  <span className="font-mono text-black dark:text-white">A&#125;</span>
                  <span> Don Wins</span>
                </div>
              </li>
              <li>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 inline-block mt-1">
                  <span>If the card is </span>
                  <span className="font-mono text-red-600">A&#123;</span>
                  <span className="font-mono text-red-600 ml-1">A&#91;</span>
                  <span className="font-mono text-black dark:text-white ml-1">A&#93;</span>
                  <span> Amar Akbar Anthony Wins</span>
                </div>
              </li>
              <li>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 inline-block mt-1">
                  <span>If the card is </span>
                  <span className="font-mono text-black dark:text-white">K&#125;</span>
                  <span className="font-mono text-black dark:text-white ml-1">Q&#125;</span>
                  <span className="font-mono text-black dark:text-white ml-1">J&#125;</span>
                  <span> Sahib Bibi aur Ghulam Wins</span>
                </div>
              </li>
              <li>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 inline-block mt-1">
                  <span>If the card is </span>
                  <span className="font-mono text-red-600">K&#91;</span>
                  <span className="font-mono text-black dark:text-white ml-1">K&#93;</span>
                  <span> Dharam Veer Wins</span>
                </div>
              </li>
              <li>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 inline-block mt-1">
                  <span>If the card is </span>
                  <span className="font-mono text-red-600">K&#123;</span>
                  <span className="font-mono text-black dark:text-white ml-1">Q&#93;</span>
                  <span className="font-mono text-red-600 ml-1">Q&#91;</span>
                  <span className="font-mono text-red-600 ml-1">Q&#123;</span>
                  <span> Kis Kisko Pyaar Karoon Wins</span>
                </div>
              </li>
              <li>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 inline-block mt-1">
                  <span>If the card is </span>
                  <span className="font-mono text-red-600">J&#123;</span>
                  <span className="font-mono text-black dark:text-white ml-1">J&#93;</span>
                  <span className="font-mono text-red-600 ml-1">J&#91;</span>
                  <span> Ghulam Wins</span>
                </div>
              </li>
            </ul>

            <ul className="list-disc pl-4 space-y-2 mt-4">
              <li>
                <b>ODD:</b> J K A
              </li>
              <li>
                <b>DULHA DULHAN:</b> Q K <span className="text-blue-600 dark:text-blue-400">Payout: 1.97</span>
              </li>
              <li>
                <b>BARATI:</b> A J <span className="text-blue-600 dark:text-blue-400">Payout: 1.97</span>
              </li>
              <li>
                <b>RED:</b> <span className="text-blue-600 dark:text-blue-400">Payout: 1.97</span>
              </li>
              <li>
                <b>BLACK:</b> <span className="text-blue-600 dark:text-blue-400">Payout: 1.97</span>
              </li>
              <li>
                <span>J, Q, K, A</span> <div className="text-blue-600 dark:text-blue-400 font-semibold mt-1">PAYOUT: 3.75</div>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2">Movie Mapping:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>A = DON</li>
                <li>B = AMAR AKBAR ANTHONY</li>
                <li>C = SAHIB BIBI AUR GHULAM</li>
                <li>D = DHARAM VEER</li>
                <li>E = KIS KISKO PYAAR KAROON</li>
                <li>F = GHULAM</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
