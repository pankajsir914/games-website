import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, Lock } from "lucide-react";

interface PokerBettingBoardProps {
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

export const PokerBettingBoard = ({
  bets = [],
  locked = false,
  min = 100,
  max = 100000,
  onPlaceBet,
}: PokerBettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState<string>(String(min));
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find specific bets for Player A and Player B
  const findBet = (searchTerms: string[], excludeTerms: string[] = []) => {
    return bets.find((bet: any) => {
      const searchText = (bet.type || bet.nat || "").toLowerCase();
      const hasMatch = searchTerms.some(term => searchText.includes(term.toLowerCase()));
      const hasExclude = excludeTerms.some(term => searchText.includes(term.toLowerCase()));
      return hasMatch && !hasExclude;
    });
  };

  const playerABack = findBet(["player a back", "playera back", "player a", "playera"], ["player b", "playerb"]);
  const playerALay = findBet(["player a lay", "playera lay"], ["player b", "playerb"]);
  const playerBBack = findBet(["player b back", "playerb back", "player b", "playerb"], ["player a", "playera"]);
  const playerBLay = findBet(["player b lay", "playerb lay"], ["player a", "playera"]);
  
  // Bonus bets - try to find player-specific first, then fallback to generic
  const playerA2Cards = findBet(["player a 2 card", "playera 2 card"], ["player b", "playerb"]) || 
                       findBet(["2 card bonus", "2 cards bonus"], ["player b", "playerb", "7"]);
  const playerA7Cards = findBet(["player a 7 card", "playera 7 card"], ["player b", "playerb"]) || 
                       findBet(["7 card bonus", "7 cards bonus"], ["player b", "playerb", "2"]);
  const playerB2Cards = findBet(["player b 2 card", "playerb 2 card"], ["player a", "playera"]) || 
                       findBet(["2 card bonus", "2 cards bonus"], ["player a", "playera", "7"]);
  const playerB7Cards = findBet(["player b 7 card", "playerb 7 card"], ["player a", "playera"]) || 
                       findBet(["7 card bonus", "7 cards bonus"], ["player a", "playera", "2"]);

  // Map all bets to display format (for fallback)
  const allBets = bets.map((bet, idx) => ({
    bet,
    label: bet.type || bet.nat || bet.label || `Bet ${idx + 1}`,
    suspended: isSuspended(bet),
  }));

  const totalBets = useMemo(() => {
    if (!selectedBet) return 0;
    const amt = parseFloat(amount) || 0;
    return amt;
  }, [selectedBet, amount]);

  const handlePlace = async () => {
    if (!selectedBet) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || locked) return;
    
    const suspended = isSuspended(selectedBet);
    if (suspended) return;
    
    const oddsValue = selectedSide === "back" 
      ? (selectedBet?.back ?? selectedBet?.b1 ?? selectedBet?.b ?? selectedBet?.odds ?? 0)
      : (selectedBet?.lay ?? selectedBet?.l1 ?? selectedBet?.l ?? 0);
    
    const odds = Number(oddsValue);
    await onPlaceBet({
      betType: selectedBet.type || selectedBet.nat || "",
      amount: Math.min(Math.max(amt, min), max),
      odds: odds > 1000 ? odds / 100000 : odds,
      roundId: selectedBet?.mid,
      sid: selectedBet?.sid,
      side: selectedSide,
    });
    
    // Close modal and reset
    setIsModalOpen(false);
    setSelectedBet(null);
    setSelectedSide("back");
    setAmount(String(min));
  };

