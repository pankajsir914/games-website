// src/features/live-casino/ui-templates/others/Cmatch20Betting.tsx

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

interface Cmatch20BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  odds?: any;
}

interface TeamScore {
  runs: number;
  wickets: number;
  overs: string;
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

// Parse score string (e.g., "1,238,6,20,226,5,19.4")
// Format: [team_id, runs, wickets, overs, runs, wickets, overs]
const parseScore = (scoreString: string): { teamA: TeamScore; teamB: TeamScore } => {
  if (!scoreString) {
    return {
      teamA: { runs: 0, wickets: 0, overs: "0" },
      teamB: { runs: 0, wickets: 0, overs: "0" },
    };
  }
  
  const parts = scoreString.split(",").map((p) => p.trim());
  
  // Format: "1,238,6,20,226,5,19.4"
  // Team A: 238/6 in 20 Overs
  // Team B: 226/5 in 19.4 Overs
  if (parts.length >= 7) {
    return {
      teamA: {
        runs: parseInt(parts[1] || "0") || 0,
        wickets: parseInt(parts[2] || "0") || 0,
        overs: parts[3] || "0",
      },
      teamB: {
        runs: parseInt(parts[4] || "0") || 0,
        wickets: parseInt(parts[5] || "0") || 0,
        overs: parts[6] || "0",
      },
    };
  }
  
  return {
    teamA: { runs: 0, wickets: 0, overs: "0" },
    teamB: { runs: 0, wickets: 0, overs: "0" },
  };
};

// Format overs display (e.g., "20" -> "20 Over", "19.4" -> "19.4 Overs")
const formatOvers = (overs: string): string => {
  if (!overs || overs === "0") return "0 Over";
  const oversNum = parseFloat(overs);
  if (isNaN(oversNum)) return "0 Over";
  // If overs is a whole number, show "Over", otherwise "Overs"
  if (oversNum % 1 === 0) {
    return `${Math.floor(oversNum)} Over`;
  }
  return `${overs} Overs`;
};

/* ================= COMPONENT ================= */

export const Cmatch20Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  odds,
}: Cmatch20BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

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

  // Parse score and remark
  const scoreString = odds?.data?.score || odds?.score || "";
  const scores = useMemo(() => parseScore(scoreString), [scoreString]);
  const remark = odds?.data?.remark || odds?.remark || "";

  // Get bets for Run 2-10
  const runBets = useMemo(() => {
    const runs: { [key: number]: any } = {};
    for (let i = 2; i <= 10; i++) {
      runs[i] = find(actualBetTypes, `Run ${i}`);
    }
    return runs;
  }, [actualBetTypes]);

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet, side);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    await onPlaceBet({
      sid: selectedBet.sid,
      odds: getOdds(selectedBet, selectedSide),
      nat: selectedBet.nat,
      amount: parseFloat(amount),
      side: selectedSide,
    });

    setBetModalOpen(false);
    setSelectedBet(null);
    setAmount("100");
  };

  // Cricket Ball Icon Component (30% smaller)
  const CricketBallIcon = ({ runValue }: { runValue: number }) => {
    return (
      <div className="flex flex-col items-center mb-1 sm:mb-1.5">
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full flex items-center justify-center shadow-md border-2 border-red-900/30">
          {/* Cricket ball seam pattern - horizontal */}
          <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center">
            <div className="w-full h-0.5 bg-red-900/40 rounded-full"></div>
          </div>
          {/* Cricket ball seam pattern - vertical curved */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-red-900/30 rounded-full transform -rotate-12"></div>
          {/* Run number - prominent white text (30% smaller) */}
          <span className="text-sm sm:text-base lg:text-lg font-extrabold text-white drop-shadow-md relative z-10">{runValue}</span>
        </div>
        <span className="text-[9px] sm:text-[10px] font-bold text-gray-800 dark:text-gray-200 mt-0.5 uppercase tracking-wide">RUNS</span>
      </div>
    );
  };

  // Run Betting Section Component (30% smaller)
  const RunBetSection = ({ runValue }: { runValue: number }) => {
    const bet = runBets[runValue];
    const backOdds = getOdds(bet, "back");
    const layOdds = getOdds(bet, "lay");
    const formattedBackOdds = formatOdds(backOdds);
    const formattedLayOdds = formatOdds(layOdds);
    const suspended = isSuspended(bet) || (formattedBackOdds === "0.00" && formattedLayOdds === "0.00");
    const hasBack = formattedBackOdds !== "0.00";
    const hasLay = formattedLayOdds !== "0.00";

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-1.5 sm:p-2 lg:p-2.5 shadow-md">
        {/* Cricket Ball Icon */}
        <div className="flex justify-center mb-1.5 sm:mb-2">
          <CricketBallIcon runValue={runValue} />
        </div>

        {/* Team Information Bar (30% smaller) */}
        <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-lg p-1.5 sm:p-2 lg:p-2.5 mb-1.5 sm:mb-2 border border-gray-600">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:gap-2.5 text-white text-[9px] sm:text-[10px] lg:text-xs">
            <div>
              <div className="font-semibold mb-0.5 text-[9px] sm:text-[10px]">Team A</div>
              <div className="text-[10px] sm:text-xs font-bold break-words leading-tight">
                {scores.teamA.runs}/{scores.teamA.wickets} {formatOvers(scores.teamA.overs)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold mb-0.5 text-[9px] sm:text-[10px]">Team B</div>
              <div className="text-[10px] sm:text-xs font-bold break-words leading-tight">
                {scores.teamB.runs}/{scores.teamB.wickets} {formatOvers(scores.teamB.overs)}
              </div>
            </div>
          </div>
        </div>

        {/* Odds Buttons (30% smaller) */}
        {suspended || (!hasBack && !hasLay) ? (
          <div className="flex gap-1 sm:gap-1.5">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1.5 sm:p-2 flex items-center justify-center min-h-[32px] sm:min-h-[36px] lg:min-h-[40px]">
              <Lock size={14} className="sm:w-4 sm:h-4 text-gray-500" />
            </div>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1.5 sm:p-2 flex items-center justify-center min-h-[32px] sm:min-h-[36px] lg:min-h-[40px]">
              <Lock size={14} className="sm:w-4 sm:h-4 text-gray-500" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
            {hasBack && (
              <button
                disabled={loading}
                onClick={() => openBetModal(bet, "back")}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 sm:py-2 lg:py-2.5 px-1 sm:px-1.5 rounded-lg text-[10px] sm:text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[32px] sm:min-h-[36px] lg:min-h-[40px]"
              >
                {formattedBackOdds}
              </button>
            )}
            {hasLay && (
              <button
                disabled={loading}
                onClick={() => openBetModal(bet, "lay")}
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-1.5 sm:py-2 lg:py-2.5 px-1 sm:px-1.5 rounded-lg text-[10px] sm:text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[32px] sm:min-h-[36px] lg:min-h-[40px]"
              >
                {formattedLayOdds}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h3 className="text-xs sm:text-sm font-semibold">Cricket Match 20-20</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)} className="h-7 w-7 sm:h-8 sm:w-8">
          <Info size={14} className="sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* ================= REMARK/STATUS MESSAGE ================= */}
      {remark && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
          <p className="text-[10px] sm:text-xs text-yellow-800 dark:text-yellow-200 font-medium leading-relaxed">{remark}</p>
        </div>
      )}

      {/* ================= MAIN BETTING GRID - RESPONSIVE ================= */}
      {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
      {/* Run 2-10 all in one grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-3">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((run) => (
          <RunBetSection key={run} runValue={run} />
        ))}
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

          {selectedBet && (
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {selectedSide === "back" ? "Back" : "Lay"} Odds:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet, selectedSide))}
                  </span>
                </div>
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
                    const oddsValue = Number(getOdds(selectedBet, selectedSide));
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
            <DialogTitle className="text-sm sm:text-base">Cricket Match 20-20 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-[10px] sm:text-xs leading-relaxed text-gray-700 dark:text-gray-300 px-3 sm:px-6 pb-4 sm:pb-6">
            <p>
              This is a game of twenty-20 cricket. We will already have score of first batting team, & score of second batting team up to 19.4 overs. At this stage second batting team will be always 12 run short of first batting team (IF THE SCORE IS TIED, SECOND BAT WILL WIN). This 12 run has to be scored by 2 scoring shots or (two steps).
            </p>

            <div className="mt-4">
              <p className="font-semibold mb-2">1st Step:</p>
              <p>
                To be select a scoring shot from 2, 3, 4, 5, 6, 7, 8, 9, 10. The one who bet will get rate according to the scoring shot he select from 2 to 10, & that will be considered as ball number 19.5.
              </p>
            </div>

            <div className="mt-4">
              <p className="font-semibold mb-2">2nd Step:</p>
              <p>
                To open a card from 40 card deck of 1 to 10 of all suites. This will be considered last ball of the match. This twenty-20 game consist of scoring shots of 1 run to 10 runs.
              </p>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                IF THE SCORE IS TIED SECOND BAT WILL WIN
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
