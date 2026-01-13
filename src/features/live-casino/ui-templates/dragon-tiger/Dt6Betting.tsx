// src/pages/tables/Dt6Betting.tsx

import { Lock, Info, X, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ================= TYPES ================= */

interface Dt6BettingProps {
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
  bets.find((b) => {
    const betNat = (b.nat || "").toLowerCase();
    const betType = (b.type || "").toLowerCase();
    const searchTerm = nat.toLowerCase();
    return betNat === searchTerm || betType === searchTerm;
  });

// Get odds from multiple possible fields
const getOdds = (bet: any) => {
  if (!bet) return 0;
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? bet.l ?? 0;
};

// Format odds value
const formatOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* ================= COMPONENT ================= */

export const Dt6Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false, 
  resultHistory = [],
  currentResult,
  tableId,
}: Dt6BettingProps) => {
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
  // Priority: resultHistory array > currentResult.results > resultHistory.results
  const last10Results = useMemo(() => {
    // First try: resultHistory as direct array
    if (Array.isArray(resultHistory) && resultHistory.length > 0) {
      return resultHistory.slice(0, 10);
    }
    
    // Second try: currentResult.results array (same as CurrentResult component)
    if (currentResult?.results && Array.isArray(currentResult.results) && currentResult.results.length > 0) {
      return currentResult.results.slice(0, 10);
    }
    
    // Third try: resultHistory.results (nested)
    if ((resultHistory as any)?.results && Array.isArray((resultHistory as any).results)) {
      return (resultHistory as any).results.slice(0, 10);
    }
    
    // Fourth try: currentResult as array (if it's the results array itself)
    if (Array.isArray(currentResult) && currentResult.length > 0) {
      return currentResult.slice(0, 10);
    }
    
    return [];
  }, [resultHistory, currentResult]);

  const dragon = find(betTypes, "Dragon");
  const tiger = find(betTypes, "Tiger");
  const pair = find(betTypes, "Pair");

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
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold
          ${
            suspended
              ? "bg-gray-200 text-gray-500"
              : "bg-sky-400 text-white hover:bg-sky-500"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : formattedOdds}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Dragon Tiger</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= DRAGON / TIGER ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-3 text-sm font-semibold ">
          <div className="h-10 flex items-center" />
          <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">
            Back
          </div>
          <div className="text-center bg-pink-300 text-gray-900 h-10 flex items-center justify-center">
            Lay
          </div>
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Dragon</div>
          <Cell bet={dragon} />
          <div className="bg-pink-200 flex items-center justify-center">0</div>
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Tiger</div>
          <Cell bet={tiger} />
          <div className="bg-pink-200 flex items-center justify-center">0</div>
        </div>
      </div>

      {/* ================= PAIR ================= */}
      {pair && (
        <div className="border mb-3">
          <div className="grid grid-cols-2">
            <div className="p-2 text-sm">12</div>
            <button
              disabled={
                isSuspended(pair) ||
                loading ||
                formatOdds(getOdds(pair)) === "0.00"
              }
              onClick={() => openBetModal(pair)}
              className={`h-10 bg-gradient-to-r from-sky-600 to-slate-700 text-white font-semibold ${
                isSuspended(pair) || formatOdds(getOdds(pair)) === "0.00"
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-sky-700 hover:to-slate-800"
              }`}
            >
              {isSuspended(pair) || formatOdds(getOdds(pair)) === "0.00" ? (
                <Lock size={14} />
              ) : (
                `Pair ${formatOdds(getOdds(pair))}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= EVEN / ODD ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-3 text-sm font-semibold">
          <div className="h-10 flex items-center" />
          <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">
            Even
          </div>
          <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">
            Odd
          </div>
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Dragon</div>
          <Cell bet={get("Dragon Even")} />
          <Cell bet={get("Dragon Odd")} />
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Tiger</div>
          <Cell bet={get("Tiger Even")} />
          <Cell bet={get("Tiger Odd")} />
        </div>
      </div>

      {/* ================= RED / BLACK ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-3 text-sm font-semibold">
          <div className="h-10 flex items-center" />
          <div className="text-center bg-sky-300 gap-2  text-gray-900 h-10 flex items-center justify-center">
            Red <span className="text-2xl"> ♦</span>
          </div>
          <div className="text-center bg-sky-300 gap-2 text-gray-900 h-10 flex items-center justify-center">
            Black <span className="text-2xl"> ♠</span>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Dragon</div>
          <Cell bet={get("Dragon Red")} />
          <Cell bet={get("Dragon Black")} />
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Tiger</div>
          <Cell bet={get("Tiger Red")} />
          <Cell bet={get("Tiger Black")} />
        </div>
      </div>

      {/* ================= SUITS ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-5 text-sm font-semibold">
          <div className="h-10 flex items-center" />
          <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center text-2xl font-bold">
            ♠
          </div>
          <div className="text-center bg-sky-300 text-red-500  h-10 flex items-center justify-center text-2xl font-bold">
            ♥
          </div>
          <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center text-2xl font-bold">
            ♣
          </div>
          <div className="text-center bg-sky-300 text-red-500  h-10 flex items-center justify-center text-2xl font-bold">
            ♦
          </div>
        </div>

        {["Dragon", "Tiger"].map((side) => (
          <div key={side} className="grid grid-cols-5 border-t">
            <div className="p-2 text-sm">{side}</div>
            <Cell bet={get(`${side} Spade`)} />
            <Cell bet={get(`${side} Heart`)} />
            <Cell bet={get(`${side} Club`)} />
            <Cell bet={get(`${side} Diamond`)} />
          </div>
        ))}
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10Results.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2  overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
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
        <DialogContent className="max-w-md w-full mx-4 p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Place Bet</h2>
            <button
              onClick={() => setBetModalOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>

          {selectedBet && (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Bet Type</div>
                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {selectedBet.nat}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Odds:</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet))}
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Amount</div>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(String(amt))}
                      className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded text-xs sm:text-sm font-semibold transition-all ${
                        amount === String(amt)
                          ? "bg-blue-600 text-white shadow-md scale-105"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Enter Amount</div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Potential Win
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{(
                      parseFloat(amount) *
                      (Number(getOdds(selectedBet)) > 1000
                        ? Number(getOdds(selectedBet)) / 100000
                        : Number(getOdds(selectedBet)))
                    ).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                onClick={handlePlaceBet}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    Placing Bet...
                  </>
                ) : (
                  `Place Bet ₹${amount}`
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-3xl w-full mx-4 max-h-[85vh] p-0 overflow-hidden flex flex-col bg-gray-900 dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Dragon Tiger Rules</h2>
            <button
              onClick={() => setRulesOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-gray-100">
              <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                <li>
                  Dragon Tiger game me 2 hands deal hoti hain – ek Dragon ke liye
                  aur ek Tiger ke liye. Player bet karta hai kaunsa jeetega ya tie
                  hoga.
                </li>
                <li>
                  Har side ko ek hi card milta hai. Highest ranking card winner
                  hota hai.
                </li>
                <li>Game 1 deck (52 cards) se khela jata hai.</li>
                <li>
                  Card ranking (lowest se highest): <br />
                  <b>Ace (1), 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen, King (13)</b>
                </li>
                <li>
                  Agar same rank ka card aaye (jaise Ace vs Ace), to winner suit
                  priority se decide hota hai:
                  <br />
                  <span className="font-semibold">
                    ♠ Spade &gt; ♥ Heart &gt; ♣ Club &gt; ♦ Diamond
                  </span>
                </li>
              </ul>
            </div>
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
