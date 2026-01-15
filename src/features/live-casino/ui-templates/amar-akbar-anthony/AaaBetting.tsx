import { Lock, Info, X, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ================= TYPES ================= */

interface AaaBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  resultHistory?: Array<{
    mid?: string | number;
    win?: "Amar" | "Akbar" | "Anthony" | string | number;
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
  const num = Number(val);
  if (!num || isNaN(num)) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* ================= COMPONENT ================= */

export const AaaBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  resultHistory = [],
  tableId,
}: AaaBettingProps) => {
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
          py-4 px-2 rounded-md transition-all
          bg-gradient-to-b from-blue-500 to-blue-700 text-white
          ${
            suspended
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-blue-600 hover:to-blue-800 cursor-pointer"
          }
        `}
      >
        <div className="text-xs font-semibold mb-1">{odds}</div>
        <div className="text-sm font-bold flex items-center gap-1">
          {icon}
          {label}
        </div>
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded">
            <Lock size={16} />
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
          transition-all p-1 min-h-[45px]
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
        <h3 className="text-sm font-semibold">Amar Akbar Anthony</h3>
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
      <div className="border rounded-lg p-2 mb-4">
        <div className="text-center text-sm font-bold mb-2 text-gray-700">12</div>
        <div 
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
        >
          {cards.map((card, idx) => (
            <CardCell key={card} bet={cardBets[idx]} card={card} />
          ))}
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      {last10.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs mb-2 text-gray-600">Last 10 Results</p>
          <div className="flex gap-1 flex-wrap">
            {last10.map((r, i) => {
              // Handle different win formats: "Amar"/"Akbar"/"Anthony", "A"/"B"/"C", etc.
              const winValue = r.win?.toString() || r.winnerId?.toString() || "";
              const winValueLower = winValue.toLowerCase();
              
              const isAmar = 
                winValue === "Amar" || 
                winValue === "A" ||
                winValue === "1" ||
                winValueLower === "amar" ||
                (r.winnerId && r.winnerId.toString() === "1");
              
              const isAkbar = 
                winValue === "Akbar" || 
                winValue === "B" ||
                winValue === "2" ||
                winValueLower === "akbar" ||
                (r.winnerId && r.winnerId.toString() === "2");
              
              const isAnthony = 
                winValue === "Anthony" || 
                winValue === "C" ||
                winValue === "3" ||
                winValueLower === "anthony" ||
                (r.winnerId && r.winnerId.toString() === "3");
              
              // Display "A" for Amar, "B" for Akbar, "C" for Anthony
              let winner = "B";
              let bgColor = "bg-blue-500 text-white border-blue-600";
              
              if (isAmar) {
                winner = "A";
                bgColor = "bg-green-500 text-white border-green-600";
              } else if (isAkbar) {
                winner = "B";
                bgColor = "bg-blue-500 text-white border-blue-600";
              } else if (isAnthony) {
                winner = "C";
                bgColor = "bg-purple-500 text-white border-purple-600";
              }
              
              return (
                <Button
                  key={r.mid || r.round || r.round_id || i}
                  size="sm"
                  variant="outline"
                  className={`w-9 h-9 p-0 font-bold ${bgColor}`}
                  onClick={() => handleResultClick(r)}
                >
                  {winner}
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

      {/* ================= DETAIL RESULT DIALOG ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 [&>button]:hidden bg-white rounded-lg border-0 shadow-xl">
          {/* Blue Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between relative rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">
              Amar Akbar Anthony Result
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
              <div className="text-center py-8 text-red-600">
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

                  // Parse card - format: "5SS" (single card for AAA)
                  const cardString = t1Data.card || '';
                  const card = parseCard(cardString.split(',')[0]?.trim() || cardString.trim());

                  // Parse winner
                  const winner = t1Data.winnat || t1Data.win || t1Data.rdesc || "";
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isAmarWinner = 
                    winnerStr.includes("amar") || 
                    winnerStr === "a" || 
                    winnerStr === "1" ||
                    winner === "Amar" ||
                    winner === "A" ||
                    winner === 1 ||
                    winner === "1";
                  const isAkbarWinner = 
                    winnerStr.includes("akbar") || 
                    winnerStr === "b" || 
                    winnerStr === "2" ||
                    winner === "Akbar" ||
                    winner === "B" ||
                    winner === 2 ||
                    winner === "2";
                  const isAnthonyWinner = 
                    winnerStr.includes("anthony") || 
                    winnerStr === "c" || 
                    winnerStr === "3" ||
                    winner === "Anthony" ||
                    winner === "C" ||
                    winner === 3 ||
                    winner === "3";

                  // Parse rdesc - format: "Amar#Odd#Black#Under 7#5"
                  const rdesc = t1Data.rdesc || "";
                  const rdescParts = rdesc ? rdesc.split('#').filter(Boolean) : [];

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

                      {/* Card Display */}
                      <div className="flex justify-center items-center py-6">
                        {card ? (
                          <div className="relative">
                            <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded-lg bg-white flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                              <span className={`text-xl sm:text-2xl font-bold ${card.isRed ? "text-red-600" : "text-black"}`}>
                                {card.rank}
                              </span>
                              <span className={`text-3xl sm:text-4xl ${card.isRed ? "text-red-600" : "text-black"}`}>
                                {card.suit}
                              </span>
                            </div>
                            {(isAmarWinner || isAkbarWinner || isAnthonyWinner) && (
                              <div className="absolute -right-2 -top-2 rounded-full p-1 shadow-lg bg-green-500">
                                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-yellow-400 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                            No card
                          </div>
                        )}
                      </div>

                      {/* Winner Information Box */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4 sm:p-5 shadow-sm">
                        <div className="space-y-2">
                          <div className="text-center">
                            <span className="font-bold text-gray-900 text-lg sm:text-xl">
                              Winner: {isAmarWinner ? "Amar" : isAkbarWinner ? "Akbar" : isAnthonyWinner ? "Anthony" : "N/A"}
                            </span>
                          </div>
                          {rdesc && (
                            <div className="text-center text-gray-700 text-sm sm:text-base mt-2">
                              {rdesc}
                            </div>
                          )}
                          {/* Winning Categories from rdesc */}
                          {rdescParts.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mt-3">
                              {rdescParts.map((part, idx) => {
                                const partTrimmed = part.trim();
                                // Skip the winner name (first part) as it's already shown
                                if (idx === 0) return null;
                                return (
                                  <span
                                    key={idx}
                                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold"
                                  >
                                    {partTrimmed}
                                  </span>
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

      {/* ================= RULES ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Amar Akbar Anthony Rules</DialogTitle>
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
    </>
  );
};
