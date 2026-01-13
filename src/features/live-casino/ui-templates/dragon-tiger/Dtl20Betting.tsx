import { useState, useMemo } from "react";
import { Lock, Info, X, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

/* ================= TYPES ================= */

interface Dtl20BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  formatOdds?: (val: any) => string; // Optional odds formatter
  resultHistory?: any[];
  currentResult?: any;
  tableId?: string;
}

/* ================= HELPERS ================= */

// Get odds from multiple possible fields
const getOdds = (bet: any) => {
  if (!bet) return 0;
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? bet.l ?? 0;
};

// Format odds value
const formatOddsValue = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

// Check if bet is suspended or locked 
const isSuspended = (b: any) => {
  if (!b) return true;
  if (b?.gstatus === "SUSPENDED" || b?.status === "suspended") return true;
  const odds = getOdds(b);
  const oddsValue = formatOddsValue(odds);
  // If odds are 0 or "0.00", consider it suspended
  if (oddsValue === "0.00" || Number(odds) === 0) return true;
  return false;
};

const find = (bets: any[], nat: string) =>
  bets.find((b) => (b.nat || "").toLowerCase() === nat.toLowerCase());

const cardRanks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// Playing Card Label Component
const CardLabel = ({ rank }: { rank: string }) => {
  const getSuitColor = (suit: string) => {
    return suit === "♥" || suit === "♦" ? "text-red-600" : "text-black";
  };

  return (
    <div className="p-1 flex items-center justify-center h-9">
      <div className="relative bg-white rounded border border-gray-400 shadow-sm 
                      w-7 h-7 sm:w-8 sm:h-8
                      flex flex-col items-center justify-center">
        {/* Rank at top left */}
        <div className="absolute top-0.5 left-0.5 
                        text-[7px] sm:text-[8px]
                        font-bold text-black leading-none">
          {rank}
        </div>
        
        {/* Four suits in center in a 2x2 grid */}
        <div className="grid grid-cols-2 gap-0.5 
                        text-[7px] sm:text-[8px]">
          <span className={getSuitColor("♠")}>♠</span>
          <span className={getSuitColor("♥")}>♥</span>
          <span className={getSuitColor("♣")}>♣</span>
          <span className={getSuitColor("♦")}>♦</span>
        </div>
        
        {/* Rank at bottom right (rotated) */}
        <div className="absolute bottom-0.5 right-0.5 
                        text-[7px] sm:text-[8px]
                        font-bold text-black rotate-180 leading-none">
          {rank}
        </div>
      </div>
    </div>
  );
};

/* ================= COMPONENT ================= */

