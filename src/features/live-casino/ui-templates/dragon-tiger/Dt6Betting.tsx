// src/pages/tables/Dt6Betting.tsx

import { Lock, Info, X, Loader2 } from "lucide-react";
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
          <div className="flex gap-1.5 px-2 overflow-x-auto">
            {last10Results.map((result: any, index: number) => {
              const winner = result.win || result.winner || result.result || result.nat || "";
              const winnerStr = String(winner).toLowerCase().trim();
              
              // Handle numeric values: 1 = Dragon, 2 = Tiger
              // Also handle text: "dragon", "tiger", "d", "t"
              let letter = "?";
              let textColor = "text-white";
              
              // Check for numeric values first (1 = Dragon, 2 = Tiger)
              if (winner === 1 || winner === "1" || winnerStr === "1") {
                letter = "D";
                textColor = "text-orange-500";
              } else if (winner === 2 || winner === "2" || winnerStr === "2") {
                letter = "T";
                textColor = "text-yellow-400";
              } else if (winnerStr.includes("dragon") || winnerStr === "d") {
                letter = "D";
                textColor = "text-orange-500";
              } else if (winnerStr.includes("tiger") || winnerStr === "t") {
                letter = "T";
                textColor = "text-yellow-400";
              } else {
                // Try to extract first letter if it's a single character
                const firstChar = String(winner).charAt(0).toUpperCase();
                if (firstChar === "D" || firstChar === "1") {
                  letter = "D";
                  textColor = "text-orange-500";
                } else if (firstChar === "T" || firstChar === "2") {
                  letter = "T";
                  textColor = "text-yellow-400";
                }
              }

              return (
                <button
                  key={result.mid || result.round_id || result.round || index}
                  onClick={() => handleResultClick(result)}
                  className={`flex-shrink-0 w-10 h-10 rounded-full bg-green-700 ${textColor} font-bold text-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer`}
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
                  Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet))}
                  </span>
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
                  {(
                    parseFloat(amount) *
                    (Number(getOdds(selectedBet)) > 1000
                      ? Number(getOdds(selectedBet)) / 100000
                      : Number(getOdds(selectedBet)))
                  ).toFixed(2)}
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
            <DialogTitle>Dragon Tiger Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              • Dragon Tiger game me 2 hands deal hoti hain – ek Dragon ke liye
              aur ek Tiger ke liye. Player bet karta hai kaunsa jeetega ya tie
              hoga.
            </p>

            <p>
              • Har side ko ek hi card milta hai. Highest ranking card winner
              hota hai.
            </p>

            <p>• Game 1 deck (52 cards) se khela jata hai.</p>

            <p>
              • Card ranking (lowest se highest): <br />
              <b>Ace (1), 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen, King (13)</b>
            </p>

            <p>
              • Agar same rank ka card aaye (jaise Ace vs Ace), to winner suit
              priority se decide hota hai:
            </p>

            <p className="font-semibold">
              ♠ Spade &gt; ♥ Heart &gt; ♣ Club &gt; ♦ Diamond
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Round #{selectedResult?.mid || selectedResult?.round || selectedResult?.round_id || "N/A"} - Detailed Result
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
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

                  // Format cards for display
                  const formatCards = (cardString: string) => {
                    if (!cardString) return [];
                    return cardString.split(',').map(card => card.trim());
                  };

                  const cards = formatCards(t1Data.card || '');
                  const parsedRdesc = parseRdesc(t1Data.rdesc || '');

                  return (
                    <div className="space-y-6">
                      {/* Winner Section - Highlighted */}
                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-lg p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Winner</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                              {parsedRdesc.winner || t1Data.winnat || 'N/A'}
                            </p>
                          </div>
                          
                          {/* Multiple bet results for same round */}
                          {parsedRdesc.results && parsedRdesc.results.length > 0 && (
                            <div className="pt-2 border-t border-green-500/30 space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">
                                Round Results
                              </p>
                              <div className="space-y-1">
                                {parsedRdesc.results.map((res, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-md bg-green-500/10 px-2 py-1.5"
                                  >
                                    <span className="text-xs font-medium text-green-700 dark:text-green-200">
                                      Bet:{" "}
                                      <span className="font-semibold">
                                        {res.betOption || "N/A"}
                                      </span>
                                    </span>
                                    {res.result && (
                                      <span className="text-xs text-green-800 dark:text-green-100">
                                        Result:{" "}
                                        <span className="font-medium">
                                          {res.result}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-green-500/30">
                            <p className="text-xs text-muted-foreground mb-1">Win Code</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {t1Data.win || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Game Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Event Name</p>
                          <p className="text-sm font-medium">{t1Data.ename || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Round ID</p>
                          <p className="text-sm font-medium font-mono">{t1Data.rid || 'N/A'}</p>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <p className="text-xs font-semibold text-muted-foreground">Round Description</p>
                          <p className="text-sm font-medium break-words">{parsedRdesc.fullText || t1Data.rdesc || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Time</p>
                          <p className="text-sm font-medium">{t1Data.mtime || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Cards Display */}
                      {cards.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Cards</p>
                          <div className="flex flex-wrap gap-2">
                            {cards.map((card, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border border-red-300 dark:border-red-700 rounded-md font-mono font-bold text-sm text-red-700 dark:text-red-300"
                              >
                                {card}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
