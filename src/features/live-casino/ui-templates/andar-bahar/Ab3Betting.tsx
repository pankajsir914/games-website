import { Lock, X } from "lucide-react";
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
  amount,
  onAmountChange,
  onPlaceBet,
  loading = false,
}: any) => {
  const [localAmount, setLocalAmount] = useState<string>("100");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCardBet, setSelectedCardBet] = useState<any>(null);
  const [selectedCardInfo, setSelectedCardInfo] = useState<{side: string, card: string} | null>(null);
  const quickAmounts = [100, 500, 1000, 5000];
  
  // Use provided amount or local state
  const currentAmount = amount !== undefined ? amount : localAmount;
  const setAmount = onAmountChange || setLocalAmount;
  
  // Get last 10 results
  const last10Results = Array.isArray(resultHistory) 
    ? resultHistory.slice(0, 10).reverse() 
    : [];

  // Debug: Log betTypes once when they change
  useMemo(() => {
    if (betTypes.length > 0) {
      console.log("Ab3Betting betTypes sample:", betTypes.slice(0, 2));
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

  const BetCard = memo(({ bet, side, card }: any) => {
    // Check suspended status - support both status and gstatus properties
    const isSuspended = bet?.status === "suspended" || 
                       bet?.gstatus === "SUSPENDED" || 
                       bet?.gstatus === "0";
    
    // Get odds from multiple possible properties
    const odds = bet?.l ?? bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0;
    const hasOdds = odds > 0;
    
    // If no bet found, check if we have any active bets at all
    // Card is suspended if: bet is explicitly suspended, OR no betTypes, OR all bets are suspended
    const hasAnyBets = betTypes.length > 0;
    const hasActiveBets = hasAnyBets && betTypes.some((b: any) => 
      b?.status !== "suspended" && 
      b?.gstatus !== "SUSPENDED" &&
      b?.gstatus !== "0"
    );
    const suspended = isSuspended || (!hasActiveBets);

    // Use type first (for BettingPanel compatibility), then sid, then fallback
    const betKey = bet?.type ?? bet?.nat ?? bet?.sid ?? `${side}-${card}`;
    const selected = selectedBet === betKey || 
                    selectedBet === bet?.type || 
                    selectedBet === bet?.nat ||
                    selectedBet === String(bet?.sid);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (suspended) {
        console.log("Card clicked but suspended:", { side, card, bet, suspended, isSuspended });
        return;
      }
      
      // Use the bet if found, otherwise use first available active bet
      // The backend will map the card selection (side + card) to the correct position
      let betToSelect = bet;
      
      if (!betToSelect && hasActiveBets) {
        // Use first active bet
        betToSelect = betTypes.find((b: any) => 
          b?.status !== "suspended" && 
          b?.gstatus !== "SUSPENDED" &&
          b?.gstatus !== "0"
        );
      }
      
      if (!betToSelect) {
        console.log("Card clicked but no bet available:", { side, card });
        return;
      }
      
      // Enhance bet object with card information for backend mapping
      betToSelect = {
        ...betToSelect,
        // Preserve original type/nat for backend
        type: betToSelect.type || betToSelect.nat || betToSelect.nation || `${side} ${card}`,
        nat: betToSelect.nat || betToSelect.type || `${side} ${card}`,
        // Add card selection info for backend to map to correct position
        cardSelection: `${side} ${card}`,
        cardSide: side,
        cardValue: card,
      };
      
      // Open modal with selected bet
      setSelectedCardBet(betToSelect);
      setSelectedCardInfo({ side, card });
      setModalOpen(true);
      
      // Also call onSelect for compatibility
      if (onSelect) {
        onSelect(betToSelect, "back");
      }
    };

    return (
      <div
        onClick={handleClick}
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
            className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  });

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
          />
        ))}
      </div>
    </div>
  );

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
            <DialogDescription>
              {selectedCardBet && (
                <div className="mt-2">
                  <p className="text-sm">
                    Odds: <span className="font-bold">{formatOdds(selectedCardBet?.back || selectedCardBet?.l || selectedCardBet?.odds || 0)}</span>
                  </p>
                  {selectedCardBet?.cardSelection && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedCardBet.cardSelection}
                    </p>
                  )}
                </div>
              )}
            </DialogDescription>
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

      {/* Last 10 Results */}
      {last10Results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4" />
              Last 10 Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {last10Results.map((result: any, index: number) => {
                  const winValue = result.win || result.winner || result.result || result.nat || 'N/A';
                  const roundId = result.mid || result.round_id || result.round || `Round ${index + 1}`;
                  
                  // Format for Andar Bahar - could be "Andar", "Bahar", or card info
                  const formatResult = (win: string) => {
                    const winStr = String(win).toLowerCase();
                    if (winStr.includes('andar')) return 'Andar';
                    if (winStr.includes('bahar')) return 'Bahar';
                    if (winStr === '1' || winStr === 'a') return 'Andar';
                    if (winStr === '2' || winStr === 'b') return 'Bahar';
                    return win;
                  };
                  
                  const displayResult = formatResult(winValue);
                  
                  return (
                    <div
                      key={result.mid || index}
                      className="flex justify-between items-center p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">
                          Round #{String(roundId).slice(-6)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {result.card || result.cardValue || ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-sm ${
                          displayResult === 'Andar' ? 'text-blue-500' : 
                          displayResult === 'Bahar' ? 'text-yellow-500' : 
                          'text-primary'
                        }`}>
                          {displayResult}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const Ab3Betting = memo(Ab3BettingComponent);
