import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock, Users, Loader2, Trophy, X, Info } from "lucide-react";
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
  
  // Rules modal state
  const [rulesOpen, setRulesOpen] = useState(false);
  
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
            <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-6 w-6">
              <Info size={16} />
            </Button>
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

          {/* Last 10 Results */}
          {last10.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs mb-2 text-muted-foreground">Last 10 Results</p>
              <div className="flex gap-1 flex-wrap">
                {last10.map((r, i) => {
                  // Handle different win formats: "1"/"2", "Player A"/"Player B", "A"/"B", "Player"/"Dealer", "Tie"/"T"
                  const winValue = r.win?.toString() || r.winnerId?.toString() || "";
                  const winValueLower = winValue.toLowerCase();
                  
                  const isPlayer = 
                    winValue === "1" || 
                    winValue === "Player A" || 
                    winValue === "A" ||
                    winValue === "Player" ||
                    winValue === "P" ||
                    winValueLower === "playera" ||
                    winValueLower === "player" ||
                    (r.winnerId && r.winnerId.toString() === "1");
                  
                  const isDealer = 
                    winValue === "2" || 
                    winValue === "Player B" || 
                    winValue === "B" ||
                    winValue === "Dealer" ||
                    winValue === "D" ||
                    winValueLower === "playerb" ||
                    winValueLower === "dealer" ||
                    (r.winnerId && r.winnerId.toString() === "2");
                  
                  const isTie = 
                    winValue === "T" ||
                    winValue === "Tie" ||
                    winValueLower === "tie" ||
                    winValueLower === "t" ||
                    winValue === "3" ||
                    (r.winnerId && r.winnerId.toString() === "3");
                  
                  // Display "P" for Player, "D" for Dealer, "T" for Tie
                  let winner = "D";
                  let bgColor = "bg-red-500 text-white border-red-600";
                  
                  if (isPlayer) {
                    winner = "P";
                    bgColor = "bg-blue-500 text-white border-blue-600";
                  } else if (isDealer) {
                    winner = "D";
                    bgColor = "bg-red-500 text-white border-red-600";
                  } else if (isTie) {
                    winner = "T";
                    bgColor = "bg-yellow-500 text-white border-yellow-600";
                  }
                  
                  return (
                    <Button
                      key={r.mid || r.round || r.round_id || i}
                      size="sm"
                      variant="outline"
                      className={`w-9 h-9 p-0 font-bold ${bgColor}`}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 [&>button]:hidden bg-white rounded-lg border-0 shadow-xl">
          {/* Blue Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between relative rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">
              1 CARD ONE-DAY Result
            </DialogTitle>
            <button
              onClick={() => setDetailDialogOpen(false)}
              className="text-white hover:bg-blue-700 rounded-full p-1.5 transition-colors absolute right-4 top-1/2 -translate-y-1/2 z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content Area with Custom Scrollbar */}
          <div className="p-4 bg-white overflow-y-auto max-h-[calc(90vh-64px)] custom-scrollbar">
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
                {(() => {
                  // Extract t1 data from the response (nested structure)
                  const t1Data = detailData?.data?.t1 || detailData?.t1 || detailData;
                  
                  if (!t1Data || (!t1Data.card && !t1Data.winnat && !t1Data.win)) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No detailed result data available</p>
                        <pre className="mt-4 text-xs text-left bg-gray-100 p-2 rounded overflow-auto max-h-64">
                          {JSON.stringify(detailData, null, 2)}
                        </pre>
                      </div>
                    );
                  }

                  // Parse card function
                  const parseCard = (cardString: string) => {
                    if (!cardString) return null;
                    
                    // Card format: "KSS", "8SS", "QHH", "10DD", "ACC" etc.
                    // Format: Rank + Suit + Suit (e.g., KSS = King of Spades, 10DD = 10 of Diamonds)
                    let rank = '';
                    let suit = '';
                    
                    if (cardString.length >= 3) {
                      // Check if it starts with "10" (two digits)
                      if (cardString.length >= 4 && cardString.startsWith('10')) {
                        rank = '10';
                        suit = cardString.charAt(cardString.length - 1); // Last character is the suit
                      } else {
                        // Single character rank (K, Q, J, A, 1-9)
                        rank = cardString.substring(0, cardString.length - 2); // Everything except last 2 chars
                        suit = cardString.charAt(cardString.length - 1); // Last character is the suit
                      }
                    }
                    
                    // Map suit codes to symbols
                    const suitMap: { [key: string]: string } = {
                      'S': '♠', // Spades
                      'H': '♥', // Hearts
                      'C': '♣', // Clubs
                      'D': '♦', // Diamonds
                    };
                    
                    // Map rank codes
                    const rankMap: { [key: string]: string } = {
                      '1': 'A',
                      'A': 'A',
                      'K': 'K',
                      'Q': 'Q',
                      'J': 'J',
                    };
                    
                    const displayRank = rankMap[rank] || rank;
                    const displaySuit = suitMap[suit] || suit;
                    
                    return {
                      raw: cardString,
                      rank: displayRank,
                      suit: displaySuit,
                      display: `${displayRank}${displaySuit}`,
                      isRed: suit === 'H' || suit === 'D',
                    };
                  };

                  // Parse cards - format: "3H,7C" or "3HH,7CC" (Player, Dealer)
                  const cardString = t1Data.card || '';
                  const cards = cardString.split(',').map(c => c.trim()).filter(Boolean);
                  const playerCard = cards.length > 0 ? parseCard(cards[0]) : null;
                  const dealerCard = cards.length > 1 ? parseCard(cards[1]) : null;

                  // Parse winner
                  const winner = t1Data.winnat || t1Data.win || t1Data.rdesc || "";
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isPlayerWinner = 
                    winnerStr.includes("player") || 
                    winnerStr === "a" || 
                    winnerStr === "1" ||
                    winner === "A" ||
                    winner === 1 ||
                    winner === "1" ||
                    winnerStr === "p";
                  const isDealerWinner = 
                    winnerStr.includes("dealer") || 
                    winnerStr === "b" || 
                    winnerStr === "2" ||
                    winner === "B" ||
                    winner === 2 ||
                    winner === "2" ||
                    winnerStr === "d";
                  const isTie = 
                    winnerStr.includes("tie") || 
                    winnerStr === "t" ||
                    winner === "Tie" ||
                    winner === "T" ||
                    winner === 3 ||
                    winner === "3";

                  // Get rdesc for additional info
                  const rdesc = t1Data.rdesc || "";
                  
                  // Show trophy for both if tie
                  const showPlayerTrophy = isPlayerWinner || (isTie && playerCard);
                  const showDealerTrophy = isDealerWinner || (isTie && dealerCard);

                  return (
                    <div className="space-y-4">
                      {/* Round ID and Match Time */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm border-b border-gray-200 pb-3 pt-2">
                        <div>
                          <span className="font-semibold text-gray-700">Round Id: </span>
                          <span className="text-gray-900 font-mono">
                            {t1Data.rid || t1Data.mid || detailData.mid || selectedResult?.mid || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Match Time: </span>
                          <span className="text-gray-900">
                            {t1Data.mtime || t1Data.match_time || detailData.mtime || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Player and Dealer Cards */}
                      <div className="grid grid-cols-2 gap-6 sm:gap-8 py-4">
                        {/* Player Section */}
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800">
                              Player
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-3">
                            {playerCard ? (
                              <div className="relative">
                                <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded-lg bg-white flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                                  <span className={`text-xl sm:text-2xl font-bold ${playerCard.isRed ? "text-red-600" : "text-black"}`}>
                                    {playerCard.rank}
                                  </span>
                                  <span className={`text-3xl sm:text-4xl ${playerCard.isRed ? "text-red-600" : "text-black"}`}>
                                    {playerCard.suit}
                                  </span>
                                </div>
                                {showPlayerTrophy && (
                                  <div className={`absolute -right-2 -top-2 rounded-full p-1 shadow-lg ${isTie ? "bg-yellow-500" : "bg-green-500"}`}>
                                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                                No card
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dealer Section */}
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800">
                              Dealer
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-3">
                            {dealerCard ? (
                              <div className="relative">
                                <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded-lg bg-white flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                                  <span className={`text-xl sm:text-2xl font-bold ${dealerCard.isRed ? "text-red-600" : "text-black"}`}>
                                    {dealerCard.rank}
                                  </span>
                                  <span className={`text-3xl sm:text-4xl ${dealerCard.isRed ? "text-red-600" : "text-black"}`}>
                                    {dealerCard.suit}
                                  </span>
                                </div>
                                {showDealerTrophy && (
                                  <div className={`absolute -right-2 -top-2 rounded-full p-1 shadow-lg ${isTie ? "bg-yellow-500" : "bg-green-500"}`}>
                                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                                No card
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Winner Information Box */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4 sm:p-5 shadow-sm">
                        <div className="space-y-2">
                          <div className="text-center">
                            <span className="font-bold text-gray-900 text-lg sm:text-xl">
                              Winner: {isPlayerWinner ? "Player" : isDealerWinner ? "Dealer" : isTie ? "Tie" : "N/A"}
                            </span>
                          </div>
                          {rdesc && (
                            <div className="text-center text-gray-700 text-sm sm:text-base mt-2">
                              {rdesc}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No data available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rules Modal */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>1 CARD ONE-DAY Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <p>
              1 CARD ONE-DAY is a very easy and fast paced game.
            </p>
            <p>
              This game is played with 8 decks of regular 52 cards between the player and dealer.
            </p>
            <p>
              Both, the player and dealer will be dealt one card each.
            </p>
            <p>
              The objective of the game is to guess whether the player or dealer will draw a card of the higher value and will therefore win.
            </p>
            <p>
              You can place your bets on the player as well as dealer.
            </p>
            <p>
              You have a betting option of Back and Lay for the main bet.
            </p>
            
            <p className="font-semibold mt-3">Ranking of cards : from lowest to highest</p>
            <p className="font-semibold">
              2 , 3 , 4 , 5 , 6 , 7 , 8 , 9 , 10 , J , Q , K , A
            </p>
            
            <p className="mt-3">
              If the player and dealer both have the same hand with the same ranking cards but of different suits then the winner will be decided according to the order of the suits.
            </p>
            
            <p className="font-semibold mt-3">Order of suits : from highest to lowest</p>
            <p className="font-semibold">
              Spades , Hearts , Clubs , Diamonds
            </p>
            
            <p className="mt-3">
              <span className="font-semibold">eg:</span> Clubs ACE Diamonds ACE<br />
              Here ACE of Clubs wins.
            </p>
            
            <p className="font-semibold mt-3">TIE :</p>
            <p>
              If both, the player and dealer hands have the same ranking cards which are of the same suit then it will be a TIE. In that case bets placed (Back and Lay) on both the player and dealer will be returned. (pushed)
            </p>
            <p>
              <span className="font-semibold">eg:</span> Ace of Spades Ace of Spades
            </p>
            
            <p className="font-semibold mt-3">7 DOWN 7 UP :</p>
            <p>
              Here you can bet whether it will be a 7Down card or a 7UP card irrespective of suits.
            </p>
            <p>
              <span className="font-semibold">7DOWN cards:</span> A, 2, 3, 4, 5, 6
            </p>
            <p>
              <span className="font-semibold">7UP cards :</span> 8, 9, 10, J, Q, K
            </p>
            
            <p className="font-semibold mt-3">CARD 7 :</p>
            <p>
              If the card drawn is 7, bets placed on both, 7Down and 7Up will lose half of the bet amount.
            </p>
            
            <p className="mt-3">
              For 7Down- 7Up you can bet on either or both the player and dealer.
            </p>
            
            <p className="mt-3">
              <span className="font-semibold">Note :</span> In case of a TIE between the player and dealer, bets placed on 7Down and 7Up will be considered valid.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

