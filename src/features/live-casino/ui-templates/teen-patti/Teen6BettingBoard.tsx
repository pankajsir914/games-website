import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Teen6BettingBoardProps {
  bets: any[];
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
  odds?: any;
  resultHistory?: Array<{
    mid: string | number;
    win: "Player A" | "Player B" | "A" | "B";
    winnerId?: string;
  }>;
  onResultClick?: (result: any) => void;
}

const QUICK_CHIPS = [10, 50, 100, 500, 1000];

const CARD_ORDER = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const isSuspended = (bet: any) =>
  !bet || bet?.gstatus === "SUSPENDED" || bet?.status === "suspended";

const findBet = (bets: any[], searchTerm: string) => {
  if (!bets || bets.length === 0) return null;
  
  const normalized = searchTerm.toLowerCase().trim();
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase().trim();
    return (
      betName === normalized ||
      betName.includes(normalized) ||
      betName.includes(`player ${normalized}`) ||
      betName.includes(`${normalized} player`) ||
      betName.includes(`under ${normalized}`) ||
      betName.includes(`over ${normalized}`)
    );
  });
};

const getCardBet = (bets: any[], card: string) => {
  if (!bets || bets.length === 0) return null;
  const normalized = card.toLowerCase();
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase();
    return (
      betName === normalized ||
      betName.includes(`joker ${normalized}`) ||
      betName.includes(`${normalized} joker`)
    );
  });
};

