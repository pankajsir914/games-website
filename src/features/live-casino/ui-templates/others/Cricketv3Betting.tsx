// src/features/live-casino/ui-templates/others/Cricketv3Betting.tsx

import { Lock, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";

/* ================= TYPES ================= */

interface Cricketv3BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
}

/* ================= HELPERS ================= */

const isSuspended = (section: any) => !section || section?.gstatus === "SUSPENDED" || section?.gstatus === "INACTIVE";

// Get odds from section's odds array (similar to Cmatch20Betting's getOdds function)
// Cricketv3 has nested structure: section.odds = [{otype: "back", odds: value}, {otype: "lay", odds: value}]
const getOddsFromSection = (section: any, side: "back" | "lay" = "back") => {
  if (!section || !Array.isArray(section.odds)) return 0;
  const oddsObj = section.odds.find((o: any) => o.otype === side);
  return oddsObj?.odds || 0;
};

// Get size (liquidity) from section's odds array
const getSizeFromSection = (section: any, side: "back" | "lay" = "back") => {
  if (!section || !Array.isArray(section.odds)) return 0;
  const oddsObj = section.odds.find((o: any) => o.otype === side);
  return oddsObj?.size || 0;
};

// Format odds value
const formatOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

// Format size (liquidity)
const formatSize = (val: any): string => {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "";
  if (num >= 100000) return (num / 100000).toFixed(2) + "L";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toFixed(0);
};

// Format min/max display
const formatLimit = (val: any): string => {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "";
  if (num >= 100000) return (num / 100000).toFixed(0) + "L";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
};

/* ================= COMPONENT ================= */

