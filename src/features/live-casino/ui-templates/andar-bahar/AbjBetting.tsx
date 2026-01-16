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

interface AbjBettingProps {
  betTypes: any[];
  selectedBet: string;
  onSelect: (bet: any, side: "back") => void;
  formatOdds: (v: any) => string;
  resultHistory?: Array<{
    mid?: string | number;
    win?: "Andar" | "Bahar" | string;
    card?: string;
    round?: string | number;
    round_id?: string | number;
  }>;
  onResultClick?: (res: any) => void;
  amount?: string;
  onAmountChange?: (amount: string) => void;
  onPlaceBet?: (betData: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
  tableId?: string;
}

/* ================= CONSTANTS ================= */

const CARD_ORDER = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED" || b?.status === "suspended" || b?.gstatus === "0";

const find = (bets: any[], nat: string) =>
  bets.find((b) => {
    const natStr = (b.nat || b.type || "").toLowerCase().trim();
    const searchStr = nat.toLowerCase().trim();
    return natStr === searchStr || natStr.includes(searchStr) || searchStr.includes(natStr);
  });

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

const getJokerBet = (betTypes: any[], card: string) => {
  if (!betTypes || betTypes.length === 0) return null;
  
  // Try multiple formats: "joker A", "Joker A", "JOKER A", "Card A", etc.
  const searchTerm = `joker ${card.toLowerCase()}`;
  const cardSearchTerm = `card ${card.toLowerCase()}`;
  
  return betTypes.find(
    (b: any) => {
      const nat = (b.nat || "").toLowerCase().trim();
      const type = (b.type || "").toLowerCase().trim();
      return nat === searchTerm || type === searchTerm || 
             nat.includes(searchTerm) || type.includes(searchTerm) ||
             nat === cardSearchTerm || type === cardSearchTerm ||
             nat.includes(cardSearchTerm) || type.includes(cardSearchTerm);
    }
  ) || null;
};

/* ================= COMPONENT ================= */

export const AbjBetting = ({
  betTypes,
  selectedBet,
  onSelect,
  formatOdds,
  resultHistory = [],
  onResultClick,
  amount,
  onAmountChange,
  onPlaceBet,
  loading = false,
  odds,
  tableId,
}: AbjBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);
  const [localAmount, setLocalAmount] = useState("100");
  
  const currentAmount = amount ?? localAmount;
  const setAmount = onAmountChange ?? setLocalAmount;

  // Detail result modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const last10 = useMemo(() => resultHistory.slice(0, 10), [resultHistory]);

  // Extract bets from multiple possible sources
  const actualBetTypes = useMemo(() => {
    if (odds?.data?.sub && Array.isArray(odds.data.sub) && odds.data.sub.length > 0) {
      return odds.data.sub;
    }
    if (Array.isArray(betTypes) && betTypes.length > 0) {
      return betTypes;
    }
    return betTypes || [];
  }, [betTypes, odds]);

  // Find bets
  const saBet = find(actualBetTypes, "sa");
  const sbBet = find(actualBetTypes, "sb");
  const firstBetAndar = find(actualBetTypes, "first bet andar") || find(actualBetTypes, "first bet a") || find(actualBetTypes, "1st bet andar");
  const firstBetBahar = find(actualBetTypes, "first bet bahar") || find(actualBetTypes, "first bet b") || find(actualBetTypes, "1st bet bahar");
  const secondBetAndar = find(actualBetTypes, "second bet andar") || find(actualBetTypes, "second bet a") || find(actualBetTypes, "2nd bet andar");
  const secondBetBahar = find(actualBetTypes, "second bet bahar") || find(actualBetTypes, "second bet b") || find(actualBetTypes, "2nd bet bahar");
  const oddBet = find(actualBetTypes, "odd");
  const evenBet = find(actualBetTypes, "even");
  
  const spadeBet = find(actualBetTypes, "spade") || find(actualBetTypes, "♠");
  const clubBet = find(actualBetTypes, "club") || find(actualBetTypes, "♣");
  const heartBet = find(actualBetTypes, "heart") || find(actualBetTypes, "♥");
  const diamondBet = find(actualBetTypes, "diamond") || find(actualBetTypes, "♦");

