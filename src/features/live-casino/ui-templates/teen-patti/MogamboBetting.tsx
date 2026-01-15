// src/pages/tables/MogamboBetting.tsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Lock, X, Info, Loader2, Trophy } from "lucide-react";
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

interface MogamboBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  table?: any; // Table information for bet placement
  formatOdds?: (val: any) => string; // Optional odds formatter
  odds?: any; // Full odds object in case bets are nested
  resultHistory?: any[]; // Last 10 results for display
  currentResult?: any; // Current result object (may contain results array)
  tableId?: string; // Table ID for fetching rules and detail results
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

const byNat = (bets: any[], nat: string) => {
  if (!bets || !Array.isArray(bets)) {
    console.warn("⚠️ [byNat] bets is not an array:", bets);
    return undefined;
  }
  
  // Try to find by nat field (exact match, case-insensitive)
  let found = bets.find(
    (b) => (b.nat || "").toLowerCase().trim() === nat.toLowerCase().trim()
  );
  
  // If not found, try by type field
  if (!found) {
    found = bets.find(
      (b) => (b.type || "").toLowerCase().trim() === nat.toLowerCase().trim()
    );
  }
  
  // If still not found, try partial match
  if (!found) {
    const searchLower = nat.toLowerCase().trim();
    found = bets.find((b) => {
      const betNat = (b.nat || "").toLowerCase().trim();
      const betType = (b.type || "").toLowerCase().trim();
      return betNat.includes(searchLower) || searchLower.includes(betNat) ||
             betType.includes(searchLower) || searchLower.includes(betType);
    });
  }
  
  if (!found) {
    console.warn(`⚠️ [byNat] Bet not found for "${nat}". Available bets:`, 
      bets.map(b => ({ nat: b.nat, type: b.type, sid: b.sid }))
    );
  }
  
  return found;
};

// Sanitize HTML for rules
const sanitizeHTML = (html: string): string => {
  if (!html) return "";
  let sanitized = html;
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son\w+='[^']*'/gi, "");
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/data:text\/html/gi, "");
  sanitized = sanitized.replace(/vbscript:/gi, "");
  sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  sanitized = sanitized.replace(/<object[\s\S]*?<\/object>/gi, "");
  sanitized = sanitized.replace(/<embed[\s\S]*?<\/embed>/gi, "");
  return sanitized;
};

/* ================= COMPONENT ================= */

