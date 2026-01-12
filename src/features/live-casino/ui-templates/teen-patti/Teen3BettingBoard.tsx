import { useMemo, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, X, Loader2, Trophy, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Teen3BettingBoardProps {
  bets: any[];
  locked?: boolean;
  min?: number;
  max?: number;
  onPlaceBet: (betData: {
    betType: string;
    amount: number;
    odds: number;
    roundId?: string;
    sid?: string | number;
    side?: "back" | "lay";
  }) => Promise<void>;
  odds?: any;
  resultHistory?: Array<{
    mid: string | number;
    win: "Player A" | "Player B" | "A" | "B" | "1" | "2" | 1 | 2;
    winnerId?: string;
  }>;
  onResultClick?: (result: any) => void;
  loading?: boolean;
  tableId?: string;
}

const QUICK_CHIPS = [100, 500, 1000, 5000];

// Format odds value
const formatOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const isSuspended = (bet: any) =>
  !bet || bet?.gstatus === "SUSPENDED" || bet?.status === "suspended";

// Find bet by nat, type, or sid
const findBet = (bets: any[], searchTerm: string | number) => {
  if (!bets || bets.length === 0) return null;
  
  // If searchTerm is a number, search by sid
  if (typeof searchTerm === "number") {
    return bets.find((b: any) => b.sid === searchTerm);
  }
  
  const normalized = String(searchTerm).toLowerCase().trim();
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase().trim();
    const betSid = String(b.sid || "").toLowerCase();
    return (
      betName === normalized ||
      betName.includes(normalized) ||
      betName.includes(`player ${normalized}`) ||
      betName.includes(`${normalized} player`) ||
      betSid === normalized
    );
  });
};

// Get odds from multiple possible fields
const getOdds = (bet: any) => {
  if (!bet) return 0;
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? bet.l ?? 0;
};

// HTML Sanitizer
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

// Section title map
const sectionTitleMap: Record<string, string> = {
  main: "Game Rules",
  players: "Player Rules",
  banker: "Banker Rules",
  sidebets: "Side Bets",
  side: "Side Bets",
};