export const Cricketv3Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Cricketv3BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  // Extract markets from API structure (same pattern as Cmatch20Betting)
  // Cmatch20Betting uses: odds?.data?.sub, so Cricketv3 should use: odds?.data?.t2
  const markets = useMemo(() => {
    // Priority 1: Check odds.data.t2 (API structure - same as Cmatch20Betting uses odds.data.sub)
    if (odds?.data?.t2 && Array.isArray(odds.data.t2) && odds.data.t2.length > 0) {
      return odds.data.t2;
    }
    
    // Priority 2: Check odds.rawData.data.t2 (if data is wrapped in rawData)
    if (odds?.rawData?.data?.t2 && Array.isArray(odds.rawData.data.t2) && odds.rawData.data.t2.length > 0) {
      return odds.rawData.data.t2;
    }
    
    // Priority 3: Check odds.rawData.t2 (if rawData directly has t2)
    if (odds?.rawData?.t2 && Array.isArray(odds.rawData.t2) && odds.rawData.t2.length > 0) {
      return odds.rawData.t2;
    }
    
    // Priority 4: Check odds.t2 (if t2 is directly in odds)
    if (odds?.t2 && Array.isArray(odds.t2) && odds.t2.length > 0) {
      return odds.t2;
    }
    
    return [];
  }, [odds]);

  // Find Bookmaker and Fancy markets
  const bookmakerMarket = useMemo(() => {
    return markets.find((m: any) => (m.mname || "").toLowerCase().includes("bookmaker"));
  }, [markets]);

  const fancyMarket = useMemo(() => {
    return markets.find((m: any) => (m.mname || "").toLowerCase().includes("fancy"));
  }, [markets]);

  // Get sections from markets (same pattern as Cmatch20Betting filters bets)
  const bookmakerSections = useMemo(() => {
    if (!bookmakerMarket || !Array.isArray(bookmakerMarket.section)) return [];
    return bookmakerMarket.section.filter((s: any) => s.visible !== 0);
  }, [bookmakerMarket]);

  const fancySections = useMemo(() => {
    if (!fancyMarket || !Array.isArray(fancyMarket.section)) return [];
    return fancyMarket.section.filter((s: any) => s.visible !== 0);
  }, [fancyMarket]);

  const openBetModal = (section: any, market: any, side: "back" | "lay" = "back") => {
    if (!section || isSuspended(section)) return;
    const oddsValue = getOddsFromSection(section, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedSection(section);
    setSelectedMarket(market);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedSection || !selectedMarket || !amount || parseFloat(amount) <= 0) return;

    const oddsValue = getOddsFromSection(selectedSection, selectedSide);
    const oddsObj = selectedSection.odds?.find((o: any) => o.otype === selectedSide);

    await onPlaceBet({
      sid: selectedSection.sid,
      psid: selectedSection.psid,
      mid: selectedMarket.mid || oddsObj?.mid,
      odds: oddsValue,
      nat: selectedSection.nat,
      amount: parseFloat(amount),
      side: selectedSide,
    });

    setBetModalOpen(false);
    setSelectedSection(null);
    setSelectedMarket(null);
    setAmount("100");
  };

  // Odds Cell Component (for table-like structure matching image)
  const OddsCell = ({ section, market, marketType, side }: { section: any; market: any; marketType: "bookmaker" | "fancy"; side: "back" | "lay" }) => {
    // For Fancy: "No" column (left) = lay side, "Yes" column (right) = back side
    // For Bookmaker: "Back" column (left) = back side, "Lay" column (right) = lay side
    const actualSide = marketType === "fancy" 
      ? (side === "back" ? "lay" : "back")  // Fancy: "No" (left/back param) uses lay, "Yes" (right/lay param) uses back
      : side;  // Bookmaker: "Back" (left/back param) uses back, "Lay" (right/lay param) uses lay
    
    const oddsValue = getOddsFromSection(section, actualSide);
    const formattedOdds = formatOdds(oddsValue);
    const suspended = isSuspended(section) || formattedOdds === "0.00";

    return (
      <td className="border-b border-gray-300 dark:border-gray-600 p-0">
        {suspended ? (
          <div className="bg-gray-400 dark:bg-gray-700 h-12 flex flex-col items-center justify-center relative">
            <span className="text-red-600 dark:text-red-400 text-xs font-bold">SUSPENDED</span>
            <span className="text-gray-600 dark:text-gray-500 text-[10px] mt-0.5">0.00</span>
          </div>
        ) : (
          <button
            disabled={loading}
            onClick={() => openBetModal(section, market, actualSide)}
            className={`
              w-full h-12 flex flex-col items-center justify-center transition-colors 
              disabled:opacity-50 disabled:cursor-not-allowed text-white
              ${
                marketType === "fancy"
                  ? (side === "back" ? "bg-pink-400 hover:bg-pink-500" : "bg-blue-400 hover:bg-blue-500")
                  : (side === "back" ? "bg-blue-400 hover:bg-blue-500" : "bg-pink-400 hover:bg-pink-500")
              }
            `}
          >
            <span className="text-sm font-bold">{formattedOdds}</span>
            {getSizeFromSection(section, actualSide) > 0 && (
              <span className="text-[10px] opacity-90 mt-0.5">
                {formatSize(getSizeFromSection(section, actualSide))}
              </span>
            )}
          </button>
        )}
      </td>
    );
  };

  // Market Section Component - Table-like structure matching image
  const MarketSection = ({ market, marketType }: { market: any; marketType: "bookmaker" | "fancy" }) => {
    const sections = marketType === "bookmaker" ? bookmakerSections : fancySections;
    
    if (!sections || sections.length === 0) return null;

    return (
      <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Dark Grey Header */}
        <div className="bg-gray-700 dark:bg-gray-800 px-3 py-2 border-b border-gray-400">
          <h4 className="text-sm font-bold text-white">
            {market.mname || (marketType === "bookmaker" ? "Bookmaker" : "Fancy")}
          </h4>
        </div>

        {/* Table Structure - Matching Image Layout */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {/* Header Row: Min/Max Limits and Column Headers - Matching Image Layout */}
              <tr className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
                {/* Bet Name Column (empty in header for Bookmaker, shows Min/Max for Bookmaker) */}
                <td className="px-3 py-2">
                  {marketType === "bookmaker" && (market.min || market.max) && (
                    <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                      Min: {formatLimit(market.min) || "100"} Max: {formatLimit(market.max) || "0"}
                    </div>
                  )}
                </td>
                {/* Back/No Column Header */}
                <td className="px-2 py-1 text-center">
                  <div className={`${marketType === "fancy" ? "bg-pink-400" : "bg-blue-400"} text-white text-xs font-bold px-2 py-1 rounded`}>
                    {marketType === "fancy" ? "No" : "Back"}
                  </div>
                </td>
                {/* Lay/Yes Column Header */}
                <td className="px-2 py-1 text-center">
                  <div className={`${marketType === "fancy" ? "bg-blue-400" : "bg-pink-400"} text-white text-xs font-bold px-2 py-1 rounded`}>
                    {marketType === "fancy" ? "Yes" : "Lay"}
                  </div>
                </td>
                {/* Min/Max Column for Fancy bets (empty in header, shown per row) */}
                {marketType === "fancy" && (
                  <td className="px-2 py-1"></td>
                )}
              </tr>
            </thead>
            <tbody>
              {sections.map((section: any) => (
                <tr key={section.sid || section.psid} className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
                  {/* Bet Name / Team Name Column */}
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    {section.nat || "N/A"}
                  </td>
                  {/* Back/No Odds Cell */}
                  <OddsCell section={section} market={market} marketType={marketType} side="back" />
                  {/* Lay/Yes Odds Cell */}
                  <OddsCell section={section} market={market} marketType={marketType} side="lay" />
                  {/* Min/Max for Fancy bets (inline with each row) */}
                  {marketType === "fancy" && (section.min || section.max || market.min || market.max) && (
                    <td className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      Min: {formatLimit(section.min || market.min) || "100"} Max: {formatLimit(section.max || market.max) || "0"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h3 className="text-xs sm:text-sm font-semibold">
          {odds?.data?.t1?.ename || odds?.rawData?.data?.t1?.ename || "Five Five Cricket"}
        </h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-7 w-7 sm:h-8 sm:w-8">
          <Info size={14} className="sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* ================= MAIN BETTING SECTIONS - SIDE BY SIDE ================= */}
      {/* Two sections side-by-side: Bookmaker (left) and Fancy (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Bookmaker Section (Left) */}
        {bookmakerMarket && (
          <MarketSection market={bookmakerMarket} marketType="bookmaker" />
        )}

        {/* Fancy Section (Right) */}
        {fancyMarket && (
          <MarketSection market={fancyMarket} marketType="fancy" />
        )}
      </div>

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full p-0">
          <DialogHeader className="bg-slate-800 text-white px-3 sm:px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-xs sm:text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)} className="p-1">
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          </DialogHeader>

          {selectedSection && selectedMarket && (
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedSection.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOddsFromSection(selectedSection, selectedSide))}
                  </span>
                </div>
                {getSizeFromSection(selectedSection, selectedSide) > 0 && (
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Size: {formatSize(getSizeFromSection(selectedSection, selectedSide))}
                  </div>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded text-[10px] sm:text-xs font-medium ${
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
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10"
              />

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Potential win" : "Liability"}: ₹
                  {(() => {
                    const oddsValue = Number(getOddsFromSection(selectedSection, selectedSide));
                    const normalizedOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                    if (selectedSide === "back") {
                      return (parseFloat(amount) * normalizedOdds).toFixed(2);
                    } else {
                      return (parseFloat(amount) * (normalizedOdds - 1)).toFixed(2);
                    }
                  })()}
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm h-9 sm:h-10"
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
        <DialogContent className="max-w-md w-[95vw] sm:w-full text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader className="px-3 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle className="text-sm sm:text-base">Five Five Cricket Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-[10px] sm:text-xs leading-relaxed text-gray-700 dark:text-gray-300 px-3 sm:px-6 pb-4 sm:pb-6">
            <ul className="list-disc pl-4 space-y-2">
              <li><strong>It is a five overs each match</strong></li>
              <li><strong>Team scoring more runs will be winner</strong></li>
              <li><strong>Difference of wickets doesn't matter in result.</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>If any team's 10 wickets fall before five overs that team is all out.</li>
                  <li>If it is a tie (difference of wicket doesn't matter), bets will be cancelled.</li>
                </ul>
              </li>
              <li><strong>1st batting team is given name AUS.</strong></li>
              <li><strong>2nd batting team is given name IND.</strong></li>
              <li><strong>It is a 70 card deck.</strong></li>
              <li><strong>After the first inning is finished deck will be reshuffled.</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>In the first inning, the rates will be given after the end of each over.</li>
                  <li>In the second innings, for the first 3 overs, rates will be given after the end of each over.</li>
                  <li>In the 4th and 5th overs, rates will be given after the end of each ball.</li>
                </ul>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Card Values:</p>
              <div className="grid grid-cols-3 gap-2 text-[9px] sm:text-[10px]">
                <div className="font-semibold">CARDS</div>
                <div className="font-semibold">COUNT</div>
                <div className="font-semibold">RUNS</div>
                <div>A</div>
                <div>x 10</div>
                <div>1 RUN</div>
                <div>2</div>
                <div>x 10</div>
                <div>2 RUNS</div>
                <div>3</div>
                <div>x 10</div>
                <div>3 RUNS</div>
                <div>4</div>
                <div>x 10</div>
                <div>4 RUNS</div>
                <div>6</div>
                <div>x 10</div>
                <div>6 RUNS</div>
                <div>10</div>
                <div>x 10</div>
                <div>0 RUN</div>
                <div>K</div>
                <div>x 10</div>
                <div>WICKET</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
