import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock } from "lucide-react";

interface Poker20BettingBoardProps {
  bets?: any[];
  locked?: boolean;
  min?: number;
  max?: number;
  onPlaceBet: (betData: {
    betType: string;
    amount: number;
    odds: number;
    roundId?: string;
    sid?: string | number;
    side?: "back" | "lay";
  }) => Promise<void>;
}

const QUICK_CHIPS = [100, 500, 1000, 5000];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const isSuspended = (bet: any) => {
  if (!bet) return true;
  if (bet.status === "suspended" || bet.gstatus === "SUSPENDED" || bet.gstatus === "0") return true;
  const odds = bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0;
  return Number(odds) <= 0;
};

export const Poker20BettingBoard = ({
  bets = [],
  locked = false,
  min = 100,
  max = 100000,
  onPlaceBet,
}: Poker20BettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState<string>(String(min));

  // Poker20 hand types in order
  const pokerHands = [
    "Winner",
    "One Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush"
  ];

  // Find bet for a specific hand and player
  const findBetForHand = (handName: string, player: "A" | "B") => {
    const playerPrefix = player === "A" 
      ? ["player a", "playera", "player_a", "a", "player-a", "playera-"] 
      : ["player b", "playerb", "player_b", "b", "player-b", "playerb-"];
    
    const handVariations = [
      handName.toLowerCase(),
      handName.toLowerCase().replace(/\s+/g, ""),
      handName.toLowerCase().replace(/\s+/g, "_"),
      handName.toLowerCase().replace(/\s+/g, "-"),
    ];

    // First try: find bet with both player and hand
    let found = bets.find((b: any) => {
      const searchText = (b.type || b.nat || "").toLowerCase();
      const hasPlayer = playerPrefix.some(p => searchText.includes(p.toLowerCase()));
      const hasHand = handVariations.some(h => searchText.includes(h));
      return hasPlayer && hasHand;
    });

    // Fallback: if not found, try to find by hand only
    if (!found) {
      found = bets.find((b: any) => {
        const searchText = (b.type || b.nat || "").toLowerCase();
        return handVariations.some(h => searchText.includes(h));
      });
    }

    return found;
  };

  // Get all bets for a player in order
  const getPlayerBets = (player: "A" | "B") => {
    return pokerHands.map(hand => ({
      hand,
      bet: findBetForHand(hand, player)
    }));
  };

  const playerABets = getPlayerBets("A");
  const playerBBets = getPlayerBets("B");

  // Debug: Log bets
  if (bets.length > 0) {
    console.log(`🎰 Poker20 - Total Bets: ${bets.length}, Player A: ${playerABets.filter(b => b.bet).length}, Player B: ${playerBBets.filter(b => b.bet).length}`);
  }

  const totalBets = useMemo(() => {
    const bet = bets.find((b: any) => (b.type === selectedBet || b.nat === selectedBet));
    const amt = parseFloat(amount) || 0;
    return bet ? amt : 0;
  }, [bets, selectedBet, amount]);

  const handlePlace = async () => {
    const bet = bets.find((b: any) => (b.type === selectedBet || b.nat === selectedBet));
    const amt = parseFloat(amount);
    if (!bet || !amt || amt <= 0 || locked) return;
    
    const suspended = isSuspended(bet);
    if (suspended) return;
    
    const oddsValue = selectedSide === "back" 
      ? (bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0)
      : (bet?.lay ?? bet?.l1 ?? bet?.l ?? 0);
    
    const odds = Number(oddsValue);
    await onPlaceBet({
      betType: bet.type || bet.nat || selectedBet,
      amount: Math.min(Math.max(amt, min), max),
      odds: odds > 1000 ? odds / 100000 : odds,
      roundId: bet?.mid,
      sid: bet?.sid,
      side: selectedSide,
    });
    setSelectedBet("");
    setSelectedSide("back");
    setAmount(String(min));
  };

  const handleBetClick = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet) return;
    const suspended = isSuspended(bet);
    if (suspended || locked) return;
    setSelectedBet(bet.type || bet.nat || "");
    setSelectedSide(side);
  };

  // Poker20 Betting Cell - Matches image design exactly, responsive
  const Poker20Cell = ({ hand, bet }: { hand: string; bet: any }) => {
    const suspended = bet ? isSuspended(bet) : false;
    const disabled = locked || suspended;
    const backOdds = bet ? formatOdds(bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0) : "0.00";
    const isSelected = bet && (bet.type === selectedBet || bet.nat === selectedBet) && selectedSide === "back";

    return (
      <div className="flex flex-col border border-gray-300 bg-gray-100 min-w-0">
        {/* Hand Label - Dark gray/black text */}
        <div className="px-1 sm:px-2 py-1.5 sm:py-2 text-center bg-gray-100">
          <span className="text-xs sm:text-sm font-bold text-gray-900 truncate block">{hand}</span>
        </div>
        
        {/* Odds Box - Light blue background with white bold text */}
        <div
          onClick={() => bet && !disabled && handleBetClick(bet, "back")}
          className={`
            relative h-12 sm:h-14 bg-blue-400 flex items-center justify-center transition-all
            ${isSelected ? "ring-2 ring-yellow-400" : ""}
            ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-blue-500"}
            ${!bet ? "bg-gray-300" : ""}
          `}
        >
          {suspended || !bet ? (
            <Lock className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          ) : (
            <span className="text-sm sm:text-lg font-bold text-white">{backOdds}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Poker20 Betting Table - Responsive: Stack on mobile, side-by-side on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-gray-400 bg-gray-200 overflow-hidden rounded-lg">
        {/* Player A Section - Left Half */}
        <div className="border-b-2 md:border-b-0 md:border-r-2 border-gray-400">
          <div className="grid grid-cols-3 gap-0">
            {playerABets.map(({ hand, bet }, idx) => (
              <Poker20Cell key={`player-a-${hand}-${idx}`} hand={hand} bet={bet} />
            ))}
          </div>
        </div>

        {/* Player B Section - Right Half */}
        <div>
          <div className="grid grid-cols-3 gap-0">
            {playerBBets.map(({ hand, bet }, idx) => (
              <Poker20Cell key={`player-b-${hand}-${idx}`} hand={hand} bet={bet} />
            ))}
          </div>
        </div>
      </div>

      {/* Betting Controls - Responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_CHIPS.map((chip) => (
            <Button
              key={chip}
              size="sm"
              variant="outline"
              disabled={locked}
              onClick={() =>
                setAmount((prev) => {
                  const current = Number(prev) || 0;
                  const next = current + chip;
                  return String(next);
                })
              }
              className="text-xs"
            >
              ₹{chip}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            type="number"
            min={min}
            max={max}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={locked}
            className="max-w-[160px]"
          />
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            Min ₹{min} · Max ₹{max}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="text-sm whitespace-nowrap">
            Total: <span className="font-semibold">₹{totalBets}</span>
          </div>
          <Button
            size="sm"
            onClick={handlePlace}
            disabled={locked || !selectedBet || totalBets === 0}
            className="flex items-center gap-1 whitespace-nowrap"
          >
            <TrendingUp className="w-4 h-4" />
            Place Bet
          </Button>
        </div>
      </div>
    </div>
  );
};

