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

interface Teen8BettingBoardProps {
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
    win: string;
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
      betName.includes(`pair plus ${normalized}`) ||
      betName.includes(`total ${normalized}`)
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

// Helper to get card display from bet data or odds
const getPlayerCards = (playerNum: number, odds?: any): string[] => {
  // Try to extract cards from odds data
  const raw = odds?.rawData || odds?.raw || odds || {};
  const players = raw?.players || raw?.cards || [];
  
  if (Array.isArray(players) && players[playerNum - 1]) {
    const player = players[playerNum - 1];
    if (player.cards && Array.isArray(player.cards)) {
      return player.cards;
    }
    if (player.card) {
      return [player.card];
    }
  }
  
  // Default cards for display (will be replaced by actual data)
  return [];
};

export const Teen8BettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: Teen8BettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

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

  // Get bets for each player (1-8)
  const getPlayerBets = (playerNum: number) => {
    const playerBet = findBet(bets, `player ${playerNum}`) || findBet(bets, `player${playerNum}`);
    const oddsBet = findBet(bets, `odds player ${playerNum}`) || findBet(bets, `odds ${playerNum}`);
    const pairPlusBet = findBet(bets, `pair plus ${playerNum}`) || findBet(bets, `pair ${playerNum}`);
    const totalBet = findBet(bets, `total ${playerNum}`) || findBet(bets, `total player ${playerNum}`);
    
    return {
      main: playerBet || oddsBet,
      pairPlus: pairPlusBet,
      total: totalBet,
    };
  };

  const renderCardDisplay = (cards: string[]) => {
    if (!cards || cards.length === 0) return null;
    
    return (
      <div className="flex gap-1">
        {cards.map((card, idx) => {
          // Parse card format (e.g., "4♦", "7♣", "J♦")
          const rank = card.replace(/[♠♣♥♦]/g, '').trim();
          const suit = card.match(/[♠♣♥♦]/)?.[0] || '';
          const isRed = suit === '♥' || suit === '♦';
          
          return (
            <div
              key={idx}
              className="w-8 h-10 rounded border border-gray-400 bg-white flex flex-col items-center justify-center text-xs font-bold"
            >
              <span className={isRed ? "text-red-500" : "text-black"}>{rank}</span>
              <span className={isRed ? "text-red-500" : "text-black"}>{suit}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Card className="border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Teen8 Bets
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
          {/* Players Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs sm:text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-blue-400/20">
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-[10px] sm:text-xs font-semibold bg-gray-200/50">Player [Number] [Card Hand]</th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-[10px] sm:text-xs font-semibold">Odds</th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-[10px] sm:text-xs font-semibold">Pair Plus</th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-[10px] sm:text-xs font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((playerNum) => {
                  const playerBets = getPlayerBets(playerNum);
                  const cards = getPlayerCards(playerNum, odds);
                  const mainDisabled = locked || isSuspended(playerBets.main);
                  const pairPlusDisabled = locked || isSuspended(playerBets.pairPlus);
                  const totalDisabled = locked || isSuspended(playerBets.total);
                  
                  const mainBackOdds = formatOdds(getBackOdds(playerBets.main));
                  const pairPlusOdds = formatOdds(getBackOdds(playerBets.pairPlus));
                  const totalOdds = formatOdds(getBackOdds(playerBets.total));

                  return (
                    <tr key={playerNum} className="border-b border-border/50">
                      {/* Player Column */}
                      <td className="px-2 sm:px-3 py-2 sm:py-3 bg-gray-100/30">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="font-bold text-xs sm:text-sm">Player {playerNum}</span>
                          {renderCardDisplay(cards) || (
                            <div className="flex gap-1">
                              <div className="w-6 h-8 sm:w-8 sm:h-10 rounded border border-gray-400 bg-white flex items-center justify-center text-[10px] sm:text-xs text-gray-400">
                                ?
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Odds Column */}
                      <td className="px-2 sm:px-3 py-2 sm:py-3 bg-gray-700/50 text-center">
                        {mainDisabled || mainBackOdds === "0.00" ? (
                          <div className="flex items-center justify-center">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBetClick(playerBets.main, `Player ${playerNum}`, "back")}
                            className="px-2 sm:px-3 py-1 sm:py-2 rounded bg-blue-400 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all"
                          >
                            {mainBackOdds}
                          </button>
                        )}
                      </td>

                      {/* Pair Plus Column */}
                      <td className="px-3 py-3 bg-gray-700/50 text-center">
                        {pairPlusDisabled || pairPlusOdds === "0.00" ? (
                          <div className="flex items-center justify-center gap-1 text-white text-xs">
                            <span>Pair</span>
                            <Lock className="w-4 h-4" />
                            <span>us {playerNum}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBetClick(playerBets.pairPlus, `Pair Plus ${playerNum}`, "back")}
                            className="px-3 py-2 rounded bg-blue-400 hover:bg-blue-500 text-white font-bold transition-all text-xs"
                          >
                            Pair {pairPlusOdds}
                          </button>
                        )}
                      </td>

                      {/* Total Column */}
                      <td className="px-3 py-3 bg-gray-700/50 text-center">
                        {totalDisabled || totalOdds === "0.00" ? (
                          <div className="flex items-center justify-center">
                            <Lock className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBetClick(playerBets.total, `Total ${playerNum}`, "back")}
                            className="px-3 py-2 rounded bg-blue-400 hover:bg-blue-500 text-white font-bold transition-all"
                          >
                            {totalOdds}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  const winner = r.win || "?";
                  return (
                    <Button
                      key={i}
                      size="sm"
                      variant="outline"
                      className="w-9 h-9 p-0 font-bold bg-blue-500 text-white border-blue-600"
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