  const handleBetClick = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet) return;
    const suspended = isSuspended(bet);
    if (suspended || locked) return;
    setSelectedBet(bet);
    setSelectedSide(side);
    setIsModalOpen(true);
  };

  // Player Section Component
  const PlayerSection = ({ 
    playerName, 
    backBet, 
    layBet, 
    bonus2Cards, 
    bonus7Cards 
  }: { 
    playerName: string; 
    backBet?: any; 
    layBet?: any;
    bonus2Cards?: any;
    bonus7Cards?: any;
  }) => {
    const backOdds = formatOdds(backBet?.back ?? backBet?.b1 ?? backBet?.b ?? backBet?.odds ?? 0);
    const layOdds = formatOdds(layBet?.lay ?? layBet?.l1 ?? layBet?.l ?? 0);
    const backSuspended = backBet ? isSuspended(backBet) : true;
    const laySuspended = layBet ? isSuspended(layBet) : true;
    const bonus2Suspended = bonus2Cards ? isSuspended(bonus2Cards) : true;
    const bonus7Suspended = bonus7Cards ? isSuspended(bonus7Cards) : true;
    
    const backDisabled = locked || backSuspended;
    const layDisabled = locked || laySuspended;
    const bonus2Disabled = locked || bonus2Suspended;
    const bonus7Disabled = locked || bonus7Suspended;

    const isBackSelected = backBet && selectedBet && (backBet.type === selectedBet.type || backBet.nat === selectedBet.nat) && selectedSide === "back";
    const isLaySelected = layBet && selectedBet && (layBet.type === selectedBet.type || layBet.nat === selectedBet.nat) && selectedSide === "lay";
    const isBonus2Selected = bonus2Cards && selectedBet && (bonus2Cards.type === selectedBet.type || bonus2Cards.nat === selectedBet.nat);
    const isBonus7Selected = bonus7Cards && selectedBet && (bonus7Cards.type === selectedBet.type || bonus7Cards.nat === selectedBet.nat);

    return (
      <div className="space-y-3">
        {/* Player Name and Odds Row */}
        <div className="flex items-center gap-2">
          {/* Player Name - White Box */}
          <div className="bg-white text-gray-900 px-4 py-2 rounded font-semibold text-sm min-w-[100px] text-center">
            {playerName}
          </div>
          
          {/* Back Odds - Blue Box */}
          <div
            onClick={() => backBet && !backDisabled && handleBetClick(backBet, "back")}
            className={`
              bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm min-w-[60px] text-center transition-all
              ${isBackSelected ? "ring-2 ring-yellow-400 scale-105" : ""}
              ${backDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-blue-600"}
            `}
          >
            {backSuspended || !backBet ? (
              <Lock className="w-4 h-4 mx-auto" />
            ) : (
              backOdds
            )}
          </div>
          
          {/* Lay Odds - Pink Box */}
          <div
            onClick={() => layBet && !layDisabled && handleBetClick(layBet, "lay")}
            className={`
              bg-pink-500 text-white px-4 py-2 rounded font-bold text-sm min-w-[60px] text-center transition-all
              ${isLaySelected ? "ring-2 ring-yellow-400 scale-105" : ""}
              ${layDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-pink-600"}
            `}
          >
            {laySuspended || !layBet ? (
              <Lock className="w-4 h-4 mx-auto" />
            ) : (
              layOdds
            )}
          </div>
        </div>

        {/* Bonus Cards Row */}
        <div className="flex items-center gap-2">
          {/* 2 Cards Bonus */}
          <div
            onClick={() => bonus2Cards && !bonus2Disabled && handleBetClick(bonus2Cards, "back")}
            className={`
              bg-blue-500 text-white px-4 py-2 rounded font-semibold text-sm flex-1 text-center transition-all
              ${isBonus2Selected ? "ring-2 ring-yellow-400 scale-105" : ""}
              ${bonus2Disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-blue-600"}
            `}
          >
            {bonus2Suspended || !bonus2Cards ? (
              <Lock className="w-4 h-4 mx-auto" />
            ) : (
              "2 Cards Bonus"
            )}
          </div>
          
          {/* 7 Cards Bonus */}
          <div
            onClick={() => bonus7Cards && !bonus7Disabled && handleBetClick(bonus7Cards, "back")}
            className={`
              bg-blue-500 text-white px-4 py-2 rounded font-semibold text-sm flex-1 text-center transition-all
              ${isBonus7Selected ? "ring-2 ring-yellow-400 scale-105" : ""}
              ${bonus7Disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-blue-600"}
            `}
          >
            {bonus7Suspended || !bonus7Cards ? (
              <Lock className="w-4 h-4 mx-auto" />
            ) : (
              "7 Cards Bonus"
            )}
          </div>
        </div>
      </div>
    );
  };

  // Check if we have the structured bets (Player A/B format)
  const hasStructuredBets = playerABack || playerBBack;

  return (
    <div className="space-y-4">
      {hasStructuredBets ? (
        /* Poker Betting Panel - Player A and Player B Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player A Section */}
          <PlayerSection
            playerName="Player A"
            backBet={playerABack}
            layBet={playerALay}
            bonus2Cards={playerA2Cards}
            bonus7Cards={playerA7Cards}
          />

          {/* Player B Section */}
          <PlayerSection
            playerName="Player B"
            backBet={playerBBack}
            layBet={playerBLay}
            bonus2Cards={playerB2Cards}
            bonus7Cards={playerB7Cards}
          />
        </div>
      ) : (
        /* Fallback: Show all bets in grid if structured format not found */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {allBets.map(({ label, bet, suspended }, idx) => {
            const disabled = locked || suspended;
            const backOdds = formatOdds(bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0);
            const layOdds = formatOdds(bet?.lay ?? bet?.l1 ?? bet?.l ?? 0);
            const hasLay = Number(bet?.lay ?? bet?.l1 ?? bet?.l ?? 0) > 0;
            const isSelected = selectedBet && (bet?.type === selectedBet.type || bet?.nat === selectedBet.nat);
            const isBackSelected = isSelected && selectedSide === "back";
            const isLaySelected = isSelected && selectedSide === "lay";

            return (
              <div
                key={`bet-${bet?.type || bet?.nat || bet?.sid || idx}-${idx}`}
                className={`
                  border rounded-md p-2 space-y-1 transition-all
                  ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40"}
                  ${suspended ? "opacity-50" : ""}
                `}
              >
                <div className="text-xs font-medium truncate text-center">{label}</div>
                <div className={`grid ${hasLay ? "grid-cols-2" : "grid-cols-1"} gap-1`}>
                  <button
                    onClick={() => !disabled && handleBetClick(bet, "back")}
                    disabled={disabled || backOdds === "0.00"}
                    className={`
                      h-8 text-xs px-2 text-white font-medium rounded transition-all
                      ${isBackSelected ? "ring-2 ring-green-500 scale-[1.02] bg-green-600" : "bg-green-600 hover:bg-green-700"}
                      ${disabled || backOdds === "0.00" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    {suspended || backOdds === "0.00" ? (
                      <Lock className="w-3 h-3 mx-auto" />
                    ) : (
                      `Back ${backOdds}`
                    )}
                  </button>
                  {hasLay && (
                    <button
                      onClick={() => !disabled && handleBetClick(bet, "lay")}
                      disabled={disabled || layOdds === "0.00"}
                      className={`
                        h-8 text-xs px-2 text-white font-medium rounded transition-all
                        ${isLaySelected ? "ring-2 ring-red-500 scale-[1.02] bg-red-600" : "bg-red-600 hover:bg-red-700"}
                        ${disabled || layOdds === "0.00" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      {suspended || layOdds === "0.00" ? (
                        <Lock className="w-3 h-3 mx-auto" />
                      ) : (
                        `Lay ${layOdds}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Place Bet Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Place Your Bet</DialogTitle>
            <DialogDescription>
              {selectedBet && (
                <div className="mt-2">
                  <div className="font-semibold text-foreground">
                    {selectedBet.type || selectedBet.nat || "Bet"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Odds: {formatOdds(
                      selectedSide === "back" 
                        ? (selectedBet?.back ?? selectedBet?.b1 ?? selectedBet?.b ?? selectedBet?.odds ?? 0)
                        : (selectedBet?.lay ?? selectedBet?.l1 ?? selectedBet?.l ?? 0)
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Quick Chips */}
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

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bet Amount</label>
              <Input
                type="number"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked}
                placeholder={`Min ₹${min} - Max ₹${max}`}
              />
              <div className="text-xs text-muted-foreground">
                Min ₹{min} · Max ₹{max}
              </div>
            </div>

            {/* Potential Win/Liability */}
            {selectedBet && (() => {
              const rawOdds = selectedSide === "back" 
                ? (selectedBet?.back ?? selectedBet?.b1 ?? selectedBet?.b ?? selectedBet?.odds ?? 0)
                : (selectedBet?.lay ?? selectedBet?.l1 ?? selectedBet?.l ?? 0);
              const oddsNum = Number(rawOdds);
              const normalizedOdds = oddsNum > 1000 ? oddsNum / 100000 : oddsNum;
              const betAmount = parseFloat(amount) || 0;
              const potentialWin = betAmount * (normalizedOdds - 1);
              
              return (
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {selectedSide === "back" ? "Potential Win" : "Liability"}:
                    </span>
                    <span className="font-semibold">
                      ₹{potentialWin.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedBet(null);
                setAmount(String(min));
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlace}
              disabled={locked || !selectedBet || totalBets === 0 || parseFloat(amount) < min || parseFloat(amount) > max}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Place Bet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

