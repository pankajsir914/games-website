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

interface Joker20BettingBoardProps {
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
      betName.includes(`joker ${normalized}`) ||
      betName.includes(`${normalized} joker`)
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

export const Joker20BettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: Joker20BettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

  // Find Player A and Player B bets
  const playerA = findBet(bets, "player a") || findBet(bets, "a");
  const playerB = findBet(bets, "player b") || findBet(bets, "b");

  // Find Joker bets
  const jokerEven = findBet(bets, "even") || findBet(bets, "joker even");
  const jokerOdd = findBet(bets, "odd") || findBet(bets, "joker odd");
  const jokerRed = findBet(bets, "red") || findBet(bets, "joker red");
  const jokerBlack = findBet(bets, "black") || findBet(bets, "joker black");
  const jokerSpade = findBet(bets, "spade") || findBet(bets, "joker spade");
  const jokerHeart = findBet(bets, "heart") || findBet(bets, "joker heart");
  const jokerDiamond = findBet(bets, "diamond") || findBet(bets, "joker diamond");
  const jokerClub = findBet(bets, "club") || findBet(bets, "joker club");

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

  const renderBetCell = (bet: any, label: string, disabled: boolean) => {
    const backOdds = formatOdds(getBackOdds(bet));
    const isDisabled = disabled || backOdds === "0.00";
    
    return (
      <button
        onClick={() => handleBetClick(bet, bet?.nat || bet?.type || label, "back")}
        disabled={isDisabled}
        className={`h-[40px] sm:h-[50px] rounded flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
          isDisabled
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer shadow-md"
        }`}
      >
        {isDisabled && <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
        <span className="text-[10px] sm:text-sm">{backOdds === "0.00" ? "0" : backOdds}</span>
      </button>
    );
  };

  return (
    <>
      <Card className="border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Joker20 Bets
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
          {/* Player A / Player B Section */}
          <div className="border rounded-lg overflow-hidden bg-muted/20">
            <div className="p-1 sm:p-2 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[300px]">
                <thead>
                  <tr className="bg-white/10">
                    <th className="px-1 sm:px-2 py-1 text-left text-[10px] sm:text-xs font-semibold"></th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold bg-blue-400/30">Back</th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold bg-pink-400/30">Lay</th>
                  </tr>
                </thead>
                <tbody>
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
                      <tr key={label} className="bg-blue-400/20">
                        <td className="px-1 sm:px-2 py-1.5 sm:py-2 font-bold text-xs sm:text-sm">
                          {label}
                        </td>
                        <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                          <button
                            onClick={() => handleBetClick(bet, bet?.nat || bet?.type || label, "back")}
                            disabled={backDisabled}
                            className={`w-full h-[36px] sm:h-[44px] rounded flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                              backDisabled
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer shadow-md"
                            }`}
                          >
                            {backDisabled && <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                            <span>{backOdds === "0.00" ? "0" : backOdds}</span>
                          </button>
                        </td>
                        <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                          <button
                            onClick={() => handleBetClick(bet, bet?.nat || bet?.type || label, "lay")}
                            disabled={layDisabled}
                            className={`w-full h-[36px] sm:h-[44px] rounded flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                              layDisabled
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-pink-400 hover:bg-pink-500 text-white cursor-pointer shadow-md"
                            }`}
                          >
                            {layDisabled && <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                            <span>{layOdds === "0.00" ? "0" : layOdds}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Joker - Even/Odd/Red/Black Section */}
          <div className="border rounded-lg overflow-hidden bg-muted/20">
            <div className="p-1 sm:p-2 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[400px]">
                <thead>
                  <tr className="bg-white/10">
                    <th className="px-1 sm:px-2 py-1 text-left text-[10px] sm:text-xs font-semibold">Joker</th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold">Even</th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold">Odd</th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-red-500">♥</span>
                        <span className="text-red-500">♦</span>
                        <span>Red</span>
                      </div>
                    </th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-black">♠</span>
                        <span className="text-black">♣</span>
                        <span>Black</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-400/20">
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2 font-bold text-xs sm:text-sm">Joker</td>
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                      {renderBetCell(jokerEven, "Joker Even", locked || isSuspended(jokerEven))}
                    </td>
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                      {renderBetCell(jokerOdd, "Joker Odd", locked || isSuspended(jokerOdd))}
                    </td>
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                      {renderBetCell(jokerRed, "Joker Red", locked || isSuspended(jokerRed))}
                    </td>
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                      {renderBetCell(jokerBlack, "Joker Black", locked || isSuspended(jokerBlack))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Joker - Suit Betting Section */}
          <div className="border rounded-lg overflow-hidden bg-muted/20">
            <div className="p-1 sm:p-2 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[400px]">
                <thead>
                  <tr className="bg-white/10">
                    <th className="px-1 sm:px-2 py-1 text-left text-[10px] sm:text-xs font-semibold">Joker</th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold">
                      <span className="text-black text-lg sm:text-xl">♠</span>
                    </th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold">
                      <span className="text-red-500 text-lg sm:text-xl">♥</span>
                    </th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold">
                      <span className="text-red-500 text-lg sm:text-xl">♦</span>
                    </th>
                    <th className="px-1 sm:px-2 py-1 text-center text-[10px] sm:text-xs font-semibold">
                      <span className="text-black text-lg sm:text-xl">♣</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-400/20">
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2 font-bold text-xs sm:text-sm">Joker</td>
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                      {renderBetCell(jokerSpade, "Joker Spade", locked || isSuspended(jokerSpade))}
                    </td>
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                      {renderBetCell(jokerHeart, "Joker Heart", locked || isSuspended(jokerHeart))}
                    </td>
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                      {renderBetCell(jokerDiamond, "Joker Diamond", locked || isSuspended(jokerDiamond))}
                    </td>
                    <td className="px-1 sm:px-2 py-1.5 sm:py-2">
                      {renderBetCell(jokerClub, "Joker Club", locked || isSuspended(jokerClub))}
                    </td>
                  </tr>
                </tbody>
              </table>
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

