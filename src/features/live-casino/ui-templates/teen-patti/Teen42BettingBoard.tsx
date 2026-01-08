import { useState } from "react";
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

interface Teen42BettingBoardProps {
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
      betName.includes(`${normalized} player`) ||
      betName.includes(`under 21`) ||
      betName.includes(`over 21`)
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

export const Teen42BettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: Teen42BettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

  // Find Player A and Player B bets
  const playerA = findBet(bets, "player a") || findBet(bets, "a");
  const playerB = findBet(bets, "player b") || findBet(bets, "b");

  // Find Under/Over 21 bets for Player B
  const playerBUnder21 = findBet(bets, "player b under 21") || findBet(bets, "b under 21");
  const playerBOver21 = findBet(bets, "player b over 21") || findBet(bets, "b over 21");

  // Find Under/Over 21 bets for Player A (if available)
  const playerAUnder21 = findBet(bets, "player a under 21") || findBet(bets, "a under 21");
  const playerAOver21 = findBet(bets, "player a over 21") || findBet(bets, "a over 21");

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
    
    // Extract roundId
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
              Teen42 Bets
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
              { 
                label: "Player A", 
                bet: playerA,
                underBet: playerAUnder21,
                overBet: playerAOver21,
              },
              { 
                label: "Player B", 
                bet: playerB,
                underBet: playerBUnder21,
                overBet: playerBOver21,
              },
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
                      <div className="text-xs font-semibold text-center bg-blue-400 text-white py-1 rounded">
                        Back
                      </div>
                      <div className="text-[10px] text-center text-muted-foreground mb-1 font-bold">
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
                          <Lock className="w-4 h-4 absolute top-1 right-1 text-white" />
                        )}
                        <span className="text-lg font-bold">
                          {backOdds === "0.00" ? "0" : backOdds}
                        </span>
                      </button>
                    </div>

                    {/* Lay Column */}
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-center bg-pink-400 text-white py-1 rounded">
                        Lay
                      </div>
                      <div className="text-[10px] text-center text-muted-foreground mb-1 font-bold">
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
                          <Lock className="w-4 h-4 absolute top-1 right-1 text-white" />
                        )}
                        <span className="text-lg font-bold">
                          {layOdds === "0.00" ? "0" : layOdds}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Under/Over 21 Bets (Only for Player B, or both if available) */}
                  {(underBet || overBet) && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-border/50">
                      {underBet && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{label} Under 21</span>
                          <button
                            onClick={() => handleBetClick(underBet, underBet?.nat || underBet?.type || `${label} Under 21`, "back")}
                            disabled={locked || isSuspended(underBet)}
                            className={`px-3 py-2 rounded font-bold text-sm transition-all ${
                              locked || isSuspended(underBet)
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer"
                            }`}
                          >
                            {formatOdds(getBackOdds(underBet)) === "0.00" ? "0" : formatOdds(getBackOdds(underBet))}
                          </button>
                        </div>
                      )}
                      {overBet && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{label} Over 21</span>
                          <button
                            onClick={() => handleBetClick(overBet, overBet?.nat || overBet?.type || `${label} Over 21`, "back")}
                            disabled={locked || isSuspended(overBet)}
                            className={`px-3 py-2 rounded font-bold text-sm transition-all ${
                              locked || isSuspended(overBet)
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer"
                            }`}
                          >
                            {formatOdds(getBackOdds(overBet)) === "0.00" ? "0" : formatOdds(getBackOdds(overBet))}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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

