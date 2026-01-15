// src/features/live-casino/ui-templates/others/WarBetting.tsx

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

interface WarBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
  resultHistory?: Array<{
    mid?: string | number;
    win?: string | number;
    winnerId?: string;
    round?: string | number;
    round_id?: string | number;
  }>;
  tableId?: string;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => {
  if (!b) return true;
  if (b.gstatus === "SUSPENDED") return true;
  if (b.gstatus && b.gstatus !== "OPEN") return true;
  return false;
};

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

export const WarBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
  resultHistory = [],
  tableId,
}: WarBettingProps) => {
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
  
  const last10 = resultHistory.slice(0, 10);

  // Extract bets from API structure (odds.data.sub)
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

  // Organize bets by round and type
  const organizedBets = useMemo(() => {
    const rounds = [1, 2, 3, 4, 5, 6];
    const betTypes = ["Winner", "Black", "Red", "Odd", "Even", "Spade", "Heart", "Club", "Diamond"];
    
    return rounds.map((round) => {
      const roundBets: any = {};
      betTypes.forEach((type) => {
        const bet = actualBetTypes.find(
          (b: any) => b.nat === `${type} ${round}`
        );
        roundBets[type] = bet || null;
      });
      return { round, bets: roundBets };
    });
  }, [actualBetTypes]);

  // Get bet by round and type
  const getBet = (round: number, type: string) => {
    return actualBetTypes.find(
      (b: any) => b.nat === `${type} ${round}`
    ) || null;
  };

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

  // Betting Cell Component
  const BettingCell = ({ bet, round, type }: { bet: any; round: number; type: string }) => {
    const odds = bet ? getOdds(bet, "back") : 0;
    const formattedOdds = formatOdds(odds);
    const suspended = !bet || isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => bet && openBetModal(bet, "back")}
        className={`
          h-10 w-full flex items-center justify-center
          text-xs font-semibold
          ${
            suspended
              ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-sky-400 text-white hover:bg-sky-500"
          }
        `}
      >
        {suspended ? <Lock size={12} /> : formattedOdds}
      </button>
    );
  };

  // Bet Type Labels
  const betTypeLabels = [
    { key: "Winner", label: "Winner" },
    { key: "Black", label: "Black" },
    { key: "Red", label: "Red" },
    { key: "Odd", label: "Odd" },
    { key: "Even", label: "Even" },
    { key: "Spade", label: "♠" },
    { key: "Heart", label: "♥" },
    { key: "Club", label: "♣" },
    { key: "Diamond", label: "♦" },
  ];

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

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm sm:text-base font-semibold">Casino War</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-7 w-7 sm:h-8 sm:w-8">
          <Info size={14} className="sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* ================= BETTING GRID ================= */}
      <div className="mb-4 overflow-x-auto">
        <div className="min-w-full">
          {/* Header Row - Round Numbers */}
          <div className="grid grid-cols-10 gap-0 border-2 border-gray-300 dark:border-gray-600 rounded-t overflow-hidden">
            <div className="col-span-1 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold p-2 flex items-center justify-center border-r border-gray-400 dark:border-gray-600">
              Round
            </div>
            {[1, 2, 3, 4, 5, 6].map((round) => (
              <div
                key={round}
                className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold p-2 flex items-center justify-center border-r border-gray-400 dark:border-gray-600 last:border-r-0"
              >
                {round}
              </div>
            ))}
          </div>

          {/* Betting Rows */}
          {betTypeLabels.map((betType, idx) => (
            <div
              key={betType.key}
              className={`grid grid-cols-10 gap-0 border-l-2 border-r-2 border-gray-300 dark:border-gray-600 ${
                idx === betTypeLabels.length - 1 ? "border-b-2 rounded-b" : "border-b"
              } overflow-hidden`}
            >
              {/* Bet Type Label */}
              <div className="col-span-1 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-medium p-2 flex items-center justify-center border-r border-gray-400 dark:border-gray-600">
                {betType.label}
              </div>
              {/* Betting Cells for each round */}
              {[1, 2, 3, 4, 5, 6].map((round) => (
                <div
                  key={round}
                  className="border-r border-gray-400 dark:border-gray-600 last:border-r-0"
                >
                  <BettingCell
                    bet={getBet(round, betType.key)}
                    round={round}
                    type={betType.key}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      {last10.length > 0 && (
        <div className="pt-2 border-t border-border/50 mb-4">
          <p className="text-xs mb-2 text-muted-foreground">Last 10 Results</p>
          <div className="flex gap-1 flex-wrap">
            {last10.map((r, i) => {
              // Always display "R" for all results
              return (
                <Button
                  key={r.mid || r.round || r.round_id || i}
                  size="sm"
                  variant="outline"
                  className="w-9 h-9 p-0 font-bold bg-red-500 text-white border-red-600"
                  onClick={() => handleResultClick(r)}
                >
                  R
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full p-0">
          <DialogHeader className="bg-slate-800 text-white px-3 sm:px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-xs sm:text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)} className="p-1">
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          </DialogHeader>

          {selectedBet && (
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSide))}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: ₹{selectedBet.min || 100} Max: ₹{selectedBet.max || 0}
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded text-[10px] sm:text-xs font-medium ${
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
                min={selectedBet.min || 100}
                max={selectedBet.max || 0}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10"
              />

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Potential win" : "Liability"}: ₹
                  {(() => {
                    const oddsValue = Number(getOdds(selectedBet, selectedSide));
                    const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    if (selectedSide === "back") {
                      return (parseFloat(amount) * normalizedOdds).toFixed(2);
                    } else {
                      return (parseFloat(amount) * (normalizedOdds - 1)).toFixed(2);
                    }
                  })()}
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm h-9 sm:h-10"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                onClick={handlePlaceBet}
              >
                {loading ? "Placing..." : `Place Bet ₹${amount}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT DIALOG ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 [&>button]:hidden bg-white rounded-lg border-0 shadow-xl">
          {/* Blue Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between relative rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">
              Casino War Result
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
                      display: `${displayRank}${displaySuit}`,
                      isRed: suit === 'H' || suit === 'D',
                    };
                  };

                  // Parse cards - format: "QCC,2HH,9CC,JHH,KHH,2DD,JSS" 
                  // First card is Dealer, next 6 are Players (1-6)
                  const cardString = t1Data.card || '';
                  const allCards = cardString.split(',').map(c => parseCard(c.trim())).filter(Boolean);
                  
                  // First card is Dealer
                  const dealerCard = allCards.length > 0 ? allCards[0] : null;
                  
                  // Next 6 cards are Players (1-6)
                  const playerCards = allCards.slice(1, 7); // Take cards 2-7 for players 1-6

                  // Parse winning rounds
                  const winner = t1Data.winnat || t1Data.win || "";
                  const winningRounds = winner ? winner.split(',').map((r: string) => r.trim()).filter(Boolean) : [];

                  const rdesc = t1Data.rdesc || "";
                  // Parse rdesc: sections separated by #, rounds separated by | or ~
                  const rdescSections = rdesc ? rdesc.split('#').filter(Boolean) : [];
                  
                  // Parse each section to extract round information
                  const parseRdescSection = (section: string) => {
                    // Split by | or ~
                    const rounds = section.split(/[|~]/).map(r => r.trim()).filter(Boolean);
                    return rounds.map(round => {
                      // Format: "1 : Black" or "1  5" (winning rounds)
                      const parts = round.split(':').map(p => p.trim());
                      if (parts.length >= 2) {
                        return { round: parts[0], value: parts[1] };
                      }
                      return { round: round, value: '' };
                    });
                  };
                  
                  const parsedSections = rdescSections.map(parseRdescSection);

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

                      {/* Dealer Card Display */}
                      {dealerCard && (
                        <div className="flex justify-center items-center py-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-base sm:text-lg font-bold text-gray-800">Dealer</div>
                            <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded-lg bg-white flex flex-col items-center justify-center shadow-lg">
                              <span className={`text-xl sm:text-2xl font-bold ${dealerCard.isRed ? "text-red-600" : "text-black"}`}>
                                {dealerCard.rank}
                              </span>
                              <span className={`text-3xl sm:text-4xl ${dealerCard.isRed ? "text-red-600" : "text-black"}`}>
                                {dealerCard.suit}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Player Positions (1-6) Display */}
                      {playerCards.length > 0 && (
                        <div className="py-4">
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                            {playerCards.map((card, playerIdx) => {
                              const playerNum = playerIdx + 1;
                              const isWinner = winningRounds.includes(String(playerNum));
                              
                              return (
                                <div key={playerIdx} className="flex flex-col items-center gap-2">
                                  <div className="text-sm font-semibold text-gray-700">{playerNum}</div>
                                  <div className="relative">
                                    <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded-lg bg-white flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                                      <span className={`text-xl sm:text-2xl font-bold ${card.isRed ? "text-red-600" : "text-black"}`}>
                                        {card.rank}
                                      </span>
                                      <span className={`text-3xl sm:text-4xl ${card.isRed ? "text-red-600" : "text-black"}`}>
                                        {card.suit}
                                      </span>
                                    </div>
                                    {isWinner && (
                                      <div className="absolute -right-2 -top-2 rounded-full p-1.5 shadow-lg bg-green-500">
                                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Detailed Results Box */}
                      <div className="bg-white border border-gray-300 rounded-lg p-4 sm:p-5 shadow-sm mt-4">
                        <div className="space-y-3">
                          {/* Winner */}
                          <div>
                            <span className="font-bold text-gray-900 text-sm sm:text-base">Winner: </span>
                            <span className="text-gray-900 text-sm sm:text-base">
                              {winningRounds.length > 0 ? winningRounds.join(' ') : "N/A"}
                            </span>
                          </div>
                          
                          {/* Display round details from rdesc */}
                          {parsedSections.length > 0 && (
                            <div className="space-y-2">
                              {parsedSections.map((section, sectionIdx) => {
                                if (section.length === 0) return null;
                                
                                // Determine category name from section
                                const categoryNames = ['Color', 'Odd/Even', 'Suit'];
                                const categoryName = categoryNames[sectionIdx] || `Category ${sectionIdx + 1}`;
                                
                                // Format section items as "1 : Black | 2 : Red | 3 : Black" etc.
                                const formattedItems = section.map(item => `${item.round} : ${item.value || '-'}`).join(' | ');
                                
                                return (
                                  <div key={sectionIdx}>
                                    <span className="font-bold text-gray-900 text-sm sm:text-base">{categoryName}:</span>
                                    <div className="text-gray-700 text-xs sm:text-sm mt-1">
                                      {formattedItems}
                                    </div>
                                  </div>
                                );
                              })}
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

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader className="px-3 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle className="text-sm sm:text-base">Casino War Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-[10px] sm:text-xs leading-relaxed text-gray-700 dark:text-gray-300 px-3 sm:px-6 pb-4 sm:pb-6">
            <p>
              Casino War is a card-based betting game where players can bet on different outcomes across 6 rounds.
            </p>
            
            <div className="mt-4">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Betting Options:</p>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <b>Winner:</b> Bet on which round will win
                </li>
                <li>
                  <b>Black:</b> Bet on black cards (Spades ♠, Clubs ♣)
                </li>
                <li>
                  <b>Red:</b> Bet on red cards (Hearts ♥, Diamonds ♦)
                </li>
                <li>
                  <b>Odd:</b> Bet on odd-numbered cards
                </li>
                <li>
                  <b>Even:</b> Bet on even-numbered cards
                </li>
                <li>
                  <b>Spade ♠:</b> Bet on Spade suit
                </li>
                <li>
                  <b>Heart ♥:</b> Bet on Heart suit
                </li>
                <li>
                  <b>Club ♣:</b> Bet on Club suit
                </li>
                <li>
                  <b>Diamond ♦:</b> Bet on Diamond suit
                </li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">How to Play:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Select your betting option from the grid (choose round and bet type)</li>
                <li>Enter your bet amount</li>
                <li>Confirm your bet</li>
                <li>Wait for the result</li>
                <li>If your selected bet matches the winning result, you win!</li>
              </ol>
            </div>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Betting Limits:</p>
              <p>Minimum Bet: ₹{actualBetTypes[0]?.min || 100}</p>
              <p>Maximum Bet: ₹{actualBetTypes[0]?.max || 100000}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