export const MogamboBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  table,
  formatOdds = formatOddsValue,
  odds,
  resultHistory = [],
  currentResult,
  tableId,
}: MogamboBettingProps) => {
  /* ---------- EXTRACT BETS FROM MULTIPLE SOURCES ---------- */
  // Try to get bets from multiple possible locations
  const actualBetTypes = useMemo(() => {
    // First try: betTypes prop (already an array)
    if (Array.isArray(betTypes) && betTypes.length > 0) {
      return betTypes;
    }
    
    // Second try: odds?.bets
    if (odds?.bets && Array.isArray(odds.bets) && odds.bets.length > 0) {
      console.log("✅ [Mogambo] Found bets in odds.bets");
      return odds.bets;
    }
    
    // Third try: odds?.data?.sub (API structure)
    if (odds?.data?.sub && Array.isArray(odds.data.sub) && odds.data.sub.length > 0) {
      console.log("✅ [Mogambo] Found bets in odds.data.sub");
      return odds.data.sub;
    }
    
    // Fourth try: odds?.sub
    if (odds?.sub && Array.isArray(odds.sub) && odds.sub.length > 0) {
      console.log("✅ [Mogambo] Found bets in odds.sub");
      return odds.sub;
    }
    
    console.warn("⚠️ [Mogambo] No bets found in any location", { betTypes, odds });
    return betTypes || [];
  }, [betTypes, odds]);
  
  /* ---------- BETS ---------- */
  
  // First, log the raw betTypes to see what we're getting
  useEffect(() => {
    console.log("📊 [Mogambo] Bet extraction:", {
      betTypesLength: betTypes?.length || 0,
      actualBetTypesLength: actualBetTypes?.length || 0,
      oddsStructure: odds ? Object.keys(odds) : null,
      oddsDataSub: odds?.data?.sub?.length || 0,
      oddsBets: odds?.bets?.length || 0,
      oddsSub: odds?.sub?.length || 0,
      firstFewBets: actualBetTypes?.slice(0, 3) || [],
    });
  }, [betTypes, actualBetTypes, odds]);

  const mogambo = byNat(actualBetTypes, "Mogambo");
  const dagaTeja = byNat(actualBetTypes, "Daga / Teja");
  const cardTotal = byNat(actualBetTypes, "3 Card Total");

  /* ---------- CONSOLE LOG ODDS ---------- */
  // Log odds whenever betTypes change
  useEffect(() => {
    console.log("🎰 [Mogambo Betting] Full Data:", {
      betTypesLength: betTypes?.length || 0,
      betTypesStructure: betTypes,
      betTypesSample: betTypes?.slice(0, 3)?.map((b: any) => ({
        nat: b?.nat,
        type: b?.type,
        sid: b?.sid,
        b: b?.b,
        back: b?.back,
        odds: b?.odds,
        gstatus: b?.gstatus,
        allKeys: Object.keys(b || {})
      })),
      mogambo: {
        bet: mogambo,
        odds: getOdds(mogambo),
        formatted: formatOdds(getOdds(mogambo)),
        suspended: isSuspended(mogambo),
      },
      dagaTeja: {
        bet: dagaTeja,
        odds: getOdds(dagaTeja),
        formatted: formatOdds(getOdds(dagaTeja)),
        suspended: isSuspended(dagaTeja),
      },
      cardTotal: {
        bet: cardTotal,
        odds: getOdds(cardTotal),
        formatted: formatOdds(getOdds(cardTotal)),
        suspended: isSuspended(cardTotal),
      },
    });
  }, [actualBetTypes, mogambo, dagaTeja, cardTotal, formatOdds]);

  /* ---------- MODAL STATE ---------- */

  const [open, setOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [stake, setStake] = useState("");

  // Rules modal state
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const hasFetchedRulesRef = useRef(false);

  // Detail result modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  /* ---------- LAST 10 RESULTS ---------- */
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

  /* ---------- FETCH RULES ---------- */
  useEffect(() => {
    if (rulesOpen) {
      const finalTableId = tableId || odds?.tableId || odds?.rawData?.gtype || "mogambo";
      
      if (!finalTableId || hasFetchedRulesRef.current) return;
      
      hasFetchedRulesRef.current = true;
      setRulesLoading(true);
      setRulesError(null);
      
      supabase.functions.invoke("diamond-casino-proxy", {
        body: {
          action: "get-casino-rules",
          tableId: finalTableId,
        },
      })
        .then(({ data, error }) => {
          if (error) {
            setRulesError(error.message);
            setRules([]);
          } else if (data && data.success) {
            const rulesArray = data?.data?.data || data?.data || [];
            setRules(rulesArray);
          } else {
            setRulesError(data?.error || "Rules not available");
            setRules([]);
          }
        })
        .catch((err: any) => {
          setRulesError(err?.message || "Failed to load rules");
          setRules([]);
        })
        .finally(() => {
          setRulesLoading(false);
        });
    } else {
      hasFetchedRulesRef.current = false;
    }
  }, [rulesOpen, tableId, odds]);

  // Sanitize rules HTML
  const sanitizedRules = useMemo(() => {
    return rules.map((rule) => ({
      ...rule,
      safeHTML: sanitizeHTML(rule.rules || ""),
    }));
  }, [rules]);

  /* ---------- FETCH DETAIL RESULT ---------- */
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

  /* ---------- OPEN MODAL ---------- */

  const openModal = (bet: any) => {
    if (isSuspended(bet)) return;
    setSelectedBet(bet);
    setStake("");
    setOpen(true);
  };

  /* ---------- SUBMIT ---------- */

  const submitBet = async () => {
    if (!selectedBet || !stake) return;
    
    await onPlaceBet({
      tableId: table?.id || table?.gmid || table?.data?.gmid || "",
      tableName: table?.name || table?.gname || "",
      amount: Number(stake),
      betType: selectedBet.nat,
      odds: getOdds(selectedBet) || 1,
      sid: selectedBet.sid,
      roundId: selectedBet.mid,
      side: "back", // Mogambo bets are always "back"
    });

    setOpen(false);
  };

  /* ---------- QUICK STAKES ---------- */

  const quickStakes = [25, 50, 100, 200, 500, 1000];

  /* ================= UI ================= */

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Mogambo</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= MAIN BETS ================= */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* DAGA / TEJA */}
        <button
          onClick={() => openModal(dagaTeja)}
          className={`p-2 text-sm rounded border flex justify-between items-center
            ${
              isSuspended(dagaTeja)
                ? "bg-gray-200 text-gray-500"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
        >
          <span>Daga / Teja</span>
          <span className="font-bold">
            {(() => {
              const odds = getOdds(dagaTeja);
              const formatted = formatOdds(odds);
              const suspended = isSuspended(dagaTeja);
              console.log("🎯 [Daga/Teja] Display:", { odds, formatted, suspended, bet: dagaTeja });
              return suspended ? <Lock size={14} /> : formatted;
            })()}
          </span>
        </button>

        {/* MOGAMBO */}
        <button
          onClick={() => openModal(mogambo)}
          className={`p-2 text-sm rounded border flex justify-between items-center
            ${
              isSuspended(mogambo)
                ? "bg-gray-200 text-gray-500"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
        >
          <span>Mogambo</span>
          <span className="font-bold">
            {(() => {
              const odds = getOdds(mogambo);
              const formatted = formatOdds(odds);
              const suspended = isSuspended(mogambo);
              console.log("🎯 [Mogambo] Display:", { odds, formatted, suspended, bet: mogambo });
              return suspended ? <Lock size={14} /> : formatted;
            })()}
          </span>
        </button>
      </div>

      {/* ================= 3 CARD TOTAL ================= */}
      <button
        onClick={() => openModal(cardTotal)}
        className={`w-full p-2 mb-3 text-sm rounded border flex justify-between items-center
          ${
            isSuspended(cardTotal)
              ? "bg-gray-200 text-gray-500"
              : "bg-pink-600 hover:bg-pink-700 text-white"
          }`}
      >
        <span>3 Card Total</span>
        <span className="font-bold">
          {(() => {
            const odds = getOdds(cardTotal);
            const formatted = formatOdds(odds);
            const suspended = isSuspended(cardTotal);
            console.log("🎯 [3 Card Total] Display:", { odds, formatted, suspended, bet: cardTotal });
            return suspended ? <Lock size={14} /> : formatted;
          })()}
        </span>
      </button>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2 mt-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10Results.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              const winner = result.win || result.winner || result.result || "";
              const winnerStr = String(winner).trim();
              
              // Map winner to M (Mogambo) or D (Daga/Teja)
              // win: "1" = Mogambo, win: "2" = Daga/Teja
              let letter = "D";
              let bgColor = "bg-blue-500";
              
              if (winnerStr === "1" || winner === 1) {
                letter = "M";
                bgColor = "bg-purple-500";
              } else if (winnerStr === "2" || winner === 2) {
                letter = "D";
                bgColor = "bg-blue-500";
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="bg-slate-800 text-white px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-sm">
              Place Bet
            </DialogTitle>
            <button onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          <div className="bg-white dark:bg-gray-800 p-3 text-sm">
            <div className="flex justify-between mb-2 text-gray-900 dark:text-white">
              <span className="font-semibold">{selectedBet?.nat}</span>
              <span className="text-gray-600 dark:text-gray-300">Range: {selectedBet?.min} to {selectedBet?.max}</span>
            </div>

            {/* INPUTS */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Input
                disabled
                value={formatOdds(getOdds(selectedBet))}
                placeholder="Odds"
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
              <Input
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Stake"
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
              <Input
                disabled
                value={
                  stake && selectedBet
                    ? (Number(stake) * (Number(getOdds(selectedBet)) || 0)).toFixed(2)
                    : ""
                }
                placeholder="Profit"
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* QUICK STAKES */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {quickStakes.map((v) => (
                <button
                  key={v}
                  onClick={() => setStake(String(v))}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-1 rounded text-xs font-medium"
                >
                  +{v}
                </button>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center">
              <Button
                size="sm"
                variant="outline"
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white border-gray-300 dark:border-gray-600"
                onClick={() => setStake("")}
              >
                Reset
              </Button>

              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading}
                onClick={submitBet}
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mogambo Rules</DialogTitle>
          </DialogHeader>

          {rulesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading rules...</span>
            </div>
          ) : rulesError ? (
            <div className="text-center py-8 text-red-500">
              {rulesError}
            </div>
          ) : sanitizedRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Rules not available
            </div>
          ) : (
            <div className="space-y-4">
              {sanitizedRules.map((rule, idx) => (
                <div key={idx}>
                  <div
                    className="rules-section"
                    dangerouslySetInnerHTML={{ __html: rule.safeHTML }}
                  />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Mogambo Result</h2>
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
                      // Format: "10SS" = 10 of Spades, "8HH" = 8 of Hearts
                      // Last 2 chars are suit (doubled: SS, HH, CC, DD)
                      if (card.length >= 3) {
                        if (card.startsWith("10")) {
                          rank = "10";
                          suit = card.slice(2);
                        } else {
                          rank = card.substring(0, card.length - 2);
                          suit = card.slice(-2);
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
                  // For Mogambo: first 2 cards are Daga/Teja, last 1 card is Mogambo
                  const dagaTejaCard1 = allCards[0] || null;
                  const dagaTejaCard2 = allCards[1] || null;
                  const mogamboCard = allCards[2] || null;

                  // Parse winner
                  const winner = t1Data.winnat || t1Data.win || "";
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isDagaTejaWinner = 
                    winnerStr.includes("daga") || 
                    winnerStr.includes("teja") ||
                    winnerStr === "2" ||
                    winner === "2" ||
                    winner === 2;
                  const isMogamboWinner = 
                    winnerStr.includes("mogambo") ||
                    winnerStr === "1" ||
                    winner === "1" ||
                    winner === 1;

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
                        {/* Daga / Teja */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Daga / Teja
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isDagaTejaWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {dagaTejaCard1 ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${dagaTejaCard1.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{dagaTejaCard1.rank}</span>
                                  <span className={`text-lg ${dagaTejaCard1.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{dagaTejaCard1.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">No card</div>
                              )}
                              {dagaTejaCard2 ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${dagaTejaCard2.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{dagaTejaCard2.rank}</span>
                                  <span className={`text-lg ${dagaTejaCard2.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{dagaTejaCard2.suit}</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Mogambo */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Mogambo
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isMogamboWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {mogamboCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${mogamboCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{mogamboCard.rank}</span>
                                  <span className={`text-lg ${mogamboCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{mogamboCard.suit}</span>
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
                              {isDagaTejaWinner ? "Daga / Teja" : isMogamboWinner ? "Mogambo" : winner || "N/A"}
                            </span>
                          </div>
                          {t1Data.rdesc && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Description: </span>
                              <span className="text-gray-900 dark:text-gray-100">{t1Data.rdesc}</span>
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
