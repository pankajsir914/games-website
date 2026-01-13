import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Info, X, Loader2, Trophy } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface TeenmufBettingBoardProps {
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
    round?: string | number;
    round_id?: string | number;
  }>;
  onResultClick?: (result: any) => void;
  loading?: boolean;
  tableId?: string;
}

const QUICK_CHIPS = [50, 100, 500, 1000];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const isSuspended = (bet: any) =>
  !bet || bet?.gstatus === "SUSPENDED" || bet?.status === "suspended";

const sanitizeHTML = (html: string): string => {
  if (!html) return "";
  let sanitized = html;
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son\w+='[^']*'/gi, "");
  return sanitized;
};

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
      betName.includes(`top 9 ${normalized}`) ||
      betName.includes(`m baccarat ${normalized}`) ||
      betName.includes(`mini baccarat ${normalized}`)
    );
  });
};

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

// Hardcoded rules for Muflis Teenpatti
const TEENMUF_RULES = [
  {
    stype: "Main",
    rules: `
<div class="rules-section text-sm leading-relaxed space-y-2">
  <p class="font-semibold">Main Bet:</p>
  <ul class="list-disc pl-4 space-y-1">
    <li>It is played with regular 52 card deck between two teams A & B.</li>
    <li>Lowest of the 2 games will win.</li>
    <li>In regular teenpatti 2] 3} 5{ of different color(suits) is the lowest game, But in this game it is the best game.</li>
    <li>In regular teenpatti Q} K} A} of same color(suits) is the highest game, But it is the worst game.</li>
  </ul>
</div>`
  },
  {
    stype: "Fancy",
    rules: `
<div class="rules-section text-sm leading-relaxed space-y-2">
  <p class="font-semibold">Fancy: TOP9</p>
  <p>Here, 2 conditions apply:</p>
  <p class="font-semibold">Condition 1</p>
  <p>Game must not have Pair, Color, Sequence, Trio, Pure sequence.</p>
  <p class="font-semibold">Condition 2</p>
  <ul class="list-disc pl-4 space-y-1">
    <li>If your game has the highest card of 9, you will receive triple(x3) amount of your betting value.</li>
    <li>If your game has the highest card of 8, you will receive quadruple(x4) amount of your betting value.</li>
    <li>If your game has the highest card of 7, you will receive (x5) amount of your betting value.</li>
    <li>If your game has the highest card of 6, you will receive (x8) amount of your betting value.</li>
    <li>If your game has the highest card of 5, you will receive (x30) amount of your betting value.</li>
  </ul>
</div>`
  },
  {
    stype: "M Baccarat",
    rules: `
<div class="rules-section text-sm leading-relaxed space-y-2">
  <p class="font-semibold">M (muflis) baccarat:</p>
  <p>Baccarat is where you take the last digit of the total of the 3 cards of the game.</p>
  <p class="font-semibold">Value of cards are:</p>
  <ul class="list-disc pl-4 space-y-1">
    <li>Ace = 1 point</li>
    <li>2 = 2 point</li>
    <li>3 = 3 point</li>
    <li>4 = 4 point</li>
    <li>5 = 5 point</li>
    <li>6 = 6 point</li>
    <li>7 = 7 point</li>
    <li>8 = 8 point</li>
    <li>9 = 9 point</li>
    <li>10 , Jack , Queen, King = 0 point (suit/color doesn’t matter for points)</li>
  </ul>
  <p class="font-semibold">Example 1:</p>
  <p>Game is 2 ,5 ,8 → 2 + 5 + 8 = 15 → last digit 5 → baccarat value 5</p>
  <p class="font-semibold">Example 2:</p>
  <p>Game is 1, 4, K → 1 + 4 + 0 = 5 → single digit 5 → baccarat value 5</p>
  <p>M baccarat is comparison of baccarat value of both the game. Lower value baccarat will win.</p>
  <p>If baccarat value is tie of both the game then, game having lowest card will win. Ace is highest card, 2 is lowest card.</p>
  <p>If lowest card of both game is equal then color will be compared (Diamond < Club < Heart < Spade).</p>
  <p class="font-semibold">Example:</p>
  <p>If baccarat tie & lowest card of game A is 2{ and lowest card of game B is 2[ then game B will win.</p>
</div>`
  }
];

