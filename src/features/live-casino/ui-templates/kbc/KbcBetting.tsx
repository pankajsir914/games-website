// src/features/live-casino/ui-templates/kbc/KbcBetting.tsx

import { Lock, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { useDiamondCasino } from "@/hooks/useDiamondCasino";

/* ================= TYPES ================= */

interface KbcBettingProps {
  betTypes: any;
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  resultHistory?: any[];
  rules?: any[];
  tableId?: string;
  odds?: any;
}

interface BettingSection {
  sid: number;
  nat: string;
  subtype: string;
  gstatus: string;
  odds: Array<{
    nat: string;
    ssid: number;
    sno: number;
    b: number;
    l: number;
  }>;
}

/* ================= HELPERS ================= */

const isSuspended = (section: BettingSection) => 
  !section || section?.gstatus === "SUSPENDED";

const formatOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const getOdds = (oddsItem: any) => {
  if (!oddsItem) return 0;
  return oddsItem.b ?? oddsItem.back ?? oddsItem.odds ?? 0;
};

// Get question number from section
const getQuestionNumber = (section: BettingSection): number => {
  const mapping: Record<string, number> = {
    "Red-Black": 1,
    "Odd-Even": 2,
    "7 Up-7 Down": 3,
    "3 Card Judgement": 4,
    "Suits": 5,
  };
  return mapping[section.nat] || section.sid;
};

// Render card symbols
const renderCardSymbols = (nat: string) => {
  if (nat === "Red") {
    return (
      <div className="flex items-center justify-center gap-1 text-red-600">
        <span className="text-xl">♥</span>
        <span className="text-xl">♦</span>
      </div>
    );
  }
  if (nat === "Black") {
    return (
      <div className="flex items-center justify-center gap-1 text-black dark:text-gray-300">
        <span className="text-xl">♠</span>
        <span className="text-xl">♣</span>
      </div>
    );
  }
  if (nat === "Spade") {
    return <span className="text-2xl text-black dark:text-gray-300">♠</span>;
  }
  if (nat === "Heart") {
    return <span className="text-2xl text-red-600">♥</span>;
  }
  if (nat === "Club") {
    return <span className="text-2xl text-black dark:text-gray-300">♣</span>;
  }
  if (nat === "Diamond") {
    return <span className="text-2xl text-red-600">♦</span>;
  }
  return null;
};

/* ================= COMPONENT ================= */

export const KbcBetting = ({
  betTypes = {},
  onPlaceBet,
  loading = false,
  resultHistory = [],
  rules: rulesProp = [],
  tableId = "kbc",
  odds,
}: KbcBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<BettingSection | null>(null);
  const [amount, setAmount] = useState("100");
  const [bettingMode, setBettingMode] = useState<"five" | "four" | "5050">("five");
  const [rules, setRules] = useState<any[]>(rulesProp);
  const { fetchCasinoRules } = useDiamondCasino();
  const hasFetchedRulesRef = useRef(false);

  const quickAmounts = [100, 500, 1000, 5000];

  // Fetch rules if not provided
  useEffect(() => {
    if (rulesProp.length > 0) {
      setRules(rulesProp);
      return;
    }
    
    if (hasFetchedRulesRef.current || !tableId) return;
    
    hasFetchedRulesRef.current = true;
    
    fetchCasinoRules(tableId)
      .then(({ rules: fetchedRules, error }) => {
        if (!error && fetchedRules && fetchedRules.length > 0) {
          setRules(fetchedRules);
        }
      })
      .catch(() => {
        // Silently fail, will show default rules
      });
  }, [rulesProp, tableId, fetchCasinoRules]);

  // Extract sections from betTypes
  const sections: BettingSection[] = (() => {
    const betTypesAny = betTypes as any;
    const oddsAny = odds as any;
    
    // Debug: Log raw structure to see what's available
    if (betTypesAny?.rawData?.raw) {
      console.log("🔍 [KBC] betTypes.rawData.raw keys:", Object.keys(betTypesAny.rawData.raw));
      console.log("🔍 [KBC] betTypes.rawData.raw.sub:", betTypesAny.rawData.raw.sub);
      console.log("🔍 [KBC] betTypes.rawData.raw.data:", betTypesAny.rawData.raw.data);
    }
    if (oddsAny?.rawData?.raw) {
      console.log("🔍 [KBC] odds.rawData.raw keys:", Object.keys(oddsAny.rawData.raw));
      console.log("🔍 [KBC] odds.rawData.raw.sub:", oddsAny.rawData.raw.sub);
      console.log("🔍 [KBC] odds.rawData.raw.data:", oddsAny.rawData.raw.data);
    }
    
    // Priority 1: Check betTypes.rawData.raw.sub directly (raw API response)
    if (betTypesAny?.rawData?.raw?.sub && Array.isArray(betTypesAny.rawData.raw.sub) && betTypesAny.rawData.raw.sub.length > 0) {
      console.log("✅ [KBC] Found sections in betTypes.rawData.raw.sub:", betTypesAny.rawData.raw.sub.length);
      return betTypesAny.rawData.raw.sub;
    }
    
    // Priority 2: Check odds.rawData.raw.sub directly (raw API response)
    if (oddsAny?.rawData?.raw?.sub && Array.isArray(oddsAny.rawData.raw.sub) && oddsAny.rawData.raw.sub.length > 0) {
      console.log("✅ [KBC] Found sections in odds.rawData.raw.sub:", oddsAny.rawData.raw.sub.length);
      return oddsAny.rawData.raw.sub;
    }
    
    // Priority 3: Check betTypes.rawData.raw.data.sub (nested data structure)
    if (betTypesAny?.rawData?.raw?.data?.sub && Array.isArray(betTypesAny.rawData.raw.data.sub) && betTypesAny.rawData.raw.data.sub.length > 0) {
      console.log("✅ [KBC] Found sections in betTypes.rawData.raw.data.sub:", betTypesAny.rawData.raw.data.sub.length);
      return betTypesAny.rawData.raw.data.sub;
    }
    
    // Priority 4: Check odds.rawData.raw.data.sub (nested data structure)
    if (oddsAny?.rawData?.raw?.data?.sub && Array.isArray(oddsAny.rawData.raw.data.sub) && oddsAny.rawData.raw.data.sub.length > 0) {
      console.log("✅ [KBC] Found sections in odds.rawData.raw.data.sub:", oddsAny.rawData.raw.data.sub.length);
      return oddsAny.rawData.raw.data.sub;
    }
    
    // Priority 5: Check odds.data.sub directly (most reliable for KBC API structure)
    if (oddsAny?.data?.sub && Array.isArray(oddsAny.data.sub) && oddsAny.data.sub.length > 0) {
      console.log("✅ [KBC] Found sections in odds.data.sub:", oddsAny.data.sub.length);
      return oddsAny.data.sub;
    }
    
    // Priority 6: Check odds.rawData.data.sub (if rawData exists)
    if (oddsAny?.rawData?.data?.sub && Array.isArray(oddsAny.rawData.data.sub) && oddsAny.rawData.data.sub.length > 0) {
      console.log("✅ [KBC] Found sections in odds.rawData.data.sub:", oddsAny.rawData.data.sub.length);
      return oddsAny.rawData.data.sub;
    }
    
    // Priority 7: Check betTypes.sub (if betTypes is already odds.data)
    if (betTypesAny && typeof betTypesAny === 'object' && !Array.isArray(betTypesAny)) {
      if (Array.isArray(betTypesAny.sub) && betTypesAny.sub.length > 0) {
        console.log("✅ [KBC] Found sections in betTypes.sub:", betTypesAny.sub.length);
        return betTypesAny.sub;
      }
      
      // Priority 7b: Check betTypes.data.sub
      if (Array.isArray(betTypesAny.data?.sub) && betTypesAny.data.sub.length > 0) {
        console.log("✅ [KBC] Found sections in betTypes.data.sub:", betTypesAny.data.sub.length);
        return betTypesAny.data.sub;
      }
    }
    
    // Priority 8: If betTypes is an array (fallback)
    if (Array.isArray(betTypesAny) && betTypesAny.length > 0) {
      if (Array.isArray(betTypesAny[0]?.sub) && betTypesAny[0].sub.length > 0) {
        return betTypesAny[0].sub;
      }
      const filtered = betTypesAny.filter((b: any) => b.subtype && Array.isArray(b.odds));
      if (filtered.length > 0) {
        return filtered;
      }
    }
    
    console.warn("⚠️ [KBC] No sections found. betTypes:", {
      keys: betTypesAny ? Object.keys(betTypesAny) : [],
      rawData: betTypesAny?.rawData,
      rawDataRaw: betTypesAny?.rawData?.raw,
      rawDataRawSub: betTypesAny?.rawData?.raw?.sub,
    }, "odds:", {
      keys: oddsAny ? Object.keys(oddsAny) : [],
      rawData: oddsAny?.rawData,
      rawDataRaw: oddsAny?.rawData?.raw,
      rawDataRawSub: oddsAny?.rawData?.raw?.sub,
    });
    return [];
  })();

  // Sort sections by question number
  const sortedSections = [...sections].sort((a, b) => getQuestionNumber(a) - getQuestionNumber(b));

  const openBetModal = (section: BettingSection, oddsItem: any) => {
    // Only block if section is suspended
    // Allow opening modal if section is OPEN, even if odds are 0 (odds might be updating)
    if (!section || isSuspended(section)) return;
    setSelectedBet(oddsItem);
    setSelectedSection(section);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !selectedSection || !amount || parseFloat(amount) <= 0) return;

    await onPlaceBet({
      sid: selectedSection.sid,
      ssid: selectedBet.ssid,
      odds: getOdds(selectedBet),
      nat: selectedBet.nat,
      amount: parseFloat(amount),
      subtype: selectedSection.subtype,
    });

    setBetModalOpen(false);
    setSelectedBet(null);
    setSelectedSection(null);
    setAmount("100");
  };

  const handleQuitBet = (quitType: "4cards" | "5050") => {
    // Handle quit bet logic here
    console.log("Quit bet:", quitType);
  };

  const BettingCell = ({ 
    section, 
    oddsItem, 
    cellIndex 
  }: { 
    section: BettingSection; 
    oddsItem: any;
    cellIndex: number;
  }) => {
    // Calculate odds based on KBC rules
    const odds = getOdds(oddsItem, section, bettingMode);
    const formattedOdds = formatOdds(odds);
    // Only suspend if section is actually suspended (gstatus === "SUSPENDED")
    // If section is OPEN, allow betting even if odds are 0 (odds might be updating)
    const suspended = isSuspended(section);
    const hasSymbols = ["Red", "Black", "Spade", "Heart", "Club", "Diamond"].includes(oddsItem.nat);
    // Alternate colors: even index = light blue, odd index = dark green
    const isDarkGreen = cellIndex % 2 === 1;

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(section, oddsItem)}
        className={`
          relative border-2 border-yellow-400 rounded
          h-20 w-full flex flex-col items-center justify-center
          text-sm font-bold transition-all
          ${suspended 
            ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-50" 
            : isDarkGreen
            ? "bg-green-700 hover:bg-green-800 text-white cursor-pointer"
            : "bg-blue-400 hover:bg-blue-500 text-white cursor-pointer"
          }
        `}
      >
        {suspended ? (
          <Lock size={16} />
        ) : (
          <>
            {hasSymbols ? (
              <div className="mb-1">
                {renderCardSymbols(oddsItem.nat)}
              </div>
            ) : (
              <div className="mb-1 text-base font-bold">
                {oddsItem.nat}
              </div>
            )}
            <div className="text-lg font-bold">
              {formattedOdds}
            </div>
          </>
        )}
      </button>
    );
  };

  const renderSection = (section: BettingSection, index: number) => {
    const qNum = getQuestionNumber(section);
    const numOptions = section.odds.length;
    
    return (
      <div key={section.sid} className="flex flex-col">
        {/* Section Header - Dark grey rounded */}
        <div className="bg-gray-700 text-white px-3 py-2 rounded-t-lg text-xs font-semibold mb-1">
          [Q{qNum}] {section.nat}
        </div>

        {/* Betting Options */}
        <div 
          className={`grid gap-1 ${
            numOptions === 2 ? 'grid-cols-2' : 'grid-cols-2'
          }`}
        >
          {section.odds.map((oddsItem, idx) => (
            <BettingCell 
              key={oddsItem.ssid} 
              section={section} 
              oddsItem={oddsItem}
              cellIndex={idx}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Kaun Banega Crorepati (KBC)</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={18} />
        </Button>
      </div>

      {/* ================= BETTING GRID ================= */}
      {sortedSections.length > 0 ? (
        <div className="space-y-4">
          {/* Top Row: Q1, Q2, Q3 */}
          <div className="grid grid-cols-3 gap-3">
            {sortedSections.slice(0, 3).map((section, idx) => renderSection(section, idx))}
          </div>

          {/* Bottom Row: Q4, Q5, Quit Buttons */}
          <div className="grid grid-cols-12 gap-3">
            {/* Q4 */}
            <div className="col-span-3">
              {sortedSections[3] && renderSection(sortedSections[3], 3)}
            </div>
            
            {/* Q5 */}
            <div className="col-span-3">
              {sortedSections[4] && renderSection(sortedSections[4], 4)}
            </div>
            
            {/* Quit Buttons */}
            <div className="col-span-6 flex flex-row gap-4 justify-center items-center">
              <button
                onClick={() => handleQuitBet("4cards")}
                disabled={loading}
                className="w-28 h-28 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex flex-col items-center justify-center border-2 border-yellow-400 shadow-lg transition-all disabled:opacity-50"
              >
                <span>4 Cards</span>
                <span>Quit</span>
              </button>
              <button
                onClick={() => handleQuitBet("5050")}
                disabled={loading}
                className="w-28 h-28 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex flex-col items-center justify-center border-2 border-yellow-400 shadow-lg transition-all disabled:opacity-50"
              >
                <span>50-50</span>
                <span>Quit</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-500">
          No betting options available
        </div>
      )}

      {/* ================= RESULTS ================= */}
      {resultHistory && resultHistory.length > 0 && (
        <div className="border-2 border-gray-300 rounded-lg mt-6 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
            Recent Results
          </div>
          <div className="grid grid-cols-5 gap-2">
            {resultHistory.slice(0, 10).map((result: any, idx: number) => (
              <div 
                key={idx} 
                className={`text-xs flex flex-col items-center justify-center p-2 rounded border-2 ${
                  result.win === "0" 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-400" 
                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-400"
                }`}
              >
                <span className="font-semibold">R{idx + 1}</span>
                <span className="text-xs mt-1">
                  {result.win === "0" ? "✓" : "✗"}
                </span>
              </div>
            ))}
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

          {selectedBet && selectedSection && (
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  [{getQuestionNumber(selectedSection)}] {selectedSection.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-1">
                  Option: <span className="font-semibold">{selectedBet.nat}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-2">
                  Betting Mode: <span className="font-semibold">
                    {bettingMode === "five" ? "Five Questions" : 
                     bettingMode === "four" ? "Four Questions" : 
                     "50-50 Quit"}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSection, bettingMode))}
                  </span>
                </div>
              </div>

              {/* Betting Mode Selector in Modal */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Change Betting Mode:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setBettingMode("five")}
                    className={`py-2 px-2 rounded text-xs font-medium ${
                      bettingMode === "five"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Five
                  </button>
                  <button
                    onClick={() => setBettingMode("four")}
                    className={`py-2 px-2 rounded text-xs font-medium ${
                      bettingMode === "four"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Four
                  </button>
                  <button
                    onClick={() => setBettingMode("5050")}
                    className={`py-2 px-2 rounded text-xs font-medium ${
                      bettingMode === "5050"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    50-50
                  </button>
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
                  {(
                    parseFloat(amount) * getOdds(selectedBet, selectedSection, bettingMode)
                  ).toFixed(2)}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KBC Rules</DialogTitle>
          </DialogHeader>

          {rules && rules.length > 0 ? (
            <div className="space-y-4">
              {rules.map((rule: any, idx: number) => (
                <div key={idx} className="text-sm">
                  {rule.stype && (
                    <h6 className="font-semibold text-lg mb-2 text-yellow-500">
                      {rule.stype === "main" ? "How to Play" : rule.stype}
                    </h6>
                  )}
                  <div
                    dangerouslySetInnerHTML={{ __html: rule.rules || "" }}
                    className="rules-section prose prose-sm max-w-none dark:prose-invert"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-xs leading-relaxed">
              <p>
                • Kaun Banega Crorepati (KBC) is a unique game played with a regular 52 cards deck.
              </p>
              <p>
                • There are 5 questions, each with multiple choice answers.
              </p>
              <p>
                • 5 cards will be drawn one by one from the deck as answers to questions 1 to 5.
              </p>
              <p>
                • <b>Q1:</b> RED (Hearts & Diamonds) or BLACK (Spades & Clubs)
              </p>
              <p>
                • <b>Q2:</b> ODD (A,3,5,7,9,J,K) or EVEN (2,4,6,8,10,Q)
              </p>
              <p>
                • <b>Q3:</b> 7UP (8,9,10,J,Q,K) or 7DOWN (A,2,3,4,5,6)
              </p>
              <p>
                • <b>Q4:</b> 3 CARD JUDGEMENT (A,2,3 or 4,5,6 or 8,9,10 or J,Q,K)
              </p>
              <p>
                • <b>Q5:</b> SUITS (Spades or Hearts or Clubs or Diamonds)
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
