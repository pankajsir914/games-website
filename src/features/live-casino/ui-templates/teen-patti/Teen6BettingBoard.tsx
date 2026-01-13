import { useMemo, useState } from "react";
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

interface Teen6BettingBoardProps {
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
    win: "Player A" | "Player B" | "A" | "B";
    winnerId?: string;
  }>;
  onResultClick?: (result: any) => void;
}

const QUICK_CHIPS = [50, 100, 500, 1000];

const CARD_ORDER = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
];

const formatOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const isSuspended = (bet: any) =>
  !bet || bet?.gstatus === "SUSPENDED" || bet?.status === "suspended";

const findBet = (bets: any[], searchTerm: string) => {
  if (!bets || bets.length === 0) return null;
  
  const normalized = searchTerm.toLowerCase().trim();
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase().trim();
    return (
      betName === normalized ||
      betName.includes(normalized) ||
      betName.includes(`player ${normalized}`) ||
      betName.includes(`${normalized} player`) ||
      betName.includes(`under ${normalized}`) ||
      betName.includes(`over ${normalized}`)
    );
  });
};

const getCardBet = (bets: any[], card: string) => {
  if (!bets || bets.length === 0) return null;
  const normalized = card.toLowerCase();
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase();
    return (
      betName === normalized ||
      betName.includes(`joker ${normalized}`) ||
      betName.includes(`${normalized} joker`) ||
      betName.includes(`fix ${normalized}`) ||
      betName.includes(`${normalized} fix`)
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

// Parse cards for Teen6 - format: "KSS,8SS,QHH,9CC,10DD,KDD" (6 cards: 3 for Player A, 3 for Player B)
const parseCards = (cardString: string) => {
  if (!cardString) return [];
  const cards = cardString.split(",").map((c) => c.trim()).filter(Boolean);
  return cards.map((card) => {
    let rank = "";
    let suit = "";
    // Format: "KSS" = King of Spades, "10DD" = 10 of Diamonds
    // Last 2 chars are suit (doubled: SS, HH, CC, DD)
    if (card.length >= 3) {
      if (card.length >= 4 && card.startsWith("10")) {
        rank = "10";
        suit = card.slice(2, 4); // "10DD" -> "DD"
      } else {
        rank = card.substring(0, card.length - 2); // "KSS" -> "K"
        suit = card.slice(-2); // "KSS" -> "SS"
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
  });
};

export const Teen6BettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: Teen6BettingBoardProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState(String(min));
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  // Find Player A and Player B bets
  const playerA = findBet(bets, "player a") || findBet(bets, "a");
  const playerB = findBet(bets, "player b") || findBet(bets, "b");

  // Find Under/Over bets for each player
  const playerAUnder21 = findBet(bets, "player a under 21") || findBet(bets, "a under 21");
  const playerAOver22 = findBet(bets, "player a over 22") || findBet(bets, "a over 22");
  const playerBUnder21 = findBet(bets, "player b under 21") || findBet(bets, "b under 21");
  const playerBOver22 = findBet(bets, "player b over 22") || findBet(bets, "b over 22");

  // Find suit bets
  const suits = [
    { key: "spade", icon: "♠", label: "Spade", color: "text-black" },
    { key: "heart", icon: "♥", label: "Heart", color: "text-red-500" },
    { key: "club", icon: "♣", label: "Club", color: "text-black" },
    { key: "diamond", icon: "♦", label: "Diamond", color: "text-red-500" },
  ].map((s) => ({
    ...s,
    bet: findBet(bets, s.key),
  }));

  // Find Odd/Even bets
  const oddBet = findBet(bets, "odd");
  const evenBet = findBet(bets, "even");

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = side === "back" ? getBackOdds(bet) : getLayOdds(bet);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedSide(side);
    setAmount(String(min));
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    const amt = parseFloat(amount);
    const oddsValue = selectedSide === "back" ? getBackOdds(selectedBet) : getLayOdds(selectedBet);
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;

    const roundIdFromBet = selectedBet?.mid || selectedBet?.round_id || selectedBet?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds = raw?.mid || raw?.round_id || raw?.round || raw?.gmid || raw?.game_id ||
                           odds?.mid || odds?.round_id || odds?.round || odds?.gmid || odds?.game_id;
    const roundIdFromFirstBet = bets.length > 0 && (bets[0]?.mid || bets[0]?.round_id || bets[0]?.round);
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
          tableId: "teen6",
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

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Teenpatti - 2.0</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= TOP ROW - PLAYER A & B ================= */}
      <div className="mb-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Player A Section */}
          <div className="flex-1">
            <div className="text-sm font-bold text-white mb-1">Player A</div>
            <div className="grid grid-cols-2 gap-1 mb-2">
              <div className="space-y-1">
                <div className="text-xs text-center text-muted-foreground">Back</div>
                <div className="text-[10px] text-center text-muted-foreground">Main</div>
                <button
                  disabled={locked || isSuspended(playerA) || formatOdds(getBackOdds(playerA)) === "0.00"}
                  onClick={() => openBetModal(playerA, "back")}
                  className={`
                    h-[60px] w-full flex items-center justify-center font-bold relative
                    ${
                      locked || isSuspended(playerA) || formatOdds(getBackOdds(playerA)) === "0.00"
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-sky-200 hover:bg-sky-300 text-black"
                    }
                  `}
                >
                  {locked || isSuspended(playerA) || formatOdds(getBackOdds(playerA)) === "0.00" ? (
                    <Lock size={14} className="absolute top-1 right-1" />
                  ) : (
                    formatOdds(getBackOdds(playerA))
                  )}
                </button>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-center text-muted-foreground">Lay</div>
                <div className="text-[10px] text-center text-muted-foreground">Main</div>
                <button
                  disabled={locked || isSuspended(playerA) || formatOdds(getLayOdds(playerA)) === "0.00"}
                  onClick={() => openBetModal(playerA, "lay")}
                  className={`
                    h-[60px] w-full flex items-center justify-center font-bold relative
                    ${
                      locked || isSuspended(playerA) || formatOdds(getLayOdds(playerA)) === "0.00"
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-pink-200 hover:bg-pink-300 text-black"
                    }
                  `}
                >
                  {locked || isSuspended(playerA) || formatOdds(getLayOdds(playerA)) === "0.00" ? (
                    <Lock size={14} className="absolute top-1 right-1" />
                  ) : (
                    formatOdds(getLayOdds(playerA))
                  )}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                disabled={locked || isSuspended(playerAUnder21)}
                onClick={() => openBetModal(playerAUnder21, "back")}
                className={`
                  h-[40px] w-full flex items-center justify-center text-xs font-semibold relative
                  ${
                    locked || isSuspended(playerAUnder21)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-sky-200 hover:bg-sky-300 text-black"
                  }
                `}
              >
                {locked || isSuspended(playerAUnder21) ? (
                  <Lock size={14} className="absolute top-1 right-1 text-gray-500" />
                ) : null}
                <span className="text-xs">Under 21</span>
              </button>
              <button
                disabled={locked || isSuspended(playerAOver22)}
                onClick={() => openBetModal(playerAOver22, "back")}
                className={`
                  h-[40px] w-full flex items-center justify-center text-xs font-semibold relative
                  ${
                    locked || isSuspended(playerAOver22)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-sky-200 hover:bg-sky-300 text-black"
                  }
                `}
              >
                {locked || isSuspended(playerAOver22) ? (
                  <Lock size={14} className="absolute top-1 right-1 text-gray-500" />
                ) : null}
                <span className="text-xs">Over 22</span>
              </button>
            </div>
          </div>

          {/* Player B Section */}
          <div className="flex-1">
            <div className="text-sm font-bold text-white mb-1">Player B</div>
            <div className="grid grid-cols-2 gap-1 mb-2">
              <div className="space-y-1">
                <div className="text-xs text-center text-muted-foreground">Back</div>
                <div className="text-[10px] text-center text-muted-foreground">Main</div>
                <button
                  disabled={locked || isSuspended(playerB) || formatOdds(getBackOdds(playerB)) === "0.00"}
                  onClick={() => openBetModal(playerB, "back")}
                  className={`
                    h-[60px] w-full flex items-center justify-center font-bold relative
                    ${
                      locked || isSuspended(playerB) || formatOdds(getBackOdds(playerB)) === "0.00"
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-sky-200 hover:bg-sky-300 text-black"
                    }
                  `}
                >
                  <Lock size={14} className="absolute top-1 right-1 text-gray-500" />
                </button>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-center text-muted-foreground">Lay</div>
                <div className="text-[10px] text-center text-muted-foreground">Main</div>
                <button
                  disabled={locked || isSuspended(playerB) || formatOdds(getLayOdds(playerB)) === "0.00"}
                  onClick={() => openBetModal(playerB, "lay")}
                  className={`
                    h-[60px] w-full flex items-center justify-center font-bold relative
                    ${
                      locked || isSuspended(playerB) || formatOdds(getLayOdds(playerB)) === "0.00"
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-pink-200 hover:bg-pink-300 text-black"
                    }
                  `}
                >
                  <Lock size={14} className="absolute top-1 right-1 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                disabled={locked || isSuspended(playerBUnder21)}
                onClick={() => openBetModal(playerBUnder21, "back")}
                className={`
                  h-[40px] w-full flex items-center justify-center text-xs font-semibold relative
                  ${
                    locked || isSuspended(playerBUnder21)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-sky-200 hover:bg-sky-300 text-black"
                  }
                `}
              >
                <Lock size={14} className="absolute top-1 right-1 text-gray-500" />
                <span className="text-xs">Under 21</span>
              </button>
              <button
                disabled={locked || isSuspended(playerBOver22)}
                onClick={() => openBetModal(playerBOver22, "back")}
                className={`
                  h-[40px] w-full flex items-center justify-center text-xs font-semibold relative
                  ${
                    locked || isSuspended(playerBOver22)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-sky-200 hover:bg-sky-300 text-black"
                  }
                `}
              >
                <Lock size={14} className="absolute top-1 right-1 text-gray-500" />
                <span className="text-xs">Over 22</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SUITS AND ODD/EVEN ROW ================= */}
      <div className="mb-2">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {/* Suits */}
          {suits.map((s) => {
            const disabled = locked || isSuspended(s.bet);
            const backOdds = formatOdds(getBackOdds(s.bet));
            return (
              <div key={s.key} className="flex flex-col items-center justify-start min-w-0">
                <div className={`text-2xl mb-1 ${s.color} leading-none h-8 flex items-center justify-center`}>{s.icon}</div>
                <button
                  onClick={() => openBetModal(s.bet, "back")}
                  disabled={disabled}
                  className={`
                    w-full h-[50px] rounded flex items-center justify-center font-bold text-sm transition-all min-h-[50px]
                    ${
                      disabled
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-sky-200 hover:bg-sky-300 text-black"
                    }
                  `}
                >
                  {disabled ? <Lock size={14} /> : backOdds === "0.00" ? "0" : backOdds}
                </button>
              </div>
            );
          })}

          {/* Odd/Even */}
          {[
            { label: "Odd", bet: oddBet },
            { label: "Even", bet: evenBet },
          ].map(({ label, bet }) => {
            const disabled = locked || isSuspended(bet);
            const backOdds = formatOdds(getBackOdds(bet));
            return (
              <div key={label} className="flex flex-col items-center justify-start min-w-0">
                <div className="font-bold text-xs mb-1 leading-tight h-8 flex items-center justify-center">{label}</div>
                <button
                  onClick={() => openBetModal(bet, "back")}
                  disabled={disabled}
                  className={`
                    w-full h-[50px] rounded flex items-center justify-center font-bold text-sm transition-all min-h-[50px]
                    ${
                      disabled
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-sky-200 hover:bg-sky-300 text-black"
                    }
                  `}
                >
                  {disabled ? <Lock size={14} /> : backOdds === "0.00" ? "0" : backOdds}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= CARD VALUE BETTING SECTION ================= */}
      <div className="mb-2">
        <div className="grid grid-cols-7 lg:flex lg:flex-nowrap gap-1 sm:gap-2 justify-center">
          {CARD_ORDER.map((card) => {
            const cardBet = getCardBet(bets, card);
            const disabled = locked || isSuspended(cardBet);
            const backOdds = formatOdds(getBackOdds(cardBet));
            
            return (
              <div key={card} className="w-[30px] sm:w-[36px] md:w-[42px] lg:w-[42px] flex flex-col items-center">
                {/* Card */}
                <button
                  onClick={() => openBetModal(cardBet, "back")}
                  disabled={disabled}
                  className={`
                    w-full h-[42px] sm:h-[50px] md:h-[56px] rounded border-2 flex flex-col items-center justify-between p-1 font-bold transition-all relative
                    ${
                      disabled
                        ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-white border-yellow-400 text-black cursor-pointer hover:border-yellow-500 hover:shadow-lg"
                    }
                  `}
                >
                  {/* Card Rank - Top */}
                  <div className="text-[10px] sm:text-xs font-bold leading-none">{card}</div>
                  
                  {/* Suit Icons - 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-0.5 flex-1 items-center justify-center">
                    <span className="text-[8px] sm:text-[9px] text-black leading-none">♠</span>
                    <span className="text-[8px] sm:text-[9px] text-black leading-none">♣</span>
                    <span className="text-[8px] sm:text-[9px] text-red-500 leading-none">♥</span>
                    <span className="text-[8px] sm:text-[9px] text-red-500 leading-none">♦</span>
                  </div>
                  
                  {disabled && (
                    <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5 absolute top-0.5 right-0.5 text-gray-500" />
                  )}
                </button>
                
                {/* Odds below card */}
                <div className="text-center mt-1">
                  <span className="text-[9px] sm:text-[10px] font-semibold">
                    {backOdds === "0.00" ? "0" : backOdds}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10.map((r, i) => {
              const winValue = r.win?.toString() || r.winnerId?.toString() || r.result || "";
              const isPlayerA = 
                winValue === "1" || 
                winValue === "Player A" || 
                winValue === "A" ||
                winValue.toLowerCase() === "playera" ||
                (r.winnerId && r.winnerId.toString() === "1");
              const winner = isPlayerA ? "A" : "B";
              
              return (
                <button
                  key={r.mid || r.round || r.round_id || i}
                  onClick={() => handleResultClick(r)}
                  className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm active:opacity-80 touch-none ${
                    isPlayerA
                      ? "bg-blue-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {winner}
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
        <DialogContent className="max-w-md p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex flex-row justify-between items-center">
            <h2 className="text-lg font-semibold text-white m-0">Place Bet</h2>
            <button
              onClick={() => setBetModalOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>

          {selectedBet && (
            <div className="p-6 space-y-5 bg-white dark:bg-gray-900">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Bet Type</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedBet?.nat || selectedBet?.type || ""}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Odds:</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(
                      selectedSide === "back" ? getBackOdds(selectedBet) : getLayOdds(selectedBet)
                    )}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Amount</div>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_CHIPS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(String(amt))}
                      className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
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
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Enter Amount</div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ₹${min} - Max ₹${max}`}
                  min={min}
                  max={max}
                  className="w-full h-12 text-lg font-semibold bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: ₹{min} · Max: ₹{max}
                </div>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {selectedSide === "back" ? "Potential Win" : "Liability"}
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{(() => {
                      const oddsValue = Number(
                        selectedSide === "back" ? getBackOdds(selectedBet) : getLayOdds(selectedBet)
                      );
                      const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                      if (selectedSide === "back") {
                        return (parseFloat(amount) * normalizedOdds).toFixed(2);
                      } else {
                        return (parseFloat(amount) * (normalizedOdds - 1)).toFixed(2);
                      }
                    })()}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={locked || !selectedBet || parseFloat(amount) <= 0 || parseFloat(amount) < min || parseFloat(amount) > max}
                onClick={handlePlaceBet}
              >
                {locked ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Placing Bet...
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
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-white m-0">Teenpatti - 2.0 Result</h2>
            <button
              onClick={() => setResultDialogOpen(false)}
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
                  const t1Data = detailData?.data?.t1 || detailData?.t1 || null;
                  if (!t1Data) {
                    return <div className="text-center py-8 text-muted-foreground">No detailed result data available</div>;
                  }
                  
                  // Parse cards - format: "KSS,8SS,QHH,9CC,10DD,KDD" (6 cards: 3 for Player A, 3 for Player B)
                  const cardString = t1Data.card || "";
                  const allCards = parseCards(cardString);
                  const playerACards = allCards.slice(0, 3);
                  const playerBCards = allCards.slice(3, 6);
                  
                  // Determine winner
                  const winner = t1Data.winnat || t1Data.win || "";
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isPlayerAWinner = winnerStr.includes("player a") || winnerStr === "a" || winnerStr === "1";
                  const isPlayerBWinner = winnerStr.includes("player b") || winnerStr === "b" || winnerStr === "2";

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

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                              Player A
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerAWinner && <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {playerACards.length > 0 ? playerACards.map((card, idx) => (
                                <div
                                  key={idx}
                                  className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                                >
                                  <span className={`text-sm font-bold ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{card.rank}</span>
                                  <span className={`text-lg ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{card.suit}</span>
                                </div>
                              )) : <div className="text-gray-500 text-xs">No cards</div>}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                              Player B
                            </h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerBWinner && <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />}
                            <div className="flex gap-1.5 justify-center">
                              {playerBCards.length > 0 ? playerBCards.map((card, idx) => (
                                <div
                                  key={idx}
                                  className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                                >
                                  <span className={`text-sm font-bold ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{card.rank}</span>
                                  <span className={`text-lg ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>{card.suit}</span>
                                </div>
                              )) : <div className="text-gray-500 text-xs">No cards</div>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Main: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {isPlayerAWinner ? "Player A" : isPlayerBWinner ? "Player B" : winner || "N/A"}
                            </span>
                          </div>
                          {t1Data.rdesc && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Description: </span>
                              <span className="text-gray-900 dark:text-gray-100">{t1Data.rdesc}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No detailed data available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-gray-900 dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex flex-row justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-semibold text-white m-0">Teenpatti - 2.0 Rules</h2>
            <button
              onClick={() => setRulesOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            <div className="space-y-4 text-sm leading-relaxed text-gray-100">
              <p>
                Teenpatti is an indian origin three cards game. This game is played with a regular 52 cards deck between Player A and Player B. The objective of the game is to make the best three cards hand as per the hand rankings and win. You have a betting option of Back and Lay for the main bet.
              </p>
              
              <div>
                <h3 className="font-bold text-lg mb-2">Rankings of the card hands from highest to lowest:</h3>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Straight Flush (pure Sequence)</li>
                  <li>Trail (Three of a Kind)</li>
                  <li>Straight (Sequence)</li>
                  <li>Flush (Color)</li>
                  <li>Pair (Two of a kind)</li>
                  <li>High Card</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Side bets:</h3>
                <p className="mb-2">
                  <strong>Under 21 - Over 22:</strong> It is a total point value of all the three cards. Here you can bet whether the total point value of all the 3 cards will be Under 21 or Over 22. You can bet on either or both the players.
                </p>
                <div className="mb-2">
                  <strong>Point Values:</strong>
                  <ul className="list-disc pl-6 mt-1">
                    <li>A = 1</li>
                    <li>2 = 2, 3 = 3, 4 = 4, 5 = 5, 6 = 6, 7 = 7, 8 = 8, 9 = 9, 10 = 10</li>
                    <li>J = 11, Q = 12, K = 13</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Suits:</h3>
                <p>Here you can bet on every card whether it will be a Spade, Heart, Club or a Diamond card.</p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Odd - Even:</h3>
                <p>Here you can bet on every card whether it will be an Odd card or an Even card.</p>
                <ul className="list-disc pl-6 mt-1">
                  <li><strong>Odd Cards:</strong> A, 3, 5, 7, 9, J, K</li>
                  <li><strong>Even Cards:</strong> 2, 4, 6, 8, 10, Q</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Fix Cards:</h3>
                <p>Here you can place bets on fix cards of your choice from Ace (A) to King (K). This bet is available for every card.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
