// src/features/live-casino/ui-templates/others/Race2Betting.tsx

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

interface Race2BettingProps {
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

export const Race2Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Race2BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
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

  const playerA = find(actualBetTypes, "Player A");
  const playerB = find(actualBetTypes, "Player B");
  const playerC = find(actualBetTypes, "Player C");
  const playerD = find(actualBetTypes, "Player D");

  const players = [
    { bet: playerA, label: "Player A" },
    { bet: playerB, label: "Player B" },
    { bet: playerC, label: "Player C" },
    { bet: playerD, label: "Player D" },
  ];

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

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Race to 2nd</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= PLAYERS GRID ================= */}
      <div className="border">
        {/* Header Row */}
        <div className="grid grid-cols-4 text-sm font-semibold border-b">
          {players.map((player) => (
            <div
              key={player.label}
              className="h-10 flex items-center justify-center border-r last:border-r-0"
            >
              {player.label}
            </div>
          ))}
        </div>

        {/* Back Odds Row */}
        <div className="grid grid-cols-4 border-b">
          {players.map((player, idx) => (
            <div
              key={`back-${player.label}`}
              className="border-r last:border-r-0"
            >
              <OddsCell bet={player.bet} side="back" />
            </div>
          ))}
        </div>

        {/* Lay Odds Row */}
        <div className="grid grid-cols-4">
          {players.map((player, idx) => (
            <div
              key={`lay-${player.label}`}
              className="border-r last:border-r-0"
            >
              <OddsCell bet={player.bet} side="lay" />
            </div>
          ))}
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

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Race to 2nd Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              Race to 2nd is a new kind of game and the brilliance of this game will test your nerve.
            </p>
            <p>
              In this unique game the player who has the 2nd highest ranking card will be the winner (and not the highest ranking card).
            </p>
            <p>
              Race to 2nd is played with a regular single deck of 52 cards.
            </p>
            <p>
              This game is played among 4 players: <b>Player A, Player B, Player C and Player D</b>
            </p>
            <p>
              All the 4 players will be dealt one card each.
            </p>
            <p>
              The objective of the game is to guess which player will have the 2nd highest ranking card and therefor win.
            </p>
            
            <p className="font-semibold mt-2">RANKINGS OF CARDS FROM HIGHEST TO LOWEST:</p>
            <p className="font-semibold">
              A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2
            </p>
            <p className="text-xs text-gray-600">
              Here Ace of spades is the highest ranking card and 2 of Diamonds is the lowest ranking card.
            </p>

            <p className="font-semibold mt-2">Suit Sequence:</p>
            <p className="font-semibold">
              {'}'} SPADES 1st (First)<br />
              {'{'} HEARTS 2nd (Second)<br />
              ] CLUBS 3rd (Third)<br />
              [ DIAMONDS 4th (Fourth)
            </p>

            <p className="font-semibold mt-2">Example 1:</p>
            <p>
              If all the players have following hands:<br />
              Player A - 5 of Hearts<br />
              Player B - Ace of Hearts<br />
              Player C - 2 of Clubs<br />
              Player D - King of Clubs
            </p>
            <p>
              Here all four Players have different hands the ranking of the cards will be as follows:<br />
              Highest Ranking card (1st) will be Ace of Hearts.<br />
              Second Highest Ranking card (2nd) will be King of Clubs.<br />
              Third Highest Ranking card (3rd) will be 5 of Hearts.<br />
              Fourth Highest Ranking card (4th) will be 2 of Clubs.
            </p>
            <p>
              Here the second Highest Ranking card is King of Clubs So Player D will be the winner.
            </p>

            <p className="font-semibold mt-2">Example 2:</p>
            <p>
              If all the players have following hands:<br />
              Player A - 3 of Spades<br />
              Player B - 3 of Hearts<br />
              Player C - 3 of Clubs<br />
              Player D - 3 of Diamonds
            </p>
            <p>
              As here all four players have same hands but of different suits the ranking of the cards will be as follows:<br />
              Highest Ranking card (1st) will be 3 of Spades.<br />
              Second Highest Ranking card (2nd) will be 3 of Hearts.<br />
              Third Highest Ranking card (3rd) will be 3 of Clubs.<br />
              Fourth Highest Ranking card (4th) will be 3 of Diamonds.
            </p>
            <p>
              Here, the second highest ranking card is 3 of Hearts so player B will be the winner.
            </p>

            <p className="font-semibold mt-2">
              You will have betting options of Back and Lay on every card.
            </p>
            <p>
              In this game there will be no Tie.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