export const Teen6BettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: Teen6BettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

  // Find Player A and Player B bets
  const playerA = findBet(bets, "player a") || findBet(bets, "a");
  const playerB = findBet(bets, "player b") || findBet(bets, "b");

  // Find Under/Over bets for each player
  const playerAUnder21 = findBet(bets, "player a under 21") || findBet(bets, "a under 21") || findBet(bets, "under 21");
  const playerAOver22 = findBet(bets, "player a over 22") || findBet(bets, "a over 22") || findBet(bets, "over 22");
  const playerBUnder21 = findBet(bets, "player b under 21") || findBet(bets, "b under 21");
  const playerBOver22 = findBet(bets, "player b over 22") || findBet(bets, "b over 22");

  // Find suit bets
  const suits = [
    { key: "spade", icon: "♠", label: "Spade", color: "text-black" },
    { key: "heart", icon: "♥", label: "Heart", color: "text-red-500" },
    { key: "club", icon: "♣", label: "Club", color: "text-black" },
    { key: "diamond", icon: "♦", label: "Diamond", color: "text-red-500" },
  ].map((s) => ({
    ...s,
    bet: findBet(bets, s.key),
  }));

  // Find Odd/Even bets
  const oddBet = findBet(bets, "odd");
  const evenBet = findBet(bets, "even");

  const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
  const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

  const handleBetClick = (bet: any, betName: string, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    setSelectedBetData({ ...bet, side });
    setSelectedBet(`${betName}-${side}`);
    setModalOpen(true);
  };

  const handlePlace = async () => {
    if (!selectedBetData || !amount || parseFloat(amount) <= 0 || locked) return;
    
    const amt = parseFloat(amount);
    const side = selectedBetData?.side || "back";
    const oddsValue = side === "back" 
      ? Number(getBackOdds(selectedBetData))
      : Number(getLayOdds(selectedBetData));
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
    
    // Extract roundId from bet data or odds
    const roundIdFromBet = selectedBetData?.mid || selectedBetData?.round_id || selectedBetData?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds = raw?.mid || raw?.round_id || raw?.round || raw?.gmid || raw?.game_id ||
                           odds?.mid || odds?.round_id || odds?.round || odds?.gmid || odds?.game_id;
    const roundIdFromFirstBet = bets.length > 0 && (bets[0]?.mid || bets[0]?.round_id || bets[0]?.round);
    const finalRoundId = roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;

    await onPlaceBet({
      betType: selectedBetData?.nat || selectedBetData?.type || selectedBet.split("-")[0],
      amount: Math.min(Math.max(amt, min), max),
      odds: finalOdds,
      roundId: finalRoundId,
      sid: selectedBetData?.sid,
      side: side,
    });
    
    setModalOpen(false);
    setSelectedBet("");
    setAmount(String(min));
    setSelectedBetData(null);
  };

  const last10 = resultHistory.slice(0, 10);

  return (
    <>
      <Card className="border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Teen6 Bets
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                  className="text-[10px] sm:text-xs px-2 sm:px-3"
                >
                  ₹{chip}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Player A vs Player B - Back/Lay Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { label: "Player A", bet: playerA, underBet: playerAUnder21, overBet: playerAOver22 },
              { label: "Player B", bet: playerB, underBet: playerBUnder21, overBet: playerBOver22 },
            ].map(({ label, bet, underBet, overBet }) => {
              const disabled = locked || isSuspended(bet);
              const backOdds = formatOdds(getBackOdds(bet));
              const layOdds = formatOdds(getLayOdds(bet));
              const backDisabled = disabled || backOdds === "0.00";
              const layDisabled = disabled || layOdds === "0.00";

              return (
                <div key={label} className="border rounded-lg p-3 bg-muted/30">
                  {/* Player Header */}
                  <div className="font-bold text-sm mb-3 text-center">{label}</div>
                  
                  {/* Back/Lay Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Back Column */}
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-center text-muted-foreground">
                        Back
                      </div>
                      <div className="text-[10px] text-center text-muted-foreground mb-1">
                        Main
                      </div>
                      <button
                        onClick={() => handleBetClick(bet, bet?.nat || bet?.type || label, "back")}
                        disabled={backDisabled}
                        className={`w-full h-[60px] rounded flex flex-col items-center justify-center font-bold transition-all relative ${
                          backDisabled
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer shadow-md hover:shadow-lg"
                        }`}
                      >
                        {backDisabled && (
                          <Lock className="w-4 h-4 absolute top-1 right-1 text-gray-500" />
                        )}
                        <span className="text-lg font-bold">
                          {backOdds === "0.00" ? "0" : backOdds}
                        </span>
                      </button>
                    </div>

                    {/* Lay Column */}
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-center text-muted-foreground">
                        Lay
                      </div>
                      <div className="text-[10px] text-center text-muted-foreground mb-1">
                        Main
                      </div>
                      <button
                        onClick={() => handleBetClick(bet, bet?.nat || bet?.type || label, "lay")}
                        disabled={layDisabled}
                        className={`w-full h-[60px] rounded flex flex-col items-center justify-center font-bold transition-all relative ${
                          layDisabled
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-pink-400 hover:bg-pink-500 text-white cursor-pointer shadow-md hover:shadow-lg"
                        }`}
                      >
                        {layDisabled && (
                          <Lock className="w-4 h-4 absolute top-1 right-1 text-gray-500" />
                        )}
                        <span className="text-lg font-bold">
                          {layOdds === "0.00" ? "0" : layOdds}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Under/Over Bets */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleBetClick(underBet, underBet?.nat || underBet?.type || `${label} Under 21`, "back")}
                      disabled={locked || isSuspended(underBet)}
                      className={`h-[40px] rounded flex items-center justify-center font-bold text-sm transition-all ${
                        locked || isSuspended(underBet)
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer"
                      }`}
                    >
                      <span className="text-xs">Under 21</span>
                      <span className="ml-1 text-xs">
                        {formatOdds(getBackOdds(underBet)) === "0.00" ? "0" : formatOdds(getBackOdds(underBet))}
                      </span>
                    </button>
                    <button
                      onClick={() => handleBetClick(overBet, overBet?.nat || overBet?.type || `${label} Over 22`, "back")}
                      disabled={locked || isSuspended(overBet)}
                      className={`h-[40px] rounded flex items-center justify-center font-bold text-sm transition-all ${
                        locked || isSuspended(overBet)
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer"
                      }`}
                    >
                      <span className="text-xs">Over 22</span>
                      <span className="ml-1 text-xs">
                        {formatOdds(getBackOdds(overBet)) === "0.00" ? "0" : formatOdds(getBackOdds(overBet))}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suits and Odd/Even Row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-border/50">
            {/* Suits */}
            {suits.map((s) => {
              const disabled = locked || isSuspended(s.bet);
              const backOdds = formatOdds(getBackOdds(s.bet));
              return (
                <div key={s.key} className="text-center">
                  <div className={`text-2xl mb-1 ${s.color}`}>{s.icon}</div>
                  <button
                    onClick={() => handleBetClick(s.bet, s.bet?.nat || s.bet?.type || s.label, "back")}
                    disabled={disabled}
                    className={`w-full h-[50px] rounded flex items-center justify-center font-bold transition-all ${
                      disabled
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer shadow-md"
                    }`}
                  >
                    {backOdds === "0.00" ? "0" : backOdds}
                  </button>
                </div>
              );
            })}

            {/* Odd/Even */}
            {[
              { label: "Odd", bet: oddBet },
              { label: "Even", bet: evenBet },
            ].map(({ label, bet }) => {
              const disabled = locked || isSuspended(bet);
              const backOdds = formatOdds(getBackOdds(bet));
              return (
                <div key={label} className="text-center">
                  <div className="font-bold text-xs mb-1">{label}</div>
                  <button
                    onClick={() => handleBetClick(bet, bet?.nat || bet?.type || label, "back")}
                    disabled={disabled}
                    className={`w-full h-[50px] rounded flex items-center justify-center font-bold transition-all ${
                      disabled
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer shadow-md"
                    }`}
                  >
                    {backOdds === "0.00" ? "0" : backOdds}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Playing Cards Display */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex flex-wrap gap-1 sm:gap-2 justify-center pb-2">
              {CARD_ORDER.map((card) => {
                const cardBet = getCardBet(bets, card);
                const disabled = locked || isSuspended(cardBet);
                const backOdds = formatOdds(getBackOdds(cardBet));
                
                return (
                  <div key={card} className="w-[50px] sm:w-[60px] md:w-[70px]">
                    {/* Odds above card */}
                    <div className="text-center mb-1">
                      <span className="text-xs font-semibold">
                        {backOdds === "0.00" ? "0" : backOdds}
                      </span>
                    </div>
                    {/* Card */}
                    <button
                      onClick={() => handleBetClick(cardBet, cardBet?.nat || cardBet?.type || card, "back")}
                      disabled={disabled}
                      className={`w-full h-[70px] sm:h-[80px] rounded border-2 flex flex-col items-center justify-center font-bold transition-all relative ${
                        disabled
                          ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-white border-yellow-400 text-black cursor-pointer hover:border-yellow-500 hover:shadow-lg"
                      }`}
                    >
                      {/* Card Rank */}
                      <div className="text-sm sm:text-lg font-bold mb-1">{card}</div>
                      {/* Suit Icons */}
                      <div className="flex gap-0.5 text-[10px] sm:text-xs">
                        <span className="text-black">♠</span>
                        <span className="text-black">♣</span>
                        <span className="text-red-500">♥</span>
                        <span className="text-red-500">♦</span>
                      </div>
                      {disabled && (
                        <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 absolute top-1 right-1 text-gray-500" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Amount Input and Place Bet */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked}
                className="flex-1 sm:max-w-[160px]"
                placeholder="Enter amount"
              />
              <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                Min ₹{min} · Max ₹{max}
              </div>
            </div>
            <div className="text-xs sm:text-sm text-center sm:text-left">
              Total: <span className="font-semibold">₹{parseFloat(amount) || 0}</span>
            </div>
          </div>

          {/* Last 10 Results */}
          {last10.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs mb-2 text-muted-foreground">Last 10 Results</p>
              <div className="flex gap-1 flex-wrap">
                {last10.map((r, i) => {
                  const winner = r.win === "Player A" || r.win === "A" ? "A" : "B";
                  const isPlayerA = winner === "A";
                  return (
                    <Button
                      key={i}
                      size="sm"
                      variant="outline"
                      className={`w-9 h-9 p-0 font-bold ${
                        isPlayerA
                          ? "bg-blue-500 text-white border-blue-600"
                          : "bg-red-500 text-white border-red-600"
                      }`}
                      onClick={() => onResultClick?.(r)}
                    >
                      {winner}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bet Confirmation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Bet Type</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold">
                {selectedBetData?.nat || selectedBetData?.type || selectedBet.split("-")[0]}
              </div>
            </div>

            <div>
              <Label>Side</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold uppercase">
                {selectedBetData?.side || "back"}
              </div>
            </div>

            <div>
              <Label>Odds</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold">
                {selectedBetData?.side === "lay"
                  ? formatOdds(getLayOdds(selectedBetData))
                  : formatOdds(getBackOdds(selectedBetData))}
              </div>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked}
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Potential Win</div>
              <div className="text-lg font-bold">
                ₹{(
                  (parseFloat(amount) || 0) *
                  (() => {
                    const side = selectedBetData?.side || "back";
                    const oddsValue = side === "back"
                      ? Number(getBackOdds(selectedBetData))
                      : Number(getLayOdds(selectedBetData));
                    return oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                  })()
                ).toFixed(2)}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={locked || !selectedBetData || parseFloat(amount) <= 0}
              onClick={handlePlace}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Place Bet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

