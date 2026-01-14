import { useState, useMemo } from "react";
import { Lock, Info, X, Loader2 } from "lucide-react";
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

interface Card3jBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  formatOdds?: (val: any) => string;
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
  if (oddsValue === "0.00" || Number(odds) === 0) return true;
  return false;
};

const find = (bets: any[], nat: string) =>
  bets.find((b) => (b.nat || "").toLowerCase() === nat.toLowerCase());

const cardRanks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// Card Component
const CardComponent = ({ 
  rank, 
  isSelected, 
  onClick, 
  disabled 
}: { 
  rank: string; 
  isSelected: boolean; 
  onClick: () => void; 
  disabled: boolean;
}) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
        relative bg-white rounded border-2 transition-all
        w-7 h-9 sm:w-8 sm:h-10
        flex flex-col items-center justify-center
        ${isSelected ? "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-300" : "border-yellow-400"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-50 cursor-pointer"}
      `}
    >
      {/* Rank at top */}
      <div className="text-[10px] sm:text-xs font-bold text-black leading-none mb-0.5">
        {rank}
      </div>
      
      {/* Suit symbols - club and heart stacked */}
      <div className="flex flex-col items-center gap-0 text-[8px] sm:text-[9px]">
        <span className="text-black">♣</span>
        <span className="text-red-600">♥</span>
      </div>
    </button>
  );
};

/* ================= COMPONENT ================= */

export const Card3jBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  formatOdds = formatOddsValue,
  resultHistory = [],
  currentResult,
  tableId,
}: Card3jBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No" | null>(null);
  const [amount, setAmount] = useState("100");
  
  // Detail result modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const quickAmounts = [100, 500, 1000, 5000];
  
  // Get last 10 results
  const last10Results = useMemo(() => {
    let results: any[] = [];
    
    if (Array.isArray(resultHistory) && resultHistory.length > 0) {
      results = resultHistory;
    } else if (resultHistory && typeof resultHistory === 'object') {
      results = (resultHistory as any)?.data?.res || 
                (resultHistory as any)?.res || 
                (resultHistory as any)?.results ||
                (resultHistory as any)?.data?.data?.res ||
                [];
    }
    
    if (results.length === 0 && currentResult?.results && Array.isArray(currentResult.results) && currentResult.results.length > 0) {
      results = currentResult.results;
    }
    
    if (results.length === 0 && currentResult?.data?.res && Array.isArray(currentResult.data.res)) {
      results = currentResult.data.res;
    }
    
    if (results.length === 0 && Array.isArray(currentResult) && currentResult.length > 0) {
      results = currentResult;
    }
    
    const finalResults = Array.isArray(results) ? results.slice(0, 10) : [];
    return finalResults;
  }, [resultHistory, currentResult]);

  const yesBet = find(betTypes, "Yes");
  const noBet = find(betTypes, "No");

  const handleCardClick = (rank: string) => {
    if (loading || isSuspended(yesBet) || isSuspended(noBet)) return;
    
    if (selectedCards.includes(rank)) {
      // Deselect card
      setSelectedCards(selectedCards.filter(c => c !== rank));
    } else {
      // Select card (max 3)
      if (selectedCards.length < 3) {
        setSelectedCards([...selectedCards, rank]);
      }
    }
  };

  const handleOutcomeClick = (outcome: "Yes" | "No") => {
    if (loading || isSuspended(outcome === "Yes" ? yesBet : noBet)) return;
    if (selectedCards.length !== 3) return;
    
    setSelectedOutcome(outcome);
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedOutcome || selectedCards.length !== 3 || !amount || parseFloat(amount) <= 0) return;
    
    const bet = selectedOutcome === "Yes" ? yesBet : noBet;
    if (!bet || isSuspended(bet)) return;
    
    await onPlaceBet({
      sid: bet.sid,
      odds: getOdds(bet),
      nat: bet.nat,
      amount: parseFloat(amount),
      selectedCards: selectedCards,
    });
    
    setBetModalOpen(false);
    setSelectedCards([]);
    setSelectedOutcome(null);
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

  // Parse win string (e.g., "A9K" -> ["A", "9", "K"])
  const parseWinCards = (win: string) => {
    if (!win) return [];
    // Handle formats like "A9K", "A 9 K", etc.
    return win.replace(/\s+/g, "").split("").filter(Boolean);
  };

  const yesSuspended = isSuspended(yesBet);
  const noSuspended = isSuspended(noBet);
  const yesOdds = formatOdds(getOdds(yesBet));
  const noOdds = formatOdds(getOdds(noBet));

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">3 Cards Judgement</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= BETTING AREA ================= */}
      <div className="border border-black">
        {/* YES SECTION */}
        <div className="bg-blue-200 border-b border-black">
          <div className="flex items-stretch">
            {/* Yes Label */}
            <div className="bg-blue-200 px-2 sm:px-3 py-2 flex items-center justify-center border-r border-black min-w-[50px] sm:min-w-[60px]">
              <span className="text-sm sm:text-base font-semibold text-black">Yes</span>
            </div>
            
            {/* Cards and Odds */}
            <div className="flex-1 flex flex-col">
              {/* Odds Display */}
              <div className="text-center py-1 border-b border-black">
                <span className="text-sm sm:text-base font-bold text-black">{yesOdds}</span>
              </div>
              
              {/* Card Grid */}
              <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2 py-2 overflow-x-auto">
                {cardRanks.map((rank) => (
                  <CardComponent
                    key={rank}
                    rank={rank}
                    isSelected={selectedCards.includes(rank)}
                    onClick={() => handleCardClick(rank)}
                    disabled={yesSuspended || loading || selectedCards.length >= 3 && !selectedCards.includes(rank)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NO SECTION */}
        <div className="bg-pink-200">
          <div className="flex items-stretch">
            {/* No Label */}
            <div className="bg-pink-200 px-2 sm:px-3 py-2 flex items-center justify-center border-r border-black min-w-[50px] sm:min-w-[60px]">
              <span className="text-sm sm:text-base font-semibold text-black">No</span>
            </div>
            
            {/* Cards and Odds */}
            <div className="flex-1 flex flex-col">
              {/* Odds Display */}
              <div className="text-center py-1 border-b border-black">
                <span className="text-sm sm:text-base font-bold text-black">{noOdds}</span>
              </div>
              
              {/* Card Grid */}
              <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2 py-2 overflow-x-auto">
                {cardRanks.map((rank) => (
                  <CardComponent
                    key={rank}
                    rank={rank}
                    isSelected={selectedCards.includes(rank)}
                    onClick={() => handleCardClick(rank)}
                    disabled={noSuspended || loading || selectedCards.length >= 3 && !selectedCards.includes(rank)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Cards Info */}
      {selectedCards.length > 0 && (
        <div className="mt-2 text-xs text-center text-muted-foreground">
          Selected: {selectedCards.join(", ")} ({selectedCards.length}/3)
          {selectedCards.length === 3 && (
            <div className="mt-1 flex gap-2 justify-center">
              <Button
                size="sm"
                variant={selectedOutcome === "Yes" ? "default" : "outline"}
                onClick={() => handleOutcomeClick("Yes")}
                disabled={yesSuspended || loading}
                className="h-7 text-xs"
              >
                Bet Yes
              </Button>
              <Button
                size="sm"
                variant={selectedOutcome === "No" ? "default" : "outline"}
                onClick={() => handleOutcomeClick("No")}
                disabled={noSuspended || loading}
                className="h-7 text-xs"
              >
                Bet No
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2 mt-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10Results.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              return (
                <button
                  key={result.mid || result.round_id || result.round || index}
                  onClick={() => handleResultClick(result)}
                  className="flex-shrink-0 w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-blue-500 text-white font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center active:opacity-80 touch-none hover:scale-110 transition-transform cursor-pointer"
                >
                  R
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

          {selectedOutcome && (
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedOutcome} - {selectedCards.join(", ")}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Odds: <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedOutcome === "Yes" ? yesBet : noBet))}
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
                  {(parseFloat(amount) * (Number(getOdds(selectedOutcome === "Yes" ? yesBet : noBet)) > 1000 ? Number(getOdds(selectedOutcome === "Yes" ? yesBet : noBet)) / 100000 : Number(getOdds(selectedOutcome === "Yes" ? yesBet : noBet)))).toFixed(2)}
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
            <DialogTitle>3 Cards Judgement Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              <strong>Yes:</strong> Select any 3 cards and you will win if you will get at least 1 card from the 3 cards you have selected.
            </p>
            <p>
              <strong>No:</strong> Select any 3 cards and you will win if you do not get any card from the 3 cards you have selected.
            </p>
            <p className="mt-3 text-muted-foreground">
              • Select exactly 3 cards from the deck (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
              <br />
              • Choose "Yes" if you think at least one of your selected cards will appear in the result
              <br />
              • Choose "No" if you think none of your selected cards will appear in the result
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">3 Cards Judgement Result</h2>
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
                  const t1Data = detailData?.data?.t1 || detailData?.t1 || null;
                  
                  if (!t1Data) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No detailed result data available
                      </div>
                    );
                  }

                  // Parse cards
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
                  const winCards = parseWinCards(t1Data.win || "");

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

                      <div className="space-y-3">
                        <div className="text-center">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">
                            Result Cards
                          </h3>
                        </div>
                        <div className="flex justify-center gap-2">
                          {winCards.map((card, idx) => {
                            const cardData = allCards[idx] || null;
                            return (
                              <div
                                key={idx}
                                className="w-12 h-16 sm:w-14 sm:h-20 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                              >
                                <span className={`text-sm font-bold ${cardData?.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                                  {card}
                                </span>
                                {cardData && (
                                  <span className={`text-lg ${cardData.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                                    {cardData.suit}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Winner: </span>
                            <span className="text-gray-900 dark:text-gray-100">{t1Data.winnat || t1Data.win || "N/A"}</span>
                          </div>
                          {t1Data.win && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Win Code: </span>
                              <span className="text-gray-900 dark:text-gray-100 font-mono">{t1Data.win}</span>
                            </div>
                          )}
                          {t1Data.rdesc && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Description: </span>
                              <span className="text-gray-900 dark:text-gray-100">{t1Data.rdesc}</span>
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
