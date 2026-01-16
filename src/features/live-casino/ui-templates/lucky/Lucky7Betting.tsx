import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Info, X, Loader2, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

/* ================= TYPES ================= */

interface Lucky7BettingProps {
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

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string) =>
  bets.find((b) => (b.nat || "").toLowerCase() === nat.toLowerCase());

const getOdds = (bet: any, side: "back" | "lay" = "back") => {
  if (side === "lay") {
    return bet?.lay ?? bet?.l ?? 0;
  }
  return bet?.back ?? bet?.b ?? bet?.b1 ?? bet?.odds ?? 0;
};

const formatOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

// Card groups
const LINE_1_CARDS = ["A", "2", "3"];
const LINE_2_CARDS = ["4", "5", "6"];
const LINE_3_CARDS = ["8", "9", "10"];
const LINE_4_CARDS = ["J", "Q", "K"];

// Individual card order
const CARD_ORDER = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

/* ================= COMPONENT ================= */

export const Lucky7Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
  resultHistory = [],
  tableId,
}: Lucky7BettingProps) => {
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

  const last10 = resultHistory.slice(0, 10);

  // Extract bets from multiple possible sources
  const actualBetTypes = useMemo(() => {
    if (odds?.data?.sub && Array.isArray(odds.data.sub) && odds.data.sub.length > 0) {
      return odds.data.sub;
    }
    if (Array.isArray(betTypes) && betTypes.length > 0) {
      return betTypes;
    }
    if (odds?.bets && Array.isArray(odds.bets) && odds.bets.length > 0) {
      return odds.bets;
    }
    if (odds?.sub && Array.isArray(odds.sub) && odds.sub.length > 0) {
      return odds.sub;
    }
    return betTypes || [];
  }, [betTypes, odds]);

  // Find bets
  const lowCardBet = find(actualBetTypes, "Low Card");
  const highCardBet = find(actualBetTypes, "High Card");
  const evenBet = find(actualBetTypes, "Even");
  const oddBet = find(actualBetTypes, "Odd");
  const redBet = find(actualBetTypes, "Red");
  const blackBet = find(actualBetTypes, "Black");
  const line1Bet = find(actualBetTypes, "Line 1");
  const line2Bet = find(actualBetTypes, "Line 2");
  const line3Bet = find(actualBetTypes, "Line 3");
  const line4Bet = find(actualBetTypes, "Line 4");

  // Find individual card bets
  const cardBets = CARD_ORDER.map((card) => {
    // Try multiple variations for each card
    let bet = find(actualBetTypes, `Card ${card}`) || 
              find(actualBetTypes, card);
    
    // Special handling for Ace (A/1/Ace)
    if (card === "A" && !bet) {
      bet = find(actualBetTypes, "Card Ace") || 
            find(actualBetTypes, "Card 1") ||
            find(actualBetTypes, "Ace") ||
            find(actualBetTypes, "1");
    }
    
    // Special handling for numbered cards that might be "Card 1" format
    if (!bet && !isNaN(Number(card))) {
      bet = find(actualBetTypes, `Card ${Number(card)}`);
    }
    
    return bet || null;
  });

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const odds = getOdds(bet, side);
    if (formatOdds(odds) === "0.00") return;
    setSelectedBet(bet);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const placeBet = async () => {
    if (!selectedBet) return;
    await onPlaceBet({
      sid: selectedBet.sid,
      nat: selectedBet.nat,
      odds: getOdds(selectedBet, selectedSide),
      amount: Number(amount),
      side: selectedSide,
    });
    setBetModalOpen(false);
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

  // Betting Panel Component
  const BettingPanel = ({ bet, label, oddsLabel }: { bet: any; label: string; oddsLabel?: string }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    const displayOdds = oddsLabel || odds;

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative w-full flex items-center justify-center
          py-2 px-2 rounded-md transition-all text-xs
          bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-bold
          ${
            suspended || odds === "0.00"
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-blue-700 hover:to-cyan-500 cursor-pointer"
          }
        `}
      >
        {label}
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded">
            <Lock size={10} />
          </div>
        )}
      </button>
    );
  };

  // Odds Badge Component
  const OddsBadge = ({ value }: { value: string }) => (
    <div className="bg-blue-900 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded mb-0.5">
      {value}
    </div>
  );

  // Card Component
  const CardDisplay = ({ bet, card, showOdds = false }: { bet: any; card: string; showOdds?: boolean }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    const isDisabled = !bet || suspended || loading || odds === "0.00";
    
    return (
      <button
        disabled={isDisabled}
        onClick={() => {
          if (!isDisabled && bet) {
            openBetModal(bet);
          }
        }}
        className={`
          relative w-full border-2 border-yellow-400 bg-white rounded-md
          flex flex-col items-center justify-center
          transition-all p-1 min-h-[32px]
          ${
            isDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-yellow-50 cursor-pointer hover:border-yellow-500"
          }
        `}
      >
        <div className="font-bold text-gray-900 mb-0.5 text-xs">{card}</div>
        <div className="grid grid-cols-2 gap-0.5 text-[8px]">
          <span className="text-black">♠</span>
          <span className="text-red-500">♥</span>
          <span className="text-black">♣</span>
          <span className="text-red-500">♦</span>
        </div>
        {showOdds && odds !== "0.00" && (
          <div className="text-gray-600 mt-0.5 text-[7px]">{odds}</div>
        )}
        {isDisabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 rounded">
            <Lock size={8} />
          </div>
        )}
      </button>
    );
  };

  // Central Card Component (for the "7" card)
  const CentralCard = () => (
    <div className="flex flex-col items-center">
      <OddsBadge value="7" />
      <div className="w-[40px] h-[52px] sm:w-[52px] sm:h-[64px] border-2 border-yellow-400 bg-white rounded-md flex flex-col items-center justify-center shadow-md">
        <div className="font-bold text-gray-900 text-xs mb-0.5">7</div>
        <div className="grid grid-cols-2 gap-0.5 text-[8px]">
          <span className="text-black">♠</span>
          <span className="text-red-500">♥</span>
          <span className="text-black">♣</span>
          <span className="text-red-500">♦</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2.5">
        <h3 className="text-xs sm:text-sm font-semibold">Lucky 7</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-5 w-5 sm:h-6 sm:w-6">
          <Info size={10} className="sm:w-3 sm:h-3" />
        </Button>
      </div>

      {/* ================= TOP SECTION: Central Card with Low/High Card ================= */}
      <div className="flex items-end gap-1.5 mb-2.5">
        {/* Low Card */}
        <div className="flex-1 flex flex-col items-center">
          <OddsBadge value={formatOdds(getOdds(lowCardBet))} />
          <BettingPanel bet={lowCardBet} label="Low Card" />
        </div>

        {/* Central 7 Card */}
        <CentralCard />

        {/* High Card */}
        <div className="flex-1 flex flex-col items-center">
          <OddsBadge value={formatOdds(getOdds(highCardBet))} />
          <BettingPanel bet={highCardBet} label="High Card" />
        </div>
      </div>

      {/* ================= MID SECTION: Even/Odd & Red/Black ================= */}
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        {/* Left: Even/Odd */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex flex-col items-center">
            <OddsBadge value={formatOdds(getOdds(evenBet))} />
            <BettingPanel bet={evenBet} label="Even" />
          </div>
          <div className="flex flex-col items-center">
            <OddsBadge value={formatOdds(getOdds(oddBet))} />
            <BettingPanel bet={oddBet} label="Odd" />
          </div>
        </div>

        {/* Right: Red/Black */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex flex-col items-center">
            <OddsBadge value={formatOdds(getOdds(redBet))} />
            <button
              disabled={isSuspended(redBet) || loading}
              onClick={() => openBetModal(redBet)}
              className={`
                relative w-full flex items-center justify-center gap-0.5
                py-2 px-2 rounded-md transition-all text-xs
                bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-bold
                ${
                  isSuspended(redBet) || formatOdds(getOdds(redBet)) === "0.00"
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-blue-700 hover:to-cyan-500 cursor-pointer"
                }
              `}
            >
              <span className="text-red-200">♥</span>
              <span className="text-red-200">♥</span>
            </button>
          </div>
          <div className="flex flex-col items-center">
            <OddsBadge value={formatOdds(getOdds(blackBet))} />
            <button
              disabled={isSuspended(blackBet) || loading}
              onClick={() => openBetModal(blackBet)}
              className={`
                relative w-full flex items-center justify-center gap-0.5
                py-2 px-2 rounded-md transition-all text-xs
                bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-bold
                ${
                  isSuspended(blackBet) || formatOdds(getOdds(blackBet)) === "0.00"
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-blue-700 hover:to-cyan-500 cursor-pointer"
                }
              `}
            >
              <span className="text-black">♠</span>
              <span className="text-black">♣</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= LOWER SECTION 1: Card Groups (A-2-3, 4-5-6, 8-9-10, J-Q-K) ================= */}
      <div className="mb-2.5">
        {/* Desktop View: All 4 groups in one row */}
        <div className="hidden sm:grid grid-cols-4 gap-1.5">
          {[
            { cards: LINE_1_CARDS, bet: line1Bet },
            { cards: LINE_2_CARDS, bet: line2Bet },
            { cards: LINE_3_CARDS, bet: line3Bet },
            { cards: LINE_4_CARDS, bet: line4Bet },
          ].map(({ cards, bet }, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <OddsBadge value={formatOdds(getOdds(bet))} />
              <div className="grid grid-cols-3 gap-0.5 w-full">
                {cards.map((card) => (
                  <CardDisplay key={card} bet={bet} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View: 2 groups per row */}
        <div className="sm:hidden space-y-1.5">
          {/* First Row: 2 groups (A-2-3 and 4-5-6) */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { cards: LINE_1_CARDS, bet: line1Bet },
              { cards: LINE_2_CARDS, bet: line2Bet },
            ].map(({ cards, bet }, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <OddsBadge value={formatOdds(getOdds(bet))} />
                <div className="grid grid-cols-3 gap-1 w-full">
                  {cards.map((card) => (
                    <CardDisplay key={card} bet={bet} card={card} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Second Row: 2 groups (8-9-10 and J-Q-K) */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { cards: LINE_3_CARDS, bet: line3Bet },
              { cards: LINE_4_CARDS, bet: line4Bet },
            ].map(({ cards, bet }, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <OddsBadge value={formatOdds(getOdds(bet))} />
                <div className="grid grid-cols-3 gap-1 w-full">
                  {cards.map((card) => (
                    <CardDisplay key={card} bet={bet} card={card} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= LOWEST SECTION 2: Individual Cards (A-K) ================= */}
      <div className="mb-4">
        {/* Odds heading for Card 7 */}
        <div className="text-center mb-2">
          <div className="inline-block bg-blue-900 text-white text-xs font-semibold px-3 py-1 rounded">
            {formatOdds(getOdds(cardBets[CARD_ORDER.indexOf("7")]))}
          </div>
        </div>
        
        {/* Desktop View: All 13 cards in one row */}
        <div className="hidden sm:grid gap-1" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
          {CARD_ORDER.map((card, idx) => (
            <CardDisplay key={card} bet={cardBets[idx]} card={card} />
          ))}
        </div>
        
        {/* Mobile View: First Row (7 cards), Second Row (6 cards centered) */}
        <div className="sm:hidden space-y-1.5">
          {/* First Row: Cards A-7 (7 cards) */}
          <div className="grid grid-cols-7 gap-0.5">
            {CARD_ORDER.slice(0, 7).map((card, idx) => (
              <CardDisplay key={card} bet={cardBets[idx]} card={card} />
            ))}
          </div>
          
          {/* Second Row: Cards 8-K (6 cards) - Centered */}
          <div className="flex justify-center">
            <div className="grid grid-cols-6 gap-0.5 max-w-[80%]">
              {CARD_ORDER.slice(7, 13).map((card, idx) => (
                <CardDisplay key={card} bet={cardBets[idx + 7]} card={card} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      {last10.length > 0 && (
        <div className="pt-1.5 border-t border-border/50 mb-2.5">
          <p className="text-[9px] mb-1.5 text-muted-foreground">Last 10 Results</p>
          <div className="flex gap-0.5 flex-wrap">
            {last10.map((r, i) => {
              const winValue = r.win?.toString() || r.winnerId?.toString() || "";
              
              // Convert: 2 → H, 1 → L, 0 → T
              let display = "R";
              let bgColor = "bg-red-500 text-white border-red-600";
              
              if (winValue === "2" || winValue === "High") {
                display = "H";
                bgColor = "bg-blue-500 text-white border-blue-600";
              } else if (winValue === "1" || winValue === "Low") {
                display = "L";
                bgColor = "bg-green-500 text-white border-green-600";
              } else if (winValue === "0" || winValue === "Tie" || winValue === "T") {
                display = "T";
                bgColor = "bg-yellow-500 text-white border-yellow-600";
              } else if (winValue) {
                display = winValue;
              }
              
              return (
                <Button
                  key={r.mid || r.round || r.round_id || i}
                  size="sm"
                  variant="outline"
                  className={`w-6 h-6 p-0 font-bold ${bgColor} text-[9px]`}
                  onClick={() => handleResultClick(r)}
                >
                  {display}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="bg-slate-800 text-white px-3 py-2 flex justify-between items-center">
            <DialogTitle className="text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          {selectedBet && (
            <div className="p-4 space-y-3">
              <div className="text-sm font-semibold">{selectedBet.nat}</div>
              <div className="text-xs text-gray-600">
                Side: <span className="font-bold capitalize">{selectedSide}</span>
              </div>
              <div className="text-xs text-gray-600">
                Odds: <span className="font-bold">{formatOdds(getOdds(selectedBet, selectedSide))}</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`py-2 px-2 rounded text-xs font-medium transition-colors ${
                      amount === String(a)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    ₹{a}
                  </button>
                ))}
              </div>

              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full"
              />

              {amount && parseFloat(amount) > 0 && (
                <div className="text-xs text-gray-600">
                  {selectedSide === "back" ? "Potential win" : "Liability"}: ₹
                  {(
                    parseFloat(amount) *
                    (Number(getOdds(selectedBet, selectedSide)) > 1000
                      ? Number(getOdds(selectedBet, selectedSide)) / 100000
                      : Number(getOdds(selectedBet, selectedSide))) -
                    (selectedSide === "lay" ? parseFloat(amount) : 0)
                  ).toFixed(2)}
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={placeBet}
                disabled={loading || !amount || parseFloat(amount) <= 0}
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
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between relative rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">
              Lucky 7 Result
            </DialogTitle>
            <button
              onClick={() => setDetailDialogOpen(false)}
              className="text-white hover:bg-blue-700 rounded-full p-1.5 transition-colors absolute right-4 top-1/2 -translate-y-1/2 z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
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
                      'S': '♠', 'H': '♥', 'C': '♣', 'D': '♦',
                    };
                    
                    const rankMap: { [key: string]: string } = {
                      '1': 'A', 'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J',
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

                  const cardString = t1Data.card || '';
                  const card = parseCard(cardString.split(',')[0]?.trim() || cardString.trim());
                  const winner = t1Data.winnat || t1Data.win || t1Data.rdesc || "";
                  const rdesc = t1Data.rdesc || "";

                  return (
                    <div className="space-y-4">
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

                      {card && (
                        <div className="flex justify-center items-center py-6">
                          <div className="relative">
                            <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded-lg bg-white flex flex-col items-center justify-center shadow-lg">
                              <span className={`text-xl sm:text-2xl font-bold ${card.isRed ? "text-red-600" : "text-black"}`}>
                                {card.rank}
                              </span>
                              <span className={`text-3xl sm:text-4xl ${card.isRed ? "text-red-600" : "text-black"}`}>
                                {card.suit}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4 sm:p-5 shadow-sm">
                        <div className="space-y-2">
                          <div className="text-center">
                            <span className="font-bold text-gray-900 text-lg sm:text-xl">
                              Winner: {winner || "N/A"}
                            </span>
                          </div>
                          {rdesc && (
                            <div className="text-center text-gray-700 text-sm sm:text-base mt-2">
                              {rdesc}
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
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lucky 7 - A Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <p>
              Lucky 7 is a 8 deck playing cards game, total 8 * 52 = 416 cards.
            </p>
            
            <p>
              If the card is from ACE to 6, LOW Wins.
            </p>
            
            <p>
              If the card is from 8 to KING, HIGH Wins.
            </p>
            
            <div className="bg-yellow-50 p-2 rounded">
              <p className="font-semibold text-yellow-800">Note:</p>
              <p className="text-yellow-700">
                If the card is 7, bets on high and low will lose 50% of the bet amount.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">LOW: 1,2,3,4,5,6 | HIGH: 8,9,10,J,Q,K</p>
              <p className="mb-2">Payout: 2.0</p>
            </div>

            <div>
              <p className="font-semibold mb-1">EVEN: 2,4,6,8,10,Q</p>
              <p className="mb-2">Payout: 2.10</p>
            </div>

            <div>
              <p className="font-semibold mb-1">ODD: 1,3,5,7,9,J,K</p>
              <p className="mb-2">Payout: 1.79</p>
            </div>

            <div>
              <p className="font-semibold mb-1">RED:</p>
              <p className="mb-2">Payout: 1.95</p>
            </div>

            <div>
              <p className="font-semibold mb-1">BLACK:</p>
              <p className="mb-2">Payout: 1.95</p>
            </div>

            <div>
              <p className="font-semibold mb-1">CARDS: 1,2,3,4,5,6,7,8,9,10,J,Q,K</p>
              <p>PAYOUT: 12.0</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
