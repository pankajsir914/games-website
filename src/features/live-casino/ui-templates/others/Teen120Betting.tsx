// src/features/live-casino/ui-templates/others/Teen120Betting.tsx

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

interface Teen120BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
  resultHistory?: Array<{
    mid: string | number;
    win?: string;
    winner?: string;
    result?: string;
  }>;
  onResultClick?: (result: any) => void;
  tableId?: string;
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

/* ================= COMPONENT ================= */

export const Teen120Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
  resultHistory = [],
  onResultClick,
  tableId,
}: Teen120BettingProps) => {
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
    if (Array.isArray(resultHistory) && resultHistory.length > 0) {
      return resultHistory.slice(0, 10);
    }
    return [];
  }, [resultHistory]);

  // Extract bets from multiple possible sources (similar to KBC/Dum10)
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

  const playerBet = find(actualBetTypes, "Player");
  const dealerBet = find(actualBetTypes, "Dealer");
  const tieBet = find(actualBetTypes, "Tie");
  const pairBet = find(actualBetTypes, "Pair");

  const bettingOptions = [
    { bet: playerBet, label: "Player" },
    { bet: tieBet, label: "Tie" },
    { bet: dealerBet, label: "Dealer" },
    { bet: pairBet, label: "Pair" },
  ];

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
    const finalTableId = tableId || odds?.tableId || odds?.rawData?.gtype || "teen120";
    
    if (!mid) {
      console.error("Missing mid:", { mid });
      return;
    }
    
    setDetailLoading(true);
    setDetailData(null);
    
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
    } else {
      setSelectedResult(result);
      setDetailDialogOpen(true);
      setDetailData(null);
    }
  };

  // Parse 1 CARD 20-20 card format (similar to Teen3 but for single cards)
  const parseCard = (cardString: string) => {
    if (!cardString) return null;
    
    // Card format: "KSS", "8SS", "QHH", "10DD", "ACC" etc.
    // Format: Rank + Suit + Suit (e.g., KSS = King of Spades, 10DD = 10 of Diamonds)
    let rank = '';
    let suit = '';
    
    if (cardString.length >= 3) {
      // Check if it starts with "10" (two digits)
      if (cardString.length >= 4 && cardString.startsWith('10')) {
        rank = '10';
        suit = cardString.charAt(cardString.length - 1); // Last character is the suit
      } else {
        // Single character rank (K, Q, J, A, 1-9)
        rank = cardString.substring(0, cardString.length - 2); // Everything except last 2 chars
        suit = cardString.charAt(cardString.length - 1); // Last character is the suit
      }
    }
    
    // Map suit codes to symbols
    const suitMap: { [key: string]: string } = {
      'S': '♠', // Spades
      'H': '♥', // Hearts
      'C': '♣', // Clubs
      'D': '♦', // Diamonds
    };
    
    // Map rank codes
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

  const BettingOption = ({ bet, label }: { bet: any; label: string }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <div className="w-full flex flex-col items-center space-y-1">
        {/* Odds Display */}
        <div className="text-sm font-semibold text-gray-900">
          {formattedOdds}
        </div>
        
        {/* Betting Button */}
        <button
          disabled={suspended || loading}
          onClick={() => openBetModal(bet)}
          className={`
            w-full py-3 px-4 rounded
            bg-gradient-to-r from-sky-600 to-slate-700
            text-white font-bold text-sm
            transition-all shadow-sm
            ${
              suspended
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-sky-700 hover:to-slate-800 hover:shadow-md"
            }
          `}
        >
          {suspended ? <Lock size={16} /> : label}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">1 CARD 20-20</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= BETTING OPTIONS ================= */}
      <div className="grid grid-cols-4 gap-2 relative mb-2">
        {bettingOptions.map((option, index) => (
          <div
            key={option.label}
            className={`relative ${index === 2 ? "border-l-2 border-gray-500 pl-2 ml-1" : ""}`}
          >
            <BettingOption
              bet={option.bet}
              label={option.label}
            />
          </div>
        ))}
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10Results.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              const winner = result.win || result.winner || result.result || "";
              const winnerStr = String(winner).toLowerCase().trim();
              
              // Determine winner: Player, Dealer, or Tie
              // Default to "P" (Player) if unknown, or "D" (Dealer) based on index/pattern
              let letter = "P"; // Default to Player
              let bgColor = "bg-blue-600";
              let textColor = "text-white";
              
              if (winnerStr.includes("player") || winnerStr === "p" || winnerStr === "1") {
                letter = "P";
                bgColor = "bg-blue-600";
                textColor = "text-white";
              } else if (winnerStr.includes("dealer") || winnerStr === "d" || winnerStr === "2") {
                letter = "D";
                bgColor = "bg-red-600";
                textColor = "text-white";
              } else if (winnerStr.includes("tie") || winnerStr === "t") {
                letter = "T";
                bgColor = "bg-yellow-600";
                textColor = "text-white";
              } else {
                // If unknown, try to infer from other data or default to Player
                // Check if result has any indicator for dealer
                const resultStr = JSON.stringify(result).toLowerCase();
                if (resultStr.includes("dealer") || resultStr.includes("d")) {
                  letter = "D";
                  bgColor = "bg-red-600";
                } else {
                  // Default to Player
                  letter = "P";
                  bgColor = "bg-blue-600";
                }
              }

              return (
                <button
                  key={result.mid || result.round_id || result.round || index}
                  onClick={() => {
                    handleResultClick(result);
                    onResultClick?.(result);
                  }}
                  className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full ${bgColor} ${textColor} font-bold text-xs sm:text-sm flex items-center justify-center active:opacity-80 cursor-pointer touch-none`}
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
                  Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet))}
                  </span>
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
                  {(() => {
                    const oddsValue = Number(getOdds(selectedBet));
                    const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    return (parseFloat(amount) * normalizedOdds).toFixed(2);
                  })()}
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
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle>1 CARD 20-20 Rules</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                1 CARD 20-20 is a very easy and fast paced game.
              </p>
              <p>
                This game is played with 8 decks of regular 52 cards between the player and dealer.
              </p>
              <p>
                Both, the player and dealer will be dealt one card each.
              </p>
              <p>
                The objective of the game is to guess whether the player or dealer will draw a card of the higher value and will therefore win.
              </p>
              <p>
                You can place your bets on the player as well as dealer.
              </p>
              
              <p className="font-semibold mt-3">Ranking of cards : from lowest to highest</p>
              <p className="font-mono text-xs bg-gray-900 dark:bg-gray-800 p-2 rounded">
                2 , 3 , 4 , 5 , 6 , 7 , 8 , 9 , 10 , J , Q , K , A
              </p>

              <p className="font-semibold mt-3">
                If the player and dealer both have the same hands with the same ranking cards but of different suits then the winner will be decided according to the order of the suits
              </p>
              <p className="font-semibold">Order of suits : from highest to lowest</p>
              <p className="font-mono text-xs bg-gray-900 dark:bg-gray-800 p-2 rounded">
                Spades , Hearts , Clubs , Diamonds
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                eg: Clubs ACE vs Diamonds ACE - Here ACE of Clubs wins.
              </p>

              <p className="font-semibold mt-3">
                If both, the player and dealer hands have the same ranking cards which are of the same suit, then it will be a TIE.
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                eg: Spades ACE vs Spades ACE
              </p>
              <p className="font-semibold text-red-600 dark:text-red-400">
                In case of a TIE, bets placed on both the player and dealer will lose the bet amount.
              </p>

              <div className="border-t pt-3 mt-3">
                <p className="font-semibold text-lg mb-2">Side Bets</p>
                <p className="mb-2">
                  <b>Pair :</b> Here you can bet that both, the player and dealer will have the same ranking cards irrespective of suits
                </p>
                <p className="mb-2">
                  <b>Tie :</b> Here you can bet that the game will be a Tie.
                </p>
                <p className="font-semibold text-yellow-600 dark:text-yellow-400 mt-2">
                  Note : In case of a Tie between the player and dealer, bets placed on Side bets will be considered valid.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-white m-0">1 CARD 20-20 Result</h2>
            <button 
              onClick={() => setDetailDialogOpen(false)} 
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
                  // Extract t1 data from the response
                  const t1Data = detailData?.data?.t1 || detailData?.t1 || null;
                  
                  if (!t1Data) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No detailed result data available
                      </div>
                    );
                  }

                  // Parse cards - format: "KSS,8SS" or "ACC,5SS" (Player, Dealer)
                  const cardString = t1Data.card || '';
                  const cards = cardString.split(',').map(c => c.trim()).filter(Boolean);
                  const playerCard = cards.length > 0 ? parseCard(cards[0]) : null;
                  const dealerCard = cards.length > 1 ? parseCard(cards[1]) : null;
                  
                  // Determine winner
                  const winner = t1Data.winnat || t1Data.win || t1Data.rdesc || '';
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isPlayerWinner = winnerStr.includes("player") || winnerStr === "p";
                  const isDealerWinner = winnerStr.includes("dealer") || winnerStr === "d";
                  const isTie = winnerStr.includes("tie") || winnerStr === "t";
                  
                  // Check for Pair
                  const pairInfo = t1Data.rdesc || '';
                  const hasPair = pairInfo.toLowerCase().includes("pair yes") || pairInfo.toLowerCase().includes("pair: yes");

                  return (
                    <div className="space-y-4">
                      {/* Round Information */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm border-b pb-3">
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Round Id: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono">{t1Data.rid || selectedResult?.mid || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Match Time: </span>
                          <span className="text-gray-900 dark:text-gray-100">{t1Data.mtime || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Player vs Dealer Cards - Horizontal Layout */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Player Card */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Player</h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerWinner && (
                              <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            )}
                            {playerCard ? (
                              <div className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                <span className={`text-sm font-bold ${playerCard.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                  {playerCard.rank}
                                </span>
                                <span className={`text-lg ${playerCard.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                  {playerCard.suit}
                                </span>
                              </div>
                            ) : (
                              <div className="text-gray-500 text-xs">No card</div>
                            )}
                          </div>
                        </div>

                        {/* Dealer Card */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Dealer</h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isDealerWinner && (
                              <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            )}
                            {dealerCard ? (
                              <div className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                <span className={`text-sm font-bold ${dealerCard.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                  {dealerCard.rank}
                                </span>
                                <span className={`text-lg ${dealerCard.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                  {dealerCard.suit}
                                </span>
                              </div>
                            ) : (
                              <div className="text-gray-500 text-xs">No card</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Winner and Pair Declaration - At Bottom */}
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center shadow-md space-y-1">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          Winner: <span className="text-green-600 dark:text-green-400">
                            {isPlayerWinner ? "Player" : isDealerWinner ? "Dealer" : isTie ? "Tie" : winner || "N/A"}
                          </span>
                        </p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Pair: <span className={hasPair ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                            {hasPair ? "Yes" : "No"}
                          </span>
                        </p>
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
