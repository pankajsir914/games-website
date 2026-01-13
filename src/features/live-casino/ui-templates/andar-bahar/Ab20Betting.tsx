import { Lock, Info, X, Loader2 } from "lucide-react";
import { memo, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ===============================
   CONSTANTS
================================ */

const CARD_ORDER = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const MOBILE_FIRST_ROW = CARD_ORDER.slice(0, 6);
const MOBILE_SECOND_ROW = CARD_ORDER.slice(6);

const SUITS = ["♠", "♥", "♦", "♣"];

const suitColor = (s: string) =>
  s === "♥" || s === "♦" ? "text-red-600" : "text-black";

/* ===============================
   TYPES
================================ */

type Bet = {
  sid?: number | string;
  nat?: string;
  type?: string;
  back?: number;
  l?: number;
  odds?: number;
  gstatus?: string;
  status?: string;
  [key: string]: any;
};

/* ===============================
   COMPONENT
================================ */

const QUICK_CHIPS = [50, 100, 500, 1000];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const Ab20BettingComponent = ({
  betTypes = [],
  tableData,
  onSelect,
  onPlaceBet,
  formatOdds: customFormatOdds = formatOdds,
  loading = false,
  resultHistory = [],
  onResultClick,
  min = 10,
  max = 100000,
}: any) => {

  /* =========================
     STATE
  ========================= */

  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState(String(min));
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const [highlight, setHighlight] = useState<{
    andar: Set<string>;
    bahar: Set<string>;
  }>({
    andar: new Set(),
    bahar: new Set(),
  });

  /* =========================
     CARD PARSING
  ========================= */

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

  /* =========================
     RESULT → UI MAPPING
  ========================= */

  useEffect(() => {
    if (!tableData?.card) return;

    const cards = tableData.card.split(",");
    const ares = tableData.ares?.split(",").map(Number) || [];
    const bres = tableData.bres?.split(",").map(Number) || [];

    const andarSet = new Set<string>();
    const baharSet = new Set<string>();

    cards.forEach((c: string, i: number) => {
      const rank = c.slice(0, c.length - 2);
      if (ares[i] > 0) andarSet.add(rank);
      if (bres[i] > 0) baharSet.add(rank);
    });

    setHighlight({ andar: andarSet, bahar: baharSet });
  }, [tableData]);

  /* =========================
     RESULT HANDLING
  ========================= */

  const handleResultClick = (result: any) => {
    setSelectedResult(result);
    setResultDialogOpen(true);
    onResultClick?.(result);
  };

  const last10 = useMemo(() => (Array.isArray(resultHistory) ? resultHistory.slice(0, 10) : []), [resultHistory]);

  /* =========================
     BET FINDER
  ========================= */

  const getBet = (side: "andar" | "bahar", card: string): Bet | null =>
    betTypes.find((b: any) => {
      const nat = (b?.nat || b?.type || "").toLowerCase();
      return nat === `${side} ${card.toLowerCase()}`;
    }) || null;

  /* =========================
     CARD CELL
  ========================= */

  const CardCell = ({ side, card }: { side: "andar" | "bahar"; card: string }) => {
    const bet = getBet(side, card);
    const suspended = bet?.gstatus === "SUSPENDED";
    const opened = highlight[side].has(card);
    const odds = bet?.back ?? bet?.l ?? bet?.odds ?? 0;

    const handleClick = () => {
      if (suspended) return;

      const payload = {
        ...bet,
        type: `${side} ${card}`,
        nat: `${side} ${card}`,
        cardSide: side,
        cardValue: card,
        odds,
      };

      setSelectedBet(payload);
      setModalOpen(true);
      onSelect?.(payload, "back");
    };

    const oddsValue = odds ? customFormatOdds(odds) : "--";

    return (
      <div
        onClick={handleClick}
        className={`
          relative w-[56px] h-[82px]
          rounded-lg flex flex-col items-center justify-between
          font-bold text-sm
          transition-colors duration-150
          ${side === "andar"
            ? "bg-[#2e1f1f] text-white hover:bg-[#3a2626]"
            : "bg-[#ffe08a] text-black hover:bg-[#ffeaad]"}
          ${opened ? "ring-2 ring-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : ""}
          ${suspended
            ? "opacity-40 cursor-not-allowed"
            : "cursor-pointer"}
        `}
      >
        <div className="pt-1">{card}</div>

        <div className="grid grid-cols-2 text-[13px]">
          {SUITS.map((s) => (
            <span key={s} className={suitColor(s)}>{s}</span>
          ))}
        </div>

        <div className="pb-1 text-xs">
          {oddsValue}
        </div>

        {suspended && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  /* =========================
     DESKTOP ROW
  ========================= */

  const renderDesktopRow = (side: "andar" | "bahar") => (
    <div className="space-y-2 hidden sm:block">
      <div
        className={`text-center py-2 font-bold rounded
        ${side === "andar"
          ? "bg-[#3b1f1f] text-white"
          : "bg-yellow-400 text-black"}`}
      >
        {side.toUpperCase()}
        {side === "bahar" && (
          <span className="ml-2 text-xs">(1st Card → 25%)</span>
        )}
      </div>

      <div className="flex justify-between gap-2 px-2">
        {CARD_ORDER.map((c) => (
          <CardCell key={`${side}-${c}`} side={side} card={c} />
        ))}
      </div>
    </div>
  );

  /* =========================
     MOBILE ROW (6 + 7)
  ========================= */

  const renderMobileRow = (side: "andar" | "bahar") => (
    <div className="space-y-2 sm:hidden">
      <div
        className={`text-center py-2 font-bold rounded text-sm
        ${side === "andar"
          ? "bg-[#3b1f1f] text-white"
          : "bg-yellow-400 text-black"}`}
      >
        {side.toUpperCase()}
        {side === "bahar" && (
          <span className="ml-1 text-[10px]">(1st 25%)</span>
        )}
      </div>

      <div className="flex justify-center gap-1">
        {MOBILE_FIRST_ROW.map((c) => (
          <CardCell key={`m1-${side}-${c}`} side={side} card={c} />
        ))}
      </div>

      <div className="flex justify-center gap-1">
        {MOBILE_SECOND_ROW.map((c) => (
          <CardCell key={`m2-${side}-${c}`} side={side} card={c} />
        ))}
      </div>
    </div>
  );

  /* =========================
     HANDLE PLACE BET
  ========================= */

  const handlePlace = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0 || loading) return;

    const amt = parseFloat(amount);
    const oddsValue = Number(selectedBet?.odds || selectedBet?.back || selectedBet?.l || 0);
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;

    await onPlaceBet?.({
      amount: Math.min(Math.max(amt, min), max),
      betType: selectedBet?.type || selectedBet?.nat,
      odds: finalOdds,
      sid: selectedBet?.sid,
    });

    setModalOpen(false);
    setSelectedBet(null);
    setAmount(String(min));
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Andar Bahar 20 Bets</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= BETTING OPTIONS ================= */}
      <div className="space-y-6 mb-2">
        {renderMobileRow("andar")}
        {renderDesktopRow("andar")}

        {renderMobileRow("bahar")}
        {renderDesktopRow("bahar")}
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10.map((r, i) => {
              const winValue = r.win?.toString() || r.winnerId?.toString() || r.result || "";
              const isAndar = 
                winValue === "1" || 
                winValue === "Andar" || 
                winValue === "A" ||
                winValue.toLowerCase() === "andar" ||
                (r.winnerId && r.winnerId.toString() === "1");
              const winner = isAndar ? "A" : "B";
              
              return (
                <button
                  key={r.mid || r.round || r.round_id || i}
                  onClick={() => handleResultClick(r)}
                  className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm active:opacity-80 touch-none ${
                    isAndar
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

          {selectedBet && (
            <div className="p-6 space-y-5 bg-white dark:bg-gray-900">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Bet Type</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedBet.cardSide?.toUpperCase()} {selectedBet.cardValue}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Odds:</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {customFormatOdds(selectedBet.odds || selectedBet.back || selectedBet.l || 0)}
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
                        const oddsValue = Number(selectedBet?.odds || selectedBet?.back || selectedBet?.l || 0);
                        return oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                      })()
                    ).toFixed(2)}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !selectedBet || parseFloat(amount) <= 0 || parseFloat(amount) < min || parseFloat(amount) > max}
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

      {/* Result Modal */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-white m-0">Andar Bahar Result</h2>
            <button
              onClick={() => setResultDialogOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-700 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-6 bg-white dark:bg-gray-900">
            {selectedResult ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm border-b pb-3">
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Round Id: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-mono">
                      {selectedResult.mid || selectedResult.round_id || selectedResult.round || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Match Time: </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {selectedResult.mtime || selectedResult.match_time || "N/A"}
                    </span>
                  </div>
                </div>

                {selectedResult.card ? (
                  <>
                    {(() => {
                      const allCards = parseCards(selectedResult.card);
                      const topRow = allCards.slice(0, 8);
                      const bottomRow = allCards.slice(8, 17);

                      return (
                        <div className="space-y-4">
                          {/* Top Row */}
                          <div className="flex justify-center gap-2 flex-wrap">
                            {topRow.map((card, idx) => (
                              <div
                                key={idx}
                                className="w-12 h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                              >
                                <span className={`text-sm font-bold ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                                  {card.rank}
                                </span>
                                <span className={`text-lg ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                                  {card.suit}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Bottom Row */}
                          <div className="flex justify-center gap-2 flex-wrap">
                            {bottomRow.map((card, idx) => (
                              <div
                                key={idx + 8}
                                className="w-12 h-16 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                              >
                                <span className={`text-sm font-bold ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                                  {card.rank}
                                </span>
                                <span className={`text-lg ${card.isRed ? "text-red-600" : "text-black dark:text-white"}`}>
                                  {card.suit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Winner Field */}
                    <div className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Winner {(() => {
                          const ares = selectedResult.ares?.split(",").map(Number) || [];
                          const bres = selectedResult.bres?.split(",").map(Number) || [];
                          const winners: number[] = [];
                          // Collect winning positions/values
                          ares.forEach((val: number, idx: number) => {
                            if (val > 0) {
                              // Use the actual value if it's meaningful, otherwise use position
                              winners.push(val > 100 ? val : idx + 1);
                            }
                          });
                          bres.forEach((val: number, idx: number) => {
                            if (val > 0) {
                              // Use the actual value if it's meaningful, otherwise use position
                              winners.push(val > 100 ? val : idx + 14);
                            }
                          });
                          // If no winners from ares/bres, try to get from win field
                          if (winners.length === 0 && selectedResult.win) {
                            return selectedResult.win;
                          }
                          return winners.length > 0 ? winners.join(",") : "N/A";
                        })()}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No card data available
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No result data available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rules Modal - Blank */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-gray-900 dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex flex-row justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-semibold text-white m-0">Andar Bahar 20 Rules</h2>
            <button
              onClick={() => setRulesOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No rules available</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const Ab20Betting = memo(Ab20BettingComponent);
