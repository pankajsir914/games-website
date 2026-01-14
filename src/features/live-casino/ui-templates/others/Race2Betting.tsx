// src/features/live-casino/ui-templates/others/Race2Betting.tsx

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

interface Race2BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
  resultHistory?: any[];
  currentResult?: any;
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

export const Race2Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
  resultHistory = [],
  currentResult,
  tableId,
}: Race2BettingProps) => {
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

  const playerA = find(actualBetTypes, "Player A");
  const playerB = find(actualBetTypes, "Player B");
  const playerC = find(actualBetTypes, "Player C");
  const playerD = find(actualBetTypes, "Player D");

  const players = [
    { bet: playerA, label: "Player A" },
    { bet: playerB, label: "Player B" },
    { bet: playerC, label: "Player C" },
    { bet: playerD, label: "Player D" },
  ];

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    await onPlaceBet({
      sid: selectedBet.sid,
      odds: getOdds(selectedBet, selectedSide),
      nat: selectedBet.nat,
      amount: parseFloat(amount),
      side: selectedSide,
    });

    setBetModalOpen(false);
    setSelectedBet(null);
    setAmount("100");
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
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : side === "back"
              ? "bg-sky-400 text-white hover:bg-sky-500"
              : "bg-pink-300 text-gray-900 hover:bg-pink-400"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : formattedOdds}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Race to 2nd</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= PLAYERS GRID ================= */}
      <div className="border">
        {/* Header Row */}
        <div className="grid grid-cols-4 text-sm font-semibold border-b">
          {players.map((player) => (
            <div
              key={player.label}
              className="h-10 flex items-center justify-center border-r last:border-r-0"
            >
              {player.label}
            </div>
          ))}
        </div>

        {/* Back Odds Row */}
        <div className="grid grid-cols-4 border-b">
          {players.map((player, idx) => (
            <div
              key={`back-${player.label}`}
              className="border-r last:border-r-0"
            >
              <OddsCell bet={player.bet} side="back" />
            </div>
          ))}
        </div>

        {/* Lay Odds Row */}
        <div className="grid grid-cols-4">
          {players.map((player, idx) => (
            <div
              key={`lay-${player.label}`}
              className="border-r last:border-r-0"
            >
              <OddsCell bet={player.bet} side="lay" />
            </div>
          ))}
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
              
              // Map winner to A, B, C, D
              let letter = "D";
              let bgColor = "bg-purple-500";
              
              // Check for Player A
              if (winnerStr.includes("player a") || winnerStr.includes("a") || winner === "A" || winner === 1 || winner === "1") {
                letter = "A";
                bgColor = "bg-blue-500";
              } 
              // Check for Player B
              else if (winnerStr.includes("player b") || winnerStr.includes("b") || winner === "B" || winner === 2 || winner === "2") {
                letter = "B";
                bgColor = "bg-green-500";
              } 
              // Check for Player C
              else if (winnerStr.includes("player c") || winnerStr.includes("c") || winner === "C" || winner === 3 || winner === "3") {
                letter = "C";
                bgColor = "bg-yellow-500";
              } 
              // Check for Player D
              else if (winnerStr.includes("player d") || winnerStr.includes("d") || winner === "D" || winner === 4 || winner === "4") {
                letter = "D";
                bgColor = "bg-purple-500";
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
                  bgColor = "bg-yellow-500";
                } else if (firstChar === "D" || firstChar === "4") {
                  letter = "D";
                  bgColor = "bg-purple-500";
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
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSide))}
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
                  {selectedSide === "back" ? "Potential win" : "Liability"}: ₹
                  {(() => {
                    const oddsValue = Number(getOdds(selectedBet, selectedSide));
                    const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    if (selectedSide === "back") {
                      // Total return for back bet
                      return (parseFloat(amount) * normalizedOdds).toFixed(2);
                    } else {
                      // Liability for lay bet = (odds - 1) * amount
                      return (parseFloat(amount) * (normalizedOdds - 1)).toFixed(2);
                    }
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
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Race to 2nd Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              Race to 2nd is a new kind of game and the brilliance of this game will test your nerve.
            </p>
            <p>
              In this unique game the player who has the 2nd highest ranking card will be the winner (and not the highest ranking card).
            </p>
            <p>
              Race to 2nd is played with a regular single deck of 52 cards.
            </p>
            <p>
              This game is played among 4 players: <b>Player A, Player B, Player C and Player D</b>
            </p>
            <p>
              All the 4 players will be dealt one card each.
            </p>
            <p>
              The objective of the game is to guess which player will have the 2nd highest ranking card and therefor win.
            </p>
            
            <p className="font-semibold mt-2">RANKINGS OF CARDS FROM HIGHEST TO LOWEST:</p>
            <p className="font-semibold">
              A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2
            </p>
            <p className="text-xs text-gray-600">
              Here Ace of spades is the highest ranking card and 2 of Diamonds is the lowest ranking card.
            </p>

            <p className="font-semibold mt-2">Suit Sequence:</p>
            <p className="font-semibold">
              {'}'} SPADES 1st (First)<br />
              {'{'} HEARTS 2nd (Second)<br />
              ] CLUBS 3rd (Third)<br />
              [ DIAMONDS 4th (Fourth)
            </p>

            <p className="font-semibold mt-2">Example 1:</p>
            <p>
              If all the players have following hands:<br />
              Player A - 5 of Hearts<br />
              Player B - Ace of Hearts<br />
              Player C - 2 of Clubs<br />
              Player D - King of Clubs
            </p>
            <p>
              Here all four Players have different hands the ranking of the cards will be as follows:<br />
              Highest Ranking card (1st) will be Ace of Hearts.<br />
              Second Highest Ranking card (2nd) will be King of Clubs.<br />
              Third Highest Ranking card (3rd) will be 5 of Hearts.<br />
              Fourth Highest Ranking card (4th) will be 2 of Clubs.
            </p>
            <p>
              Here the second Highest Ranking card is King of Clubs So Player D will be the winner.
            </p>

            <p className="font-semibold mt-2">Example 2:</p>
            <p>
              If all the players have following hands:<br />
              Player A - 3 of Spades<br />
              Player B - 3 of Hearts<br />
              Player C - 3 of Clubs<br />
              Player D - 3 of Diamonds
            </p>
            <p>
              As here all four players have same hands but of different suits the ranking of the cards will be as follows:<br />
              Highest Ranking card (1st) will be 3 of Spades.<br />
              Second Highest Ranking card (2nd) will be 3 of Hearts.<br />
              Third Highest Ranking card (3rd) will be 3 of Clubs.<br />
              Fourth Highest Ranking card (4th) will be 3 of Diamonds.
            </p>
            <p>
              Here, the second highest ranking card is 3 of Hearts so player B will be the winner.
            </p>

            <p className="font-semibold mt-2">
              You will have betting options of Back and Lay on every card.
            </p>
            <p>
              In this game there will be no Tie.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Race to 2nd Result</h2>
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
                  // For Race2, cards are in order: Player A, Player B, Player C, Player D
                  const playerACard = allCards[0] || null;
                  const playerBCard = allCards[1] || null;
                  const playerCCard = allCards[2] || null;
                  const playerDCard = allCards[3] || null;

                  // Parse winner
                  const winner = t1Data.winnat || t1Data.win || "";
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isPlayerAWinner = 
                    winnerStr.includes("player a") || 
                    winnerStr === "a" || 
                    winnerStr === "1" ||
                    winner === "A" ||
                    winner === 1 ||
                    winner === "1";
                  const isPlayerBWinner = 
                    winnerStr.includes("player b") || 
                    winnerStr === "b" || 
                    winnerStr === "2" ||
                    winner === "B" ||
                    winner === 2 ||
                    winner === "2";
                  const isPlayerCWinner = 
                    winnerStr.includes("player c") || 
                    winnerStr === "c" || 
                    winnerStr === "3" ||
                    winner === "C" ||
                    winner === 3 ||
                    winner === "3";
                  const isPlayerDWinner = 
                    winnerStr.includes("player d") || 
                    winnerStr === "d" || 
                    winnerStr === "4" ||
                    winner === "D" ||
                    winner === 4 ||
                    winner === "4";

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

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Player A
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerAWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {playerACard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${playerACard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{playerACard.rank}</span>
                                  <span className={`text-lg ${playerACard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{playerACard.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">No card</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Player B
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerBWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {playerBCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${playerBCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{playerBCard.rank}</span>
                                  <span className={`text-lg ${playerBCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{playerBCard.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">No card</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Player C
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerCWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {playerCCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${playerCCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{playerCCard.rank}</span>
                                  <span className={`text-lg ${playerCCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{playerCCard.suit}</span>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">No card</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                              Player D
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerDWinner && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {playerDCard ? (
                                <div className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md">
                                  <span className={`text-sm font-bold ${playerDCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{playerDCard.rank}</span>
                                  <span className={`text-lg ${playerDCard.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{playerDCard.suit}</span>
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
                              {isPlayerAWinner ? "Player A" : isPlayerBWinner ? "Player B" : isPlayerCWinner ? "Player C" : isPlayerDWinner ? "Player D" : winner || "N/A"}
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