export const Teen3BettingBoard = ({
  bets = [],
  locked = false,
  min = 100,
  max = 200000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
  loading = false,
  tableId,
}: Teen3BettingBoardProps) => {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [amount, setAmount] = useState("100");
  
  // Detail result modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  
  // Rules modal state
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const hasFetchedRulesRef = useRef(false);

  // Extract bets from multiple sources (bets prop, odds.bets, odds.data.sub, odds.sub)
  const actualBets = useMemo(() => {
    // First try: bets prop
    if (Array.isArray(bets) && bets.length > 0) {
      return bets;
    }
    
    // Second try: odds?.bets
    if (odds?.bets && Array.isArray(odds.bets) && odds.bets.length > 0) {
      return odds.bets;
    }
    
    // Third try: odds?.data?.sub (API structure for teen3)
    if (odds?.data?.sub && Array.isArray(odds.data.sub) && odds.data.sub.length > 0) {
      return odds.data.sub.map((item: any) => ({
        nat: item.nat || item.type || "Unknown",
        type: item.type || item.nat || "Unknown",
        b: item.b || 0,
        l: item.l || 0,
        back: item.b || 0,
        lay: item.l || 0,
        gstatus: item.gstatus || "SUSPENDED",
        status: item.status || (item.gstatus === "OPEN" ? "active" : "suspended"),
        min: item.min || 100,
        max: item.max || 200000,
        sid: item.sid,
        mid: item.mid || odds?.data?.mid,
        subtype: item.subtype,
        etype: item.etype,
      }));
    }
    
    // Fourth try: odds?.sub
    if (odds?.sub && Array.isArray(odds.sub) && odds.sub.length > 0) {
      return odds.sub.map((item: any) => ({
        nat: item.nat || item.type || "Unknown",
        type: item.type || item.nat || "Unknown",
        b: item.b || 0,
        l: item.l || 0,
        back: item.b || 0,
        lay: item.l || 0,
        gstatus: item.gstatus || "SUSPENDED",
        status: item.status || (item.gstatus === "OPEN" ? "active" : "suspended"),
        min: item.min || 100,
        max: item.max || 200000,
        sid: item.sid,
        mid: item.mid || odds?.mid,
        subtype: item.subtype,
        etype: item.etype,
      }));
    }
    
    return bets || [];
  }, [bets, odds]);

  // Find Player A (sid:1) and Player B (sid:2) bets
  const playerA = findBet(actualBets, "player a") || findBet(actualBets, "a") || findBet(actualBets, 1);
  const playerB = findBet(actualBets, "player b") || findBet(actualBets, "b") || findBet(actualBets, 2);

  // Find other potential bets (Odd/Even, consecutive, etc.)
  const oddBet = findBet(actualBets, "odd");
  const evenBet = findBet(actualBets, "even");
  const consecutiveBet = findBet(actualBets, "consecutive") || findBet(actualBets, "con");

  // Get last 10 results - handle different data structures
  const last10Results = useMemo(() => {
    if (Array.isArray(resultHistory) && resultHistory.length > 0) {
      return resultHistory.slice(0, 10);
    }
    return [];
  }, [resultHistory]);

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = side === "back" 
      ? (bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? 0)
      : (bet.lay ?? bet.l ?? bet.l1 ?? 0);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet({ ...bet, side });
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0 || loading) return;

    const side = selectedBet?.side || "back";
    const oddsValue = side === "back"
      ? (selectedBet.back ?? selectedBet.b ?? selectedBet.b1 ?? selectedBet.odds ?? 0)
      : (selectedBet.lay ?? selectedBet.l ?? selectedBet.l1 ?? 0);
    
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
    
    // Extract roundId from bet data or odds
    const roundIdFromBet = selectedBet?.mid || selectedBet?.round_id || selectedBet?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds = raw?.mid || raw?.round_id || raw?.round || raw?.gmid || raw?.game_id ||
                           odds?.mid || odds?.round_id || odds?.round || odds?.gmid || odds?.game_id;
    const roundIdFromFirstBet = actualBets.length > 0 && (actualBets[0]?.mid || actualBets[0]?.round_id || actualBets[0]?.round);
    const finalRoundId = roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;

    const betType = selectedBet?.nat || selectedBet?.type || "Unknown";
    const betAmount = Math.min(Math.max(parseFloat(amount), min), max);

    await onPlaceBet({
      betType: betType,
      amount: betAmount,
      odds: finalOdds,
      roundId: finalRoundId,
      sid: selectedBet?.sid,
      side: side,
    });

    setBetModalOpen(false);
    setSelectedBet(null);
    setAmount("100");
  };

  // Fetch detail result
  const fetchDetailResult = async (mid: string | number) => {
    // Get tableId from props or extract from odds
    const finalTableId = tableId || odds?.tableId || odds?.rawData?.gtype || "teen3";
    
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
      // If no mid, still open modal with available data
      setSelectedResult(result);
      setDetailDialogOpen(true);
      setDetailData(null);
    }
  };

  // Fetch rules when modal opens
  useEffect(() => {
    if (rulesOpen) {
      const finalTableId = tableId || odds?.tableId || odds?.rawData?.gtype || "teen3";
      
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
    }
  }, [rulesOpen, tableId, odds]);

  // Parse Teen3 card format: "KSS,8SS,QHH,9CC,10DD,KDD"
  // Format: Rank + Suit + Suit (e.g., KSS = King of Spades, 10DD = 10 of Diamonds)
  const parseTeen3Cards = (cardString: string) => {
    if (!cardString) return [];
    
    const cards = cardString.split(',').map(card => card.trim()).filter(Boolean);
    
    return cards.map(card => {
      // Card format: Rank + Suit + Suit (e.g., KSS, 8SS, QHH, 10DD)
      // The last two characters are the same suit, so we take the last character
      let rank = '';
      let suit = '';
      
      if (card.length >= 3) {
        // Check if it starts with "10" (two digits)
        if (card.length >= 4 && card.startsWith('10')) {
          rank = '10';
          suit = card.charAt(card.length - 1); // Last character is the suit
        } else {
          // Single character rank (K, Q, J, A, 1-9)
          rank = card.substring(0, card.length - 2); // Everything except last 2 chars
          suit = card.charAt(card.length - 1); // Last character is the suit
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
        raw: card,
        rank: displayRank,
        suit: displaySuit,
        display: `${displayRank}${displaySuit}`,
        isRed: suit === 'H' || suit === 'D',
      };
    });
  };

  // Sanitize rules HTML
  const sanitizedRules = useMemo(() => {
    return rules.map((rule) => ({
      ...rule,
      safeHTML: sanitizeHTML(rule.rules || ""),
    }));
  }, [rules]);

  const Cell = ({ bet, side = "back" }: { bet: any; side?: "back" | "lay" }) => {
    const oddsValue = side === "back"
      ? (bet?.back ?? bet?.b ?? bet?.b1 ?? bet?.odds ?? 0)
      : (bet?.lay ?? bet?.l ?? bet?.l1 ?? 0);
    const formattedOdds = formatOdds(oddsValue);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading || locked}
        onClick={() => openBetModal(bet, side)}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : side === "back"
              ? "bg-sky-400 text-white hover:bg-sky-500 cursor-pointer"
              : "bg-pink-400 text-white hover:bg-pink-500 cursor-pointer"
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
        <h3 className="text-sm font-semibold">Teen3 (Player A vs Player B)</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= PLAYER A / PLAYER B ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        {/* Player A */}
        <div className="border">
          <div className="grid grid-cols-3 text-sm font-semibold">
            <div className="h-10 flex items-center px-2 font-bold text-white-900">Player A</div>
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">
              Back
            </div>
            <div className="text-center bg-pink-300 text-gray-900 h-10 flex items-center justify-center">
              Lay
            </div>
          </div>
          <div className="grid grid-cols-3 border-t">
            <div className="p-2 text-sm font-semibold">Main</div>
            <Cell bet={playerA} side="back" />
            <Cell bet={playerA} side="lay" />
          </div>
        </div>

        {/* Player B */}
        <div className="border">
          <div className="grid grid-cols-3 text-sm font-semibold">
            <div className="h-10 flex items-center px-2 font-bold text-white-900">Player B</div>
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">
              Back
            </div>
            <div className="text-center bg-pink-300 text-gray-900 h-10 flex items-center justify-center">
              Lay
            </div>
          </div>
          <div className="grid grid-cols-3 border-t">
            <div className="p-2 text-sm font-semibold">Main</div>
            <Cell bet={playerB} side="back" />
            <Cell bet={playerB} side="lay" />
          </div>
        </div>
      </div>

      {/* ================= CONSECUTIVE CARDS ================= */}
      {consecutiveBet && (
        <div className="border mb-2">
          <div className="grid grid-cols-2">
            <div className="p-2 text-sm">Consecutive Cards</div>
            <button
              disabled={
                isSuspended(consecutiveBet) ||
                loading ||
                formatOdds(getOdds(consecutiveBet)) === "0.00"
              }
              onClick={() => openBetModal(consecutiveBet, "back")}
              className={`h-10 bg-gradient-to-r from-sky-600 to-slate-700 text-white font-semibold ${
                isSuspended(consecutiveBet) || formatOdds(getOdds(consecutiveBet)) === "0.00"
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-sky-700 hover:to-slate-800"
              }`}
            >
              {isSuspended(consecutiveBet) || formatOdds(getOdds(consecutiveBet)) === "0.00" ? (
                <Lock size={14} />
              ) : (
                `Consecutive ${formatOdds(getOdds(consecutiveBet))}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= ODD / EVEN ================= */}
      {(oddBet || evenBet) && (
        <div className="border mb-2">
          <div className="grid grid-cols-3 text-sm font-semibold">
            <div className="h-10 flex items-center" />
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">
              Odd
            </div>
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">
              Even
            </div>
          </div>

          <div className="grid grid-cols-3 border-t">
            <div className="p-2 text-sm">Player A</div>
            <Cell bet={findBet(actualBets, "Player A Odd") || findBet(actualBets, "A Odd")} />
            <Cell bet={findBet(actualBets, "Player A Even") || findBet(actualBets, "A Even")} />
          </div>

          <div className="grid grid-cols-3 border-t">
            <div className="p-2 text-sm">Player B</div>
            <Cell bet={findBet(actualBets, "Player B Odd") || findBet(actualBets, "B Odd")} />
            <Cell bet={findBet(actualBets, "Player B Even") || findBet(actualBets, "B Even")} />
          </div>
        </div>
      )}

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10Results.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              const winner = result.win || result.winner || result.result || "";
              const winnerStr = String(winner).toLowerCase().trim();
              
              // Handle numeric values: 1 = Player A, 2 = Player B
              // Also handle text: "player a", "player b", "a", "b"
              let letter = "?";
              let bgColor = "bg-gray-600";
              let textColor = "text-white";
              
              // Check for numeric values first (1 = Player A, 2 = Player B)
              if (winner === 1 || winner === "1" || winnerStr === "1") {
                letter = "A";
                bgColor = "bg-blue-600";
                textColor = "text-white";
              } else if (winner === 2 || winner === "2" || winnerStr === "2") {
                letter = "B";
                bgColor = "bg-red-600";
                textColor = "text-white";
              } else if (winnerStr.includes("player a") || winnerStr === "a" || winnerStr.includes("player a")) {
                letter = "A";
                bgColor = "bg-blue-600";
                textColor = "text-white";
              } else if (winnerStr.includes("player b") || winnerStr === "b" || winnerStr.includes("player b")) {
                letter = "B";
                bgColor = "bg-red-600";
                textColor = "text-white";
              } else {
                // Try to extract first letter if it's a single character
                const firstChar = String(winner).charAt(0).toUpperCase();
                if (firstChar === "A" || firstChar === "1") {
                  letter = "A";
                  bgColor = "bg-blue-600";
                  textColor = "text-white";
                } else if (firstChar === "B" || firstChar === "2") {
                  letter = "B";
                  bgColor = "bg-red-600";
                  textColor = "text-white";
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
                  {selectedBet.nat || selectedBet.type || "Unknown"}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Side: <span className="font-bold uppercase">{selectedBet.side || "back"}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(
                      selectedBet.side === "lay"
                        ? (selectedBet.lay ?? selectedBet.l ?? selectedBet.l1 ?? 0)
                        : (selectedBet.back ?? selectedBet.b ?? selectedBet.b1 ?? selectedBet.odds ?? 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {QUICK_CHIPS.map((amt) => (
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
                min={min}
                max={max}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Potential win: ₹
                  {(
                    parseFloat(amount) *
                    (() => {
                      const side = selectedBet.side || "back";
                      const oddsValue = side === "back"
                        ? (selectedBet.back ?? selectedBet.b ?? selectedBet.b1 ?? selectedBet.odds ?? 0)
                        : (selectedBet.lay ?? selectedBet.l ?? selectedBet.l1 ?? 0);
                      return oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    })()
                  ).toFixed(2)}
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) < min}
                onClick={handlePlaceBet}
              >
                {loading ? "Placing..." : `Place Bet ₹${amount}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-white m-0">Instant Teenpatti Result</h2>
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
              <div className="space-y-6">
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

                  // Parse cards
                  const allCards = parseTeen3Cards(t1Data.card || '');
                  // First 3 cards are Player A, next 3 are Player B
                  const playerACards = allCards.slice(0, 3);
                  const playerBCards = allCards.slice(3, 6);
                  
                  // Determine winner
                  const winner = t1Data.winnat || t1Data.win || '';
                  const isPlayerAWinner = winner === "Player A" || winner === "1" || String(winner).toLowerCase().includes("player a");
                  const isPlayerBWinner = winner === "Player B" || winner === "2" || String(winner).toLowerCase().includes("player b");

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

                      {/* Player A and Player B Cards - Horizontal Layout */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Player A Cards */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Player A</h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerAWinner && (
                              <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            )}
                            <div className="flex gap-1.5 justify-center">
                              {playerACards.length > 0 ? playerACards.map((card, index) => (
                                <div
                                  key={index}
                                  className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                                >
                                  <span className={`text-sm font-bold ${card.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                    {card.rank}
                                  </span>
                                  <span className={`text-lg ${card.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                    {card.suit}
                                  </span>
                                </div>
                              )) : (
                                <div className="text-gray-500 text-xs">No cards</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Player B Cards */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Player B</h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerBWinner && (
                              <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            )}
                            <div className="flex gap-1.5 justify-center">
                              {playerBCards.length > 0 ? playerBCards.map((card, index) => (
                                <div
                                  key={index}
                                  className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                                >
                                  <span className={`text-sm font-bold ${card.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                    {card.rank}
                                  </span>
                                  <span className={`text-lg ${card.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                    {card.suit}
                                  </span>
                                </div>
                              )) : (
                                <div className="text-gray-500 text-xs">No cards</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Winner Declaration - At Bottom */}
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center shadow-md">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          Winner: <span className="text-green-600 dark:text-green-400">{winner || (isPlayerAWinner ? "Player A" : isPlayerBWinner ? "Player B" : "N/A")}</span>
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

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle>Teen3 Game Rules</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            {rulesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading rules...</span>
              </div>
            ) : rulesError ? (
              <div className="text-center py-8">
                <p className="text-destructive font-medium mb-2">Error</p>
                <p className="text-sm text-muted-foreground">{rulesError}</p>
              </div>
            ) : sanitizedRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Rules not found
              </div>
            ) : (
              <div className="space-y-3">
                {sanitizedRules.map((rule, idx) => (
                  <div key={`${rule.stype}-${idx}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {sectionTitleMap[rule.stype] || rule.stype}
                    </h3>
                    <div
                      className="casino-rules-content text-xs leading-relaxed text-gray-700 dark:text-gray-300 [&_ul]:space-y-1 [&_li]:mb-1 [&_p]:mb-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded"
                      dangerouslySetInnerHTML={{ __html: rule.safeHTML }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