export const TeenmufBettingBoard = ({
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
}: TeenmufBettingBoardProps) => {
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

  // parse cards (3+3 split)
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
    const finalTableId = tableId || odds?.tableId || odds?.rawData?.gtype || odds?.data?.gtype || "teenmuf";
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

  // Find Player A bets
  const actualBets = useMemo(() => {
    if (Array.isArray(bets) && bets.length > 0) return bets;
    if (odds?.bets && Array.isArray(odds.bets)) return odds.bets;
    if (odds?.data?.sub && Array.isArray(odds.data.sub)) return odds.data.sub;
    if (odds?.sub && Array.isArray(odds.sub)) return odds.sub;
    return bets || [];
  }, [bets, odds]);

  const winnerA = findBet(actualBets, "winner a") || findBet(actualBets, "player a") || findBet(actualBets, "a");
  const top9A = findBet(actualBets, "top 9 a") || findBet(actualBets, "top9 a");
  const mBaccaratA =
    findBet(actualBets, "m baccarat a") ||
    findBet(actualBets, "mini baccarat a") ||
    findBet(actualBets, "baccarat a");

  // Find Player B bets
  const winnerB = findBet(actualBets, "winner b") || findBet(actualBets, "player b") || findBet(actualBets, "b");
  const top9B = findBet(actualBets, "top 9 b") || findBet(actualBets, "top9 b");
  const mBaccaratB =
    findBet(actualBets, "m baccarat b") ||
    findBet(actualBets, "mini baccarat b") ||
    findBet(actualBets, "baccarat b");

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
    const oddsValue = side === "back" ? Number(getBackOdds(selectedBetData)) : Number(getLayOdds(selectedBetData));
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;

    const roundIdFromBet = selectedBetData?.mid || selectedBetData?.round_id || selectedBetData?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds =
      raw?.mid ||
      raw?.round_id ||
      raw?.round ||
      raw?.gmid ||
      raw?.game_id ||
      odds?.mid ||
      odds?.round_id ||
      odds?.round ||
      odds?.gmid ||
      odds?.game_id;
    const roundIdFromFirstBet = actualBets.length > 0 && (actualBets[0]?.mid || actualBets[0]?.round_id || actualBets[0]?.round);
    const finalRoundId = roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;

    await onPlaceBet({
      betType: selectedBetData?.nat || selectedBetData?.type || selectedBet.split("-")[0],
      amount: Math.min(Math.max(amt, min), max),
      odds: finalOdds,
      roundId: finalRoundId,
      sid: selectedBetData?.sid,
      side,
    });

    setModalOpen(false);
    setSelectedBet("");
    setAmount(String(min));
    setSelectedBetData(null);
  };

  const last10 = useMemo(() => (Array.isArray(resultHistory) ? resultHistory.slice(0, 10) : []), [resultHistory]);

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
        <h3 className="text-sm font-semibold">Teen Muf Bets</h3>
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
                top9Bet: top9A, 
                mBaccaratBet: mBaccaratA,
                playerId: "A"
              },
              { 
                label: "Player B", 
                winnerBet: winnerB, 
                top9Bet: top9B, 
                mBaccaratBet: mBaccaratB,
                playerId: "B"
              },
            ].map(({ label, winnerBet, top9Bet, mBaccaratBet, playerId }) => {
              const winnerDisabled = locked || isSuspended(winnerBet);
              const top9Disabled = locked || isSuspended(top9Bet);
              const mBaccaratDisabled = locked || isSuspended(mBaccaratBet);

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
                          <th className="px-2 py-1.5 text-center text-[10px] sm:text-xs font-semibold">Top 9</th>
                          <th className="px-2 py-1.5 text-center text-[10px] sm:text-xs font-semibold">M Baccarat {playerId}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-blue-400/20">
                          <td className="px-2 py-2">
                            {renderBetCell(winnerBet, `${label} Winner`, winnerDisabled)}
                          </td>
                          <td className="px-2 py-2">
                            {renderBetCell(top9Bet, `${label} Top 9`, top9Disabled)}
                          </td>
                          <td className="px-2 py-2">
                            {renderBetCell(mBaccaratBet, `${label} M Baccarat`, mBaccaratDisabled)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
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
                    {formatOdds(getBackOdds(selectedBetData))}
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
                      parseFloat(amount) *
                      (() => {
                        const oddsValue = Number(getBackOdds(selectedBetData));
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
            <h2 className="text-lg font-semibold text-white m-0">Muflis Teenpatti Result</h2>
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
            <h2 className="text-lg font-semibold text-white m-0">Muflis Teenpatti Rules</h2>
            <button
              onClick={() => setRulesOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            {TEENMUF_RULES.length > 0 ? (
              <div className="space-y-4">
                {TEENMUF_RULES.map((rule, index) => (
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
