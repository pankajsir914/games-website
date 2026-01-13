import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Info, X, Loader2, Trophy } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface TeenSinBettingBoardProps {
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
    mid?: string | number;
    win?: "Player A" | "Player B" | "A" | "B" | string;
    winnerId?: string;
    round?: string | number;
    round_id?: string | number;
  }>;
  onResultClick?: (result: any) => void;
  loading?: boolean;
  tableId?: string;
}

const QUICK_CHIPS = [10, 50, 100, 500, 1000];

const formatOdds = (val: any) => {
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
      betName.includes(`winner ${normalized}`) ||
      betName.includes(`high card ${normalized}`) ||
      betName.includes(`highcard ${normalized}`) ||
      betName.includes(`pair ${normalized}`) ||
      betName.includes(`color plus ${normalized}`) ||
      betName.includes(`color+ ${normalized}`) ||
      betName.includes(`colorplus ${normalized}`) ||
      betName.includes(`lucky ${normalized}`) ||
      betName.includes(`lucky9 ${normalized}`) ||
      betName.includes(`lucky 9 ${normalized}`) ||
      (normalized.includes("lucky") && betName.includes("lucky"))
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

// Sanitize HTML for rules
const sanitizeHTML = (html: string): string => {
  if (!html) return "";
  let sanitized = html;
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son\w+='[^']*'/gi, "");
  return sanitized;
};

// Hardcoded rules for 29Card Baccarat
const TEENSIN_RULES = [
  {
    stype: "Main",
    rules: `
<div class="rules-section text-sm leading-relaxed space-y-2">
  <p class="font-semibold">29Card Baccarat Rules</p>
  <p>Here We use total of 29 cards:</p>
  <ul class="list-disc pl-4 space-y-1">
    <li>2*4 (All four color of 2)</li>
    <li>3*4 (All four color of 3)</li>
    <li>4*4 (All four color of 4)</li>
    <li>5*4</li>
    <li>6*4</li>
    <li>7*4</li>
    <li>8*4</li>
    <li>9 of spade</li>
  </ul>
  <p>It is played between two players A and B each player will get 3 cards.</p>
  <p class="font-semibold">To win regular bet there is two criteria:</p>
  <p class="font-semibold">1st:</p>
  <p>If any player has trio he will win if both have trio the one who has got higher trio will win.</p>
  <p class="font-semibold">2nd:</p>
  <p>If nobody has trio baccarat value will be compared. Higher baccarat value game will win.</p>
  <p>To get the baccarat value, from the total of three cards last digit will be taken as baccarat value.</p>
  <p class="font-semibold">Point Value of cards:</p>
  <ul class="list-disc pl-4 space-y-1">
    <li>2 = 2</li>
    <li>3 = 3</li>
    <li>4 = 4</li>
    <li>5 = 5</li>
    <li>6 = 6</li>
    <li>7 = 7</li>
    <li>8 = 8</li>
    <li>9 = 9</li>
  </ul>
  <p class="text-xs italic">Note: Suits doesn't matter in point value of cards</p>
  <p class="font-semibold">Example: 2,5,8</p>
  <p>2+5+8 = 15, here last digit is 5 so baccarat value is 5</p>
  <p>If the total is in single digit 2,2,3</p>
  <p>2+2+3 = 7, in this case the single digit 7 is considered as baccarat value</p>
  <p>If both players have same baccarat value then highest card of both the game will be compared whose card is higher will win.</p>
  <p>If 1st highest card is equal, then 2nd high card will be compared</p>
  <p>If 2nd highest card is equal, then 3rd high card will be compared</p>
  <p>If 3rd highest card is equal, then game will be tied and Money will be returned.</p>
</div>`
  },
  {
    stype: "Fancy",
    rules: `
<div class="rules-section text-sm leading-relaxed space-y-2">
  <p class="font-semibold">Fancy:</p>
  <p class="font-semibold">HIGH CARD:</p>
  <p>It is comparison of the high value card of both the game, the game having higher high value card then other game will win. If high value card is same the 2nd high card will be compared if 2nd high card is same then 3rd high card will be compared. If 3rd high card is same then game is tie.</p>
  <p class="font-semibold">Money return:</p>
  <p class="font-semibold">PAIR:</p>
  <p>You can bet for pair on any of your selected game</p>
  <p>Only condition is If you bet for pair you must have pair in that game.</p>
  <p class="font-semibold">Example:</p>
  <ul class="list-disc pl-4 space-y-1">
    <li>6,6,4</li>
    <li>5,5,2</li>
    <li>4,4,4 (trio will be also considered as a Pair)</li>
  </ul>
  <p class="font-semibold">LUCKY 9:</p>
  <p>It is bet for having card 9 among any of total six card of both games.</p>
  <p class="font-semibold">COLOR PLUS:</p>
  <p>You can bet for color plus on any game A or B.</p>
  <p>If you bet on color plus you get 4 option to win price:</p>
  <ul class="list-disc pl-4 space-y-1">
    <li>1. sequence 3,4,5 of different suit, You will get 2 times of betting amount.</li>
    <li>2. if you get color 3,5,7 of same suit, you will get 5 times of betting amount</li>
    <li>3. If you get trio 4,4,4, You will get 20 times of betting amount.</li>
    <li>4. If you get pure sequence 4,5,6 of same suit, You will get 30 times of betting amount.</li>
  </ul>
  <p class="font-semibold text-yellow-400">If you get pure sequence you will not get price of color and simple sequence. Means you will get only one price in any case.</p>
</div>`
  }
];

