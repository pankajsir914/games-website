import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TeenSinBettingBoardProps {
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
    mid?: string | number;
    win?: "Player A" | "Player B" | "A" | "B" | string;
    winnerId?: string;
    round?: string | number;
    round_id?: string | number;
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
      betName.includes(`winner ${normalized}`) ||
      betName.includes(`high card ${normalized}`) ||
      betName.includes(`highcard ${normalized}`) ||
      betName.includes(`pair ${normalized}`) ||
      betName.includes(`color plus ${normalized}`) ||
      betName.includes(`color+ ${normalized}`) ||
      betName.includes(`colorplus ${normalized}`) ||
      betName.includes(`lucky ${normalized}`) ||
      betName.includes(`lucky9 ${normalized}`) ||
      betName.includes(`lucky 9 ${normalized}`) ||
      (normalized.includes("lucky") && betName.includes("lucky"))
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

export const TeenSinBettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: TeenSinBettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

  // Find Player A bets
  const winnerA = findBet(bets, "winner a") || findBet(bets, "player a") || findBet(bets, "a");
  const highCardA = findBet(bets, "high card a") || findBet(bets, "highcard a");
  const pairA = findBet(bets, "pair a");
  const colorPlusA = findBet(bets, "color plus a") || findBet(bets, "color+ a") || findBet(bets, "colorplus a");

  // Find Player B bets
  const winnerB = findBet(bets, "winner b") || findBet(bets, "player b") || findBet(bets, "b");
  const highCardB = findBet(bets, "high card b") || findBet(bets, "highcard b");
  const pairB = findBet(bets, "pair b");
  const colorPlusB = findBet(bets, "color plus b") || findBet(bets, "color+ b") || findBet(bets, "colorplus b");

  // Find Lucky 9 bets
  // First, try to find the base "LUCKY 9" bet (without A/B)
  const lucky9Base = findBet(bets, "lucky 9") || findBet(bets, "lucky9") || findBet(bets, "lucky");
  
  // Then try to find separate A/B bets
  const lucky9A = findBet(bets, "lucky 9 a") || findBet(bets, "lucky9 a") || findBet(bets, "lucky a") || 
                  findBet(bets, "lucky9a") || 
                  bets.find((b: any) => {
                    const betName = (b.nat || b.type || "").toLowerCase().trim();
                    return betName.includes("lucky") && betName.includes("9") && (betName.includes(" a") || betName.endsWith("a") || betName.includes("player a"));
                  });
  const lucky9B = findBet(bets, "lucky 9 b") || findBet(bets, "lucky9 b") || findBet(bets, "lucky b") || 
                  findBet(bets, "lucky9b") || 
                  bets.find((b: any) => {
                    const betName = (b.nat || b.type || "").toLowerCase().trim();
                    return betName.includes("lucky") && betName.includes("9") && (betName.includes(" b") || betName.endsWith("b") || betName.includes("player b"));
                  });
  
  // Debug: Log what we found
  if (lucky9A || lucky9B || lucky9Base) {
    console.log("🎰 [TeenSin] Lucky 9 bets found:", {
      lucky9A: lucky9A ? { nat: lucky9A.nat, back: getBackOdds(lucky9A) } : null,
      lucky9B: lucky9B ? { nat: lucky9B.nat, back: getBackOdds(lucky9B) } : null,
      lucky9Base: lucky9Base ? { nat: lucky9Base.nat, back: getBackOdds(lucky9Base) } : null,
    });
  }

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

    // Map bet to correct backend format
    let betType = selectedBetData?.nat || selectedBetData?.type || "";
    const betName = selectedBet.split("-")[0].toLowerCase();
    
    // If bet.nat is not in correct format, map it based on bet name
    if (!betType || betType === "") {
      if (betName.includes("winner")) {
        // Winner bet - map to BA/BB based on which player
        if (betName.includes("player a") || betName.includes("a")) {
          betType = side === "back" ? "BA" : "LA";
        } else if (betName.includes("player b") || betName.includes("b")) {
          betType = side === "back" ? "BB" : "LB";
        }
      } else if (betName.includes("high card") || betName.includes("highcard")) {
        // High Card bet
        if (betName.includes("player a") || betName.includes("a")) {
          betType = "HIGH CARD A";
        } else if (betName.includes("player b") || betName.includes("b")) {
          betType = "HIGH CARD B";
        }
      } else if (betName.includes("pair")) {
        // Pair bet
        if (betName.includes("player a") || betName.includes("a")) {
          betType = "PAIR A";
        } else if (betName.includes("player b") || betName.includes("b")) {
          betType = "PAIR B";
        }
      } else if (betName.includes("lucky 9") || betName.includes("lucky9")) {
        // Lucky 9 bet (no A/B needed, but we can add it for clarity)
        betType = "LUCKY 9";
      } else if (betName.includes("color plus") || betName.includes("color+") || betName.includes("colorplus")) {
        // Color Plus bet
        if (betName.includes("player a") || betName.includes("a")) {
          betType = "COLOR PLUS A";
        } else if (betName.includes("player b") || betName.includes("b")) {
          betType = "COLOR PLUS B";
        }
      }
    }

    await onPlaceBet({
      betType: betType || selectedBet.split("-")[0],
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
        onClick={() => handleBetClick(bet, label, "back")}
        disabled={isDisabled}
        className={`w-full h-[40px] sm:h-[50px] rounded transition-all ${
          isDisabled
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-blue-400 hover:bg-blue-500 text-white font-bold shadow-md hover:shadow-lg"
        } text-sm sm:text-base`}
      >
        {isDisabled ? (
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
        ) : (
          backOdds === "0.00" ? "0" : backOdds
        )}
      </button>
    );
  };

  return (
    <>
      <Card className="border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl">Teen Sin Betting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Two Tables for Player A and Player B */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { 
                label: "Player A", 
                winnerBet: winnerA, 
                highCardBet: highCardA, 
                pairBet: pairA, 
                colorPlusBet: colorPlusA,
                playerId: "A"
              },
              { 
                label: "Player B", 
                winnerBet: winnerB, 
                highCardBet: highCardB, 
                pairBet: pairB, 
                colorPlusBet: colorPlusB,
                playerId: "B"
              },
            ].map(({ label, winnerBet, highCardBet, pairBet, colorPlusBet, playerId }) => {
              const winnerDisabled = locked || isSuspended(winnerBet);
              const highCardDisabled = locked || isSuspended(highCardBet);
              const pairDisabled = locked || isSuspended(pairBet);
              const colorPlusDisabled = locked || isSuspended(colorPlusBet);

              return (
                <div key={label} className="border rounded-lg overflow-hidden bg-muted/20">
                  {/* Header */}
                  <div className="bg-gray-200/50 text-gray-800 font-bold text-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm">
                    {label}
                  </div>

                  {/* Table */}
                  <div className="p-2 sm:p-3">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-200/50">
                          <th className="px-2 py-1.5 text-left text-[10px] sm:text-xs font-semibold">Winner</th>
                          <th className="px-2 py-1.5 text-center text-[10px] sm:text-xs font-semibold">High Card</th>
                          <th className="px-2 py-1.5 text-center text-[10px] sm:text-xs font-semibold">Pair</th>
                          <th className="px-2 py-1.5 text-center text-[10px] sm:text-xs font-semibold">Color Plus</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-blue-400/20">
                          <td className="px-2 py-2">
                            {renderBetCell(winnerBet, `${label} Winner`, winnerDisabled)}
                          </td>
                          <td className="px-2 py-2">
                            {renderBetCell(highCardBet, `${label} High Card`, highCardDisabled)}
                          </td>
                          <td className="px-2 py-2">
                            {renderBetCell(pairBet, `${label} Pair`, pairDisabled)}
                          </td>
                          <td className="px-2 py-2">
                            {renderBetCell(colorPlusBet, `${label} Color Plus`, colorPlusDisabled)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lucky 9 Section */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Lucky 9 Logo/Title */}
              <div className="flex items-center gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600" style={{ fontFamily: 'cursive' }}>
                  Lucky
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-lg border-2 border-white flex items-center justify-center text-white text-xl sm:text-2xl font-bold relative">
                  9
                  {/* Decorative lights around the 9 */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="absolute -top-1 right-0 w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="absolute -bottom-1 right-0 w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="absolute top-0 -right-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="absolute bottom-0 -right-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="absolute top-0 -left-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="absolute bottom-0 -left-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
                </div>
              </div>

              {/* Two Bars */}
              <div className="flex gap-3 sm:gap-4 flex-1">
                {/* Player A Lucky 9 */}
                <button
                  onClick={() => handleBetClick(lucky9A || lucky9Base, "Lucky 9 A", "back")}
                  disabled={locked || isSuspended(lucky9A || lucky9Base) || !(lucky9A || lucky9Base)}
                  className={`flex-1 h-12 sm:h-14 rounded-lg px-4 flex items-center justify-center font-bold text-white text-lg sm:text-xl transition-all ${
                    locked || isSuspended(lucky9A || lucky9Base) || !(lucky9A || lucky9Base)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-blue-400 hover:bg-blue-500 shadow-md hover:shadow-lg"
                  }`}
                >
                  {locked || isSuspended(lucky9A || lucky9Base) || !(lucky9A || lucky9Base) ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    formatOdds(getBackOdds(lucky9A || lucky9Base))
                  )}
                </button>

                {/* Player B Lucky 9 */}
                <button
                  onClick={() => handleBetClick(lucky9B || lucky9Base, "Lucky 9 B", "back")}
                  disabled={locked || isSuspended(lucky9B || lucky9Base) || !(lucky9B || lucky9Base)}
                  className={`flex-1 h-12 sm:h-14 rounded-lg px-4 flex items-center justify-center font-bold text-white text-lg sm:text-xl transition-all ${
                    locked || isSuspended(lucky9B || lucky9Base) || !(lucky9B || lucky9Base)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-pink-400 hover:bg-pink-500 shadow-md hover:shadow-lg"
                  }`}
                >
                  {locked || isSuspended(lucky9B || lucky9Base) || !(lucky9B || lucky9Base) ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    formatOdds(getBackOdds(lucky9B || lucky9Base))
                  )}
                </button>
              </div>
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
                  // Handle different win formats: "1"/"2", "Player A"/"Player B", "A"/"B"
                  const winValue = r.win?.toString() || r.winnerId?.toString() || "";
                  const isPlayerA = 
                    winValue === "1" || 
                    winValue === "Player A" || 
                    winValue === "A" ||
                    winValue.toLowerCase() === "playera" ||
                    (r.winnerId && r.winnerId.toString() === "1");
                  const winner = isPlayerA ? "A" : "B";
                  
                  return (
                    <Button
                      key={r.mid || r.round || r.round_id || i}
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

      {/* Place Bet Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bet Type</Label>
              <div className="mt-1 p-2 bg-muted rounded">
                {selectedBetData?.nat || selectedBetData?.type || selectedBet.split("-")[0]}
              </div>
            </div>
            <div>
              <Label>Side</Label>
              <div className="mt-1 p-2 bg-muted rounded capitalize">
                {selectedBetData?.side || "back"}
              </div>
            </div>
            <div>
              <Label>Odds</Label>
              <div className="mt-1 p-2 bg-muted rounded">
                {formatOdds(
                  selectedBetData?.side === "lay"
                    ? getLayOdds(selectedBetData)
                    : getBackOdds(selectedBetData)
                )}
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
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span>Potential Win:</span>
              <span className="font-bold">
                ₹{(
                  (parseFloat(amount) || 0) *
                  (selectedBetData?.side === "lay"
                    ? Number(getLayOdds(selectedBetData)) || 0
                    : Number(getBackOdds(selectedBetData)) || 0) /
                  (selectedBetData?.side === "lay"
                    ? Number(getLayOdds(selectedBetData)) > 1000 ? 100000 : 1
                    : Number(getBackOdds(selectedBetData)) > 1000 ? 100000 : 1)
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              {QUICK_CHIPS.map((chip) => (
                <Button
                  key={chip}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(String(chip))}
                  disabled={locked}
                >
                  ₹{chip}
                </Button>
              ))}
            </div>
            <Button
              onClick={handlePlace}
              disabled={locked || !selectedBetData || !amount || parseFloat(amount) <= 0}
              className="w-full"
            >
              Place Bet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
