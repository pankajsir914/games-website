import { Lock, X, Loader2, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

/* ===============================
   CONSTANTS
================================ */

const CARD_ORDER = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const FIRST_ROW = CARD_ORDER.slice(0, 6);
const SECOND_ROW = CARD_ORDER.slice(6);
const SUITS = ["♠", "♥", "♦", "♣"];

const suitColor = (s: string) =>
  s === "♥" || s === "♦" ? "text-red-600" : "text-black";

/* ===============================
   TYPES
================================ */

type Bet = {
  sid?: number | string;
  nat?: string;
  type?: string;
  l?: number; // odds
  back?: number;
  b1?: number;
  b?: number;
  odds?: number;
  gstatus?: string;
  status?: string;
  [key: string]: any; // Allow additional properties
};

/* ===============================
   COMPONENT
================================ */

const Ab3BettingComponent = ({
  betTypes = [],   // API -> data.child
  selectedBet,
  onSelect,
  formatOdds = (v: number) => v.toFixed(2),
  resultHistory = [], // Last 10 results
  currentResult,
  tableId,
  amount,
  onAmountChange,
  onPlaceBet,
  loading = false,
}: any) => {
  const [localAmount, setLocalAmount] = useState<string>("100");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCardBet, setSelectedCardBet] = useState<any>(null);
  const [selectedCardInfo, setSelectedCardInfo] = useState<{side: string, card: string} | null>(null);
  
  // Detail result modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [cardScrollIndex, setCardScrollIndex] = useState(0);
  
  const quickAmounts = [100, 500, 1000, 5000];
  
  // Use provided amount or local state
  const currentAmount = amount !== undefined ? amount : localAmount;
  const setAmount = onAmountChange || setLocalAmount;
  
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

  // Debug: Log betTypes once when they change
  useMemo(() => {
    if (betTypes.length > 0) {
      //console.log("Ab3Betting betTypes sample:", betTypes.slice(0, 2));
    }
  }, [betTypes.length]); // Only log when length changes, not on every render

  /* =========================
     FIND BET (STRICT & SAFE)
  ========================= */

  // Map card to index: A=1, 2=2, ..., K=13, then repeat for bahar (14-26)
  // But ab3 uses 1-46 system, so we need to map differently
  // Card indices: Andar A=1, Andar 2=2, ..., Andar K=13, Bahar A=14, ..., Bahar K=26
  // But the API might use a different system (1-46)
  
  const getCardIndex = (side: "andar" | "bahar", card: string): number => {
    const cardIndex = CARD_ORDER.indexOf(card);
    if (cardIndex === -1) return -1;
    // Andar cards: 1-13, Bahar cards: 14-26
    return side === "andar" ? cardIndex + 1 : cardIndex + 14;
  };

  // Since ab3 uses card positions (1-46) and we can't directly map UI cards to positions,
  // we'll return the first available active bet for any card
  // The backend will handle the actual position mapping
  const getBet = useMemo(() => {
    return (side: "andar" | "bahar", card: string): Bet | null => {
      // Try to find exact match first (in case API provides proper mapping)
      const sideWord = side === "andar" ? "andar" : "bahar";
      const cardLower = card.toLowerCase();
      
      // Handle "10" specially
      const cardVariations = cardLower === "10" 
        ? ["10", "t", "ten"] 
        : [cardLower];

      // Strategy 1: Try exact match with "andar a", "bahar k" format
      let found = betTypes.find((b: any) => {
        const nat = (b?.nat || b?.type || b?.nation || "").toLowerCase().trim();
        if (!nat) return false;
        const normalizedNat = nat.replace(/[_-]/g, " ").trim();
        if (normalizedNat.startsWith(sideWord)) {
          return cardVariations.some(cv => 
            normalizedNat.endsWith(cv) || 
            normalizedNat.endsWith(` ${cv}`) ||
            normalizedNat === `${sideWord} ${cv}` ||
            normalizedNat === `${sideWord}${cv}`
          );
        }
        return false;
      });

      // Strategy 2: If no exact match, use first active bet
      // The backend will map the card selection to the correct position
      if (!found && betTypes.length > 0) {
        // Prefer active bets over suspended ones
        found = betTypes.find((b: any) => 
          b?.status !== "suspended" && 
          b?.gstatus !== "SUSPENDED" &&
          (b?.back > 0 || b?.l > 0 || b?.odds > 0)
        ) || betTypes[0]; // Fallback to first bet if all suspended
      }

      return found || null;
    };
  }, [betTypes]);

  /* =========================
     BET CARD
  ========================= */

  // Calculate hasActiveBets once
  const hasActiveBets = betTypes.length > 0 && betTypes.some((b: any) => 
    b?.status !== "suspended" && 
    b?.gstatus !== "SUSPENDED" &&
    b?.gstatus !== "0"
  );

  const BetCard = ({ bet, side, card, hasActiveBets: hasActive, betTypes: bets, selectedBet: selBet, onCardClick }: any) => {
    // Check suspended status - support both status and gstatus properties
    const isSuspended = bet?.status === "suspended" || 
                       bet?.gstatus === "SUSPENDED" || 
                       bet?.gstatus === "0";
    
    // Get odds from multiple possible properties
    const odds = bet?.l ?? bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0;
    const hasOdds = odds > 0;
    
    // Card is suspended ONLY if:
    // 1. The specific bet is suspended, OR
    // 2. There are NO active bets at all
    // If bet is null but there are active bets, card should still be clickable
    const suspended = (bet && isSuspended) || (!hasActive);

    // Use type first (for BettingPanel compatibility), then sid, then fallback
    const betKey = bet?.type ?? bet?.nat ?? bet?.sid ?? `${side}-${card}`;
    const selected = selBet === betKey || 
                    selBet === bet?.type || 
                    selBet === bet?.nat ||
                    selBet === String(bet?.sid);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      //console.log("🖱️ CLICK DETECTED!", { side, card, suspended, hasActive, onCardClick: !!onCardClick });
      
      // Don't allow click if suspended
      if (suspended) {
        //console.log("❌ Card suspended");
        e.stopPropagation();
        return;
      }
      
      e.stopPropagation();
      // Don't preventDefault - it can interfere with click handling
      
      // Always try to open modal, even if no bet found
      let betToSelect = bet;
      
      if (!betToSelect && bets && bets.length > 0) {
        betToSelect = bets.find((b: any) => 
          b?.status !== "suspended" && 
          b?.gstatus !== "SUSPENDED" &&
          b?.gstatus !== "0"
        ) || bets[0];
      }
      
      if (!betToSelect) {
        betToSelect = {
          type: `${side} ${card}`,
          nat: `${side} ${card}`,
          sid: `${side}-${card}`,
          back: 0,
          l: 0,
          odds: 0,
          status: 'active',
        };
      }
      
      betToSelect = {
        ...betToSelect,
        type: betToSelect.type || betToSelect.nat || `${side} ${card}`,
        nat: betToSelect.nat || betToSelect.type || `${side} ${card}`,
        cardSelection: `${side} ${card}`,
        cardSide: side,
        cardValue: card,
      };
      
      //console.log("🎯 Calling onCardClick with:", betToSelect);
      
      // Always call onCardClick if it exists
      if (onCardClick) {
        try {
          onCardClick(betToSelect, side, card);
          //console.log("✅ onCardClick executed successfully");
        } catch (error) {
          //console.error("❌ Error in onCardClick:", error);
        }
      } else {
       // console.error("❌ onCardClick is undefined!");
      }
    };

    const triggerClick = () => {
      if (suspended) {
       // console.log("❌ Card suspended, not triggering");
        return;
      }
      
      //console.log("✅ Triggering click for card", { side, card });
      
      // Use the bet if found, otherwise use first available active bet
      let betToSelect = bet;
      
      if (!betToSelect && bets && bets.length > 0) {
        betToSelect = bets.find((b: any) => 
          b?.status !== "suspended" && 
          b?.gstatus !== "SUSPENDED" &&
          b?.gstatus !== "0"
        ) || bets[0];
      }
      
      if (!betToSelect) {
        betToSelect = {
          type: `${side} ${card}`,
          nat: `${side} ${card}`,
          sid: `${side}-${card}`,
          back: 0,
          l: 0,
          odds: 0,
          status: 'active',
        };
      }
      
      betToSelect = {
        ...betToSelect,
        type: betToSelect.type || betToSelect.nat || `${side} ${card}`,
        nat: betToSelect.nat || betToSelect.type || `${side} ${card}`,
        cardSelection: `${side} ${card}`,
        cardSide: side,
        cardValue: card,
      };
      
      //console.log("🎯 Calling onCardClick with:", betToSelect);
      
      if (onCardClick) {
        try {
          onCardClick(betToSelect, side, card);
          //console.log("✅ onCardClick executed successfully");
        } catch (error) {
          //console.error("❌ Error in onCardClick:", error);
        }
      } else {
      //  console.error("❌ onCardClick is undefined!");
      }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
      if (suspended) return;
      //console.log("🖱️ MouseUp - triggering click", { side, card });
      e.stopPropagation();
      triggerClick();
    };

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          triggerClick();
        }}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => {
          if (!suspended) {
            e.stopPropagation();
            triggerClick();
          }
        }}
        className={`
          relative w-[44px] h-[66px]
          rounded-md flex flex-col items-center justify-between
          text-[11px] font-bold select-none
          ${side === "andar"
            ? "bg-[#4b3a3a] text-white"
            : "bg-[#ffe98a] text-black"}
          ${selected ? "ring-2 ring-green-400" : ""}
          ${suspended
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-white/10 active:scale-95 transition-transform"}
        `}
        style={{ 
          pointerEvents: suspended ? 'none' : 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          position: 'relative',
          zIndex: suspended ? 0 : 10,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        role="button"
        tabIndex={suspended ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !suspended) {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
      >
        <div className="mt-1 text-[12px] font-extrabold">{card}</div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[12px] leading-none">
          {SUITS.map((s) => (
            <span key={s} className={suitColor(s)}>{s}</span>
          ))}
        </div>

        <div className="mb-1 text-[11px] font-extrabold">
          {hasOdds ? formatOdds(odds) : "--"}
        </div>

        {suspended && (
          <div 
            className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md pointer-events-none z-20"
          >
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  BetCard.displayName = "BetCard";

  /* =========================
     MOBILE
  ========================= */

  const renderMobileRows = (side: "andar" | "bahar") => (
    <div className="space-y-1 flex flex-col items-center">
      <div
        className={`mb-1 px-4 py-[2px] text-xs font-bold rounded
        ${side === "andar"
          ? "bg-[#3b2a3a] text-white"
          : "bg-yellow-300 text-black"}`}
      >
        {side.toUpperCase()}
      </div>

      <div className="flex gap-1 justify-center">
        {FIRST_ROW.map((card) => (
          <BetCard
            key={`${side}-${card}`}
            card={card}
            side={side}
            bet={getBet(side, card)}
            hasActiveBets={hasActiveBets}
            betTypes={betTypes}
            selectedBet={selectedBet}
            onCardClick={(bet: any, side: string, card: string) => {
              setSelectedCardBet(bet);
              setSelectedCardInfo({ side, card });
              setModalOpen(true);
              if (onSelect) {
                onSelect(bet, "back");
              }
            }}
          />
        ))}
      </div>

      <div className="flex gap-1 justify-center">
        {SECOND_ROW.map((card) => (
          <BetCard
            key={`${side}-${card}`}
            card={card}
            side={side}
            bet={getBet(side, card)}
            hasActiveBets={hasActiveBets}
            betTypes={betTypes}
            selectedBet={selectedBet}
            onCardClick={(bet: any, side: string, card: string) => {
              setSelectedCardBet(bet);
              setSelectedCardInfo({ side, card });
              setModalOpen(true);
              if (onSelect) {
                onSelect(bet, "back");
              }
            }}
          />
        ))}
      </div>
    </div>
  );

  /* =========================
     DESKTOP
  ========================= */

  const renderDesktopRow = (side: "andar" | "bahar") => (
    <div className="flex items-center justify-center gap-2">
      <div
        className={`w-[70px] text-center text-xs font-bold
        ${side === "andar"
          ? "bg-[#3b2a3a] text-white"
          : "bg-yellow-300 text-black"}`}
      >
        {side.toUpperCase()}
      </div>

      <div className="flex gap-1">
        {CARD_ORDER.map((card) => (
          <BetCard
            key={`${side}-${card}`}
            card={card}
            side={side}
            bet={getBet(side, card)}
            hasActiveBets={hasActiveBets}
            betTypes={betTypes}
            selectedBet={selectedBet}
            onCardClick={(bet: any, side: string, card: string) => {
              setSelectedCardBet(bet);
              setSelectedCardInfo({ side, card });
              setModalOpen(true);
              if (onSelect) {
                onSelect(bet, "back");
              }
            }}
          />
        ))}
      </div>
    </div>
  );

  /* =========================
     DETAIL RESULT FUNCTIONS
  ========================= */

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

  /* =========================
     MAIN RENDER
  ========================= */

  return (
    <div className="space-y-4">
      {/* Betting Cards */}
      <div className="flex justify-center">
        <div className="block sm:hidden">{renderMobileRows("andar")}</div>
        <div className="hidden sm:block">{renderDesktopRow("andar")}</div>
      </div>

      <div className="flex justify-center">
        <div className="block sm:hidden">{renderMobileRows("bahar")}</div>
        <div className="hidden sm:block">{renderDesktopRow("bahar")}</div>
      </div>

      {/* Bet Place Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Place Bet</span>
              {selectedCardInfo && (
                <span className="text-sm font-normal text-muted-foreground">
                  {selectedCardInfo.side.toUpperCase()} - {selectedCardInfo.card}
                </span>
              )}
            </DialogTitle>
            {selectedCardBet && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Odds: <span className="font-bold text-foreground">{formatOdds(selectedCardBet?.back || selectedCardBet?.l || selectedCardBet?.odds || 0)}</span>
                </p>
                {selectedCardBet?.cardSelection && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCardBet.cardSelection}
                  </p>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick Amounts */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Amount</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    size="sm"
                    variant={currentAmount === String(amt) ? "default" : "outline"}
                    onClick={() => setAmount(String(amt))}
                    className="h-10"
                  >
                    ₹{amt}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={currentAmount}
                className="h-10"
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter custom amount"
                min="1"
              />
            </div>

            {/* Potential Win Calculation */}
            {selectedCardBet && currentAmount && parseFloat(currentAmount) > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Potential Win:</span>
                  <span className="font-bold text-green-500">
                    ₹{((selectedCardBet?.back || selectedCardBet?.l || selectedCardBet?.odds || 0) * parseFloat(currentAmount)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  <span>Stake:</span>
                  <span>₹{parseFloat(currentAmount).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Place Bet Button */}
            {onPlaceBet && (
              <Button
                className="w-full h-11"
                disabled={loading || !currentAmount || parseFloat(currentAmount) <= 0 || !selectedCardBet}
                onClick={async () => {
                  if (selectedCardBet && currentAmount) {
                    try {
                      await onPlaceBet({
                        amount: parseFloat(currentAmount),
                        betType: selectedCardBet.type || selectedCardBet.nat,
                        odds: selectedCardBet?.back || selectedCardBet?.l || selectedCardBet?.odds || 0,
                        sid: selectedCardBet?.sid,
                        mid: selectedCardBet?.mid,
                        cardSelection: selectedCardBet?.cardSelection,
                        cardSide: selectedCardBet?.cardSide,
                        cardValue: selectedCardBet?.cardValue,
                      });
                      // Close modal on success
                      setModalOpen(false);
                      setAmount("100"); // Reset amount
                    } catch (error) {
                      console.error("Error placing bet:", error);
                    }
                  }
                }}
              >
                {loading ? (
                  <>
                    <span className="mr-2">Placing...</span>
                  </>
                ) : (
                  `Place Bet ₹${currentAmount}`
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => {
        setDetailDialogOpen(open);
        if (!open) setCardScrollIndex(0);
      }}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">ANDAR BAHAR 50 CARDS Result</h2>
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
                    return cards.map((card, index) => {
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
                        position: index + 1, // Position starts from 1
                      };
                    }).filter(Boolean);
                  };

                  const cardString = t1Data.card || "";
                  const allCards = parseCards(cardString);
                  
                  // Split cards into odd and even positions
                  const evenCards = allCards.filter((_, idx) => (idx + 1) % 2 === 0); // Positions 2, 4, 6, ...
                  const oddCards = allCards.filter((_, idx) => (idx + 1) % 2 === 1); // Positions 1, 3, 5, ...
                  
                  // Cards to display per scroll (15 cards per row)
                  const cardsPerView = 15;
                  const maxScrollIndex = Math.max(
                    Math.ceil(evenCards.length / cardsPerView) - 1,
                    Math.ceil(oddCards.length / cardsPerView) - 1,
                    0
                  );
                  
                  const visibleEvenCards = evenCards.slice(
                    cardScrollIndex * cardsPerView,
                    (cardScrollIndex + 1) * cardsPerView
                  );
                  const visibleOddCards = oddCards.slice(
                    cardScrollIndex * cardsPerView,
                    (cardScrollIndex + 1) * cardsPerView
                  );

                  const CardDisplay = ({ card, position }: { card: any; position: number }) => (
                    <div className="flex flex-col items-center">
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">{position}</div>
                      <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-sm">
                        <span className={`text-sm font-bold ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                          {card.rank}
                        </span>
                        <span className={`text-lg ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                          {card.suit}
                        </span>
                      </div>
                    </div>
                  );

                  return (
                    <div className="space-y-4">
                      {/* Round Id and Match Time */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Round Id: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono">{t1Data.rid || selectedResult?.mid || "N/A"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Match Time: </span>
                          <span className="text-gray-900 dark:text-gray-100">{t1Data.mtime || "N/A"}</span>
                        </div>
                      </div>

                      {/* Cards Display */}
                      <div className="space-y-3">
                        {/* Top Row - Even Positions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCardScrollIndex(Math.max(0, cardScrollIndex - 1))}
                            disabled={cardScrollIndex === 0}
                            className="w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide flex-1">
                            {visibleEvenCards.map((card, idx) => {
                              const position = (cardScrollIndex * cardsPerView * 2) + (idx * 2) + 2;
                              return <CardDisplay key={idx} card={card} position={position} />;
                            })}
                          </div>
                          <button
                            onClick={() => setCardScrollIndex(Math.min(maxScrollIndex, cardScrollIndex + 1))}
                            disabled={cardScrollIndex >= maxScrollIndex}
                            className="w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        {/* Bottom Row - Odd Positions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCardScrollIndex(Math.max(0, cardScrollIndex - 1))}
                            disabled={cardScrollIndex === 0}
                            className="w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide flex-1">
                            {visibleOddCards.map((card, idx) => {
                              const position = (cardScrollIndex * cardsPerView * 2) + (idx * 2) + 1;
                              return <CardDisplay key={idx} card={card} position={position} />;
                            })}
                          </div>
                          <button
                            onClick={() => setCardScrollIndex(Math.min(maxScrollIndex, cardScrollIndex + 1))}
                            disabled={cardScrollIndex >= maxScrollIndex}
                            className="w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Winner Display */}
                      <div className="bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4 text-center">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Winner {t1Data.winnat || t1Data.rdesc || "Win"}
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
    </div>
  );
};

export const Ab3Betting = memo(Ab3BettingComponent);
