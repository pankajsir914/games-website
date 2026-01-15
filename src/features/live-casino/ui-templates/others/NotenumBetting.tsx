// src/features/live-casino/ui-templates/others/NotenumBetting.tsx

import { Lock, Info, X, Loader2 } from "lucide-react";
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

interface NotenumBettingProps {
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
    return betNat === searchTerm || betNat.includes(searchTerm);
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

// Card definitions
const ODD_CARDS = ["A", "3", "5", "7", "9"];
const EVEN_CARDS = ["2", "4", "6", "8", "10"];
const LOW_CARDS = ["A", "2", "3", "4", "5"];
const HIGH_CARDS = ["6", "7", "8", "9", "10"];

/* ================= COMPONENT ================= */

export const NotenumBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
  resultHistory = [],
  currentResult,
  tableId,
}: NotenumBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [selectedCardBet, setSelectedCardBet] = useState<any>(null);
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
    
    return results.slice(0, 10);
  }, [resultHistory, currentResult]);

  // Extract bets from multiple possible sources
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

  const oddCardBet = find(actualBetTypes, "Odd Card");
  const evenCardBet = find(actualBetTypes, "Even Card");
  const blackCardBet = find(actualBetTypes, "Black Card");
  const redCardBet = find(actualBetTypes, "Red Card");
  const lowCardBet = find(actualBetTypes, "Low Card");
  const highCardBet = find(actualBetTypes, "High Card");
  const baccarat1Bet = find(actualBetTypes, "Baccarat 1");
  const baccarat2Bet = find(actualBetTypes, "Baccarat 2");
  const card1Bet = find(actualBetTypes, "Card 1");

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedSide(side);
    setSelectedCardBet(null);
    setAmount("100");
    setBetModalOpen(true);
  };

  const openCardBetModal = (cardBet: any, parentBet: any) => {
    if (!cardBet || !parentBet || isSuspended(parentBet)) return;
    const oddsValue = getOdds(cardBet);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(parentBet);
    setSelectedCardBet(cardBet);
    setSelectedSide("back");
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    // For fixed point cards, use ssid from the card bet
    const payload: any = {
      sid: selectedBet.sid,
      odds: selectedCardBet ? getOdds(selectedCardBet) : getOdds(selectedBet, selectedSide),
      nat: selectedCardBet ? selectedCardBet.nat : selectedBet.nat,
      amount: parseFloat(amount),
      side: selectedSide,
    };

    if (selectedCardBet) {
      payload.ssid = selectedCardBet.ssid;
    }

    await onPlaceBet(payload);

    setBetModalOpen(false);
    setSelectedBet(null);
    setSelectedCardBet(null);
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

  const CardDisplay = ({ cards }: { cards: string[] }) => (
    <div className="flex gap-1 mb-2">
      {cards.map((card) => (
        <div
          key={card}
          className="border-2 border-yellow-400 bg-white px-2 py-1 text-xs font-semibold text-gray-900 rounded"
        >
          {card}
        </div>
      ))}
    </div>
  );

  const CardAttributeSection = ({
    title,
    bet,
    cards,
    showSuitIcons = false,
    suitType,
  }: {
    title: string;
    bet: any;
    cards?: string[];
    showSuitIcons?: boolean;
    suitType?: "black" | "red";
  }) => {
    const suspended = isSuspended(bet);

    return (
      <div className="border p-2">
        <div className="text-xs font-semibold mb-2">{title}</div>
        {cards && <CardDisplay cards={cards} />}
        {showSuitIcons && (
          <div className="flex gap-2 mb-2 justify-center">
            {suitType === "black" ? (
              <>
                <span className="text-2xl">♠</span>
                <span className="text-2xl">♣</span>
              </>
            ) : (
              <>
                <span className="text-2xl text-red-500">♥</span>
                <span className="text-2xl text-red-500">♦</span>
              </>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1">
          <OddsCell bet={bet} side="back" />
          <OddsCell bet={bet} side="lay" />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Note Number</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= TOP SECTION - CARD ATTRIBUTES ================= */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Left - Odd/Even */}
        <div className="space-y-2">
          <CardAttributeSection
            title="Odd Card 3"
            bet={oddCardBet}
            cards={ODD_CARDS}
          />
          <CardAttributeSection
            title="Even Card 3"
            bet={evenCardBet}
            cards={EVEN_CARDS}
          />
        </div>

        {/* Middle - Red/Black */}
        <div className="space-y-2">
          <CardAttributeSection
            title="Black Card"
            bet={blackCardBet}
            showSuitIcons={true}
            suitType="black"
          />
          <CardAttributeSection
            title="Red Card"
            bet={redCardBet}
            showSuitIcons={true}
            suitType="red"
          />
        </div>

        {/* Right - Low/High */}
        <div className="space-y-2">
          <CardAttributeSection
            title="Low Card 3"
            bet={lowCardBet}
            cards={LOW_CARDS}
          />
          <CardAttributeSection
            title="High Card 3"
            bet={highCardBet}
            cards={HIGH_CARDS}
          />
        </div>
      </div>

      {/* ================= BOTTOM SECTION ================= */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left - Baccarat */}
        <div className="space-y-2">
          <div className="border p-2">
            <div className="text-xs font-semibold mb-2">
              Baccarat 1 (1st, 2nd, 3rd card)
            </div>
            <button
              disabled={isSuspended(baccarat1Bet) || loading}
              onClick={() => openBetModal(baccarat1Bet, "back")}
              className={`
                w-full h-12
                flex items-center justify-center
                text-sm font-semibold
                ${
                  isSuspended(baccarat1Bet)
                    ? "bg-gray-600 text-white cursor-not-allowed"
                    : "bg-gray-700 text-white hover:bg-gray-800"
                }
              `}
            >
              {isSuspended(baccarat1Bet) ? (
                <Lock size={16} />
              ) : (
                formatOdds(getOdds(baccarat1Bet))
              )}
            </button>
          </div>
          <div className="border p-2">
            <div className="text-xs font-semibold mb-2">
              Baccarat 2 (4th, 5th, 6th card)
            </div>
            <button
              disabled={isSuspended(baccarat2Bet) || loading}
              onClick={() => openBetModal(baccarat2Bet, "back")}
              className={`
                w-full h-12
                flex items-center justify-center
                text-sm font-semibold
                ${
                  isSuspended(baccarat2Bet)
                    ? "bg-gray-600 text-white cursor-not-allowed"
                    : "bg-gray-700 text-white hover:bg-gray-800"
                }
              `}
            >
              {isSuspended(baccarat2Bet) ? (
                <Lock size={16} />
              ) : (
                formatOdds(getOdds(baccarat2Bet))
              )}
            </button>
          </div>
        </div>

        {/* Right - Fixed Point Cards */}
        <div className="border p-2">
          <div className="text-xs font-semibold mb-2">Fixed Point Card (Card 1)</div>
          {card1Bet && card1Bet.odds && Array.isArray(card1Bet.odds) ? (
            <div className="grid grid-cols-5 gap-1">
              {card1Bet.odds.map((cardOdds: any) => {
                const suspended = isSuspended(card1Bet) || formatOdds(getOdds(cardOdds)) === "0.00";
                const cardValue = cardOdds.nat.replace("Card ", "");

                return (
                  <button
                    key={cardOdds.ssid}
                    disabled={suspended || loading}
                    onClick={() => openCardBetModal(cardOdds, card1Bet)}
                    className={`
                      border-2 border-yellow-400 rounded p-1
                      flex flex-col items-center justify-center
                      text-xs
                      ${
                        suspended
                          ? "bg-gray-200 opacity-50 cursor-not-allowed"
                          : "bg-white hover:bg-gray-50"
                      }
                    `}
                  >
                    <div className="text-xs font-semibold text-gray-900 mb-1">
                      {formatOdds(getOdds(cardOdds))}
                    </div>
                    <div className="text-xs font-bold text-gray-900 mb-1">
                      {cardValue}
                    </div>
                    <div className="flex gap-0.5 text-[10px]">
                      <span>♠</span>
                      <span className="text-red-500">♥</span>
                      <span>♣</span>
                      <span className="text-red-500">♦</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-4">
              No card bets available
            </div>
          )}
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      {last10Results.length > 0 && (
        <div className="border pt-2 pb-2 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
          <div className="flex gap-1 sm:gap-1.5 px-1 sm:px-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              return (
                <button
                  key={result.mid || result.round_id || result.round || index}
                  onClick={() => handleResultClick(result)}
                  className="flex-shrink-0 w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-blue-500 text-white font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center active:opacity-80 touch-none hover:scale-110 transition-transform cursor-pointer"
                >
                  R
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="bg-slate-800 text-white px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          {(selectedBet || selectedCardBet) && (
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedCardBet ? selectedCardBet.nat : selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedCardBet ? "" : selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(
                      selectedCardBet
                        ? getOdds(selectedCardBet)
                        : getOdds(selectedBet, selectedSide)
                    )}
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
                    const oddsValue = Number(
                      selectedCardBet
                        ? getOdds(selectedCardBet)
                        : getOdds(selectedBet, selectedSide)
                    );
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
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Note Number Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              This game is played with 80 cards containing two decks of fourty cards each.
            </p>
            <p>
              Each deck contains cards from Ace to 10 of all four suits (It means There is no Jack, No Queen and No King in this game).
            </p>
            <p>
              This game is for Fancy bet lovers.
            </p>

            <p className="font-semibold mt-2 text-yellow-500">Odd and Even Cards:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>To bet on odd card or even card, Betting odds are available on every cards.</li>
              <li>Both back and Lay price is available for both, odd and even.</li>
              <li>(Here 2, 4, 6, 8 and 10 are named Even Card.)</li>
              <li>(Here 1, 3, 5, 7, and 9 are named Odd Card.)</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">Red and Black Cards:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>To bet on Red card or Black Card bettings odds are available on every cards.</li>
              <li>(Here Heart and Diamond are named Red Card)</li>
              <li>(Spade and Club are named Black Card)</li>
              <li>Both Back and Lay price is available for both, Red card and Black Card.</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">Low and High cards:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>To bet on Low or High card bettings odds are available on every cards.</li>
              <li>(Here Ace, 2, 3, 4, and 5 are named low Card)</li>
              <li>(Here 6, 7, 8, 9 and 10 are named High card)</li>
              <li>Both back and lay price is available for both, Low card and High Card.</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">Baccarat:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>In this game six cards will open.</li>
              <li>For this bet this six cards are divided in two groups i.e. Baccarat 1 and Baccarat 2.</li>
              <li>Baccarat 1 is 1st, 2nd and 3rd cards to be open.</li>
              <li>Baccarat 2 is 4th, 5th and 6th cards to be open.</li>
              <li>This is a bet for comparison of Baccarat value of both the group i.e. Baccarat 1 and Baccarat 2.</li>
              <li>The group having higher baccarat value will win.</li>
              <li>To calculate baccarat value we will add point value of all three cards of that group and We will take last digit of that total as Baccarat value.</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">Point Value of cards:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Ace = 1</li>
              <li>2 = 2, 3 = 3, 4 = 4, 5 = 5, 6 = 6, 7 = 7, 8 = 8, 9 = 9</li>
              <li>10 = 0</li>
            </ul>

            <p className="font-semibold mt-2">Example:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Suppose three cards are 2, 5, 8</li>
              <li>2+5+8 = 15, Here last digit is 5 so baccarat value is 5.</li>
              <li>1, 2, 4</li>
              <li>1+2+4 = 7, In this case total is in single digit so we will take that single digit as baccarat value i.e. 7</li>
              <li className="font-semibold text-yellow-500">Note: In case If baccarat value of both the group is equal, In that case half of the betting amount will be returned.</li>
            </ul>

            <p className="font-semibold mt-2 text-yellow-500">FIX Point Card:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It is a bet for selecting any fix point card (Suits are irrelevant).</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Result Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 [&>button]:hidden bg-white rounded-lg border-0 shadow-xl">
          {/* Blue Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between relative rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">
              Note Number Result
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
              <div className="text-center py-8 text-destructive">
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

                  return (
                    <>
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

                      {/* Cards Display */}
                      {t1Data.card && (
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3">
                              Cards
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {(() => {
                              const cardString = t1Data.card || '';
                              const cards = cardString.split(',').map(c => c.trim()).filter(Boolean);
                              
                              // Parse card function
                              const parseCard = (cardString: string) => {
                                if (!cardString) return null;
                                
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
                                  isRed: suit === 'H' || suit === 'D',
                                };
                              };

                              return cards.map((cardStr, idx) => {
                                const card = parseCard(cardStr);
                                if (!card) return null;
                                
                                return (
                                  <div
                                    key={idx}
                                    className="w-16 h-20 sm:w-20 sm:h-24 border-2 border-yellow-400 rounded-lg bg-white flex flex-col items-center justify-center shadow-lg"
                                  >
                                    <span className={`text-lg sm:text-xl font-bold ${card.isRed ? "text-red-600" : "text-black"}`}>
                                      {card.rank}
                                    </span>
                                    <span className={`text-2xl sm:text-3xl ${card.isRed ? "text-red-600" : "text-black"}`}>
                                      {card.suit}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Winner Information Box */}
                      {(t1Data.winnat || t1Data.win || t1Data.rdesc) && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4 sm:p-5 shadow-sm">
                          <div className="space-y-2">
                            <div className="text-center">
                              <span className="font-bold text-gray-900 text-lg sm:text-xl">
                                Winner: {t1Data.winnat || t1Data.win || t1Data.rdesc || "N/A"}
                              </span>
                            </div>
                            {t1Data.rdesc && (
                              <div className="text-center text-gray-700 text-sm sm:text-base mt-2">
                                {t1Data.rdesc}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
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
    </>
  );
};
