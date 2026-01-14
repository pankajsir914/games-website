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

interface Lucky5BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  formatOdds?: (val: any) => string;
  resultHistory?: any[];
  currentResult?: any;
  tableId?: string;
  odds?: any;
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

const cardValues = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J"];

/* ================= COMPONENT ================= */

export const Lucky5Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  formatOdds = formatOddsValue,
  resultHistory = [],
  currentResult,
  tableId,
  odds,
}: Lucky5BettingProps) => {
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

  const lowCardBet = find(actualBetTypes, "Low Card");
  const highCardBet = find(actualBetTypes, "High Card");
  const evenBet = find(actualBetTypes, "Even");
  const oddBet = find(actualBetTypes, "Odd");
  const redBet = find(actualBetTypes, "Red");
  const blackBet = find(actualBetTypes, "Black");

  // Card bets
  const cardBets = cardValues.map((card) => {
    const cardLabel = card === "J" ? "Card J" : `Card ${card}`;
    return find(actualBetTypes, cardLabel);
  });

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet);
    if (formatOdds(oddsValue) === "0.00") return;
    
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

  // Main Bet Button with gradient blue and odds on top
  const MainBetButton = ({ bet, label, oddsDisplay }: { bet: any; label: string; oddsDisplay: string }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          h-16 w-full flex flex-col items-center justify-center
          rounded-lg text-white font-semibold
          bg-gradient-to-b from-blue-500 to-blue-600
          ${suspended
            ? "opacity-50 cursor-not-allowed"
            : "hover:from-blue-600 hover:to-blue-700 cursor-pointer"
          }
        `}
      >
        {suspended ? (
          <Lock size={14} />
        ) : (
          <>
            <div className="text-lg font-bold">{oddsDisplay || odds}</div>
            <div className="text-sm">{label}</div>
          </>
        )}
      </button>
    );
  };

  // Red/Black Bet Button with suit symbols
  const ColorBetButton = ({ bet, label, isRed }: { bet: any; label: string; isRed: boolean }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          h-16 w-full flex flex-col items-center justify-center
          rounded-lg text-white font-semibold
          bg-gradient-to-b from-blue-500 to-blue-600
          ${suspended
            ? "opacity-50 cursor-not-allowed"
            : "hover:from-blue-600 hover:to-blue-700 cursor-pointer"
          }
        `}
      >
        {suspended ? (
          <Lock size={14} />
        ) : (
          <>
            <div className="text-lg font-bold">{odds}</div>
            <div className="flex gap-1 text-sm">
              {isRed ? (
                <>
                  <span className="text-red-500">♥</span>
                  <span className="text-red-500">♦</span>
                </>
              ) : (
                <>
                  <span className="text-black">♠</span>
                  <span className="text-black">♣</span>
                </>
              )}
            </div>
          </>
        )}
      </button>
    );
  };

  // Card Button with yellow border
  const CardButton = ({ bet, card }: { bet: any; card: string }) => {
    const suspended = isSuspended(bet);
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          w-full aspect-[3/4] flex flex-col items-center justify-center
          rounded border-2 border-yellow-400 bg-white
          ${suspended
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-yellow-50 cursor-pointer"
          }
        `}
      >
        {suspended ? (
          <Lock size={12} />
        ) : (
          <>
            <div className="font-bold text-gray-900 text-sm mb-0.5">{card === "1" ? "A" : card}</div>
            <div className="flex flex-col gap-0 text-[10px]">
              <span className="text-black">♠</span>
              <span className="text-red-600">♦</span>
            </div>
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Lucky 6</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= TOP SECTION: LOW CARD, CENTER CARD, HIGH CARD ================= */}
      <div className="bg-gray-100 p-2 mb-2 rounded">
        <div className="flex items-center gap-2">
          {/* Low Card Button */}
          <div className="flex-1">
            <MainBetButton 
              bet={lowCardBet} 
              label="Low Card" 
              oddsDisplay={formatOdds(getOdds(lowCardBet))}
            />
          </div>
          
          {/* Center Card Display - Show last result card if available */}
          {(() => {
            // Try to get current card from odds or last result
            const currentCardString = odds?.data?.card || odds?.card || "";
            let centerCard = null;
            
            if (currentCardString && currentCardString !== "1") {
              let rank = "";
              let suit = "";
              if (currentCardString.length >= 3) {
                if (currentCardString.startsWith("10")) {
                  rank = "10";
                  suit = currentCardString.slice(2);
                } else {
                  rank = currentCardString[0];
                  suit = currentCardString.slice(1);
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
              const isRed = suit === "H" || suit === "HH" || suit === "D" || suit === "DD";
              
              centerCard = { rank: displayRank, suit: displaySuit, isRed };
            }
            
            return (
              <div className="w-16 h-20 sm:w-20 sm:h-28 border-2 border-yellow-400 rounded bg-white flex flex-col items-center justify-center">
                {centerCard ? (
                  <>
                    <div className={`text-lg sm:text-xl font-bold mb-1 ${centerCard.isRed ? "text-red-600" : "text-gray-900"}`}>
                      {centerCard.rank}
                    </div>
                    <div className="flex flex-col gap-0 text-xs">
                      <span className={centerCard.isRed ? "text-red-600" : "text-black"}>{centerCard.suit}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">6</div>
                    <div className="flex flex-col gap-0 text-xs">
                      <span className="text-black">♠</span>
                      <span className="text-red-600">♦</span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
          
          {/* High Card Button */}
          <div className="flex-1">
            <MainBetButton 
              bet={highCardBet} 
              label="High Card" 
              oddsDisplay={formatOdds(getOdds(highCardBet))}
            />
          </div>
        </div>
      </div>

      {/* ================= MIDDLE SECTION: EVEN, ODD, RED, BLACK ================= */}
      <div className="bg-gray-100 p-2 mb-2 rounded">
        <div className="grid grid-cols-2 gap-2">
          <MainBetButton 
            bet={evenBet} 
            label="Even" 
            oddsDisplay={formatOdds(getOdds(evenBet))}
          />
          <MainBetButton 
            bet={oddBet} 
            label="Odd" 
            oddsDisplay={formatOdds(getOdds(oddBet))}
          />
          <ColorBetButton bet={redBet} label="Red" isRed={true} />
          <ColorBetButton bet={blackBet} label="Black" isRed={false} />
        </div>
      </div>

      {/* ================= BOTTOM SECTION: INDIVIDUAL CARDS ================= */}
      <div className="bg-gray-100 p-2 mb-2 rounded">
        <div className="text-center text-sm font-bold mb-1 text-gray-700">10</div>
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1">
          {cardValues.map((card, idx) => (
            <CardButton key={card} bet={cardBets[idx]} card={card} />
          ))}
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10Results.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              const win = result.win || result.winner || result.result || "";
              const winStr = String(win).toLowerCase().trim();
              
              // Map win value: 2 = H (High), 1 = L (Low)
              let displayValue = "L";
              let bgColor = "bg-blue-500";
              
              // If win is "2", show H (High), if "1", show L (Low)
              if (win === "2" || winStr === "2") {
                displayValue = "H";
                bgColor = "bg-green-500";
              } else {
                displayValue = "L";
                bgColor = "bg-blue-500";
              }

              return (
                <button
                  key={result.mid || result.round_id || result.round || index}
                  onClick={() => handleResultClick(result)}
                  className={`flex-shrink-0 w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full ${bgColor} text-white font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center active:opacity-80 touch-none hover:scale-110 transition-transform cursor-pointer`}
                >
                  {displayValue}
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
            <DialogTitle>Lucky 6 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              Lucky 6 is a 8 deck playing cards game, total 8 * 44 = 352 cards.
              (Deck count A,1,2,3,4,5,6,7,8,9,10,j cards only)
            </p>

            <p className="font-semibold mt-2">LOW: 1,2,3,4,5 | HIGH:7,8,9,10,J</p>
            <p>Payout : 2.0</p>
            <p className="text-xs text-gray-600">
              If the card is from ACE to 5, LOW Wins. If the card is from 7 to Jack, HIGH Wins.
              If the card is 6, bets on high and low will lose 50% of the bet amount.
            </p>

            <p className="font-semibold mt-2">EVEN : 2,4,6,8,10</p>
            <p>Payout : 2.1</p>

            <p className="font-semibold mt-2">ODD : 1,3,5,7,9,J</p>
            <p>Payout : 1.79</p>

            <p className="font-semibold mt-2">RED : Heart, Diamond</p>
            <p>Payout : 1.95</p>

            <p className="font-semibold mt-2">BLACK : Spade, Club</p>
            <p>Payout : 1.95</p>

            <p className="font-semibold mt-2">CARDS : 1,2,3,4,5,6,7,8,9,10,J</p>
            <p>Payout : 10.0</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Lucky 6 Result</h2>
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

                  // Parse card
                  const parseCard = (cardString: string) => {
                    if (!cardString) return null;
                    
                    let rank = "";
                    let suit = "";
                    if (cardString.length >= 3) {
                      if (cardString.startsWith("10")) {
                        rank = "10";
                        suit = cardString.slice(2);
                      } else {
                        rank = cardString[0];
                        suit = cardString.slice(1);
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
                      raw: cardString,
                      rank: displayRank,
                      suit: displaySuit,
                      isRed: suit === "H" || suit === "HH" || suit === "D" || suit === "DD",
                    };
                  };

                  const cardString = t1Data.card || "";
                  const resultCard = parseCard(cardString);

                  // Parse rdesc to get all winning options
                  const rdesc = t1Data.rdesc || "";
                  const winningOptions = rdesc.split('#').filter(Boolean);

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

                      {/* Card Display */}
                      {resultCard && (
                        <div className="flex justify-center">
                          <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                            <span className={`text-lg sm:text-xl font-bold ${resultCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                              {resultCard.rank}
                            </span>
                            <span className={`text-2xl sm:text-3xl ${resultCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                              {resultCard.suit}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Winner Information */}
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Winner: </span>
                            <span className="text-gray-900 dark:text-gray-100">{t1Data.winnat || "N/A"}</span>
                          </div>
                          {winningOptions.length > 0 && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Winning Options: </span>
                              <span className="text-gray-900 dark:text-gray-100">{winningOptions.join(", ")}</span>
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
