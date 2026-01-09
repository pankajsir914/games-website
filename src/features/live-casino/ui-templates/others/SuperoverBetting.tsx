// src/features/live-casino/ui-templates/others/SuperoverBetting.tsx

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

interface SuperoverBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
}

/* ================= HELPERS ================= */

const isSuspended = (section: any) => !section || section?.gstatus === "SUSPENDED" || section?.gstatus === "INACTIVE";

// Get odds from section's odds array
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

/* ================= COMPONENT ================= */

export const SuperoverBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: SuperoverBettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  // Extract markets from API structure
  const markets = useMemo(() => {
    if (odds?.data?.t2 && Array.isArray(odds.data.t2)) {
      return odds.data.t2;
    }
    return [];
  }, [odds]);

  // Find Bookmaker and Fancy1 markets
  const bookmakerMarket = useMemo(() => {
    return markets.find((m: any) => (m.mname || "").toLowerCase() === "bookmaker");
  }, [markets]);

  const fancy1Market = useMemo(() => {
    return markets.find((m: any) => (m.mname || "").toLowerCase() === "fancy1");
  }, [markets]);

  // Get sections from markets
  const bookmakerSections = useMemo(() => {
    if (!bookmakerMarket || !Array.isArray(bookmakerMarket.section)) return [];
    return bookmakerMarket.section;
  }, [bookmakerMarket]);

  const fancy1Sections = useMemo(() => {
    if (!fancy1Market || !Array.isArray(fancy1Market.section)) return [];
    return fancy1Market.section.filter((s: any) => s.visible !== 0);
  }, [fancy1Market]);

  // Find ENG and RSA sections
  const engSection = bookmakerSections.find((s: any) => (s.nat || "").toUpperCase() === "ENG");
  const rsaSection = bookmakerSections.find((s: any) => (s.nat || "").toUpperCase() === "RSA");

  const openBetModal = (section: any, side: "back" | "lay" = "back") => {
    if (!section || isSuspended(section)) return;
    const oddsValue = getOddsFromSection(section, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedSection(section);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedSection || !amount || parseFloat(amount) <= 0) return;

    const oddsValue = getOddsFromSection(selectedSection, selectedSide);
    const oddsObj = selectedSection.odds?.find((o: any) => o.otype === selectedSide);

    await onPlaceBet({
      sid: selectedSection.sid,
      psid: selectedSection.psid,
      mid: selectedSection.mid || oddsObj?.mid,
      odds: oddsValue,
      nat: selectedSection.nat,
      amount: parseFloat(amount),
      side: selectedSide,
    });

    setBetModalOpen(false);
    setSelectedSection(null);
    setAmount("100");
  };

  // OddsCell for Bookmaker section
  const BookmakerOddsCell = ({ section, side }: { section: any; side: "back" | "lay" }) => {
    const odds = getOddsFromSection(section, side);
    const formattedOdds = formatOdds(odds);
    const size = getSizeFromSection(section, side);
    const formattedSize = formatSize(size);
    const suspended = isSuspended(section) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(section, side)}
        className={`
          h-12 w-full flex flex-col items-center justify-center
          text-sm font-semibold text-white
          ${
            suspended
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : side === "back"
              ? "bg-sky-400 hover:bg-sky-500"
              : "bg-pink-300 hover:bg-pink-400"
          }
        `}
      >
        {suspended ? (
          <>
            <Lock size={14} className="mb-1" />
            <div className="text-xs">SUSPENDED</div>
            <div className="text-[10px] opacity-75">0.00</div>
          </>
        ) : (
          <>
            <div className="text-base font-bold">{formattedOdds}</div>
            {formattedSize && (
              <div className="text-[10px] opacity-90">{formattedSize}</div>
            )}
          </>
        )}
      </button>
    );
  };

  // OddsCell for Fancy1 section
  const Fancy1OddsCell = ({ section, side }: { section: any; side: "back" | "lay" }) => {
    const odds = getOddsFromSection(section, side);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(section) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(section, side)}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold text-white
          ${
            suspended
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : side === "back"
              ? "bg-sky-400 hover:bg-sky-500"
              : "bg-pink-300 hover:bg-pink-400"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : formattedOdds === "0.00" ? "-" : formattedOdds}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Super Over</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= BOOKMAKER SECTION ================= */}
      {bookmakerMarket && (
        <div className="border mb-2">
          <div className="bg-gray-700 text-white px-2 py-1 text-xs font-semibold">
            Bookmaker
          </div>
          {bookmakerMarket.min && bookmakerMarket.max && (
            <div className="px-2 py-1 text-xs text-sky-400 bg-gray-50 dark:bg-gray-800">
              Min: {bookmakerMarket.min} Max: {bookmakerMarket.max >= 100000 ? `${bookmakerMarket.max / 100000}L` : bookmakerMarket.max}
            </div>
          )}
          <div className="grid grid-cols-3 text-sm font-semibold border-b">
            <div className="h-10 flex items-center px-2 bg-gray-50 dark:bg-gray-800"></div>
            <div className="h-10 flex items-center justify-center px-2 bg-gray-50 dark:bg-gray-800 border-l">
              {engSection?.nat || "ENG"}
            </div>
            <div className="h-10 flex items-center justify-center px-2 bg-gray-50 dark:bg-gray-800 border-l">
              {rsaSection?.nat || "RSA"}
            </div>
          </div>
          <div className="grid grid-cols-3 border-b">
            <div className="h-10 flex items-center px-2 text-xs font-semibold bg-gray-50 dark:bg-gray-800">
              Back
            </div>
            <div className="border-l">
              <BookmakerOddsCell section={engSection} side="back" />
            </div>
            <div className="border-l">
              <BookmakerOddsCell section={rsaSection} side="back" />
            </div>
          </div>
          <div className="grid grid-cols-3">
            <div className="h-10 flex items-center px-2 text-xs font-semibold bg-gray-50 dark:bg-gray-800">
              Lay
            </div>
            <div className="border-l">
              <BookmakerOddsCell section={engSection} side="lay" />
            </div>
            <div className="border-l">
              <BookmakerOddsCell section={rsaSection} side="lay" />
            </div>
          </div>
        </div>
      )}

      {/* ================= FANCY1 SECTION ================= */}
      {fancy1Market && fancy1Sections.length > 0 && (
        <div className="border">
          <div className="bg-gray-700 text-white px-2 py-1 text-xs font-semibold">
            Fancy1
          </div>
          <div className="grid grid-cols-2 gap-2 p-2">
            {fancy1Sections.map((section: any) => {
              const backOdds = getOddsFromSection(section, "back");
              const layOdds = getOddsFromSection(section, "lay");
              const hasBack = formatOdds(backOdds) !== "0.00";
              const hasLay = formatOdds(layOdds) !== "0.00";
              const suspended = isSuspended(section);

              return (
                <div key={section.sid} className="border p-2">
                  <div className="text-xs font-semibold mb-1 text-center min-h-[32px] flex items-center justify-center">
                    {section.nat || ""}
                  </div>
                  <div className="grid grid-cols-2 gap-1 mb-1">
                    <Fancy1OddsCell section={section} side="back" />
                    <Fancy1OddsCell section={section} side="lay" />
                  </div>
                  {section.min && section.max && (
                    <div className="text-[10px] text-sky-400 text-center">
                      Min: {section.min} Max: {section.max >= 10000 ? `${section.max / 1000}K` : section.max}
                    </div>
                  )}
                </div>
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

          {selectedSection && (
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedSection.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOddsFromSection(selectedSection, selectedSide))}
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
            <DialogTitle>Super Over Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>Super Over is a cricket-based betting game. Please refer to the official rules for detailed information.</p>
            <div className="mt-2">
              <img 
                src="https://sitethemedata.com/v3/static/front/img/casino-rules/superover.jpg" 
                alt="Super Over Rules" 
                className="w-full h-auto rounded"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
