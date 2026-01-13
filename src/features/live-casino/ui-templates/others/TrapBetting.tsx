// src/features/live-casino/ui-templates/others/TrapBetting.tsx

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

const QUICK_CHIPS = [50, 100, 500, 1000];

/* ================= TYPES ================= */

interface TrapBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
  resultHistory?: any[];
  onResultClick?: (result: any) => void;
  min?: number;
  max?: number;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string, subtype?: string) =>
  bets.find((b) => {
    const betNat = (b.nat || "").toLowerCase();
    const searchTerm = nat.toLowerCase();
    const matchesNat = betNat === searchTerm || betNat.includes(searchTerm);
    if (subtype) {
      return matchesNat && (b.subtype || "").toLowerCase() === subtype.toLowerCase();
    }
    return matchesNat;
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

export const TrapBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
  resultHistory = [],
  onResultClick,
  min = 10,
  max = 100000,
}: TrapBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedNestedBet, setSelectedNestedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState(String(min));
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

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

  const playerABet = find(actualBetTypes, "Player A");
  const playerBBet = find(actualBetTypes, "Player B");
  const highLowCardBet = find(actualBetTypes, "Card 1", "highlow");
  const jqkCardBet = find(actualBetTypes, "Card 1", "jqk");

  // Parse cards from API format (e.g., "ADD,QDD,10CC,JCC")
  const parseCards = (cardString: string) => {
    if (!cardString) return [];
    const cards = cardString.split(",").map((c) => c.trim()).filter(Boolean);
    return cards.map((card) => {
      if (card === "1") return null; // Skip placeholder "1"
      
      let rank = "";
      let suit = "";
      // Format: "ADD" = Ace of Diamonds, "QDD" = Queen of Diamonds, "10CC" = 10 of Clubs
      // Suits are doubled: DD, CC, HH, SS
      if (card.length >= 3) {
        if (card.startsWith("10")) {
          rank = "10";
          suit = card.slice(2); // "10CC" -> "CC"
        } else {
          rank = card[0]; // "ADD" -> "A"
          suit = card.slice(1); // "ADD" -> "DD"
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

  // Fetch detail result
  const fetchDetailResult = async (mid: string | number) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: {
          action: "get-detail-result",
          tableId: "trap",
          mid: String(mid),
        },
      });
      if (error) {
        setDetailData({ error: error.message || "Failed to fetch detail" });
      } else if (data) {
        setDetailData(data?.data || data);
      } else {
        setDetailData({ error: "No data received" });
      }
    } catch (err) {
      setDetailData({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: any) => {
    const mid = result.mid || result.round || result.round_id;
    setSelectedResult(result);
    setResultDialogOpen(true);
    if (mid) {
      fetchDetailResult(mid);
    }
    onResultClick?.(result);
  };

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedNestedBet(null);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const openNestedBetModal = (nestedBet: any, parentBet: any, side: "back" | "lay" = "back") => {
    if (!nestedBet || !parentBet || isSuspended(parentBet)) return;
    const oddsValue = getOdds(nestedBet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(parentBet);
    setSelectedNestedBet(nestedBet);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    const amt = parseFloat(amount);
    const oddsValue = selectedNestedBet ? getOdds(selectedNestedBet, selectedSide) : getOdds(selectedBet, selectedSide);
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;

    const payload: any = {
      sid: selectedBet.sid,
      odds: finalOdds,
      nat: selectedNestedBet ? selectedNestedBet.nat : selectedBet.nat,
      amount: Math.min(Math.max(amt, min), max),
      side: selectedSide,
    };

    if (selectedNestedBet) {
      payload.ssid = selectedNestedBet.sid;
    }

    await onPlaceBet(payload);

    setBetModalOpen(false);
    setSelectedBet(null);
    setSelectedNestedBet(null);
    setAmount(String(min));
  };

  // Standard OddsCell for Player A/B
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
          text-sm font-semibold
          ${
            suspended
              ? "bg-gray-700 text-white cursor-not-allowed"
              : side === "back"
              ? "bg-sky-200 hover:bg-sky-300 text-black"
              : "bg-pink-200 hover:bg-pink-300 text-black"
          }
        `}
      >
        {suspended ? <Lock size={14} className="text-white" /> : formattedOdds}
      </button>
    );
  };

  // Low/High Button Component
  const LowHighButton = ({ nestedBet, label, parentBet }: { nestedBet: any; label: string; parentBet: any }) => {
    const odds = getOdds(nestedBet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(parentBet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openNestedBetModal(nestedBet, parentBet, "back")}
        className={`
          flex flex-col items-center justify-center
          h-16 w-full
          text-sm font-semibold bg-white
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "hover:bg-gray-50 text-black"
          }
        `}
      >
        {suspended ? (
          <Lock size={14} />
        ) : (
          <>
            <div className="text-sm font-bold mb-1">{formattedOdds}</div>
            <div className="text-xs">{label}</div>
          </>
        )}
      </button>
    );
  };

  // J Q K Card Display Component
  const JQKCardDisplay = () => {
    return (
      <div className="flex items-center gap-2">
        {["J", "Q", "K"].map((card) => (
          <div key={card} className="flex flex-col items-center border-2 border-yellow-400 rounded bg-white p-2 min-w-[40px]">
            <div className="text-sm font-bold text-black mb-1">{card}</div>
            <div className="grid grid-cols-2 gap-0.5 text-[8px]">
              <span className="text-black">♠</span>
              <span className="text-red-600">♥</span>
              <span className="text-black">♣</span>
              <span className="text-red-600">♦</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const last10 = useMemo(() => {
    console.log("🔴 TrapBetting - resultHistory received:", resultHistory);
    
    if (!resultHistory) {
      console.log("🔴 TrapBetting - resultHistory is empty/null");
      return [];
    }
    
    // Handle different API response structures:
    // 1. Direct array: [...]
    // 2. Wrapped: { data: { res: [...] } }
    // 3. Wrapped: { res: [...] }
    // 4. From currentResult: { results: [...] }
    
    let results: any[] = [];
    
    if (Array.isArray(resultHistory)) {
      results = resultHistory;
      console.log("🔴 TrapBetting - resultHistory is array, length:", results.length);
    } else if (resultHistory && typeof resultHistory === 'object') {
      results = (resultHistory as any)?.data?.res || 
                (resultHistory as any)?.res || 
                (resultHistory as any)?.results ||
                [];
      console.log("🔴 TrapBetting - resultHistory is object, extracted results length:", results.length);
    }
    
    // Ensure it's an array and take first 10
    const finalResults = Array.isArray(results) ? results.slice(0, 10) : [];
    console.log("🔴 TrapBetting - final last10 length:", finalResults.length);
    return finalResults;
  }, [resultHistory]);

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">The Trap</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= TOP ROW - PLAYER A & B ================= */}
      <div className="mb-2">
        <div className="flex items-center gap-2">
          {/* Player A Section */}
          <div className="flex-1">
            <div className="text-sm font-bold text-white mb-1">Player A</div>
            <div className="grid grid-cols-2 gap-1">
              <OddsCell bet={playerABet} side="back" />
              <OddsCell bet={playerABet} side="lay" />
            </div>
          </div>

          {/* Player B Section */}
          <div className="flex-1">
            <div className="text-sm font-bold text-white mb-1">Player B</div>
            <div className="grid grid-cols-2 gap-1">
              <OddsCell bet={playerBBet} side="back" />
              <OddsCell bet={playerBBet} side="lay" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ROW - SIDE BETS ================= */}
      <div className="mb-2">
        {/* Low/High Section with Central Card */}
        <div className="border border-sky-300 p-3 mb-2">
          <div className="flex items-center justify-between gap-2">
            {/* Low Button */}
            {highLowCardBet && highLowCardBet.odds && Array.isArray(highLowCardBet.odds) && 
             highLowCardBet.odds.find((o: any) => (o.nat || "").toLowerCase().includes("low")) ? (
              <LowHighButton
                nestedBet={highLowCardBet.odds.find((o: any) => (o.nat || "").toLowerCase().includes("low"))}
                label="Low"
                parentBet={highLowCardBet}
              />
            ) : (
              <div className="h-16 w-full bg-gray-200 flex items-center justify-center text-gray-500">
                <Lock size={14} />
              </div>
            )}

            {/* Central Card - Yellow Circle with Red 7 */}
            <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-red-600">7</span>
            </div>

            {/* High Button */}
            {highLowCardBet && highLowCardBet.odds && Array.isArray(highLowCardBet.odds) && 
             highLowCardBet.odds.find((o: any) => (o.nat || "").toLowerCase().includes("high")) ? (
              <LowHighButton
                nestedBet={highLowCardBet.odds.find((o: any) => (o.nat || "").toLowerCase().includes("high"))}
                label="High"
                parentBet={highLowCardBet}
              />
            ) : (
              <div className="h-16 w-full bg-gray-200 flex items-center justify-center text-gray-500">
                <Lock size={14} />
              </div>
            )}
          </div>
        </div>

        {/* J Q K Section */}
        <div className="flex items-center gap-2">
          <JQKCardDisplay />
          {jqkCardBet && jqkCardBet.odds && Array.isArray(jqkCardBet.odds) && jqkCardBet.odds.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 flex-1">
              <button
                disabled={isSuspended(jqkCardBet) || loading || formatOdds(getOdds(jqkCardBet.odds[0])) === "0.00"}
                onClick={() => openNestedBetModal(jqkCardBet.odds[0], jqkCardBet, "back")}
                className={`
                  h-10 flex items-center justify-center
                  text-sm font-semibold
                  ${
                    isSuspended(jqkCardBet) || formatOdds(getOdds(jqkCardBet.odds[0])) === "0.00"
                      ? "bg-gray-700 text-white cursor-not-allowed"
                      : "bg-sky-200 hover:bg-sky-300 text-black"
                  }
                `}
              >
                {isSuspended(jqkCardBet) || formatOdds(getOdds(jqkCardBet.odds[0])) === "0.00" ? (
                  <Lock size={14} className="text-white" />
                ) : (
                  formatOdds(getOdds(jqkCardBet.odds[0], "back"))
                )}
              </button>
              <button
                disabled={isSuspended(jqkCardBet) || loading || formatOdds(getOdds(jqkCardBet.odds[0], "lay")) === "0.00"}
                onClick={() => openNestedBetModal(jqkCardBet.odds[0], jqkCardBet, "lay")}
                className={`
                  h-10 flex items-center justify-center
                  text-sm font-semibold
                  ${
                    isSuspended(jqkCardBet) || formatOdds(getOdds(jqkCardBet.odds[0], "lay")) === "0.00"
                      ? "bg-gray-700 text-white cursor-not-allowed"
                      : "bg-pink-200 hover:bg-pink-300 text-black"
                  }
                `}
              >
                {isSuspended(jqkCardBet) || formatOdds(getOdds(jqkCardBet.odds[0], "lay")) === "0.00" ? (
                  <Lock size={14} className="text-white" />
                ) : (
                  formatOdds(getOdds(jqkCardBet.odds[0], "lay"))
                )}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 flex-1">
              <div className="h-10 bg-gray-700 flex items-center justify-center text-white">
                <Lock size={14} />
              </div>
              <div className="h-10 bg-gray-700 flex items-center justify-center text-white">
                <Lock size={14} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10.map((r, i) => {
              const winValue = r.win?.toString() || r.winnerId?.toString() || r.result || "";
              const isPlayerA = 
                winValue === "1" || 
                winValue === "Player A" || 
                winValue === "A" ||
                winValue.toLowerCase() === "playera" ||
                (r.winnerId && r.winnerId.toString() === "1");
              const winner = isPlayerA ? "A" : "B";
              
              return (
                <button
                  key={r.mid || r.round || r.round_id || i}
                  onClick={() => handleResultClick(r)}
                  className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm active:opacity-80 touch-none ${
                    isPlayerA
                      ? "bg-blue-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {winner}
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
        <DialogContent className="max-w-md p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex flex-row justify-between items-center">
            <h2 className="text-lg font-semibold text-white m-0">Place Bet</h2>
            <button
              onClick={() => setBetModalOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>

          {selectedBet && (
            <div className="p-6 space-y-5 bg-white dark:bg-gray-900">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Bet Type</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedNestedBet ? selectedNestedBet.nat : selectedBet.nat}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Odds:</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(
                      selectedNestedBet
                        ? getOdds(selectedNestedBet, selectedSide)
                        : getOdds(selectedBet, selectedSide)
                    )}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Amount</div>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_CHIPS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(String(amt))}
                      className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
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

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Enter Amount</div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ₹${min} - Max ₹${max}`}
                  min={min}
                  max={max}
                  className="w-full h-12 text-lg font-semibold bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: ₹{min} · Max: ₹{max}
                </div>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {selectedSide === "back" ? "Potential Win" : "Liability"}
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{(() => {
                      const oddsValue = Number(
                        selectedNestedBet
                          ? getOdds(selectedNestedBet, selectedSide)
                          : getOdds(selectedBet, selectedSide)
                      );
                      const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                      if (selectedSide === "back") {
                        return (parseFloat(amount) * normalizedOdds).toFixed(2);
                      } else {
                        return (parseFloat(amount) * (normalizedOdds - 1)).toFixed(2);
                      }
                    })()}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !selectedBet || parseFloat(amount) <= 0 || parseFloat(amount) < min || parseFloat(amount) > max}
                onClick={handlePlaceBet}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Placing Bet...
                  </>
                ) : (
                  `Place Bet ₹${parseFloat(amount) || 0}`
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= RESULT MODAL ================= */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-white m-0">The Trap Result</h2>
            <button
              onClick={() => setResultDialogOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-700 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-6 bg-white dark:bg-gray-900">
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
                    return <div className="text-center py-8 text-muted-foreground">No detailed result data available</div>;
                  }
                  
                  const cardString = t1Data.card || "";
                  const allCards = parseCards(cardString);
                  // Cards alternate: A, B, A, B, ...
                  const playerACards = allCards.filter((_, idx) => idx % 2 === 0);
                  const playerBCards = allCards.filter((_, idx) => idx % 2 === 1);
                  
                  // Parse rdesc to get scores: "Player B  (A:11, B:23)#..."
                  const rdesc = t1Data.rdesc || "";
                  const scoreMatch = rdesc.match(/\(A:(\d+),\s*B:(\d+)\)/);
                  const playerAScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
                  const playerBScore = scoreMatch ? parseInt(scoreMatch[2]) : null;
                  
                  const winner = t1Data.winnat || t1Data.win || "";
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isPlayerAWinner = winnerStr.includes("player a") || winnerStr === "a" || winnerStr === "1";
                  const isPlayerBWinner = winnerStr.includes("player b") || winnerStr === "b" || winnerStr === "2";

                  // Parse rdesc for Seven and Picture Card results
                  const parts = rdesc.split("#");
                  const sevenResults = parts[1] ? parts[1].split(",") : [];
                  const pictureCardResults = parts[2] ? parts[2].split(",") : [];

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

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                              Player A {playerAScore !== null ? `(${playerAScore})` : ""}
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerAWinner && <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {playerACards.length > 0 ? playerACards.map((card, idx) => (
                                <div
                                  key={idx}
                                  className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                                >
                                  <span className={`text-sm font-bold ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{card.rank}</span>
                                  <span className={`text-lg ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{card.suit}</span>
                                </div>
                              )) : <div className="text-gray-500 text-xs">No cards</div>}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                              Player B {playerBScore !== null ? `(${playerBScore})` : ""}
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerBWinner && <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {playerBCards.length > 0 ? playerBCards.map((card, idx) => (
                                <div
                                  key={idx}
                                  className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                                >
                                  <span className={`text-sm font-bold ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{card.rank}</span>
                                  <span className={`text-lg ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{card.suit}</span>
                                </div>
                              )) : <div className="text-gray-500 text-xs">No cards</div>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Main: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {isPlayerAWinner ? "Player A" : isPlayerBWinner ? "Player B" : winner || "N/A"}
                              {playerAScore !== null && playerBScore !== null && ` (A:${playerAScore}, B:${playerBScore})`}
                            </span>
                          </div>
                          {sevenResults.length > 0 && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Seven: </span>
                              <span className="text-gray-900 dark:text-gray-100">{sevenResults.join(",")}</span>
                            </div>
                          )}
                          {pictureCardResults.length > 0 && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Picture Card: </span>
                              <span className="text-gray-900 dark:text-gray-100">{pictureCardResults.join(",")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No detailed data available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-gray-900 dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex flex-row justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-semibold text-white m-0">The Trap Rules</h2>
            <button
              onClick={() => setRulesOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            <div className="space-y-2 text-sm leading-relaxed text-gray-100">
              <ul className="list-disc pl-4 space-y-1">
                <li>Trap is a 52 card deck game.</li>
                <li>
                  Keeping Ace = 1 point, 2 = 2 points, 3 = 3 points, 4 = 4 points, 5 = 5 points, 6 = 6 points, 7 = 7 points, 8 = 8 Points, 9 = 9 points, 10 = 10 points, Jack = 11 points, Queen = 12 points and King = 13 points.
                </li>
                <li>Here there are two sides in TRAP. A and B respectively.</li>
                <li>First card that will open in the game would be from side 'A', next card will open in the game from Side 'B'. Likewise till the end of the game.</li>
                <li>Any side that crosses a total score of 15 would be the winner of the game. For Example: the total score should be 16 or above.</li>
                <li>But if at any stage your score is at 13, 14, 15 then you will get into the trap which ideally means you lose.</li>
                <li>Hence there are only two conditions from which you can decide the winner here either your opponent has to be trapped in the score of 13, 14, 15 or your total score should be above 15.</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
