import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Teen3BettingBoardProps {
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
      betName.includes(`${normalized} player`)
    );
  });
};

export const Teen3BettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: Teen3BettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

  // Find Player A and Player B bets
  const playerA = findBet(bets, "player a") || findBet(bets, "a");
  const playerB = findBet(bets, "player b") || findBet(bets, "b");

  // Find other potential bets (Odd/Even, suits, etc.)
  const oddBet = findBet(bets, "odd");
  const evenBet = findBet(bets, "even");
  
  const suits = [
    { key: "spade", icon: "♠", label: "Spade" },
    { key: "club", icon: "♣", label: "Club" },
    { key: "heart", icon: "♥", label: "Heart" },
    { key: "diamond", icon: "♦", label: "Diamond" },
  ].map((s) => ({
    ...s,
    bet: findBet(bets, s.key),
  }));

  const totalBets = useMemo(() => {
    if (!selectedBetData || !amount) return 0;
    const amt = parseFloat(amount) || 0;
    return amt > 0 ? amt : 0;
  }, [selectedBetData, amount]);

  const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
  const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

  const handleBetClick = (bet: any, betName: string, side: "back" | "lay") => {
    if (!bet || isSuspended(bet)) return;
    setSelectedBetData({ ...bet, side });
    setSelectedBet(`${betName}-${side}`);
    setModalOpen(true);
  };

  const handlePlace = async () => {
    if (!selectedBetData || !amount || parseFloat(amount) <= 0 || locked) {
      console.warn("⚠️ [Teen3] Cannot place bet:", {
        hasSelectedBetData: !!selectedBetData,
        amount,
        locked
      });
      return;
    }
    
    try {
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

      const betType = selectedBetData?.nat || selectedBetData?.type || selectedBet.split("-")[0];
      const betAmount = Math.min(Math.max(amt, min), max);

      console.log("🟢 [Teen3] Placing bet:", {
        betType,
        amount: betAmount,
        odds: finalOdds,
        roundId: finalRoundId,
        sid: selectedBetData?.sid,
        side: side,
      });

      await onPlaceBet({
        betType: betType,
        amount: betAmount,
        odds: finalOdds,
        roundId: finalRoundId,
        sid: selectedBetData?.sid,
        side: side,
      });
      
      console.log("✅ [Teen3] Bet placed successfully");
      
      setModalOpen(false);
      setSelectedBet("");
      setAmount(String(min));
      setSelectedBetData(null);
    } catch (error) {
      console.error("❌ [Teen3] Error placing bet:", error);
      // Don't close modal on error so user can retry
    }
  };

  const last10 = resultHistory.slice(0, 10);

  return (
    <>
      <Card className="border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Teen3 Bets
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
              { label: "Player A", bet: playerA },
              { label: "Player B", bet: playerB },
            ].map(({ label, bet }) => {
              const disabled = locked || isSuspended(bet);
              const backOdds = formatOdds(getBackOdds(bet));
              const layOdds = formatOdds(getLayOdds(bet));
              const backDisabled = disabled || backOdds === "0.00";
              const layDisabled = disabled || layOdds === "0.00";

              return (
                <div key={label} className="border rounded-lg p-2 sm:p-3 bg-muted/30">
                  {/* Player Header */}
                  <div className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-center">{label}</div>
                  
                  {/* Back/Lay Grid */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
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
                        className={`w-full h-[50px] sm:h-[60px] rounded flex flex-col items-center justify-center font-bold transition-all relative ${
                          backDisabled
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer shadow-md hover:shadow-lg"
                        }`}
                      >
                        {backDisabled && (
                          <Lock className="w-3 h-3 sm:w-4 sm:h-4 absolute top-1 right-1 text-gray-500" />
                        )}
                        <span className="text-base sm:text-lg font-bold">
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
                        className={`w-full h-[50px] sm:h-[60px] rounded flex flex-col items-center justify-center font-bold transition-all relative ${
                          layDisabled
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-pink-400 hover:bg-pink-500 text-white cursor-pointer shadow-md hover:shadow-lg"
                        }`}
                      >
                        {layDisabled && (
                          <Lock className="w-3 h-3 sm:w-4 sm:h-4 absolute top-1 right-1 text-gray-500" />
                        )}
                        <span className="text-base sm:text-lg font-bold">
                          {layOdds === "0.00" ? "0" : layOdds}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Odd/Even Bets */}
          {(oddBet || evenBet) && (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-2 border-t border-border/50">
              {[
                { label: "ODD", bet: oddBet },
                { label: "EVEN", bet: evenBet },
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
                          ? "opacity-50 cursor-not-allowed bg-gray-600"
                          : "bg-purple-500 hover:bg-purple-600 cursor-pointer text-white"
                      }`}
                    >
                      {backOdds === "0.00" ? "0" : backOdds}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Suits */}
          {suits.some((s) => s.bet) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-2 border-t border-border/50">
              {suits.map((s) => {
                const disabled = locked || isSuspended(s.bet);
                const backOdds = formatOdds(getBackOdds(s.bet));
                return (
                  <div key={s.key} className="text-center">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <button
                      onClick={() => handleBetClick(s.bet, s.bet?.nat || s.bet?.type || s.label, "back")}
                      disabled={disabled}
                      className={`w-full h-[50px] rounded flex items-center justify-center font-bold transition-all ${
                        disabled
                          ? "opacity-50 cursor-not-allowed bg-gray-600"
                          : "bg-green-500 hover:bg-green-600 cursor-pointer text-white"
                      }`}
                    >
                      {backOdds === "0.00" ? "0" : backOdds}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

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
              Total: <span className="font-semibold">₹{totalBets}</span>
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
                {selectedBetData?.nat || selectedBetData?.type || selectedBet}
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
              disabled={locked || !selectedBetData || !amount || parseFloat(amount) <= 0 || parseFloat(amount) < min}
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