  // Find individual card bets
  const cardBets = CARD_ORDER.map((card) => getJokerBet(actualBetTypes, card));

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet)) return;
    const odds = getOdds(bet);
    if (formatOdds(odds) === "0.00") return;
    setSelectedBetData(bet);
    setAmount("100");
    onSelect?.(bet, "back");
    setBetModalOpen(true);
  };

  const placeBet = async () => {
    if (!selectedBetData) return;
    await onPlaceBet?.({
      sid: selectedBetData.sid,
      nat: selectedBetData.nat,
      odds: getOdds(selectedBetData),
      amount: Number(currentAmount),
      side: "back",
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
    onResultClick?.(result);
  };

  // Betting Button Component
  const BettingButton = ({ bet, label, oddsValue, disabled = false, className = "" }: { 
    bet: any; 
    label: string; 
    oddsValue?: string;
    disabled?: boolean;
    className?: string;
  }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    const displayOdds = oddsValue || odds;
    const isDisabled = disabled || suspended || loading || odds === "0.00" || !bet;

    return (
      <button
        disabled={isDisabled}
        onClick={() => !isDisabled && bet && openBetModal(bet)}
        className={`
          relative w-full h-[29px] border-2 rounded-md flex flex-col items-center justify-center
          transition-all text-[10px] font-bold
          ${className}
          ${
            isDisabled
              ? "opacity-50 cursor-not-allowed bg-gray-600 border-yellow-400 text-white"
              : "cursor-pointer bg-blue-600 border-yellow-400 text-white hover:bg-blue-700"
          }
        `}
      >
        {label}
        {displayOdds !== "0.00" && (
          <div className="text-[7px] mt-0.5">{displayOdds}</div>
        )}
        {isDisabled && bet && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded">
            <Lock size={7} className="text-white" />
          </div>
        )}
      </button>
    );
  };

  // Card Component
  const CardDisplay = ({ bet, card }: { bet: any; card: string }) => {
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
          transition-all p-0.5 min-h-[29px]
          ${
            isDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-yellow-50 cursor-pointer hover:border-yellow-500"
          }
        `}
      >
        <div className="font-bold text-gray-900 mb-0.5 text-[10px]">{card}</div>
        <div className="grid grid-cols-2 gap-0.5 text-[6px]">
          <span className="text-black">♠</span>
          <span className="text-red-500">♥</span>
          <span className="text-black">♣</span>
          <span className="text-red-500">♦</span>
        </div>
        {isDisabled && bet && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 rounded">
            <Lock size={6} />
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2.5">
        <h3 className="text-xs font-semibold">Andar Bahar 2</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-4 w-4">
          <Info size={10} />
        </Button>
      </div>

      {/* ================= TOP SECTION: A (Andar) & B (Bahar) ================= */}
      {/* Desktop: Side by side, Mobile: Stacked */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2.5 mb-2.5">
        {/* Left: A (Andar) */}
        <div className="flex-1 flex items-center gap-0.5 sm:gap-1.5">
          <span className="text-base sm:text-xl font-bold">A</span>
          <div className="flex gap-0.5 sm:gap-1.5 flex-1">
            {/* SA Button */}
            <div className="flex-1">
              <BettingButton
                bet={saBet}
                label="SA"
                className="bg-gray-200 border-yellow-400 text-gray-900 hover:bg-gray-300"
              />
            </div>
            {/* First Bet */}
            <div className="flex-1">
              <BettingButton
                bet={firstBetAndar}
                label="First Bet"
              />
            </div>
            {/* Second Bet */}
            <div className="flex-1">
              <BettingButton
                bet={secondBetAndar}
                label="Second Bet"
                disabled={true}
              />
            </div>
          </div>
          <span className="text-base sm:text-xl font-bold">A</span>
        </div>

        {/* Right: B (Bahar) */}
        <div className="flex-1 flex items-center gap-0.5 sm:gap-1.5">
          <span className="text-base sm:text-xl font-bold">B</span>
          <div className="flex gap-0.5 sm:gap-1.5 flex-1">
            {/* SB Button */}
            <div className="flex-1">
              <BettingButton
                bet={sbBet}
                label="SB"
                className="bg-gray-200 border-yellow-400 text-gray-900 hover:bg-gray-300"
              />
            </div>
            {/* First Bet */}
            <div className="flex-1">
              <BettingButton
                bet={firstBetBahar}
                label="First Bet"
              />
            </div>
            {/* Second Bet */}
            <div className="flex-1">
              <BettingButton
                bet={secondBetBahar}
                label="Second Bet"
                disabled={true}
              />
            </div>
          </div>
          <span className="text-base sm:text-xl font-bold">B</span>
        </div>
      </div>

      {/* ================= MIDDLE SECTION: ODD/EVEN & Suits ================= */}
      {/* Desktop: Side by side, Mobile: Stacked */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
        {/* Left: ODD/EVEN */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="text-center">
            <div className="font-bold text-[10px] sm:text-xs mb-0.5">ODD</div>
            <div
              onClick={() => oddBet && !isSuspended(oddBet) && openBetModal(oddBet)}
              className={`
                h-[29px] rounded-md flex items-center justify-center font-bold text-white text-[10px] sm:text-xs
                transition-all cursor-pointer
                ${
                  !oddBet || isSuspended(oddBet) || formatOdds(getOdds(oddBet)) === "0.00"
                    ? "opacity-50 cursor-not-allowed bg-sky-400"
                    : "bg-sky-400 hover:bg-sky-500"
                }
              `}
            >
              {formatOdds(getOdds(oddBet))}
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-[10px] sm:text-xs mb-0.5">EVEN</div>
            <div
              onClick={() => evenBet && !isSuspended(evenBet) && openBetModal(evenBet)}
              className={`
                h-[29px] rounded-md flex items-center justify-center font-bold text-white text-[10px] sm:text-xs
                transition-all cursor-pointer
                ${
                  !evenBet || isSuspended(evenBet) || formatOdds(getOdds(evenBet)) === "0.00"
                    ? "opacity-50 cursor-not-allowed bg-sky-400"
                    : "bg-sky-400 hover:bg-sky-500"
                }
              `}
            >
              {formatOdds(getOdds(evenBet))}
            </div>
          </div>
        </div>

        {/* Right: Suits */}
        <div className="grid grid-cols-4 gap-0.5 sm:gap-1.5 text-center">
          {[
            { icon: "♠", bet: spadeBet, name: "Spade" },
            { icon: "♣", bet: clubBet, name: "Club" },
            { icon: "♥", bet: heartBet, name: "Heart" },
            { icon: "♦", bet: diamondBet, name: "Diamond" },
          ].map(({ icon, bet, name }) => (
            <div key={name}>
              <div className="text-sm sm:text-base mb-0.5">{icon}</div>
              <div
                onClick={() => bet && !isSuspended(bet) && openBetModal(bet)}
                className={`
                  h-[29px] rounded-md flex items-center justify-center font-bold text-white text-[10px] sm:text-xs
                  transition-all cursor-pointer
                  ${
                    !bet || isSuspended(bet) || formatOdds(getOdds(bet)) === "0.00"
                      ? "opacity-50 cursor-not-allowed bg-sky-400"
                      : "bg-sky-400 hover:bg-sky-500"
                  }
                `}
              >
                {formatOdds(getOdds(bet))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= BOTTOM SECTION: Individual Cards (A-K) ================= */}
      {/* Desktop: All 13 cards in one row */}
      <div className="hidden sm:grid gap-0.5 sm:gap-1.5 mb-2.5" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
        {CARD_ORDER.map((card, idx) => (
          <CardDisplay key={card} bet={cardBets[idx]} card={card} />
        ))}
      </div>
      {/* Mobile: 7 cards in first row, 6 cards in second row (centered) */}
      <div className="sm:hidden space-y-0.5 mb-2.5">
        {/* First Row: Cards A-7 (7 cards) */}
        <div className="grid grid-cols-7 gap-0.5">
          {CARD_ORDER.slice(0, 7).map((card, idx) => (
            <CardDisplay key={card} bet={cardBets[idx]} card={card} />
          ))}
        </div>
        {/* Second Row: Cards 8-K (6 cards) - Centered */}
        <div className="flex justify-center">
          <div className="grid grid-cols-6 gap-0.5 max-w-[85%]">
            {CARD_ORDER.slice(7, 13).map((card, idx) => (
              <CardDisplay key={card} bet={cardBets[idx + 7]} card={card} />
            ))}
          </div>
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      {last10.length > 0 && (
        <div className="pt-1.5 border-t border-border/50 mb-2.5">
          <p className="text-[9px] mb-1.5 text-muted-foreground">Last 10 Results</p>
          <div className="flex gap-0.5 flex-wrap">
            {last10.map((r, i) => {
              const winValue = r.win?.toString() || "";
              const isAndar = winValue.toLowerCase().includes("andar") || winValue === "A" || winValue === "1";
              const isBahar = winValue.toLowerCase().includes("bahar") || winValue === "B" || winValue === "2";
              
              const display = isAndar ? "A" : isBahar ? "B" : winValue || "?";
              const bgColor = isAndar 
                ? "bg-blue-500 text-white border-blue-600"
                : isBahar
                ? "bg-green-500 text-white border-green-600"
                : "bg-gray-500 text-white border-gray-600";
              
              return (
                <Button
                  key={r.mid || r.round || r.round_id || i}
                  size="sm"
                  variant="outline"
                  className={`w-6 h-6 p-0 font-bold ${bgColor} text-[9px] rounded-full`}
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

          {selectedBetData && (
            <div className="p-4 space-y-3">
              <div className="text-sm font-semibold">{selectedBetData.nat || selectedBetData.type}</div>
              <div className="text-xs text-gray-600">
                Odds: <span className="font-bold">{formatOdds(getOdds(selectedBetData))}</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`py-2 px-2 rounded text-xs font-medium transition-colors ${
                      currentAmount === String(a)
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
                value={currentAmount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full"
              />

              {currentAmount && parseFloat(currentAmount) > 0 && (
                <div className="text-xs text-gray-600">
                  Potential win: ₹
                  {(
                    parseFloat(currentAmount) *
                    (Number(getOdds(selectedBetData)) > 1000
                      ? Number(getOdds(selectedBetData)) / 100000
                      : Number(getOdds(selectedBetData))) -
                    parseFloat(currentAmount)
                  ).toFixed(2)}
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={placeBet}
                disabled={loading || !currentAmount || parseFloat(currentAmount) <= 0}
              >
                {loading ? "Placing..." : `Place Bet ₹${currentAmount}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT DIALOG ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 [&>button]:hidden bg-white rounded-lg border-0 shadow-xl">
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between relative rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">
              Andar Bahar 2 Result
            </DialogTitle>
            <button
              onClick={() => setDetailDialogOpen(false)}
              className="text-white hover:bg-blue-700 rounded p-1.5 transition-colors absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-blue-700"
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
                    
                    // Handle formats: "5SS", "10DD", "JCC", "KHH", etc. (suit doubled)
                    // Or formats: "5S", "10D", etc. (suit single)
                    if (cardString.length >= 3) {
                      if (cardString.startsWith('10')) {
                        rank = '10';
                        // Handle "10DD" or "10D"
                        suit = cardString.length >= 5 ? cardString.slice(2, 4) : cardString.slice(2, 3);
                      } else {
                        // Handle "5SS" or "5S", "JCC" or "JC"
                        const lastTwo = cardString.slice(-2);
                        if (lastTwo[0] === lastTwo[1] && ['S', 'H', 'C', 'D'].includes(lastTwo[0])) {
                          // Doubled suit: "SS", "HH", "CC", "DD"
                          rank = cardString.substring(0, cardString.length - 2);
                          suit = lastTwo[0];
                        } else {
                          // Single suit: "S", "H", "C", "D"
                          rank = cardString.substring(0, cardString.length - 1);
                          suit = cardString.slice(-1);
                        }
                      }
                    }
                    
                    const suitMap: { [key: string]: string } = {
                      'S': '♠', 'H': '♥', 'C': '♣', 'D': '♦',
                      'SS': '♠', 'HH': '♥', 'CC': '♣', 'DD': '♦',
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
                      isRed: suit === 'H' || suit === 'HH' || suit === 'D' || suit === 'DD',
                    };
                  };

                  const cardString = t1Data.card || '';
                  const allCardsStr = cardString.split(',').map(c => c.trim()).filter(Boolean);
                  
                  // First card is joker
                  const jokerCard = allCardsStr.length > 0 ? parseCard(allCardsStr[0]) : null;
                  
                  // Next cards: first card to A, second to B, then alternating
                  // Card 1 (index 1) goes to A, Card 2 (index 2) goes to B, etc.
                  const andarCards: any[] = [];
                  const baharCards: any[] = [];
                  
                  for (let i = 1; i < allCardsStr.length; i++) {
                    const parsed = parseCard(allCardsStr[i]);
                    if (parsed) {
                      if (i % 2 === 1) {
                        // Odd index (1, 3, 5...) goes to Andar (A)
                        andarCards.push(parsed);
                      } else {
                        // Even index (2, 4, 6...) goes to Bahar (B)
                        baharCards.push(parsed);
                      }
                    }
                  }
                  

                  const winner = (t1Data.winnat || t1Data.win || "").toString();
                  const isBahar = winner.toLowerCase().includes("bahar") || winner === "B" || winner === "2";
                  const isAndar = winner.toLowerCase().includes("andar") || winner === "A" || winner === "1";
                  
                  // Extract suit and odd/even from rdesc or winner
                  const rdesc = t1Data.rdesc || "";
                  let winnerSuit = "";
                  let oddEven = "";
                  
                  // Parse rdesc if available (format might be "Bahar#Club#Odd#J")
                  if (rdesc) {
                    const parts = rdesc.split('#');
                    if (parts.length >= 2) {
                      winnerSuit = parts[1] || "";
                    }
                    if (parts.length >= 3) {
                      oddEven = parts[2] || "";
                    }
                  }
                  
                  // If no suit from rdesc, try to get from last card of winner
                  if (!winnerSuit) {
                    const winningCards = isAndar ? andarCards : isBahar ? baharCards : [];
                    if (winningCards.length > 0) {
                      const lastCard = winningCards[winningCards.length - 1];
                      const suitNames: { [key: string]: string } = {
                        '♠': 'Spade', '♥': 'Heart', '♣': 'Club', '♦': 'Diamond'
                      };
                      winnerSuit = suitNames[lastCard.suit] || lastCard.suit;
                    }
                  }

                  // Filter out null/empty cards
                  const validAndarCards = andarCards.filter(card => card && card.rank && card.suit);
                  const validBaharCards = baharCards.filter(card => card && card.rank && card.suit);
                  
                  // Card component
                  const CardComponent = ({ card, className = "" }: { card: any; className?: string }) => {
                    if (!card) return null;
                    return (
                      <div className={`w-6 h-[36px] sm:w-8 sm:h-12 border-2 border-yellow-400 rounded-lg bg-white flex flex-col items-center justify-center shadow-md ${className}`}>
                        <span className={`text-xs sm:text-sm font-bold ${card.isRed ? "text-red-600" : "text-black"}`}>
                          {card.rank}
                        </span>
                        <span className={`text-sm sm:text-base ${card.isRed ? "text-red-600" : "text-black"}`}>
                          {card.suit}
                        </span>
                      </div>
                    );
                  };

                  // Pair cards for mobile (A top, B bottom) - only valid cards
                  const maxPairs = Math.max(validAndarCards.length, validBaharCards.length);
                  const cardPairs: Array<{ a: any; b: any }> = [];
                  for (let i = 0; i < maxPairs; i++) {
                    cardPairs.push({
                      a: validAndarCards[i] || null,
                      b: validBaharCards[i] || null,
                    });
                  }
                  
                  // Get first valid cards
                  const firstAndarCard = validAndarCards.length > 0 ? validAndarCards[0] : null;
                  const firstBaharCard = validBaharCards.length > 0 ? validBaharCards[0] : null;

                  return (
                    <div className="space-y-3 sm:space-y-4">
                      {/* Round Id and Match Time */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm pb-2 sm:pb-3 border-b border-gray-200">
                        <div>
                          <span className="font-semibold text-gray-900">Round Id: </span>
                          <span className="text-gray-900 font-mono">
                            {t1Data.rid || t1Data.mid || detailData.mid || selectedResult?.mid || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">Match Time: </span>
                          <span className="text-gray-900">
                            {t1Data.mtime || t1Data.match_time || detailData.mtime || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Card Display Section */}
                      <div className="flex items-start gap-2 sm:gap-4">
                        {/* A and B Labels */}
                        <div className="flex flex-col gap-[36px] sm:gap-12 pt-1 sm:pt-2">
                          <span className="text-base sm:text-lg font-bold text-gray-900">A</span>
                          <span className="text-base sm:text-lg font-bold text-gray-900">B</span>
                        </div>
                        
                        {/* Joker Card */}
                        <div className="flex flex-col items-center">
                          {jokerCard && <CardComponent card={jokerCard} />}
                        </div>
                        
                        {/* Cards in Columns (Mobile) or Rows (Desktop) */}
                        {/* Mobile: Columns with A on top, B below - only valid cards */}
                        <div className="sm:hidden flex gap-1 sm:gap-2 overflow-x-auto pb-2">
                          {cardPairs.map((pair, idx) => (
                            <div key={idx} className="flex flex-col gap-1 sm:gap-2 flex-shrink-0">
                              {pair.a && <CardComponent card={pair.a} />}
                              {pair.b && <CardComponent card={pair.b} />}
                            </div>
                          ))}
                        </div>
                        
                        {/* Desktop: Separate rows for A and B - only valid cards */}
                        <div className="hidden sm:block flex-1 ml-4">
                          {/* First Dealt Cards */}
                          <div className="flex flex-col gap-4 sm:gap-8 mb-2 sm:mb-4">
                            {firstAndarCard && <CardComponent card={firstAndarCard} />}
                            {firstBaharCard && <CardComponent card={firstBaharCard} />}
                          </div>
                          {/* Andar Row */}
                          <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-4 flex-wrap">
                            {validAndarCards.slice(1).map((card, idx) => (
                              <CardComponent key={`andar-${idx}`} card={card} />
                            ))}
                          </div>
                          {/* Bahar Row */}
                          <div className="flex gap-1 sm:gap-2 flex-wrap">
                            {validBaharCards.slice(1).map((card, idx) => (
                              <CardComponent key={`bahar-${idx}`} card={card} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Summary Box */}
                      <div className="border-2 border-gray-300 rounded-lg bg-white p-3 sm:p-4 shadow-sm max-w-md mx-auto">
                        <div className="space-y-1 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-900">Winner </span>
                            <span className="font-bold text-gray-900">
                              {isAndar ? "Andar" : isBahar ? "Bahar" : winner || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-900">Suit </span>
                            <span className="font-bold text-gray-900">
                              {winnerSuit || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-900">Odd/Even </span>
                            <span className="font-bold text-gray-900">
                              {oddEven || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-900">Joker </span>
                            <span className="font-bold text-gray-900">
                              {jokerCard?.rank || "N/A"}
                            </span>
                          </div>
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
            <DialogTitle>Andar Bahar 2 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="font-semibold mb-2">Rules</p>
              <p className="mb-2">
                Andar Bahar is a very simple game that involves the use of a single pack of cards. Game is played between the House and the Player. The dealer deals a single card face up on the Joker place and then proceeds to deal cards face up on A (ANDAR) and B (BAHAR) spots. When a card appears that matches the value of the Joker card then the game ends. Before the start of the game, players bet on which side they think the game will end.
              </p>
              <p className="mb-2">
                Before dealer starts dealing/opening cards from the deck, he/she also offers a side bet to the players who have estimated time to bet if the card/joker will be dealt as the 1st card.
              </p>
              <p className="mb-2">
                If the 1st placed card doesn't match the value of the Joker's card, the game continues and the dealer then offers the option to players to put their 2nd bet on the same joker card to be dealt either on ANDAR or on BAHAR. The players again have estimated time to decide if they want to place a 2nd bet. Dealer deals the cards one at a time alternating between two spots.
              </p>
              <p className="mb-2">
                If the 1st dealt card in 1st bet matches the joker's card, Bahar side wins with payout 1:0,5
              </p>
              <p className="mb-2">
                If the 1st dealt card in 1st bet matches the joker's card, Andar side wins with payout 1:0,5
              </p>
              <p className="mb-2">
                If the 2nd dealt card in 1st bet matches the joker's card, Bahar side wins with payout 1:0,5
              </p>
              <p className="mb-2">
                If the 2nd dealt card in 1st bet matches the joker's card, Andar side wins with payou 1:0,5
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">Payout</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span><strong>Bet</strong></span>
                  <span><strong>Description</strong></span>
                  <span><strong>Payout</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>1st Bet Bahar</span>
                  <span>Payout if Bahar Wins on the 1st bet</span>
                  <span>1 to 1</span>
                </div>
                <div className="flex justify-between">
                  <span>1st Bet Andar</span>
                  <span>Payout if Andar wins on the 1st bet</span>
                  <span>1 to 1</span>
                </div>
                <div className="flex justify-between">
                  <span>2nd Bet Bahar</span>
                  <span>Payout if Bahar wins on the 2nd bet</span>
                  <span>1 to 1</span>
                </div>
                <div className="flex justify-between">
                  <span>2nd Bet Andar</span>
                  <span>Payout if Andar wins on the 1st bet</span>
                  <span>1 to 1</span>
                </div>
                <div className="flex justify-between">
                  <span>Side Bets Bahar</span>
                  <span>Payout for winning side bet.</span>
                  <span>1 to 14</span>
                </div>
                <div className="flex justify-between">
                  <span>Side Bets Andar</span>
                  <span>Payout for winning side bet.</span>
                  <span>1 to 14</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