export const Dtl20Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  formatOdds = formatOddsValue,
  resultHistory = [],
  currentResult,
  tableId,
}: Dtl20BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [amount, setAmount] = useState("100");
  
  // Detail result modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const quickAmounts = [100, 500, 1000, 5000];
  
  // Get last 10 results - handle different data structures
  const last10Results = useMemo(() => {
    // Handle different API response structures:
    // 1. Direct array: [...]
    // 2. Wrapped: { data: { res: [...] } }
    // 3. Wrapped: { res: [...] }
    // 4. From currentResult: { results: [...] }
    
    let results: any[] = [];
    
    // First try: resultHistory as direct array
    if (Array.isArray(resultHistory) && resultHistory.length > 0) {
      results = resultHistory;
    } else if (resultHistory && typeof resultHistory === 'object') {
      // Try to extract from nested structures
      results = (resultHistory as any)?.data?.res || 
                (resultHistory as any)?.res || 
                (resultHistory as any)?.results ||
                (resultHistory as any)?.data?.data?.res ||
                [];
    }
    
    // Second try: currentResult.results array
    if (results.length === 0 && currentResult?.results && Array.isArray(currentResult.results) && currentResult.results.length > 0) {
      results = currentResult.results;
    }
    
    // Third try: currentResult.data.res
    if (results.length === 0 && currentResult?.data?.res && Array.isArray(currentResult.data.res)) {
      results = currentResult.data.res;
    }
    
    // Fourth try: currentResult as array
    if (results.length === 0 && Array.isArray(currentResult) && currentResult.length > 0) {
      results = currentResult;
    }
    
    // Ensure it's an array and take first 10
    const finalResults = Array.isArray(results) ? results.slice(0, 10) : [];
    return finalResults;
  }, [resultHistory, currentResult]);

  // Show UI even without data - just display the structure

  const get = (nat: string) => find(betTypes, nat);

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet) || formatOdds(getOdds(bet)) === "0.00") return;
    setSelectedBet(bet);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;
    
    await onPlaceBet({
      sid: selectedBet.sid,
      odds: getOdds(selectedBet),
      nat: selectedBet.nat,
      amount: parseFloat(amount),
    });
    
    setBetModalOpen(false);
    setSelectedBet(null);
    setAmount("100");
  };

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
    }
  };

  const Cell = ({ bet }: { bet: any }) => {
    // Show UI even if bet is undefined - just show placeholder/locked state
    if (!bet) {
      return (
        <div className="h-9 w-full flex items-center justify-center">
          <button
            disabled
            className="h-6 w-4/5 flex items-center justify-center text-[10px] sm:text-xs font-semibold rounded bg-gray-200 text-gray-500 cursor-not-allowed"
          >
            <Lock size={11} />
          </button>
        </div>
      );
    }
    
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet);
    
    return (
      <div className="h-9 w-full flex items-center justify-center">
        <button
          disabled={suspended || loading}
          onClick={() => openBetModal(bet)}
          className={`
            h-6 w-4/5 flex items-center justify-center
            text-[10px] sm:text-xs font-semibold rounded
            ${
              suspended
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-sky-400 text-white hover:bg-sky-500 cursor-pointer"
            }
          `}
        >
          {suspended ? <Lock size={11} /> : formattedOdds}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">20-20 Dragon Tiger Lion</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= UNIFIED TABLE (SPLIT INTO TWO COLUMNS) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border items-stretch">
        {/* LEFT SECTION: Winner, Black, Red, Odd, Even, A-4 */}
        <div className="border-r flex flex-col">
          <div className="grid grid-cols-4 text-xs font-semibold bg-card h-9 flex-shrink-0">
            <div className="flex items-center" />
            <div className="text-center text-white flex items-center justify-center">Dragon</div>
            <div className="text-center text-white flex items-center justify-center">Tiger</div>
            <div className="text-center text-white flex items-center justify-center">Lion</div>
          </div>

          {/* Winner */}
          <div className="grid grid-cols-4 border-t h-9">
            <div className="px-1.5 py-1 text-[11px] sm:text-xs flex items-center">Winner</div>
            <Cell bet={get("Winner D")} />
            <Cell bet={get("Winner T")} />
            <Cell bet={get("Winner L")} />
          </div>

          {/* Black */}
          <div className="grid grid-cols-4 border-t h-9">
            <div className="px-1.5 py-1 text-[11px] sm:text-xs flex items-center gap-0.5">
              Black
              <span className="text-black text-[11px]">♠</span>
              <span className="text-black text-[11px]">♣</span>
            </div>
            <Cell bet={get("Black D")} />
            <Cell bet={get("Black T")} />
            <Cell bet={get("Black L")} />
          </div>

          {/* Red */}
          <div className="grid grid-cols-4 border-t h-9">
            <div className="px-1.5 py-1 text-[11px] sm:text-xs flex items-center gap-0.5">
              Red
              <span className="text-red-600 text-[11px]">♥</span>
              <span className="text-red-600 text-[11px]">♦</span>
            </div>
            <Cell bet={get("Red D")} />
            <Cell bet={get("Red T")} />
            <Cell bet={get("Red L")} />
          </div>

          {/* Odd */}
          <div className="grid grid-cols-4 border-t h-9">
            <div className="px-1.5 py-1 text-[11px] sm:text-xs flex items-center">Odd</div>
            <Cell bet={get("Odd D")} />
            <Cell bet={get("Odd T")} />
            <Cell bet={get("Odd L")} />
          </div>

          {/* Even */}
          <div className="grid grid-cols-4 border-t h-9">
            <div className="px-1.5 py-1 text-[11px] sm:text-xs flex items-center">Even</div>
            <Cell bet={get("Even D")} />
            <Cell bet={get("Even T")} />
            <Cell bet={get("Even L")} />
          </div>

          {/* Cards A-4 */}
          {cardRanks.slice(0, 4).map((r) => (
            <div key={r} className="grid grid-cols-4 border-t h-9">
              <CardLabel rank={r} />
              <Cell bet={get(`Dragon ${r}`)} />
              <Cell bet={get(`Tiger ${r}`)} />
              <Cell bet={get(`Lion ${r}`)} />
            </div>
          ))}
        </div>

        {/* RIGHT SECTION: Cards 5-K */}
        <div className="flex flex-col">
          <div className="grid grid-cols-4 text-xs font-semibold bg-card h-9 flex-shrink-0">
            <div className="flex items-center" />
            <div className="text-center text-white flex items-center justify-center">Dragon</div>
            <div className="text-center text-white flex items-center justify-center">Tiger</div>
            <div className="text-center text-white flex items-center justify-center">Lion</div>
          </div>

          {/* Cards 5-K */}
          {cardRanks.slice(4).map((r) => (
            <div key={r} className="grid grid-cols-4 border-t h-9">
              <CardLabel rank={r} />
              <Cell bet={get(`Dragon ${r}`)} />
              <Cell bet={get(`Tiger ${r}`)} />
              <Cell bet={get(`Lion ${r}`)} />
            </div>
          ))}
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10Results.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              const winner = result.win || result.winner || result.result || result.nat || "";
              const winnerStr = String(winner).toLowerCase().trim();
              
              // Handle numeric values: 1 = Dragon, 2 = Tiger, 3 = Lion
              // Also handle text: "dragon", "tiger", "lion", "d", "t", "l"
              let letter = "L";
              let bgColor = "bg-red-500";
              
              // Check for numeric values first (1 = Dragon, 2 = Tiger, 3 = Lion)
              if (winner === 1 || winner === "1" || winnerStr === "1") {
                letter = "D";
                bgColor = "bg-orange-500";
              } else if (winner === 2 || winner === "2" || winnerStr === "2") {
                letter = "T";
                bgColor = "bg-yellow-500";
              } else if (winner === 3 || winner === "3" || winnerStr === "3") {
                letter = "L";
                bgColor = "bg-red-500";
              } else if (winnerStr.includes("dragon") || winnerStr === "d") {
                letter = "D";
                bgColor = "bg-orange-500";
              } else if (winnerStr.includes("tiger") || winnerStr === "t") {
                letter = "T";
                bgColor = "bg-yellow-500";
              } else if (winnerStr.includes("lion") || winnerStr === "l") {
                letter = "L";
                bgColor = "bg-red-500";
              } else {
                // Try to extract first letter if it's a single character
                const firstChar = String(winner).charAt(0).toUpperCase();
                if (firstChar === "D" || firstChar === "1") {
                  letter = "D";
                  bgColor = "bg-orange-500";
                } else if (firstChar === "T" || firstChar === "2") {
                  letter = "T";
                  bgColor = "bg-yellow-500";
                } else if (firstChar === "L" || firstChar === "3") {
                  letter = "L";
                  bgColor = "bg-red-500";
                }
              }

              return (
                <button
                  key={result.mid || result.round_id || result.round || index}
                  onClick={() => handleResultClick(result)}
                  className={`flex-shrink-0 w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full ${bgColor} text-white font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center active:opacity-80 touch-none hover:scale-110 transition-transform cursor-pointer`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-2 text-xs text-muted-foreground text-center py-2">
            No results yet
          </div>
        )}
      </div>

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="bg-slate-800 text-white px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          {selectedBet && (
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Odds: <span className="font-bold text-blue-600 dark:text-blue-400">{formatOdds(getOdds(selectedBet))}</span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className={`py-2 px-2 rounded text-xs font-medium ${
                      amount === String(amt)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-600 hover:bg-gray-700 text-white"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Amount Input */}
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Potential win: ₹
                  {(parseFloat(amount) * (Number(getOdds(selectedBet)) > 1000 ? Number(getOdds(selectedBet)) / 100000 : Number(getOdds(selectedBet)))).toFixed(2)}
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                onClick={handlePlaceBet}
              >
                {loading ? "Placing..." : `Place Bet ₹${amount}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm">
          <DialogHeader>
            <DialogTitle>20-20 D T L Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              20-20 DTL (Dragon Tiger Lion) is a 52 playing cards game.  
              In DTL game, 3 hands are dealt – one for each player.
              The player bets on which hand will win.
            </p>

            <p>
              The ranking of cards is from lowest to highest:
              Ace, 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen and King,
              where Ace is "1" and King is "13".
            </p>

            <p>
              On same card with different suit, winner will be declared
              based on the following winning suit sequence:
            </p>

            <p className="font-semibold">
              ♠ Spade &nbsp; 1st <br />
              ♥ Heart &nbsp; 2nd <br />
              ♣ Club &nbsp; 3rd <br />
              ♦ Diamond &nbsp; 4th
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Dragon Tiger Lion Result</h2>
            <button
              onClick={() => setDetailDialogOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-700 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-6 bg-white dark:bg-gray-900">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading details...</span>
              </div>
            ) : detailData ? (
              <div className="space-y-4">
                {detailData.error ? (
                  <div className="text-center py-8">
                    <p className="text-destructive font-medium mb-2">Error</p>
                    <p className="text-sm text-muted-foreground">{detailData.error}</p>
                  </div>
                ) : (() => {
                  // Extract t1 data from the response
                  const t1Data = detailData?.data?.t1 || detailData?.t1 || null;
                  
                  if (!t1Data) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No detailed result data available
                      </div>
                    );
                  }

                  // Parse rdesc to extract winner and one or more bet results
                  const parseRdesc = (rdesc: string) => {
                    if (!rdesc) {
                      return {
                        winner: null,
                        results: [] as { betOption: string | null; result: string | null }[],
                        fullText: null
                      };
                    }

                    const parts = rdesc.split('#').map((p) => p.trim()).filter(Boolean);

                    if (parts.length === 0) {
                      return {
                        winner: null,
                        results: [],
                        fullText: rdesc
                      };
                    }

                    const winner = parts[0];
                    const results = parts.slice(1).map((segment) => {
                      const colonIndex = segment.indexOf(':');
                      if (colonIndex === -1) {
                        return {
                          betOption: segment.trim(),
                          result: null
                        };
                      }
                      const betOption = segment.substring(0, colonIndex).trim();
                      const result = segment.substring(colonIndex + 1).trim();
                      return { betOption, result };
                    });

                    return {
                      winner: winner || null,
                      results,
                      fullText: rdesc
                    };
                  };

                  const parsedRdesc = parseRdesc(t1Data.rdesc || '');

                  // Parse cards similar to TrapBetting
                  const parseCards = (cardString: string) => {
                    if (!cardString) return [];
                    const cards = cardString.split(',').map((c) => c.trim()).filter(Boolean);
                    return cards.map((card) => {
                      if (card === "1") return null;
                      
                      let rank = "";
                      let suit = "";
                      if (card.length >= 3) {
                        if (card.startsWith("10")) {
                          rank = "10";
                          suit = card.slice(2);
                        } else {
                          rank = card[0];
                          suit = card.slice(1);
                        }
                      }
                      
                      const suitMap: Record<string, string> = { 
                        S: "♠", H: "♥", C: "♣", D: "♦",
                        SS: "♠", HH: "♥", CC: "♣", DD: "♦"
                      };
                      const rankMap: Record<string, string> = { 
                        "1": "A", A: "A", K: "K", Q: "Q", J: "J",
                        "10": "10"
                      };
                      const displayRank = rankMap[rank] || rank;
                      const displaySuit = suitMap[suit] || suit;
                      
                      return {
                        raw: card,
                        rank: displayRank,
                        suit: displaySuit,
                        isRed: suit === "H" || suit === "HH" || suit === "D" || suit === "DD",
                      };
                    }).filter(Boolean);
                  };

                  const cardString = t1Data.card || "";
                  const allCards = parseCards(cardString);
                  // For DTL, first card is Dragon, second is Tiger, third is Lion
                  const dragonCard = allCards[0] || null;
                  const tigerCard = allCards[1] || null;
                  const lionCard = allCards[2] || null;

                  // Parse winner
                  const winner = t1Data.winnat || t1Data.win || parsedRdesc.winner || "";
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isDragonWinner = 
                    winnerStr.includes("dragon") || 
                    winnerStr === "d" || 
                    winnerStr === "1" ||
                    winner === 1 ||
                    winner === "1";
                  const isTigerWinner = 
                    winnerStr.includes("tiger") || 
                    winnerStr === "t" || 
                    winnerStr === "2" ||
                    winner === 2 ||
                    winner === "2";
                  const isLionWinner = 
                    winnerStr.includes("lion") || 
                    winnerStr === "l" || 
                    winnerStr === "3" ||
                    winner === 3 ||
                    winner === "3";

                  return (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm border-b pb-3">
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Round Id: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono">{t1Data.rid || selectedResult?.mid || "N/A"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Match Time: </span>
                          <span className="text-gray-900 dark:text-gray-100">{t1Data.mtime || "N/A"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Dragon
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isDragonWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {dragonCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${dragonCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{dragonCard.rank}</span>
                                  <span className={`text-lg ${dragonCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{dragonCard.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">No card</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Tiger
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isTigerWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {tigerCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${tigerCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{tigerCard.rank}</span>
                                  <span className={`text-lg ${tigerCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{tigerCard.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">No card</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Lion
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isLionWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {lionCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${lionCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{lionCard.rank}</span>
                                  <span className={`text-lg ${lionCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{lionCard.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">No card</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Winner: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {isDragonWinner ? "Dragon" : isTigerWinner ? "Tiger" : isLionWinner ? "Lion" : winner || "N/A"}
                            </span>
                          </div>
                          {parsedRdesc.results && parsedRdesc.results.length > 0 && (
                            <div className="pt-2 border-t border-gray-300 dark:border-gray-600 space-y-1">
                              {parsedRdesc.results.map((res, idx) => (
                                <div key={idx}>
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">{res.betOption || "N/A"}: </span>
                                  {res.result && (
                                    <span className="text-gray-900 dark:text-gray-100">{res.result}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {t1Data.win && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Win Code: </span>
                              <span className="text-gray-900 dark:text-gray-100 font-mono">{t1Data.win}</span>
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
                No detailed data available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </>
  ); 
};
