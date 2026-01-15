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

interface Aaa2BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  resultHistory?: any[];
  currentResult?: any;
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
  const num = Number(val);
  if (!num || isNaN(num)) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* ================= COMPONENT ================= */

export const Aaa2Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  resultHistory = [],
  currentResult,
  tableId,
}: Aaa2BettingProps) => {
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
    
    if (results.length === 0 && Array.isArray(currentResult) && currentResult.length > 0) {
      results = currentResult;
    }
    
    const finalResults = Array.isArray(results) ? results.slice(0, 10) : [];
    return finalResults;
  }, [resultHistory, currentResult]);

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

  // Main bet header with back/lay boxes
  const MainBetHeader = ({ bet, label }: { bet: any; label: string }) => {
    const suspended = isSuspended(bet);
    const backOdds = formatOdds(getOdds(bet, "back"));
    const layOdds = formatOdds(getOdds(bet, "lay"));
    
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs font-semibold text-gray-700">{label}</div>
        <div className="flex gap-1 w-full">
          <button
            disabled={suspended || loading || backOdds === "0.00"}
            onClick={() => openBetModal(bet, "back")}
            className={`
              flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all
              ${
                suspended || backOdds === "0.00"
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-200 hover:bg-blue-300 text-blue-900 cursor-pointer"
              }
            `}
          >
            {backOdds}
          </button>
          <button
            disabled={suspended || loading || layOdds === "0.00"}
            onClick={() => openBetModal(bet, "lay")}
            className={`
              flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all
              ${
                suspended || layOdds === "0.00"
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-pink-200 hover:bg-pink-300 text-pink-900 cursor-pointer"
              }
            `}
          >
            {layOdds}
          </button>
        </div>
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock size={12} />
          </div>
        )}
      </div>
    );
  };

  // Fancy bet button with gradient
  const FancyBetButton = ({ bet, label, icon }: { bet: any; label: string; icon?: React.ReactNode }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative w-full flex flex-col items-center justify-center
          py-[9.5px] px-[4.8px] rounded-md transition-all
          bg-gradient-to-b from-blue-500 to-blue-700 text-white
          ${
            suspended
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-blue-600 hover:to-blue-800 cursor-pointer"
          }
        `}
      >
        <div className="text-[8.5px] font-semibold mb-0.5">{odds}</div>
        <div className="text-[10px] font-bold flex items-center gap-0.5">
          {icon}
          {label}
        </div>
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded">
            <Lock size={9} />
          </div>
        )}
      </button>
    );
  };

  // Card Cell with yellow border and suit icons
  const CardCell = ({ bet, card }: { bet: any; card: string }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative border-2 border-yellow-400 bg-white rounded-md
          flex flex-col items-center justify-center w-full
          transition-all px-[5px] py-1 min-h-[45px]
          ${
            suspended
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-yellow-50 cursor-pointer hover:border-yellow-500"
          }
        `}
      >
        <div className="font-bold text-gray-900 mb-0.5 text-xs">{card}</div>
        <div className="grid grid-cols-2 gap-0.5 text-[10px]">
          <span className="text-black">♠</span>
          <span className="text-red-500">♥</span>
          <span className="text-black">♣</span>
          <span className="text-red-500">♦</span>
        </div>
        {odds !== "0.00" && (
          <div className="text-gray-600 mt-0.5 text-[8px]">{odds}</div>
        )}
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 rounded">
            <Lock size={10} />
          </div>
        )}
      </button>
    );
  };

  // Get bets
  const amarBet = find(betTypes, "Amar");
  const akbarBet = find(betTypes, "Akbar");
  const anthonyBet = find(betTypes, "Anthony");
  const evenBet = find(betTypes, "Even");
  const oddBet = find(betTypes, "Odd");
  const redBet = find(betTypes, "Red");
  const blackBet = find(betTypes, "Black");
  const under7Bet = find(betTypes, "Under 7");
  const over7Bet = find(betTypes, "Over 7");

  // Card bets - map Card A, Card 2, etc.
  const cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const cardBets = cards.map((card) => {
    // Try exact match first
    let bet = find(betTypes, `Card ${card}`);
    // If not found, try with space variations or just the card name
    if (!bet) {
      bet = betTypes.find((b: any) => {
        const nat = (b.nat || "").toLowerCase();
        return nat === `card ${card.toLowerCase()}` || 
               nat === `card${card.toLowerCase()}` ||
               nat === card.toLowerCase();
      });
    }
    return bet;
  });

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">Amar Akbar Anthony 2</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= MAIN BETS (Amar, Akbar, Anthony) ================= */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <MainBetHeader bet={amarBet} label="A. Amar" />
        <MainBetHeader bet={akbarBet} label="B. Akbar" />
        <MainBetHeader bet={anthonyBet} label="C. Anthony" />
      </div>

      {/* ================= FANCY BETS SECTION ================= */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Column A: Even/Odd */}
        <div className="flex flex-col gap-2">
          <FancyBetButton bet={evenBet} label="Even" />
          <FancyBetButton bet={oddBet} label="Odd" />
        </div>

        {/* Column B: Red/Black */}
        <div className="flex flex-col gap-2">
          <FancyBetButton 
            bet={redBet} 
            label="Red" 
            icon={
              <span className="flex gap-0.5">
                <span className="text-red-500">♥</span>
                <span className="text-red-500">♦</span>
              </span>
            }
          />
          <FancyBetButton 
            bet={blackBet} 
            label="Black"
            icon={
              <span className="flex gap-0.5">
                <span className="text-black">♠</span>
                <span className="text-black">♣</span>
              </span>
            }
          />
        </div>

        {/* Column C: Under 7/Over 7 */}
        <div className="flex flex-col gap-2">
          <FancyBetButton bet={under7Bet} label="Under 7" />
          <FancyBetButton bet={over7Bet} label="Over 7" />
        </div>
      </div>

      {/* ================= CARDS SECTION ================= */}
      <div className="border rounded-lg p-2">
        <div className="text-center text-sm font-bold mb-2 text-gray-700">12</div>
        {/* Mobile/Tablet: Two rows, centered */}
        <div className="flex flex-col items-center gap-1 lg:hidden">
          {/* First Row - 7 cards */}
          <div className="flex justify-center gap-1">
            {cards.slice(0, 7).map((card, idx) => (
              <CardCell key={card} bet={cardBets[idx]} card={card} />
            ))}
          </div>
          {/* Second Row - 6 cards */}
          <div className="flex justify-center gap-1">
            {cards.slice(7, 13).map((card, idx) => (
              <CardCell key={card} bet={cardBets[idx + 7]} card={card} />
            ))}
          </div>
        </div>
        {/* Desktop: Single row */}
        <div className="hidden lg:flex lg:justify-center">
          <div className="grid grid-cols-13 gap-1" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
            {cards.map((card, idx) => (
              <CardCell key={card} bet={cardBets[idx]} card={card} />
            ))}
          </div>
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2 mt-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10Results.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              const winner = result.win || result.winner || result.result || result.nat || "";
              const winnerStr = String(winner).toLowerCase().trim();
              
              // Map winner to A (Amar), B (Akbar), C (Anthony)
              let letter = "C";
              let bgColor = "bg-orange-500";
              
              // Check for Amar (A)
              if (winnerStr.includes("amar") || winnerStr === "a" || winner === "A" || winner === 1 || winner === "1") {
                letter = "A";
                bgColor = "bg-blue-500";
              } 
              // Check for Akbar (B)
              else if (winnerStr.includes("akbar") || winnerStr === "b" || winner === "B" || winner === 2 || winner === "2") {
                letter = "B";
                bgColor = "bg-green-500";
              } 
              // Check for Anthony (C)
              else if (winnerStr.includes("anthony") || winnerStr === "c" || winner === "C" || winner === 3 || winner === "3") {
                letter = "C";
                bgColor = "bg-orange-500";
              } else {
                // Try to extract first letter
                const firstChar = String(winner).charAt(0).toUpperCase();
                if (firstChar === "A" || firstChar === "1") {
                  letter = "A";
                  bgColor = "bg-blue-500";
                } else if (firstChar === "B" || firstChar === "2") {
                  letter = "B";
                  bgColor = "bg-green-500";
                } else if (firstChar === "C" || firstChar === "3") {
                  letter = "C";
                  bgColor = "bg-orange-500";
                }
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
                {quickAmounts.map((a) => (
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

      {/* ================= RULES ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Amar Akbar Anthony 2 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="font-semibold mb-1">Main Bets:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>If the card is ACE, 2, 3, 4, 5, or 6 → <strong>Amar</strong> Wins</li>
                <li>If the card is 7, 8, 9 or 10 → <strong>Akbar</strong> Wins</li>
                <li>If the card is J, Q or K → <strong>Anthony</strong> Wins</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Even (Payout 2.12):</p>
              <ul className="list-disc pl-4">
                <li>If the card is 2, 4, 6, 8, 10, Q</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Odd (Payout 1.83):</p>
              <ul className="list-disc pl-4">
                <li>If the card is A, 3, 5, 7, 9, J, K</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Red (Payout 1.97):</p>
              <ul className="list-disc pl-4">
                <li>If the card color is DIAMOND or HEART</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Black (Payout 1.97):</p>
              <ul className="list-disc pl-4">
                <li>If the card color is CLUB or SPADE</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Under 7 (Payout 2.0):</p>
              <ul className="list-disc pl-4">
                <li>If the card is A, 2, 3, 4, 5, 6</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Over 7 (Payout 2.0):</p>
              <ul className="list-disc pl-4">
                <li>If the card is 8, 9, 10, J, Q, K</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-2 rounded">
              <p className="font-semibold text-yellow-800">Note:</p>
              <p className="text-yellow-700">
                If the card is 7, bets on Under 7 and Over 7 will lose 50% of the bet amount.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">Cards (Payout 12.0):</p>
              <ul className="list-disc pl-4">
                <li>A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Amar Akbar Anthony 2 Result</h2>
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
                      };
                    }).filter(Boolean);
                  };

                  const cardString = t1Data.card || "";
                  const allCards = parseCards(cardString);
                  // For AAA2, there's typically one card result
                  const resultCard = allCards[0] || null;

                  // Parse winner
                  const winner = t1Data.winnat || t1Data.win || "";
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isAmarWinner = 
                    winnerStr.includes("amar") || 
                    winnerStr === "a" || 
                    winner === "A" ||
                    winner === 1 ||
                    winner === "1";
                  const isAkbarWinner = 
                    winnerStr.includes("akbar") || 
                    winnerStr === "b" || 
                    winner === "B" ||
                    winner === 2 ||
                    winner === "2";
                  const isAnthonyWinner = 
                    winnerStr.includes("anthony") || 
                    winnerStr === "c" || 
                    winner === "C" ||
                    winner === 3 ||
                    winner === "3";

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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Amar
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isAmarWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {isAmarWinner && resultCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${resultCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{resultCard.rank}</span>
                                  <span className={`text-lg ${resultCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{resultCard.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">-</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Akbar
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isAkbarWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {isAkbarWinner && resultCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${resultCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{resultCard.rank}</span>
                                  <span className={`text-lg ${resultCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{resultCard.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">-</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Anthony
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isAnthonyWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {isAnthonyWinner && resultCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${resultCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{resultCard.rank}</span>
                                  <span className={`text-lg ${resultCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{resultCard.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">-</div>
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
                              {isAmarWinner ? "Amar" : isAkbarWinner ? "Akbar" : isAnthonyWinner ? "Anthony" : winner || "N/A"}
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