export const TeenSinBettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
  loading = false,
  tableId,
}: TeenSinBettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Detail result modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  // Parse cards (3+3 split)
  const parseCards = (cardString: string) => {
    if (!cardString) return [];
    const cards = cardString.split(",").map((c) => c.trim()).filter(Boolean);
    return cards.map((card) => {
      let rank = "";
      let suit = "";
      if (card.length >= 3) {
        if (card.length >= 4 && card.startsWith("10")) {
          rank = "10";
          suit = card.charAt(card.length - 1);
        } else {
          rank = card.substring(0, card.length - 2);
          suit = card.charAt(card.length - 1);
        }
      }
      const suitMap: Record<string, string> = { S: "♠", H: "♥", C: "♣", D: "♦" };
      const rankMap: Record<string, string> = { "1": "A", A: "A", K: "K", Q: "Q", J: "J" };
      const displayRank = rankMap[rank] || rank;
      const displaySuit = suitMap[suit] || suit;
      return {
        raw: card,
        rank: displayRank,
        suit: displaySuit,
        isRed: suit === "H" || suit === "D",
      };
    });
  };

  const fetchDetailResult = async (mid: string | number) => {
    const finalTableId = tableId || odds?.tableId || odds?.rawData?.gtype || odds?.data?.gtype || "teensin";
    setDetailLoading(true);
    setDetailData(null);
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: {
          action: "get-detail-result",
          tableId: finalTableId,
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

  const handleResultClick = (result: any) => {
    const mid = result.mid || result.round || result.round_id;
    setSelectedResult(result);
    setDetailDialogOpen(true);
    if (mid) {
      fetchDetailResult(mid);
    }
    onResultClick?.(result);
  };

  // Extract bets from multiple sources
  const actualBets = useMemo(() => {
    if (Array.isArray(bets) && bets.length > 0) return bets;
    if (odds?.bets && Array.isArray(odds.bets)) return odds.bets;
    if (odds?.data?.sub && Array.isArray(odds.data.sub)) return odds.data.sub;
    if (odds?.sub && Array.isArray(odds.sub)) return odds.sub;
    return bets || [];
  }, [bets, odds]);

  // Find Player A bets
  const winnerA = findBet(actualBets, "winner a") || findBet(actualBets, "player a") || findBet(actualBets, "a");
  const highCardA = findBet(actualBets, "high card a") || findBet(actualBets, "highcard a");
  const pairA = findBet(actualBets, "pair a");
  const colorPlusA = findBet(actualBets, "color plus a") || findBet(actualBets, "color+ a") || findBet(actualBets, "colorplus a");

  // Find Player B bets
  const winnerB = findBet(actualBets, "winner b") || findBet(actualBets, "player b") || findBet(actualBets, "b");
  const highCardB = findBet(actualBets, "high card b") || findBet(actualBets, "highcard b");
  const pairB = findBet(actualBets, "pair b");
  const colorPlusB = findBet(actualBets, "color plus b") || findBet(actualBets, "color+ b") || findBet(actualBets, "colorplus b");

  // Find Lucky 9 bets
  // First, try to find the base "LUCKY 9" bet (without A/B)
  const lucky9Base = findBet(bets, "lucky 9") || findBet(bets, "lucky9") || findBet(bets, "lucky");
  
  // Then try to find separate A/B bets
  const lucky9A = findBet(bets, "lucky 9 a") || findBet(bets, "lucky9 a") || findBet(bets, "lucky a") || 
                  findBet(bets, "lucky9a") || 
                  bets.find((b: any) => {
                    const betName = (b.nat || b.type || "").toLowerCase().trim();
                    return betName.includes("lucky") && betName.includes("9") && (betName.includes(" a") || betName.endsWith("a") || betName.includes("player a"));
                  });
  const lucky9B = findBet(bets, "lucky 9 b") || findBet(bets, "lucky9 b") || findBet(bets, "lucky b") || 
                  findBet(bets, "lucky9b") || 
                  bets.find((b: any) => {
                    const betName = (b.nat || b.type || "").toLowerCase().trim();
                    return betName.includes("lucky") && betName.includes("9") && (betName.includes(" b") || betName.endsWith("b") || betName.includes("player b"));
                  });
  
  // Debug: Log what we found
  if (lucky9A || lucky9B || lucky9Base) {
    console.log("🎰 [TeenSin] Lucky 9 bets found:", {
      lucky9A: lucky9A ? { nat: lucky9A.nat, back: getBackOdds(lucky9A) } : null,
      lucky9B: lucky9B ? { nat: lucky9B.nat, back: getBackOdds(lucky9B) } : null,
      lucky9Base: lucky9Base ? { nat: lucky9Base.nat, back: getBackOdds(lucky9Base) } : null,
    });
  }

  const handleBetClick = (bet: any, betName: string, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    setSelectedBetData({ ...bet, side });
    setSelectedBet(`${betName}-${side}`);
    setModalOpen(true);
  };

  const handlePlace = async () => {
    if (!selectedBetData || !amount || parseFloat(amount) <= 0 || locked || loading) return;
    
    const amt = parseFloat(amount);
    const side = selectedBetData?.side || "back";
    const oddsValue = side === "back" 
      ? Number(getBackOdds(selectedBetData))
      : Number(getLayOdds(selectedBetData));
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
    
    // Extract roundId
    const roundIdFromBet = selectedBetData?.mid || selectedBetData?.round_id || selectedBetData?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds = raw?.mid || raw?.round_id || raw?.round || raw?.gmid || raw?.game_id ||
                           odds?.mid || odds?.round_id || odds?.round || odds?.gmid || odds?.game_id;
    const roundIdFromFirstBet = actualBets.length > 0 && (actualBets[0]?.mid || actualBets[0]?.round_id || actualBets[0]?.round);
    const finalRoundId = roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;

    // Map bet to correct backend format
    let betType = selectedBetData?.nat || selectedBetData?.type || "";
    const betName = selectedBet.split("-")[0].toLowerCase();
    
    // If bet.nat is not in correct format, map it based on bet name
    if (!betType || betType === "") {
      if (betName.includes("winner")) {
        // Winner bet - map to BA/BB based on which player
        if (betName.includes("player a") || betName.includes("a")) {
          betType = side === "back" ? "BA" : "LA";
        } else if (betName.includes("player b") || betName.includes("b")) {
          betType = side === "back" ? "BB" : "LB";
        }
      } else if (betName.includes("high card") || betName.includes("highcard")) {
        // High Card bet
        if (betName.includes("player a") || betName.includes("a")) {
          betType = "HIGH CARD A";
        } else if (betName.includes("player b") || betName.includes("b")) {
          betType = "HIGH CARD B";
        }
      } else if (betName.includes("pair")) {
        // Pair bet
        if (betName.includes("player a") || betName.includes("a")) {
          betType = "PAIR A";
        } else if (betName.includes("player b") || betName.includes("b")) {
          betType = "PAIR B";
        }
      } else if (betName.includes("lucky 9") || betName.includes("lucky9")) {
        // Lucky 9 bet (no A/B needed, but we can add it for clarity)
        betType = "LUCKY 9";
      } else if (betName.includes("color plus") || betName.includes("color+") || betName.includes("colorplus")) {
        // Color Plus bet
        if (betName.includes("player a") || betName.includes("a")) {
          betType = "COLOR PLUS A";
        } else if (betName.includes("player b") || betName.includes("b")) {
          betType = "COLOR PLUS B";
        }
      }
    }

    await onPlaceBet({
      betType: betType || selectedBet.split("-")[0],
      amount: Math.min(Math.max(amt, min), max),
      odds: finalOdds,
      roundId: finalRoundId,
      sid: selectedBetData?.sid,
      side: side,
    });
    
    setModalOpen(false);
    setSelectedBet("");
    setAmount(String(min));
    setSelectedBetData(null);
  };

  const last10 = resultHistory.slice(0, 10);

  const renderBetCell = (bet: any, label: string, disabled: boolean) => {
    const backOdds = formatOdds(getBackOdds(bet));
    const isDisabled = disabled || backOdds === "0.00";
    
    return (
      <button
        onClick={() => handleBetClick(bet, label, "back")}
        disabled={isDisabled}
        className={`w-full h-[40px] sm:h-[50px] rounded transition-all ${
          isDisabled
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-blue-400 hover:bg-blue-500 text-white font-bold shadow-md hover:shadow-lg"
        } text-sm sm:text-base`}
      >
        {isDisabled ? (
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
        ) : (
          backOdds === "0.00" ? "0" : backOdds
        )}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Teen Sin Betting</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= BETTING OPTIONS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative mb-2">
            {[
              { 
                label: "Player A", 
                winnerBet: winnerA, 
                highCardBet: highCardA, 
                pairBet: pairA, 
                colorPlusBet: colorPlusA,
                playerId: "A"
              },
              { 
                label: "Player B", 
                winnerBet: winnerB, 
                highCardBet: highCardB, 
                pairBet: pairB, 
                colorPlusBet: colorPlusB,
                playerId: "B"
              },
            ].map(({ label, winnerBet, highCardBet, pairBet, colorPlusBet, playerId }) => {
              const winnerDisabled = locked || isSuspended(winnerBet);
              const highCardDisabled = locked || isSuspended(highCardBet);
              const pairDisabled = locked || isSuspended(pairBet);
              const colorPlusDisabled = locked || isSuspended(colorPlusBet);

              return (
                <div key={label} className="border rounded-lg overflow-hidden bg-muted/20">
                  {/* Header */}
                  <div className="bg-gray-200/50 text-gray-800 font-bold text-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm">
                    {label}
                  </div>

                  {/* Table */}
                  <div className="p-2 sm:p-3">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-200/50">
                          <th className="px-2 py-1.5 text-left text-[10px] sm:text-xs font-semibold">Winner</th>
                          <th className="px-2 py-1.5 text-center text-[10px] sm:text-xs font-semibold">High Card</th>
                          <th className="px-2 py-1.5 text-center text-[10px] sm:text-xs font-semibold">Pair</th>
                          <th className="px-2 py-1.5 text-center text-[10px] sm:text-xs font-semibold">Color Plus</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-blue-400/20">
                          <td className="px-2 py-2">
                            {renderBetCell(winnerBet, `${label} Winner`, winnerDisabled)}
                          </td>
                          <td className="px-2 py-2">
                            {renderBetCell(highCardBet, `${label} High Card`, highCardDisabled)}
                          </td>
                          <td className="px-2 py-2">
                            {renderBetCell(pairBet, `${label} Pair`, pairDisabled)}
                          </td>
                          <td className="px-2 py-2">
                            {renderBetCell(colorPlusBet, `${label} Color Plus`, colorPlusDisabled)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Lucky 9 Section */}
      <div className="mb-2">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Lucky 9 Logo/Title */}
          <div className="flex items-center gap-2">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600" style={{ fontFamily: 'cursive' }}>
              Lucky
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-lg border-2 border-white flex items-center justify-center text-white text-xl sm:text-2xl font-bold relative">
              9
              {/* Decorative lights around the 9 */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="absolute -top-1 right-0 w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-1 right-0 w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="absolute top-0 -right-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="absolute bottom-0 -right-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="absolute top-0 -left-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="absolute bottom-0 -left-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
          </div>

          {/* Two Bars */}
          <div className="flex gap-3 sm:gap-4 flex-1">
            {/* Player A Lucky 9 - Back Odds */}
            <button
              onClick={() => handleBetClick(lucky9A || lucky9Base, "Lucky 9 A", "back")}
              disabled={locked || loading || isSuspended(lucky9A || lucky9Base) || !(lucky9A || lucky9Base)}
              className={`flex-1 h-12 sm:h-14 rounded-lg px-4 flex items-center justify-center font-bold text-white text-lg sm:text-xl transition-all ${
                locked || loading || isSuspended(lucky9A || lucky9Base) || !(lucky9A || lucky9Base)
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-400 hover:bg-blue-500 shadow-md hover:shadow-lg"
              }`}
            >
              {locked || loading || isSuspended(lucky9A || lucky9Base) || !(lucky9A || lucky9Base) ? (
                <Lock className="w-5 h-5" />
              ) : (
                formatOdds(getBackOdds(lucky9A || lucky9Base))
              )}
            </button>

            {/* Player B Lucky 9 - Lay Odds */}
            <button
              onClick={() => handleBetClick(lucky9B || lucky9Base, "Lucky 9 B", "lay")}
              disabled={locked || loading || isSuspended(lucky9B || lucky9Base) || !(lucky9B || lucky9Base)}
              className={`flex-1 h-12 sm:h-14 rounded-lg px-4 flex items-center justify-center font-bold text-white text-lg sm:text-xl transition-all ${
                locked || loading || isSuspended(lucky9B || lucky9Base) || !(lucky9B || lucky9Base)
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-pink-400 hover:bg-pink-500 shadow-md hover:shadow-lg"
              }`}
            >
              {locked || loading || isSuspended(lucky9B || lucky9Base) || !(lucky9B || lucky9Base) ? (
                <Lock className="w-5 h-5" />
              ) : (
                formatOdds(getLayOdds(lucky9B || lucky9Base))
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10.map((r, i) => {
              // Handle different win formats: "1"/"2", "Player A"/"Player B", "A"/"B"
              const winValue = r.win?.toString() || r.winnerId?.toString() || "";
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

      {/* Bet Confirmation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex flex-row justify-between items-center">
            <h2 className="text-lg font-semibold text-white m-0">Place Bet</h2>
            <button
              onClick={() => setModalOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>

          {selectedBetData && (
            <div className="p-6 space-y-5 bg-white dark:bg-gray-900">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Bet Type</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedBetData.nat || selectedBetData.type || "Unknown"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Odds:</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(
                      selectedBetData?.side === "lay"
                        ? getLayOdds(selectedBetData)
                        : getBackOdds(selectedBetData)
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
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Potential Win</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{(
                      (parseFloat(amount) || 0) *
                      (() => {
                        const side = selectedBetData?.side || "back";
                        const oddsValue = side === "lay"
                          ? Number(getLayOdds(selectedBetData))
                          : Number(getBackOdds(selectedBetData));
                        return oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                      })()
                    ).toFixed(2)}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={locked || loading || !selectedBetData || parseFloat(amount) <= 0 || parseFloat(amount) < min || parseFloat(amount) > max}
                onClick={handlePlace}
              >
                {loading ? (
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

      {/* Detail Result Modal */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-white m-0">29Card Baccarat Result</h2>
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
                  const t1Data = detailData?.data?.t1 || detailData?.t1 || null;
                  if (!t1Data) {
                    return <div className="text-center py-8 text-muted-foreground">No detailed result data available</div>;
                  }
                  const cardString = t1Data.card || "";
                  const allCards = parseCards(cardString);
                  const playerACards = allCards.slice(0, 3);
                  const playerBCards = allCards.slice(3, 6);
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
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Player A</h3>
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
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Player B</h3>
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

                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center shadow-md">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          Winner: <span className="text-green-600 dark:text-green-400">{isPlayerAWinner ? "Player A" : isPlayerBWinner ? "Player B" : winner || "N/A"}</span>
                        </p>
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

      {/* Rules Modal */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-gray-900 dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex flex-row justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-semibold text-white m-0">29Card Baccarat Rules</h2>
            <button
              onClick={() => setRulesOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            {TEENSIN_RULES.length > 0 ? (
              <div className="space-y-4">
                {TEENSIN_RULES.map((rule, index) => (
                  <div key={index} className="border-b border-gray-800 pb-4 last:border-b-0 last:pb-0 text-gray-100">
                    <div
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(rule.rules || "") }}
                      className="rules-section"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No rules available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
