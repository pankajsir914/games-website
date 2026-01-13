import { useState, useMemo, useEffect, useRef } from "react";
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

interface Teen8BettingBoardProps {
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
    win: string;
    winnerId?: string;
  }>;
  onResultClick?: (result: any) => void;
  tableId?: string;
}

const QUICK_CHIPS = [50, 100, 500, 1000];

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
      betName.includes(`pair plus ${normalized}`) ||
      betName.includes(`total ${normalized}`) ||
      betSid === normalized
    );
  });
};

// Get odds from multiple possible fields
const getOdds = (bet: any, side: "back" | "lay" = "back") => {
  if (!bet) return 0;
  if (side === "lay") {
    return bet.lay ?? bet.l ?? 0;
  }
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? 0;
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

// Parse cards from API format (e.g., "9DD,3HH,8DD,6HH,KHH,8HH,9CC,4HH,1,1,1...")
// Format: "9DD" = 9 of Diamonds, "3HH" = 3 of Hearts, "1" = placeholder
// Each player has 3 cards, so 8 players = 24 cards total
const parseCards = (cardString: string) => {
  if (!cardString) return [];
  const cards = cardString.split(",").map((c) => c.trim()).filter(Boolean);
  return cards.map((card) => {
    if (card === "1") return null; // Skip placeholder "1"
    
    let rank = "";
    let suit = "";
    // Format: "9DD" = 9 of Diamonds, "KHH" = King of Hearts, "10CC" = 10 of Clubs
    // Suits are doubled: DD, CC, HH, SS
    if (card.length >= 3) {
      if (card.startsWith("10")) {
        rank = "10";
        suit = card.slice(2); // "10CC" -> "CC"
      } else {
        rank = card.substring(0, card.length - 2); // "9DD" -> "9"
        suit = card.slice(-2); // "9DD" -> "DD"
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

// Get cards for a specific player (1-8)
// Cards are distributed: Player 1 gets cards 0-2, Player 2 gets cards 3-5, etc.
const getPlayerCards = (playerNum: number, cardString: string | undefined): any[] => {
  if (!cardString) return [];
  const allCards = parseCards(cardString);
  const startIndex = (playerNum - 1) * 3;
  return allCards.slice(startIndex, startIndex + 3);
};

export const Teen8BettingBoard = ({
  bets = [],
  locked = false,
  min = 100,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
  tableId = "teen8",
}: Teen8BettingBoardProps) => {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState(String(min));
  
  // Detail result modal state
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  
  // Rules modal state
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const hasFetchedRulesRef = useRef(false);

  // Extract bets from multiple sources (bets prop, odds.data.sub, odds.bets, odds.sub)
  const actualBets = useMemo(() => {
    // Priority 1: Check bets prop if it's already an array
    if (Array.isArray(bets) && bets.length > 0) {
      return bets;
    }
    
    // Priority 2: Check odds.bets
    if (odds?.bets && Array.isArray(odds.bets) && odds.bets.length > 0) {
      return odds.bets;
    }
    
    // Priority 3: Check odds.data.sub (API structure) - normalize the structure
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
        max: item.max || 100000,
        sid: item.sid,
        mid: item.mid || odds?.data?.mid,
        subtype: item.subtype,
        etype: item.etype,
      }));
    }
    
    // Priority 4: Check odds.sub - normalize the structure
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
        max: item.max || 100000,
        sid: item.sid,
        mid: item.mid || odds?.mid,
        subtype: item.subtype,
        etype: item.etype,
      }));
    }
    
    return bets || [];
  }, [bets, odds]);

  // Get card string from odds
  const cardString = useMemo(() => {
    return odds?.data?.card || odds?.card || odds?.rawData?.card || "";
  }, [odds]);

  // Get bets for each player (1-8)
  // Based on API: Player 1 = sid:1, Player 2 = sid:2, ..., Pair Plus 1 = sid:9, Total 1 = sid:17
  const getPlayerBets = (playerNum: number) => {
    // Find Player bet by sid (Player 1 = sid:1, Player 2 = sid:2, etc.)
    const playerBet = actualBets.find((b: any) => b.sid === playerNum && (b.subtype === "Player" || b.nat?.includes(`Player ${playerNum}`))) ||
                     findBet(actualBets, `Player ${playerNum}`) || 
                     findBet(actualBets, playerNum);
    
    // Find Pair Plus bet by sid (Pair Plus 1 = sid:9, Pair Plus 2 = sid:10, etc.)
    const pairPlusSid = 8 + playerNum; // sid:9 for Player 1, sid:10 for Player 2, etc.
    const pairPlusBet = actualBets.find((b: any) => b.sid === pairPlusSid && (b.subtype === "Pair" || b.nat?.includes(`Pair Plus ${playerNum}`))) ||
                       findBet(actualBets, `Pair Plus ${playerNum}`);
    
    // Find Total bet by sid (Total 1 = sid:17, Total 2 = sid:18, etc.)
    const totalSid = 16 + playerNum; // sid:17 for Player 1, sid:18 for Player 2, etc.
    const totalBet = actualBets.find((b: any) => b.sid === totalSid && (b.subtype === "Total" || b.nat?.includes(`Total ${playerNum}`))) ||
                    findBet(actualBets, `Total ${playerNum}`);
    
    return {
      main: playerBet,
      pairPlus: pairPlusBet,
      total: totalBet,
    };
  };

  // Check if game is suspended (all bets suspended)
  const isGameSuspended = useMemo(() => {
    const player1Bet = getPlayerBets(1).main;
    return isSuspended(player1Bet);
  }, [actualBets]);

  // Debug: Log when bets/odds change
  useEffect(() => {
    if (actualBets.length > 0) {
      console.log("🔴 [Teen8] Actual bets received:", {
        totalBets: actualBets.length,
        firstFew: actualBets.slice(0, 5),
        player1Bet: getPlayerBets(1),
        oddsStructure: odds ? Object.keys(odds) : null,
      });
    }
  }, [actualBets, odds]);

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedSide(side);
    setAmount(String(min));
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    const amt = parseFloat(amount);
    const oddsValue = getOdds(selectedBet, selectedSide);
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;

    const roundIdFromBet = selectedBet?.mid || selectedBet?.round_id || selectedBet?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds = raw?.mid || raw?.round_id || raw?.round || raw?.gmid || raw?.game_id ||
                           odds?.mid || odds?.round_id || odds?.round || odds?.gmid || odds?.game_id;
    const roundIdFromFirstBet = actualBets.length > 0 && (actualBets[0]?.mid || actualBets[0]?.round_id || actualBets[0]?.round);
    const finalRoundId = roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;

    await onPlaceBet({
      betType: selectedBet?.nat || selectedBet?.type || "",
      amount: Math.min(Math.max(amt, min), max),
      odds: finalOdds,
      roundId: finalRoundId,
      sid: selectedBet?.sid,
      side: selectedSide,
    });

    setBetModalOpen(false);
    setSelectedBet(null);
    setAmount(String(min));
  };

  // Fetch detail result
  const fetchDetailResult = async (mid: string | number) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: {
          action: "get-detail-result",
          tableId: tableId,
          mid: String(mid),
        },
      });
      if (error) {
        setDetailData({ error: error.message || "Failed to fetch detail" });
      } else if (data) {
        setDetailData(data?.data || data);
      } else {
        setDetailData({ error: "No data received" });
      }
    } catch (err) {
      setDetailData({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: any) => {
    const mid = result.mid || result.round || result.round_id;
    setSelectedResult(result);
    setResultDialogOpen(true);
    if (mid) {
      fetchDetailResult(mid);
    }
    onResultClick?.(result);
  };

  // Fetch rules when modal opens
  useEffect(() => {
    if (rulesOpen) {
      const finalTableId = tableId || odds?.tableId || odds?.rawData?.gtype || "teen8";
      
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

  const last10 = useMemo(() => {
    if (!resultHistory) return [];
    
    let results: any[] = [];
    
    if (Array.isArray(resultHistory)) {
      results = resultHistory;
    } else if (resultHistory && typeof resultHistory === 'object') {
      results = (resultHistory as any)?.data?.res || 
                (resultHistory as any)?.res || 
                (resultHistory as any)?.results ||
                [];
    }
    
    return Array.isArray(results) ? results.slice(0, 10) : [];
  }, [resultHistory]);

  // Section title map for rules
  const sectionTitleMap: Record<string, string> = {
    main: "Game Rules",
    players: "Player Rules",
    banker: "Banker Rules",
    sidebets: "Side Bets",
    side: "Side Bets",
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h3 className="text-xs sm:text-sm font-semibold">Teenpatti Open</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-7 w-7 sm:h-8 sm:w-8">
          <Info size={14} className="sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* ================= BETTING BOARD TABLE ================= */}
      <div className="mb-2 overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full text-xs sm:text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-blue-500/30">
              <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-semibold bg-gray-200/50 border-b border-gray-300">Player</th>
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-semibold bg-blue-400/50 border-b border-gray-300">Odds</th>
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-semibold bg-blue-400/50 border-b border-gray-300">Pair Plus</th>
              <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-semibold bg-blue-400/50 border-b border-gray-300">Total</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((playerNum) => {
              const playerBets = getPlayerBets(playerNum);
              const playerCards = getPlayerCards(playerNum, cardString);
              const mainDisabled = locked || isSuspended(playerBets.main);
              const pairPlusDisabled = locked || isSuspended(playerBets.pairPlus);
              const totalDisabled = locked || isSuspended(playerBets.total);
              
              const mainOdds = formatOdds(getOdds(playerBets.main));
              const pairPlusOdds = formatOdds(getOdds(playerBets.pairPlus));
              const totalOdds = formatOdds(getOdds(playerBets.total));

              return (
                <tr key={playerNum} className="border-b border-gray-300">
                  {/* Player Column with Cards */}
                  <td className="px-2 sm:px-3 py-2 sm:py-3 bg-gray-100/50">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className="font-bold text-[11px] sm:text-sm whitespace-nowrap">Player {playerNum}</span>
                      {isGameSuspended && playerCards.length > 0 ? (
                        <div className="flex gap-0.5 sm:gap-1">
                          {playerCards.map((card, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-8 sm:w-8 sm:h-11 rounded border-2 border-yellow-400 bg-white flex flex-col items-center justify-center shadow-md"
                            >
                              <span className={`text-[9px] sm:text-xs font-bold ${card.isRed ? "text-red-600" : "text-black"}`}>
                                {card.rank}
                              </span>
                              <span className={`text-[10px] sm:text-base ${card.isRed ? "text-red-600" : "text-black"}`}>
                                {card.suit}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-0.5 sm:gap-1">
                          {Array.from({ length: 3 }).map((_, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-8 sm:w-8 sm:h-11 rounded border border-gray-400 bg-white flex items-center justify-center text-gray-400 text-[10px] sm:text-xs"
                            >
                              ?
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Odds Column */}
                  <td className="px-1.5 sm:px-3 py-2 sm:py-3 bg-blue-400/30 text-center">
                    {!playerBets.main ? (
                      <div className="flex items-center justify-center">
                        <Lock size={14} className="sm:w-4 sm:h-4 text-white" />
                      </div>
                    ) : mainDisabled || mainOdds === "0.00" ? (
                      <div className="flex items-center justify-center">
                        <Lock size={14} className="sm:w-4 sm:h-4 text-white" />
                      </div>
                    ) : (
                      <button
                        disabled={locked}
                        onClick={() => openBetModal(playerBets.main, "back")}
                        className="w-full px-1.5 sm:px-3 py-1.5 sm:py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-sm font-bold transition-all"
                      >
                        {mainOdds}
                      </button>
                    )}
                  </td>

                  {/* Pair Plus Column */}
                  <td className="px-1.5 sm:px-3 py-2 sm:py-3 bg-blue-400/30 text-center">
                    {!playerBets.pairPlus ? (
                      <div className="flex items-center justify-center text-white text-[9px] sm:text-xs">
                        <span className="hidden sm:inline">Pair Plus {playerNum}</span>
                        <span className="sm:hidden">P{playerNum}</span>
                        <Lock size={12} className="sm:w-3.5 sm:h-3.5 ml-0.5 sm:ml-1" />
                      </div>
                    ) : pairPlusDisabled || pairPlusOdds === "0.00" ? (
                      <div className="flex items-center justify-center text-white text-[9px] sm:text-xs">
                        <span className="hidden sm:inline">Pair Plus {playerNum}</span>
                        <span className="sm:hidden">P{playerNum}</span>
                        <Lock size={12} className="sm:w-3.5 sm:h-3.5 ml-0.5 sm:ml-1" />
                      </div>
                    ) : (
                      <button
                        disabled={locked}
                        onClick={() => openBetModal(playerBets.pairPlus, "back")}
                        className="w-full px-1.5 sm:px-3 py-1.5 sm:py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-sm font-bold transition-all"
                      >
                        <span className="hidden sm:inline">{pairPlusOdds}</span>
                        <span className="sm:hidden">{pairPlusOdds}</span>
                      </button>
                    )}
                  </td>

                  {/* Total Column */}
                  <td className="px-1.5 sm:px-3 py-2 sm:py-3 bg-blue-400/30 text-center">
                    {!playerBets.total ? (
                      <div className="flex items-center justify-center">
                        <Lock size={14} className="sm:w-4 sm:h-4 text-white" />
                      </div>
                    ) : totalDisabled || totalOdds === "0.00" ? (
                      <div className="flex items-center justify-center">
                        <Lock size={14} className="sm:w-4 sm:h-4 text-white" />
                      </div>
                    ) : (
                      <button
                        disabled={locked}
                        onClick={() => openBetModal(playerBets.total, "back")}
                        className="w-full px-1.5 sm:px-3 py-1.5 sm:py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-sm font-bold transition-all"
                      >
                        {totalOdds}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2 mb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10.map((r, i) => {
              // Parse win string (e.g., "2,3,5,8" means players 2, 3, 5, 8 won)
              const winValue = r.win?.toString() || r.winnerId?.toString() || "";
              const winners = winValue.split(",").map(w => w.trim()).filter(Boolean);
              
              return (
                <button
                  key={r.mid || r.round || r.round_id || i}
                  onClick={() => handleResultClick(r)}
                  className="flex-shrink-0 w-8 h-8 rounded-full font-bold text-[10px] sm:text-xs bg-blue-600 text-white hover:bg-blue-700 active:opacity-80 transition-colors flex items-center justify-center"
                  title={`Winners: ${winners.join(", ")}`}
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

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-row justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-white m-0">Place Bet</h2>
            <button
              onClick={() => setBetModalOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>

          {selectedBet && (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900">
              <div className="space-y-2">
                <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Bet Type</div>
                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white break-words">
                  {selectedBet.nat}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Odds:</span>
                  <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSide))}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Amount</div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {QUICK_CHIPS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(String(amt))}
                      className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-[10px] sm:text-sm font-semibold transition-all ${
                        amount === String(amt)
                          ? "bg-blue-600 text-white shadow-md scale-105"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Enter Amount</div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ₹${min} - Max ₹${max}`}
                  min={min}
                  max={max}
                  className="w-full h-10 sm:h-12 text-sm sm:text-lg font-semibold bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: ₹{min} · Max: ₹{max}
                </div>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Potential Win
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{(() => {
                      const oddsValue = Number(getOdds(selectedBet, selectedSide));
                      const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                      return (parseFloat(amount) * normalizedOdds).toFixed(2);
                    })()}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={locked || !selectedBet || parseFloat(amount) <= 0 || parseFloat(amount) < min || parseFloat(amount) > max}
                onClick={handlePlaceBet}
              >
                {locked ? (
                  <>
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Betting Locked
                  </>
                ) : (
                  `Place Bet ₹${parseFloat(amount) || 0}`
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= RESULT MODAL ================= */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-sm sm:text-lg font-semibold text-white m-0">Teenpatti Open Result</h2>
            <button
              onClick={() => setResultDialogOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-700 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-6 bg-white dark:bg-gray-900">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                <span className="ml-2 text-sm sm:text-base">Loading details...</span>
              </div>
            ) : detailData ? (
              <div className="space-y-3 sm:space-y-4">
                {detailData.error ? (
                  <div className="text-center py-8">
                    <p className="text-destructive font-medium mb-2 text-sm sm:text-base">Error</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{detailData.error}</p>
                  </div>
                ) : (() => {
                  const t1Data = detailData?.data?.t1 || detailData?.t1 || null;
                  if (!t1Data) {
                    return <div className="text-center py-8 text-muted-foreground text-sm">No detailed result data available</div>;
                  }
                  
                  const cardString = t1Data.card || "";
                  const allCards = parseCards(cardString);
                  
                  // Distribute cards to players (3 cards each)
                  const playersCards: any[][] = [];
                  for (let i = 0; i < 8; i++) {
                    const startIndex = i * 3;
                    playersCards.push(allCards.slice(startIndex, startIndex + 3));
                  }
                  
                  // Parse winners from win field (e.g., "5,8" means players 5 and 8 won)
                  const winValue = t1Data.winnat || t1Data.win || "";
                  const winners = winValue.split(",").map(w => parseInt(w.trim())).filter(w => !isNaN(w));
                  
                  return (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs sm:text-sm border-b pb-2 sm:pb-3">
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Round Id: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono text-[10px] sm:text-sm break-all">{t1Data.rid || selectedResult?.mid || "N/A"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Match Time: </span>
                          <span className="text-gray-900 dark:text-gray-100 text-[10px] sm:text-sm">{t1Data.mtime || "N/A"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                        {Array.from({ length: 8 }, (_, i) => i + 1).map((playerNum) => {
                          const cards = playersCards[playerNum - 1] || [];
                          const isWinner = winners.includes(playerNum);
                          
                          return (
                            <div key={playerNum} className="space-y-1.5 sm:space-y-2">
                              <div className="text-center">
                                <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1">
                                  Player {playerNum}
                                  {isWinner && <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />}
                                </h3>
                              </div>
                              <div className="flex justify-center gap-0.5 sm:gap-1">
                                {cards.length > 0 ? cards.map((card, idx) => (
                                  <div
                                    key={idx}
                                    className="w-8 h-11 sm:w-10 sm:h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                                  >
                                    <span className={`text-[9px] sm:text-xs font-bold ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                                      {card.rank}
                                    </span>
                                    <span className={`text-[10px] sm:text-base ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                                      {card.suit}
                                    </span>
                                  </div>
                                )) : (
                                  <div className="text-gray-500 text-[10px] sm:text-xs">No cards</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Winners: </span>
                            <span className="text-gray-900 dark:text-gray-100 break-words">
                              {winners.length > 0 ? `Player ${winners.join(", Player ")}` : winValue || "N/A"}
                            </span>
                          </div>
                          {t1Data.rdesc && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Description: </span>
                              <span className="text-gray-900 dark:text-gray-100 break-words">{t1Data.rdesc}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No detailed data available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[85vh] p-0 overflow-hidden flex flex-col bg-gray-900 dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-row justify-between items-center flex-shrink-0">
            <h2 className="text-sm sm:text-lg font-semibold text-white m-0">Teenpatti Open Rules</h2>
            <button
              onClick={() => setRulesOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            {rulesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                <span className="ml-2 text-sm sm:text-base">Loading rules...</span>
              </div>
            ) : rulesError ? (
              <div className="text-center py-8">
                <p className="text-red-500 font-medium mb-2 text-sm sm:text-base">Error</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{rulesError}</p>
              </div>
            ) : sanitizedRules.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {sanitizedRules.map((rule, idx) => (
                  <div key={idx} className="rules-section">
                    <h3 className="text-base sm:text-lg font-bold text-yellow-400 mb-2 sm:mb-3">
                      {sectionTitleMap[rule.stype] || rule.stype || "Rules"}
                    </h3>
                    <div
                      className="text-xs sm:text-sm leading-relaxed text-gray-100 [&_img]:max-w-full [&_img]:h-auto"
                      dangerouslySetInnerHTML={{ __html: rule.safeHTML }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No rules available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
