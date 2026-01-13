import { Lock, Info, X, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ================= TYPES ================= */

interface Dt20BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  resultHistory?: any[];
  currentResult?: any;
  tableId?: string;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string) =>
  bets.find((b) => (b.nat || "").toLowerCase() === nat.toLowerCase());

const getOdds = (bet: any) =>
  bet?.back ?? bet?.b ?? bet?.b1 ?? bet?.odds ?? 0;

const formatOdds = (val: any): string => {
  const num = Number(val);
  if (!num || isNaN(num)) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* ================= COMPONENT ================= */

export const Dt20Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  resultHistory = [],
  currentResult,
  tableId,
}: Dt20BettingProps) => {
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

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet) || formatOdds(getOdds(bet)) === "0.00") return;
    setSelectedBet(bet);
    setAmount("100");
    setBetModalOpen(true);
  };

  const placeBet = async () => {
    if (!selectedBet) return;
    await onPlaceBet({
      sid: selectedBet.sid,
      nat: selectedBet.nat,
      odds: getOdds(selectedBet),
      amount: Number(amount),
    });
    setBetModalOpen(false);
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

  // Primary Bet Cell with odds above
  const PrimaryCell = ({ bet, label }: { bet: any; label: string }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative w-full flex flex-col items-center justify-center
          py-3 px-2 rounded-md transition-all
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          }
        `}
      >
        <div className="text-xs font-semibold mb-1">{odds}</div>
        <div className="text-sm font-bold">{label}</div>
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock size={16} />
          </div>
        )}
      </button>
    );
  };

  // Regular Cell for sub-bets
  const Cell = ({ bet }: { bet: any }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          h-10 w-full text-sm font-semibold flex items-center justify-center rounded
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : odds}
      </button>
    );
  };

  // Card Cell with yellow border and suit icons
  const CardCell = ({ bet, card, small = false }: { bet: any; card: string; small?: boolean }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative border-2 border-yellow-400 bg-white rounded-md
          flex flex-col items-center justify-center w-full
          transition-all
          ${small ? 'p-0.5 min-h-[35px]' : 'p-1 min-h-[45px]'}
          ${
            suspended
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-yellow-50 cursor-pointer hover:border-yellow-500"
          }
        `}
      >
        <div className={`font-bold text-gray-900 mb-0.5 ${small ? 'text-[10px]' : 'text-xs'}`}>{card}</div>
        <div className={`grid grid-cols-2 gap-0.5 ${small ? 'text-[8px]' : 'text-[10px]'}`}>
          <span className="text-black">♠</span>
          <span className="text-red-500">♥</span>
          <span className="text-black">♣</span>
          <span className="text-red-500">♦</span>
        </div>
        {odds !== "0.00" && (
          <div className={`text-gray-600 mt-0.5 ${small ? 'text-[7px]' : 'text-[8px]'}`}>{odds}</div>
        )}
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 rounded">
            <Lock size={small ? 8 : 10} />
          </div>
        )}
      </button>
    );
  };

  // Ace = 1 (dt20 API)
  const cards = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">20-20 Dragon Tiger</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= PRIMARY BETS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <PrimaryCell bet={find(betTypes, "Dragon")} label="Dragon" />
        <PrimaryCell bet={find(betTypes, "Tie")} label="Tie" />
        <PrimaryCell bet={find(betTypes, "Tiger")} label="Tiger" />
        <PrimaryCell bet={find(betTypes, "Pair")} label="Pair" />
      </div>

      {/* ================= DRAGON & TIGER SECTIONS (SIDE BY SIDE) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* DRAGON BLOCK */}
        <div className="border rounded-lg p-2">
          <div className="text-xs font-bold mb-2 text-gray-700 text-center">DRAGON</div>
          
          {/* Headers Row */}
          <div className="grid grid-cols-4 gap-1 mb-1">
            <div className="text-xs font-semibold text-center py-1">Even</div>
            <div className="text-xs font-semibold text-center py-1">Odd</div>
            <div className="text-xs font-semibold text-center py-1 flex items-center justify-center gap-0.5">
              <span className="text-red-500">♥</span>
              <span className="text-red-500">♦</span>
            </div>
            <div className="text-xs font-semibold text-center py-1 flex items-center justify-center gap-0.5">
              <span className="text-black">♠</span>
              <span className="text-black">♣</span>
            </div>
          </div>

          {/* Odds Row */}
          <div className="grid grid-cols-4 gap-1">
            <Cell bet={find(betTypes, "Dragon Even")} />
            <Cell bet={find(betTypes, "Dragon Odd")} />
            <Cell bet={find(betTypes, "Dragon Red")} />
            <Cell bet={find(betTypes, "Dragon Black")} />
          </div>
        </div>

        {/* TIGER BLOCK */}
        <div className="border rounded-lg p-2">
          <div className="text-xs font-bold mb-2 text-gray-700 text-center">TIGER</div>
          
          {/* Headers Row */}
          <div className="grid grid-cols-4 gap-1 mb-1">
            <div className="text-xs font-semibold text-center py-1">Even</div>
            <div className="text-xs font-semibold text-center py-1">Odd</div>
            <div className="text-xs font-semibold text-center py-1 flex items-center justify-center gap-0.5">
              <span className="text-red-500">♥</span>
              <span className="text-red-500">♦</span>
            </div>
            <div className="text-xs font-semibold text-center py-1 flex items-center justify-center gap-0.5">
              <span className="text-black">♠</span>
              <span className="text-black">♣</span>
            </div>
          </div>

          {/* Odds Row */}
          <div className="grid grid-cols-4 gap-1">
            <Cell bet={find(betTypes, "Tiger Even")} />
            <Cell bet={find(betTypes, "Tiger Odd")} />
            <Cell bet={find(betTypes, "Tiger Red")} />
            <Cell bet={find(betTypes, "Tiger Black")} />
          </div>
        </div>
      </div>

      {/* ================= CARDS SECTION (DRAGON LEFT, TIGER RIGHT) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* DRAGON 12 - All 13 cards in one border */}
        <div className="border rounded-lg p-2">
          <div className="text-xs font-bold mb-2 text-gray-700 text-center">DRAGON 0</div>
          
          {/* First Row: 9 cards */}
          <div 
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}
          >
            {cards.slice(0, 9).map((c) => (
              <CardCell key={c} bet={find(betTypes, `Dragon Card ${c}`)} card={c} />
            ))}
          </div>

          {/* Second Row: 4 cards - Smaller size */}
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
          >
            {cards.slice(9, 13).map((c) => (
              <CardCell key={c} bet={find(betTypes, `Dragon Card ${c}`)} card={c} small={true} />
            ))}
          </div>
        </div>

        {/* TIGER 12 - All 13 cards in one border */}
        <div className="border rounded-lg p-2">
          <div className="text-xs font-bold mb-2 text-gray-700 text-center">TIGER 0</div>
          
          {/* First Row: 9 cards */}
          <div 
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}
          >
            {cards.slice(0, 9).map((c) => (
              <CardCell key={c} bet={find(betTypes, `Tiger Card ${c}`)} card={c} />
            ))}
          </div>

          {/* Second Row: 4 cards - Smaller size */}
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
          >
            {cards.slice(9, 13).map((c) => (
              <CardCell key={c} bet={find(betTypes, `Tiger Card ${c}`)} card={c} small={true} />
            ))}
          </div>
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
              
              // Handle numeric values: 1 = Dragon, 2 = Tiger
              // Also handle text: "dragon", "tiger", "d", "t"
              let letter = "?";
              let bgColor = "bg-gray-600";
              
              // Check for numeric values first (1 = Dragon, 2 = Tiger)
              if (winner === 1 || winner === "1" || winnerStr === "1") {
                letter = "D";
                bgColor = "bg-orange-500";
              } else if (winner === 2 || winner === "2" || winnerStr === "2") {
                letter = "T";
                bgColor = "bg-yellow-500";
              } else if (winnerStr.includes("dragon") || winnerStr === "d") {
                letter = "D";
                bgColor = "bg-orange-500";
              } else if (winnerStr.includes("tiger") || winnerStr === "t") {
                letter = "T";
                bgColor = "bg-yellow-500";
              } else {
                // Try to extract first letter if it's a single character
                const firstChar = String(winner).charAt(0).toUpperCase();
                if (firstChar === "D" || firstChar === "1") {
                  letter = "D";
                  bgColor = "bg-orange-500";
                } else if (firstChar === "T" || firstChar === "2") {
                  letter = "T";
                  bgColor = "bg-yellow-500";
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
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="bg-slate-800 text-white px-3 py-2 flex justify-between items-center">
            <DialogTitle className="text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          {selectedBet && (
            <div className="p-4 space-y-3">
              <div className="text-sm font-semibold">{selectedBet.nat}</div>
              <div className="text-xs text-gray-600">
                Odds: <span className="font-bold">{formatOdds(getOdds(selectedBet))}</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`py-2 px-2 rounded text-xs font-medium transition-colors ${
                      amount === String(a)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    ₹{a}
                  </button>
                ))}
              </div>

              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full"
              />

              {amount && parseFloat(amount) > 0 && (
                <div className="text-xs text-gray-600">
                  Potential win: ₹
                  {(
                    parseFloat(amount) *
                    (Number(getOdds(selectedBet)) > 1000
                      ? Number(getOdds(selectedBet)) / 100000
                      : Number(getOdds(selectedBet)))
                  ).toFixed(2)}
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={placeBet}
                disabled={loading || !amount || parseFloat(amount) <= 0}
              >
                {loading ? "Placing..." : `Place Bet ₹${amount}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= RULES ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm">
          <DialogHeader>
            <DialogTitle>Dragon Tiger Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>• Highest card wins</p>
            <p>• Same rank → suit priority</p>
            <p className="font-semibold">
              ♠ Spade &gt; ♥ Heart &gt; ♣ Club &gt; ♦ Diamond
            </p>
            <p>• Same rank + same suit = Tie</p>
            <p>• Pair = same rank</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Dragon Tiger Result</h2>
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
                  // For Dragon Tiger, first card is Dragon, second is Tiger
                  const dragonCard = allCards[0] || null;
                  const tigerCard = allCards[1] || null;

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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                      </div>

                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Winner: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {isDragonWinner ? "Dragon" : isTigerWinner ? "Tiger" : winner || "N/A"}
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
