import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock, Users, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface TeenBettingBoardProps {
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
    win?: "Player A" | "Player B" | "A" | "B" | string | number;
    winnerId?: string;
    round?: string | number;
    round_id?: string | number;
  }>;
  onResultClick?: (result: any) => void;
  tableId?: string;
}

const QUICK_CHIPS = [10, 50, 100, 500, 1000];
const CARDS = [1, 2, 3, 4, 5, 6];

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
      betName.includes(`card ${normalized}`) ||
      betName.includes(`${normalized} card`)
    );
  });
};

const findCardBet = (bets: any[], cardNum: number, betType: "odd" | "even") => {
  if (!bets || bets.length === 0) return null;
  
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase().trim();
    return (
      (betName.includes(`card ${cardNum}`) || betName.includes(`card${cardNum}`)) &&
      betName.includes(betType)
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

export const TeenBettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
  tableId,
}: TeenBettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);
  
  // Detail result modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  // Find Player and Dealer bets (Teen1 uses "Player" and "Dealer" instead of "Player A/B")
  const playerBet = findBet(bets, "player") || findBet(bets, "player a") || findBet(bets, "a");
  const dealerBet = findBet(bets, "dealer") || findBet(bets, "player b") || findBet(bets, "b");

  // For Teen1, also check for Player A/Dealer B format
  const playerA = findBet(bets, "player a") || findBet(bets, "a") || playerBet;
  const playerB = findBet(bets, "player b") || findBet(bets, "b") || dealerBet;

  // Find consecutive bets (if any)
  const consecutiveA = findBet(bets, "consecutive a") || findBet(bets, "con a") || findBet(bets, "consecutive player");
  const consecutiveB = findBet(bets, "consecutive b") || findBet(bets, "con b") || findBet(bets, "consecutive dealer");

  // Find DOWN and UP bets for each player
  // DOWN = Card 1 (first card), UP = Card 3 (third card)
  const findDownUpBet = (playerLabel: string, position: "down" | "up") => {
    const playerPrefix = playerLabel.toLowerCase();
    const searchTerms = [
      `${playerPrefix} card 1 ${position}`,
      `${playerPrefix} ${position} card 1`,
      `card 1 ${position} ${playerPrefix}`,
      `${playerPrefix} card 3 ${position}`,
      `${playerPrefix} ${position} card 3`,
      `card 3 ${position} ${playerPrefix}`,
      `${playerPrefix} ${position}`,
      `card 1 ${position}`,
      `card 3 ${position}`,
      position === "down" ? `${playerPrefix} down` : `${playerPrefix} up`,
    ];
    
    for (const term of searchTerms) {
      const bet = findBet(bets, term);
      if (bet) return bet;
    }
    
    // Fallback: try to find any bet with DOWN/UP in the name
    return bets.find((b: any) => {
      const nat = (b.nat || b.type || "").toLowerCase();
      return nat.includes(position) && (nat.includes(playerPrefix) || nat.includes("card"));
    }) || null;
  };

  const playerDownBet = findDownUpBet("player", "down");
  const playerUpBet = findDownUpBet("player", "up");
  const dealerDownBet = findDownUpBet("dealer", "down");
  const dealerUpBet = findDownUpBet("dealer", "up");

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

  // Fetch detail result
  const fetchDetailResult = async (mid: string | number) => {
    if (!tableId || !mid) {
      console.error("Missing tableId or mid:", { tableId, mid });
      return;
    }
    
    setDetailLoading(true);
    setDetailData(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: { 
          action: "get-detail-result", 
          tableId,
          mid: String(mid)
        }
      });

      if (error) {
        console.error("❌ Error fetching detail result:", error);
        setDetailData({ error: error.message || "Failed to fetch detail result" });
      } else if (data) {
        if (data.success === false) {
          console.error("❌ API returned error:", data.error);
          setDetailData({ error: data.error || "No data available" });
        } else {
          const resultData = data?.data || data;
          setDetailData(resultData);
        }
      } else {
        setDetailData({ error: "No data received from API" });
      }
    } catch (error) {
      console.error("❌ Exception fetching detail result:", error);
      setDetailData({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: any) => {
    const mid = result.mid || result.round || result.round_id;
    if (mid) {
      setSelectedResult(result);
      setDetailDialogOpen(true);
      setDetailData(null);
      fetchDetailResult(mid);
    } else {
      // Fallback to onResultClick if provided
      onResultClick?.(result);
    }
  };

  return (
    <>
      <Card className="border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Teen Bets
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
          {/* Player and Dealer Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { 
                label: "Player", 
                mainBet: playerA, 
                consecutiveBet: consecutiveA, 
                isPlayer: true,
                downBet: playerDownBet,
                upBet: playerUpBet,
              },
              { 
                label: "Dealer", 
                mainBet: playerB, 
                consecutiveBet: consecutiveB, 
                isPlayer: false,
                downBet: dealerDownBet,
                upBet: dealerUpBet,
              },
            ].map(({ label, mainBet, consecutiveBet, isPlayer, downBet, upBet }) => {
              const disabled = locked || isSuspended(mainBet);
              const backOdds = formatOdds(getBackOdds(mainBet));
              const layOdds = formatOdds(getLayOdds(mainBet));
              const backDisabled = disabled || backOdds === "0.00";
              const layDisabled = disabled || layOdds === "0.00";

              const consecutiveDisabled = locked || isSuspended(consecutiveBet);
              const consecutiveBackOdds = formatOdds(getBackOdds(consecutiveBet));
              const consecutiveLayOdds = formatOdds(getLayOdds(consecutiveBet));
              const consecutiveBackDisabled = consecutiveDisabled || consecutiveBackOdds === "0.00";
              const consecutiveLayDisabled = consecutiveDisabled || consecutiveLayOdds === "0.00";

              return (
                <div key={label} className="border rounded-lg overflow-hidden bg-muted/20">
                  {/* Header */}
                  <div className="bg-gray-200/50 text-gray-800 font-bold text-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm">
                    {label}
                  </div>

                  {/* Back/Lay Headers */}
                  <div className="grid grid-cols-2 gap-0">
                    <div className="bg-blue-400 text-white font-semibold text-center py-1 text-[10px] sm:text-xs">
                      Back
                    </div>
                    <div className="bg-pink-400 text-white font-semibold text-center py-1 text-[10px] sm:text-xs">
                      Lay
                    </div>
                  </div>

                  {/* Main Row */}
                  <div className="grid grid-cols-2 gap-0">
                    {/* Back Cell */}
                    <div className="bg-blue-400/20 p-1.5 sm:p-2">
                      {backDisabled ? (
                        <div className="flex items-center justify-center h-[40px] sm:h-[50px] bg-gray-700 text-gray-400 rounded">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBetClick(mainBet, `${label} Main`, "back")}
                          className="w-full h-[40px] sm:h-[50px] bg-blue-400 hover:bg-blue-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                        >
                          {backOdds === "0.00" ? "0" : backOdds}
                        </button>
                      )}
                    </div>

                    {/* Lay Cell */}
                    <div className="bg-pink-400/20 p-1.5 sm:p-2">
                      {layDisabled ? (
                        <div className="flex items-center justify-center h-[40px] sm:h-[50px] bg-gray-700 text-gray-400 rounded">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBetClick(mainBet, `${label} Main`, "lay")}
                          className="w-full h-[40px] sm:h-[50px] bg-pink-400 hover:bg-pink-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                        >
                          {layOdds === "0.00" ? "0" : layOdds}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Display Section (2 DOWN, Card Number, 2 UP) */}
                  <div className="border-t border-border/30 bg-white p-3 sm:p-4">
                    <div className="flex items-center justify-center gap-2 sm:gap-4">
                      {/* 2 DOWN Button */}
                      <button
                        onClick={() => {
                          if (downBet && !isSuspended(downBet)) {
                            handleBetClick(downBet, `${label} DOWN`, "back");
                          }
                        }}
                        disabled={!downBet || isSuspended(downBet) || locked}
                        className={`flex flex-col items-center transition-all ${
                          downBet && !isSuspended(downBet) && !locked
                            ? "cursor-pointer hover:scale-105 active:scale-95"
                            : "cursor-not-allowed opacity-50"
                        }`}
                      >
                        <span className="text-lg sm:text-xl font-bold text-gray-800">
                          {downBet ? formatOdds(getBackOdds(downBet)) : "2"}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-600 font-semibold">DOWN</span>
                      </button>
                      
                      {/* Card Number Circle (Middle Card - Card 2) */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-yellow-500 shadow-lg">
                        <span className="text-xl sm:text-2xl font-bold text-red-600">7</span>
                      </div>
                      
                      {/* 2 UP Button */}
                      <button
                        onClick={() => {
                          if (upBet && !isSuspended(upBet)) {
                            handleBetClick(upBet, `${label} UP`, "back");
                          }
                        }}
                        disabled={!upBet || isSuspended(upBet) || locked}
                        className={`flex flex-col items-center transition-all ${
                          upBet && !isSuspended(upBet) && !locked
                            ? "cursor-pointer hover:scale-105 active:scale-95"
                            : "cursor-not-allowed opacity-50"
                        }`}
                      >
                        <span className="text-lg sm:text-xl font-bold text-gray-800">
                          {upBet ? formatOdds(getBackOdds(upBet)) : "2"}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-600 font-semibold">UP</span>
                      </button>
                    </div>
                  </div>

                  {/* Consecutive Row (if exists) */}
                  {consecutiveBet && (
                    <div className="grid grid-cols-2 gap-0 border-t border-border/30">
                      {/* Back Cell */}
                      <div className="bg-blue-400/20 p-1.5 sm:p-2">
                        {consecutiveBackDisabled ? (
                          <div className="flex items-center justify-center h-[40px] sm:h-[50px] bg-gray-700 text-gray-400 rounded">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBetClick(consecutiveBet, `${label} Consecutive`, "back")}
                            className="w-full h-[40px] sm:h-[50px] bg-blue-400 hover:bg-blue-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                          >
                            {consecutiveBackOdds === "0.00" ? "0" : consecutiveBackOdds}
                          </button>
                        )}
                      </div>

                      {/* Lay Cell */}
                      <div className="bg-pink-400/20 p-1.5 sm:p-2">
                        {consecutiveLayDisabled ? (
                          <div className="flex items-center justify-center h-[40px] sm:h-[50px] bg-gray-700 text-gray-400 rounded">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBetClick(consecutiveBet, `${label} Consecutive`, "lay")}
                            className="w-full h-[40px] sm:h-[50px] bg-pink-400 hover:bg-pink-500 text-white font-bold rounded transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                          >
                            {consecutiveLayOdds === "0.00" ? "0" : consecutiveLayOdds}
                          </button>
                        )}
                      </div>
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
                  // Handle different win formats: "1"/"2", "Player A"/"Player B", "A"/"B", "Player"/"Dealer"
                  const winValue = r.win?.toString() || r.winnerId?.toString() || "";
                  const isPlayer = 
                    winValue === "1" || 
                    winValue === "Player A" || 
                    winValue === "A" ||
                    winValue === "Player" ||
                    winValue === "P" ||
                    winValue.toLowerCase() === "playera" ||
                    winValue.toLowerCase() === "player" ||
                    (r.winnerId && r.winnerId.toString() === "1");
                  // Display "P" for Player, "D" for Dealer
                  const winner = isPlayer ? "P" : "D";
                  
                  return (
                    <Button
                      key={r.mid || r.round || r.round_id || i}
                      size="sm"
                      variant="outline"
                      className={`w-9 h-9 p-0 font-bold ${
                        isPlayer
                          ? "bg-blue-500 text-white border-blue-600"
                          : "bg-red-500 text-white border-red-600"
                      }`}
                      onClick={() => handleResultClick(r)}
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

      {/* Detail Result Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detailed Result</DialogTitle>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading result details...</span>
            </div>
          ) : detailData?.error ? (
            <div className="text-center py-8 text-destructive">
              <p>Error: {detailData.error}</p>
            </div>
          ) : detailData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Round ID</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md font-semibold">
                    {detailData.mid || detailData.round_id || detailData.round || "N/A"}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Winner</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md font-semibold">
                    {detailData.winnat || detailData.rdesc || detailData.win || "N/A"}
                  </div>
                </div>
              </div>
              
              {detailData.card && (
                <div>
                  <Label className="text-xs text-muted-foreground">Cards</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md">
                    <div className="font-mono text-sm">
                      {typeof detailData.card === 'string' 
                        ? detailData.card.split(',').map((c: string, i: number) => (
                            <span key={i} className="inline-block mr-2">{c.trim()}</span>
                          ))
                        : Array.isArray(detailData.card)
                        ? detailData.card.map((c: string, i: number) => (
                            <span key={i} className="inline-block mr-2">{c}</span>
                          ))
                        : String(detailData.card)}
                    </div>
                  </div>
                </div>
              )}
              
              {detailData.rdesc && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md">
                    {detailData.rdesc}
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground">Full Data</Label>
                <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto max-h-64">
                  {JSON.stringify(detailData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

