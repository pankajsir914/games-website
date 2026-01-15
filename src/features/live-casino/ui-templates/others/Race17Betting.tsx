// src/features/live-casino/ui-templates/others/Race17Betting.tsx

import { Lock, Info, X, Loader2 } from "lucide-react";
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

interface Race17BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
  resultHistory?: any[];
  currentResult?: any;
  tableId?: string;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string) =>
  bets.find((b) => {
    const betNat = (b.nat || "").toLowerCase();
    const searchTerm = nat.toLowerCase();
    return betNat === searchTerm || betNat.includes(searchTerm);
  });

// Get odds from multiple possible fields
const getOdds = (bet: any, side: "back" | "lay" = "back") => {
  if (!bet) return 0;
  if (side === "lay") {
    return bet.lay ?? bet.l ?? 0;
  }
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? 0;
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

export const Race17Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
  resultHistory = [],
  currentResult,
  tableId,
}: Race17BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
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
    
    return results.slice(0, 10);
  }, [resultHistory, currentResult]);

  // Extract bets from multiple possible sources
  const actualBetTypes = useMemo(() => {
    // Priority 1: Check odds.data.sub (API structure)
    if (odds?.data?.sub && Array.isArray(odds.data.sub) && odds.data.sub.length > 0) {
      return odds.data.sub;
    }
    
    // Priority 2: Check betTypes if it's already an array
    if (Array.isArray(betTypes) && betTypes.length > 0) {
      return betTypes;
    }
    
    // Priority 3: Check odds.bets
    if (odds?.bets && Array.isArray(odds.bets) && odds.bets.length > 0) {
      return odds.bets;
    }
    
    // Priority 4: Check odds.sub
    if (odds?.sub && Array.isArray(odds.sub) && odds.sub.length > 0) {
      return odds.sub;
    }
    
    return betTypes || [];
  }, [betTypes, odds]);

  const race17Bet = find(actualBetTypes, "Race to 17");
  const bigCardBet = find(actualBetTypes, "Big Card");
  const zeroCardBet = find(actualBetTypes, "Zero Card");
  const anyZeroBet = find(actualBetTypes, "Any Zero");

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    await onPlaceBet({
      sid: selectedBet.sid,
      odds: getOdds(selectedBet, selectedSide),
      nat: selectedBet.nat,
      amount: parseFloat(amount),
      side: selectedSide,
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

  const OddsCell = ({ bet, side }: { bet: any; side: "back" | "lay" }) => {
    const odds = getOdds(bet, side);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet, side)}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold text-white
          ${
            suspended
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : side === "back"
              ? "bg-sky-400 hover:bg-sky-500"
              : "bg-pink-300 hover:bg-pink-400"
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
        <h3 className="text-sm font-semibold">Race to 17</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= HORIZONTAL BETTING ROW ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Race to 17 */}
        <div className="border">
          <div className="p-2 text-xs font-semibold text-center bg-gray-900 dark:bg-gray-800">
            Race to 17
          </div>
          <div className="grid grid-cols-2">
            <OddsCell bet={race17Bet} side="back" />
            <OddsCell bet={race17Bet} side="lay" />
          </div>
        </div>

        {/* Big Card */}
        <div className="border">
          <div className="p-2 text-xs font-semibold text-center bg-gray-900 dark:bg-gray-800">
            {bigCardBet?.nat || "Big Card"}
          </div>
          <div className="grid grid-cols-2">
            <OddsCell bet={bigCardBet} side="back" />
            <OddsCell bet={bigCardBet} side="lay" />
          </div>
        </div>

        {/* Zero Card */}
        <div className="border">
          <div className="p-2 text-xs font-semibold text-center bg-gray-900 dark:bg-gray-800">
            {zeroCardBet?.nat || "Zero Card"}
          </div>
          <div className="grid grid-cols-2">
            <OddsCell bet={zeroCardBet} side="back" />
            <OddsCell bet={zeroCardBet} side="lay" />
          </div>
        </div>

        {/* Any Zero */}
        <div className="border">
          <div className="p-2 text-xs font-semibold text-center bg-gray-900 dark:bg-gray-800">
            Any Zero
          </div>
          <div className="grid grid-cols-2">
            <OddsCell bet={anyZeroBet} side="back" />
            <OddsCell bet={anyZeroBet} side="lay" />
          </div>
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      {last10Results.length > 0 && (
        <div className="border pt-2 pb-2 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
          <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              // Determine Y (Yes - total >= 17) or N (No - total < 17)
              const winValue = result.win || result.winner || result.result || result.winnat || "";
              const winValueStr = String(winValue).toLowerCase().trim();
              
              // Check if result indicates >= 17 (Yes) or < 17 (No)
              // Common patterns: "yes", "y", "1", "17+", ">=17" for Yes
              // "no", "n", "0", "<17" for No
              const isYes = 
                winValueStr === "yes" || 
                winValueStr === "y" || 
                winValueStr === "1" ||
                winValue === "Yes" ||
                winValue === "Y" ||
                winValue === 1 ||
                winValueStr.includes("17") ||
                winValueStr.includes("yes");
              
              const isNo = 
                winValueStr === "no" || 
                winValueStr === "n" || 
                winValueStr === "0" ||
                winValue === "No" ||
                winValue === "N" ||
                winValue === 0 ||
                winValueStr.includes("no");
              
              // Default to Y if not clearly No
              const resultLetter = isNo ? "N" : "Y";
              const bgColor = isNo ? "bg-red-500" : "bg-green-500";
              
              return (
                <button
                  key={result.mid || result.round_id || result.round || index}
                  onClick={() => handleResultClick(result)}
                  className={`flex-shrink-0 w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full ${bgColor} text-white font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center active:opacity-80 touch-none hover:scale-110 transition-transform cursor-pointer`}
                >
                  {resultLetter}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSide))}
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
                  {selectedSide === "back" ? "Potential win" : "Liability"}: ₹
                  {(() => {
                    const oddsValue = Number(getOdds(selectedBet, selectedSide));
                    const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    if (selectedSide === "back") {
                      // Total return for back bet
                      return (parseFloat(amount) * normalizedOdds).toFixed(2);
                    } else {
                      // Liability for lay bet = (odds - 1) * amount
                      return (parseFloat(amount) * (normalizedOdds - 1)).toFixed(2);
                    }
                  })()}
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
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Race to 17 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-yellow-500 mb-2">Main:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>It is played with regular 52 card deck.</li>
                <li className="font-semibold mt-2">Value of Cards:</li>
                <li className="pl-4">Ace = 1, 2 = 2, 3 = 3, 4 = 4, 5 = 5, 6 = 6, 7 = 7, 8 = 8, 9 = 9</li>
                <li className="pl-4">10 = 0, Jack = 0, Queen = 0, King = 0</li>
                <li className="mt-2">Five (5) cards will be pulled from the deck.</li>
                <li>It is a race to reach 17 or plus.</li>
                <li className="mt-2">
                  <b>If you bet on 17 (Back):</b>
                  <ul className="list-disc pl-4 mt-1">
                    <li>Total of given (5) cards comes under seventeen (17) - you lose.</li>
                    <li>Total of (5) cards comes over sixteen (16) - you win.</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-yellow-500 mb-2">Fancy:</p>
              
              <div className="mb-2">
                <p className="font-semibold">Big Card (7, 8, 9):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Here 7, 8, 9 are named big card.</li>
                  <li>Back/Lay of big card rate is available to bet on every card.</li>
                </ul>
              </div>

              <div className="mb-2">
                <p className="font-semibold">Zero Card (10, Jack, Queen, King):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Here 10, Jack, Queen, King are named zero card.</li>
                  <li>Back & Lay rate to bet on zero card is available on every card.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Any Zero Card:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Here 10, Jack, Queen, King are named zero card.</li>
                  <li>It is a bet for having at least one zero card in game (not necessary game will go up to 5 cards).</li>
                  <li>You can bet on this before start of game only.</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Result Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 [&>button]:hidden bg-white rounded-lg border-0 shadow-xl">
          {/* Blue Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between relative rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">
              Race to 17 Result
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

                  return (
                    <>
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

                      {/* Cards Display */}
                      {t1Data.card && (
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3">
                              Cards
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {(() => {
                              const cardString = t1Data.card || '';
                              const cards = cardString.split(',').map(c => c.trim()).filter(Boolean);
                              
                              // Parse card function
                              const parseCard = (cardString: string) => {
                                if (!cardString) return null;
                                
                                let rank = '';
                                let suit = '';
                                
                                if (cardString.length >= 3) {
                                  if (cardString.length >= 4 && cardString.startsWith('10')) {
                                    rank = '10';
                                    suit = cardString.charAt(cardString.length - 1);
                                  } else {
                                    rank = cardString.substring(0, cardString.length - 2);
                                    suit = cardString.charAt(cardString.length - 1);
                                  }
                                }
                                
                                const suitMap: { [key: string]: string } = {
                                  'S': '♠',
                                  'H': '♥',
                                  'C': '♣',
                                  'D': '♦',
                                };
                                
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
                                  isRed: suit === 'H' || suit === 'D',
                                };
                              };

                              return cards.map((cardStr, idx) => {
                                const card = parseCard(cardStr);
                                if (!card) return null;
                                
                                return (
                                  <div
                                    key={idx}
                                    className="w-16 h-20 sm:w-20 sm:h-24 border-2 border-yellow-400 rounded-lg bg-white flex flex-col items-center justify-center shadow-lg"
                                  >
                                    <span className={`text-lg sm:text-xl font-bold ${card.isRed ? "text-red-600" : "text-black"}`}>
                                      {card.rank}
                                    </span>
                                    <span className={`text-2xl sm:text-3xl ${card.isRed ? "text-red-600" : "text-black"}`}>
                                      {card.suit}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Winner Information Box */}
                      {(t1Data.winnat || t1Data.win || t1Data.rdesc) && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4 sm:p-5 shadow-sm">
                          <div className="space-y-2">
                            <div className="text-center">
                              <span className="font-bold text-gray-900 text-lg sm:text-xl">
                                Result: {t1Data.winnat || t1Data.win || t1Data.rdesc || "N/A"}
                              </span>
                            </div>
                            {t1Data.rdesc && (
                              <div className="text-center text-gray-700 text-sm sm:text-base mt-2">
                                {t1Data.rdesc}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
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
    </>
  );
};
