// src/pages/tables/DolidanaBetting.tsx

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

interface DolidanaBettingProps {
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

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string) =>
  bets.find((b) => {
    const betNat = (b.nat || "").toLowerCase();
    const searchTerm = nat.toLowerCase();
    return betNat === searchTerm;
  });

// Get odds from multiple possible fields
const getOdds = (bet: any) => {
  if (!bet) return 0;
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

// Format limit value (bs)
const formatLimit = (val: any): string => {
  if (!val) return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  if (num >= 100000) return (num / 100000).toFixed(0) + "L";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
};

/* ================= COMPONENT ================= */

export const DolidanaBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  formatOdds: formatOddsProp = formatOdds,
  resultHistory = [],
  currentResult,
  tableId,
  odds,
}: DolidanaBettingProps) => {
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
    
    // Priority 1: Check if resultHistory is already an array
    if (Array.isArray(resultHistory) && resultHistory.length > 0) {
      results = resultHistory;
    } 
    // Priority 2: Check resultHistory.data.res (API structure: {data: {res: [...]}})
    else if (resultHistory && typeof resultHistory === 'object') {
      results = (resultHistory as any)?.data?.res || 
                (resultHistory as any)?.data?.data?.res ||
                (resultHistory as any)?.res || 
                (resultHistory as any)?.results ||
                [];
    }
    
    // Priority 3: Check currentResult.results
    if (results.length === 0 && currentResult?.results && Array.isArray(currentResult.results) && currentResult.results.length > 0) {
      results = currentResult.results;
    }
    
    // Priority 4: Check currentResult.data.res (API structure)
    if (results.length === 0 && currentResult?.data?.res && Array.isArray(currentResult.data.res)) {
      results = currentResult.data.res;
    }
    
    // Priority 5: Check currentResult.data.data.res (nested API structure)
    if (results.length === 0 && currentResult?.data?.data?.res && Array.isArray(currentResult.data.data.res)) {
      results = currentResult.data.data.res;
    }
    
    // Priority 6: Check if currentResult itself is an array
    if (results.length === 0 && Array.isArray(currentResult) && currentResult.length > 0) {
      results = currentResult;
    }
    
    const finalResults = Array.isArray(results) ? results.slice(0, 10) : [];
    
    // Debug log
    if (finalResults.length > 0) {
      console.log("📊 [Dolidana] Last 10 Results extracted:", {
        count: finalResults.length,
        sample: finalResults.slice(0, 3),
        source: resultHistory ? "resultHistory" : currentResult ? "currentResult" : "none"
      });
    }
    
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

  // Find all bets
  const playerA = find(actualBetTypes, "Player A");
  const playerB = find(actualBetTypes, "Player B");
  const anyPair = find(actualBetTypes, "Any Pair");
  const oddBet = find(actualBetTypes, "Odd");
  const evenBet = find(actualBetTypes, "Even");
  const lucky7 = find(actualBetTypes, "Lucky 7");
  const greaterThan7 = find(actualBetTypes, "Greater than 7");
  const lessThan7 = find(actualBetTypes, "Less than 7");
  
  // Particular pairs
  const pair11 = find(actualBetTypes, "1-1 Pair");
  const pair22 = find(actualBetTypes, "2-2 Pair");
  const pair33 = find(actualBetTypes, "3-3 Pair");
  const pair44 = find(actualBetTypes, "4-4 Pair");
  const pair55 = find(actualBetTypes, "5-5 Pair");
  const pair66 = find(actualBetTypes, "6-6 Pair");
  
  // Sum totals
  const sumTotals = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => 
    find(actualBetTypes, `Sum Total ${num}`)
  );

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet);
    if (formatOddsProp(oddsValue) === "0.00") return;
    
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
    const finalTableId = tableId || odds?.tableId || odds?.rawData?.gtype || odds?.data?.gtype || "dolidana";
    
    // Keep current detailData (from selectedResult) - don't clear it
    // This ensures we always have data to show even if API fails
    
    if (!finalTableId || !mid) {
      console.error("Missing tableId or mid:", { tableId: finalTableId, mid });
      // Keep the existing detailData (from selectedResult)
      setDetailLoading(false);
      return;
    }
    
    setDetailLoading(true);
    // Don't clear detailData here - keep the fallback data from selectedResult
    
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: { 
          action: "get-detail-result", 
          tableId: finalTableId,
          mid: String(mid)
        }
      });

      if (error) {
        console.error("❌ Error fetching detail result:", error);
        // Keep existing detailData (from selectedResult) - don't overwrite with error
        // Only set error if we don't have fallback data
        setDetailData((prev: any) => {
          if (prev?.fallback || prev?.data?.t1) {
            return prev; // Keep existing data
          }
          return { error: error.message || "Failed to fetch detail result", data: { t1: selectedResult }, fallback: true };
        });
      } else if (data) {
        if (data.success === false) {
          console.error("❌ API returned error:", data.error);
          // Keep existing detailData (from selectedResult)
          setDetailData((prev: any) => {
            if (prev?.fallback || prev?.data?.t1) {
              return prev; // Keep existing data
            }
            return { error: data.error || "No data available", data: { t1: selectedResult }, fallback: true };
          });
        } else {
          // Handle API response structure: {success: true, data: {...}}
          const resultData = data?.data || data;
          // Merge with existing selectedResult data if available
          setDetailData(resultData);
        }
      } else {
        // No API response - keep existing detailData (from selectedResult)
        setDetailData((prev: any) => prev || { data: { t1: selectedResult }, fallback: true });
      }
    } catch (error) {
      console.error("❌ Exception fetching detail result:", error);
      // Keep existing detailData (from selectedResult)
      setDetailData((prev: any) => {
        if (prev?.fallback || prev?.data?.t1) {
          return prev; // Keep existing data
        }
        return { error: error instanceof Error ? error.message : "Unknown error", data: { t1: selectedResult }, fallback: true };
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: any) => {
    const mid = result.mid || result.round || result.round_id;
    // Always set selectedResult first so it's available during API call
    setSelectedResult(result);
    setDetailDialogOpen(true);
    // Set initial data from result so modal shows immediately
    setDetailData({ data: { t1: result }, fallback: true });
    setDetailLoading(true);
    
    // Then try to fetch detailed data
    if (mid) {
      fetchDetailResult(mid);
    } else {
      // No mid available, just use the result data we have
      setDetailLoading(false);
    }
  };

  // Bet Button Component
  const BetButton = ({ bet, label, showLimit = false, className = "" }: { 
    bet: any; 
    label: string; 
    showLimit?: boolean;
    className?: string;
  }) => {
    const suspended = isSuspended(bet);
    const oddsValue = formatOddsProp(getOdds(bet));
    const limit = bet?.bs ? formatLimit(bet.bs) : "";
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative flex flex-col items-center justify-center
          bg-sky-400 text-white rounded-lg
          ${suspended
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-sky-500 cursor-pointer active:scale-95 transition-transform"
          }
          ${className}
        `}
      >
        {suspended ? (
          <Lock size={12} className="sm:w-3.5 sm:h-3.5" />
        ) : (
          <>
            <div className="text-sm sm:text-base md:text-lg font-bold">{oddsValue}</div>
            {showLimit && limit && (
              <div className="text-[10px] sm:text-xs mt-0.5 opacity-90">{limit}</div>
            )}
            {label && (
              <div className="text-[10px] sm:text-xs mt-0.5">{label}</div>
            )}
          </>
        )}
      </button>
    );
  };

  // Player Bet Cell Component
  const PlayerBetCell = ({ bet, label }: { bet: any; label: string }) => {
    const suspended = isSuspended(bet);
    const oddsValue = formatOddsProp(getOdds(bet));
    const limit = bet?.bs ? formatLimit(bet.bs) : "";
    
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <div className="flex items-center px-1 sm:px-2 py-1.5 sm:py-2">
          <div className="text-xs sm:text-sm font-bold text-gray-800 w-16 sm:w-20 md:w-24">{label}</div>
          <button
            disabled={suspended || loading}
            onClick={() => openBetModal(bet)}
            className={`
              flex-1 flex flex-col items-center justify-center
              bg-sky-400 text-white rounded py-1.5 sm:py-2 min-h-[50px] sm:min-h-[60px]
              ${suspended
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-sky-500 cursor-pointer active:scale-95 transition-transform"
              }
            `}
          >
            {suspended ? (
              <Lock size={10} className="sm:w-3 sm:h-3" />
            ) : (
              <>
                <div className="text-sm sm:text-base md:text-lg font-bold">{oddsValue}</div>
                {limit && <div className="text-[10px] sm:text-xs mt-0.5">{limit}</div>}
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Doli Dana</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= TOP SECTION: PLAYER A/B AND FANCY BETS ================= */}
      <div className="bg-gray-100 p-1.5 sm:p-2 mb-2 rounded">
        <div className="flex flex-col md:flex-row gap-2">
          {/* Left: Player A and Player B */}
          <div className="w-full md:flex-1 border border-gray-300 rounded bg-white">
            <PlayerBetCell bet={playerA} label="Player A" />
            <PlayerBetCell bet={playerB} label="Player B" />
          </div>

          {/* Right: Any Pair, Odd, Even, <7, >7 */}
          <div className="w-full md:flex-1">
            {/* Any Pair - Full Width */}
            <div className="mb-1">
              <div className="text-[10px] sm:text-xs font-medium text-gray-800 mb-0.5 px-1">Any Pair</div>
              <BetButton bet={anyPair} label="" className="h-10 sm:h-12 w-full" />
            </div>
            
            {/* Odd and Even - Side by Side */}
            <div className="grid grid-cols-2 gap-1 mb-1">
              <div>
                <div className="text-[10px] sm:text-xs font-medium text-gray-800 mb-0.5 px-1">Odd</div>
                <BetButton bet={oddBet} label="" className="h-10 sm:h-12 w-full" />
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-medium text-gray-800 mb-0.5 px-1">Even</div>
                <BetButton bet={evenBet} label="" className="h-10 sm:h-12 w-full" />
              </div>
            </div>
            
            {/* <7, Lucky 7 Icon, >7 */}
            <div className="flex items-end gap-1">
              <div className="flex-1">
                <div className="text-[10px] sm:text-xs font-medium text-gray-800 mb-0.5 px-1">&lt;7</div>
                <BetButton bet={lessThan7} label="" className="h-10 sm:h-12 w-full" />
              </div>
              
              {/* Lucky 7 Icon */}
              <div className="flex items-center justify-center mb-0.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-400 border-2 border-black flex items-center justify-center">
                  <span className="text-base sm:text-xl font-bold text-red-600">7</span>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="text-[10px] sm:text-xs font-medium text-gray-800 mb-0.5 px-1">&gt;7</div>
                <BetButton bet={greaterThan7} label="" className="h-10 sm:h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION: PARTICULAR PAIR AND SUM TOTALS ================= */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-2 mb-2">
        {/* Left: Particular Pair */}
        <div className="bg-gray-100 p-1.5 sm:p-2 rounded w-full">
          <div className="text-xs sm:text-sm font-bold text-gray-800 mb-1.5 sm:mb-2">Particular Pair</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {[
              { bet: pair11, label: "1-1 Pair" },
              { bet: pair22, label: "2-2 Pair" },
              { bet: pair33, label: "3-3 Pair" },
              { bet: pair44, label: "4-4 Pair" },
              { bet: pair55, label: "5-5 Pair" },
              { bet: pair66, label: "6-6 Pair" },
            ].map(({ bet, label }) => (
              <div key={label}>
                <div className="text-[10px] sm:text-xs font-medium text-gray-800 mb-0.5 px-0.5 sm:px-1 text-center">{label}</div>
                <BetButton bet={bet} label="" className="h-10 sm:h-12 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Odds of Sum Total */}
        <div className="bg-gray-100 p-1.5 sm:p-2 rounded w-full">
          <div className="text-xs sm:text-sm font-bold text-gray-800 mb-1.5 sm:mb-2">Odds of Sum Total</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
            {sumTotals.map((bet, idx) => {
              const sumNum = idx + 2; // 2 to 12
              return (
                <div key={sumNum}>
                  <div className="text-[10px] sm:text-xs font-medium text-gray-800 mb-0.5 px-0.5 sm:px-1 text-center">
                    Sum Total {sumNum}
                  </div>
                  <BetButton bet={bet} label="" className="h-10 sm:h-12 w-full" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

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

          {selectedBet && (
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Odds: <span className="font-bold text-blue-600 dark:text-blue-400">{formatOddsProp(getOdds(selectedBet))}</span>
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
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Doli Dana Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <h6 className="font-bold text-base mb-2">Winning Dice</h6>
              <ul className="list-disc pl-6 space-y-1">
                <li>3:3</li>
                <li>5:5</li>
                <li>6:6</li>
                <li>5:6 or 6:5</li>
              </ul>
            </div>

            <div>
              <h6 className="font-bold text-base mb-2">Losing Dice</h6>
              <ul className="list-disc pl-6 space-y-1">
                <li>1:1</li>
                <li>2:2</li>
                <li>4:4</li>
                <li>1:2 or 2:1</li>
              </ul>
            </div>

            <p>Any other combo (like 2:5, 3:4, etc.):</p>
            <p>* No win / no loss Dice passes to the next player</p>

            <p><b>•Any Pair</b> : |1:1||2:2||3:3||4:4||5:5||6:6|</p>

            <p><b>•ODD:</b> 3,5,7,9,11 | <b>EVEN:</b> 2,4,6,8,10,12</p>

            <p>•If the Dice total = 7 (e.g., 1:6, 2:5, 3:4, etc.) Bets on Greater than 7 and Less than 7 both lose 50% of the bet Amount.</p>

            <p>Examples: 2:5 = 7 → 50% loss on both &lt;7 and &gt;7</p>
            <p>1:6 = 7 → 50% loss on both &lt;7 and &gt;7</p>

            <p><b>Note</b>: All other bets settle immediately, but the main bet waits until Player A or Player B win/Loss(player Back/Lay).</p>

            <div className="mt-4 pt-3 border-t">
              <h6 className="font-bold text-base mb-2">Result Integrity & Error-Correction Policy</h6>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <b>Authoritative Result</b><br />
                  The Original Dice Number Result generated and recorded by our server is the sole, final, and binding outcome for every round.
                </li>
                <li>
                  <b>Display Errors & Corrections</b><br />
                  If any technical issue causes an incorrect, missing, duplicated, delayed, or otherwise erroneous display of the result, Dolidana Casino may update the displayed result to match the Original Dice Number Result. All settlements (wins/losses/payouts) are made only against the Original Dice Number Result.
                </li>
                <li>
                  <b>Player Acceptance</b><br />
                  By participating, you agree that if a display error occurs, you must accept the corrected/updated result reflecting the Original Dice Number Result, and any settlement made on that basis.
                </li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Doli dana Result</h2>
            <button
              onClick={() => setDetailDialogOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-700 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-6 bg-white">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading details...</span>
              </div>
            ) : detailData || selectedResult ? (
              <div className="space-y-4">
                {detailData?.error && !selectedResult ? (
                  <div className="text-center py-8">
                    <p className="text-destructive font-medium mb-2">Error</p>
                    <p className="text-sm text-muted-foreground">{detailData.error}</p>
                  </div>
                ) : (() => {
                  // Parse dice values from result data
                  // Try multiple possible data structures - prioritize selectedResult if available
                  const t1Data = detailData?.data?.t1 || detailData?.t1 || (detailData?.fallback ? selectedResult : detailData) || selectedResult || {};
                  const winValue = selectedResult?.win || t1Data?.win || detailData?.win || "";
                  const cardString = t1Data?.card || selectedResult?.card || detailData?.card || "";
                  const rdesc = t1Data?.rdesc || selectedResult?.rdesc || detailData?.rdesc || "";
                  
                  console.log("📊 [Dolidana] Detail Result Data:", {
                    detailData,
                    selectedResult,
                    t1Data,
                    winValue,
                    cardString,
                    rdesc,
                    hasError: detailData?.error,
                    hasSelectedResult: !!selectedResult
                  });
                  
                  // Try to extract dice values from various possible formats
                  let dice1 = null;
                  let dice2 = null;
                  
                  // Method 1: Parse from card string (e.g., "24" or "2:4")
                  if (cardString && cardString.length >= 2) {
                    const match = cardString.match(/(\d)[:.]?(\d)/);
                    if (match) {
                      dice1 = parseInt(match[1]);
                      dice2 = parseInt(match[2]);
                    }
                  }
                  
                  // Method 2: Parse from win value (sum total) - try to find dice combinations
                  if (!dice1 || !dice2) {
                    const sumTotal = parseInt(winValue);
                    if (!isNaN(sumTotal) && sumTotal >= 2 && sumTotal <= 12) {
                      // Try common combinations
                      if (sumTotal === 2) { dice1 = 1; dice2 = 1; }
                      else if (sumTotal === 3) { dice1 = 1; dice2 = 2; }
                      else if (sumTotal === 4) { dice1 = 2; dice2 = 2; }
                      else if (sumTotal === 5) { dice1 = 2; dice2 = 3; }
                      else if (sumTotal === 6) { dice1 = 2; dice2 = 4; }
                      else if (sumTotal === 7) { dice1 = 3; dice2 = 4; }
                      else if (sumTotal === 8) { dice1 = 4; dice2 = 4; }
                      else if (sumTotal === 9) { dice1 = 4; dice2 = 5; }
                      else if (sumTotal === 10) { dice1 = 4; dice2 = 6; }
                      else if (sumTotal === 11) { dice1 = 5; dice2 = 6; }
                      else if (sumTotal === 12) { dice1 = 6; dice2 = 6; }
                    }
                  }
                  
                  // Default if still not found
                  if (!dice1 || !dice2) {
                    dice1 = 2;
                    dice2 = 4;
                  }
                  
                  // Parse betting outcomes from rdesc or calculate
                  const sumTotal = dice1 + dice2;
                  const isPair = dice1 === dice2;
                  const isOdd = sumTotal % 2 === 1;
                  const isEven = sumTotal % 2 === 0;
                  const isLucky7 = sumTotal === 7;
                  const isGreaterThan7 = sumTotal > 7;
                  const isLessThan7 = sumTotal < 7;
                  
                  // Determine turn (Player A or B) - this might come from API
                  const turn = t1Data?.winnat || t1Data?.turn || (sumTotal > 7 ? "Player A" : "Player B");
                  
                  // Dice Component
                  const Dice = ({ value }: { value: number }) => {
                    const dots = [
                      [], // 0
                      [[0.5, 0.5]], // 1
                      [[0.25, 0.25], [0.75, 0.75]], // 2
                      [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], // 3
                      [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]], // 4
                      [[0.25, 0.25], [0.25, 0.75], [0.5, 0.5], [0.75, 0.25], [0.75, 0.75]], // 5
                      [[0.25, 0.25], [0.25, 0.5], [0.25, 0.75], [0.75, 0.25], [0.75, 0.5], [0.75, 0.75]], // 6
                    ];
                    
                    return (
                      <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center relative">
                        <svg className="w-full h-full" viewBox="0 0 1 1">
                          {dots[value]?.map(([x, y], idx) => (
                            <circle
                              key={idx}
                              cx={x}
                              cy={y}
                              r="0.08"
                              fill="white"
                            />
                          ))}
                        </svg>
                      </div>
                    );
                  };
                  
                  // Format match time
                  const matchTime = t1Data?.mtime || selectedResult?.mtime || "";
                  
                  return (
                    <div className="space-y-4">
                      {/* Top Row: Round Id and Match Time */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm border-b pb-3">
                        <div>
                          <span className="text-gray-900">Round Id: </span>
                          <span className="text-gray-900 font-mono">{selectedResult?.mid || t1Data?.rid || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-900">Match Time: </span>
                          <span className="text-gray-900">{matchTime || "N/A"}</span>
                        </div>
                      </div>

                      {/* Main Content: Two Column Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Dice */}
                        <div className="flex justify-center md:justify-start">
                          <div className="flex gap-2">
                            <Dice value={dice1} />
                            <Dice value={dice2} />
                          </div>
                        </div>

                        {/* Right Column: Betting Outcomes Summary */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Turn</span>
                              <span className="font-semibold text-gray-900">{turn}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Any Pair</span>
                              <span className="font-semibold text-gray-900">{isPair ? "Yes" : "No"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Particular Pair</span>
                              <span className="font-semibold text-gray-900">{isPair ? `${dice1}-${dice2} Pair` : "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sum Total</span>
                              <span className="font-semibold text-gray-900">{sumTotal}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Odd/Even</span>
                              <span className="font-semibold text-gray-900">{isOdd ? "Odd" : "Even"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Lucky 7</span>
                              <span className="font-semibold text-gray-900">
                                {isLucky7 ? "Lucky 7" : isGreaterThan7 ? "Greater than 7" : "Less than 7"}
                              </span>
                            </div>
                          </div>
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
