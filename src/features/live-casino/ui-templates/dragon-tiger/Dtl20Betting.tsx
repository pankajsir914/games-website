import { useState } from "react";
import { Lock, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ================= TYPES ================= */

interface Dtl20BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  formatOdds?: (val: any) => string; // Optional odds formatter
}

/* ================= HELPERS ================= */

// Get odds from multiple possible fields
const getOdds = (bet: any) => {
  if (!bet) return 0;
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? bet.l ?? 0;
};

// Format odds value
const formatOddsValue = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

// Check if bet is suspended or locked 
const isSuspended = (b: any) => {
  if (!b) return true;
  if (b?.gstatus === "SUSPENDED" || b?.status === "suspended") return true;
  const odds = getOdds(b);
  const oddsValue = formatOddsValue(odds);
  // If odds are 0 or "0.00", consider it suspended
  if (oddsValue === "0.00" || Number(odds) === 0) return true;
  return false;
};

const find = (bets: any[], nat: string) =>
  bets.find((b) => (b.nat || "").toLowerCase() === nat.toLowerCase());

const cardRanks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// Playing Card Label Component
const CardLabel = ({ rank }: { rank: string }) => {
  const getSuitColor = (suit: string) => {
    return suit === "♥" || suit === "♦" ? "text-red-600" : "text-black";
  };

  return (
    <div className="p-1 sm:p-1.5 md:p-2 flex items-center justify-center h-9 m-0.5 sm:m-1">
      <div className="relative bg-white rounded border border-gray-400 shadow-sm 
                      w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 
                      flex flex-col items-center justify-center">
        {/* Rank at top left */}
        <div className="absolute top-0.5 left-0.5 sm:top-0.5 sm:left-0.5 
                        text-[7px] sm:text-[8px] md:text-[9px] 
                        font-bold text-black leading-none">
          {rank}
        </div>
        
        {/* Four suits in center in a 2x2 grid */}
        <div className="grid grid-cols-2 gap-0.5 
                        text-[7px] sm:text-[8px] md:text-[9px]">
          <span className={getSuitColor("♠")}>♠</span>
          <span className={getSuitColor("♥")}>♥</span>
          <span className={getSuitColor("♣")}>♣</span>
          <span className={getSuitColor("♦")}>♦</span>
        </div>
        
        {/* Rank at bottom right (rotated) */}
        <div className="absolute bottom-0.5 right-0.5 sm:bottom-0.5 sm:right-0.5 
                        text-[7px] sm:text-[8px] md:text-[9px] 
                        font-bold text-black rotate-180 leading-none">
          {rank}
        </div>
      </div>
    </div>
  );
};

/* ================= COMPONENT ================= */

export const Dtl20Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  formatOdds = formatOddsValue,
}: Dtl20BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  // Show UI even without data - just display the structure

  const get = (nat: string) => find(betTypes, nat);

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet) || formatOdds(getOdds(bet)) === "0.00") return;
    setSelectedBet(bet);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;
    
    await onPlaceBet({
      sid: selectedBet.sid,
      odds: getOdds(selectedBet),
      nat: selectedBet.nat,
      amount: parseFloat(amount),
    });
    
    setBetModalOpen(false);
    setSelectedBet(null);
    setAmount("100");
  };

  const Cell = ({ bet }: { bet: any }) => {
    // Show UI even if bet is undefined - just show placeholder/locked state
    if (!bet) {
      return (
        <button
          disabled
          className="h-9 w-full flex items-center justify-center text-xs font-semibold rounded bg-gray-200 text-gray-500 cursor-not-allowed"
        >
          <Lock size={14} />
        </button>
      );
    }
    
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet);
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          h-9 w-full flex items-center justify-center
          text-xs font-semibold rounded
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-sky-400 text-white hover:bg-sky-500 cursor-pointer"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : formattedOdds}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">20-20 Dragon Tiger Lion</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= WINNER ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-4 text-xs font-semibold bg-card">
          <div />
          <div className="text-center text-white">Dragon</div>
          <div className="text-center text-white">Tiger</div>
          <div className="text-center text-white">Lion</div>
        </div>

        <div className="grid grid-cols-4 border-t">
          <div className="p-2 text-xs">Winner</div>
          <Cell bet={get("Winner D")} />
          <Cell bet={get("Winner T")} />
          <Cell bet={get("Winner L")} />
        </div>
      </div>

      {/* ================= COLOR ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-4 text-xs font-semibold bg-card">
          <div />
          <div className="text-center text-white">Dragon</div>
          <div className="text-center text-white">Tiger</div>
          <div className="text-center text-white">Lion</div>
        </div>

        {["Black", "Red"].map((c) => (
          <div key={c} className="grid grid-cols-4 border-t">
            <div className="p-2 text-xs">{c}</div>
            <Cell bet={get(`${c} D`)} />
            <Cell bet={get(`${c} T`)} />
            <Cell bet={get(`${c} L`)} />
          </div>
        ))}
      </div>

      {/* ================= ODD / EVEN ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-4 text-xs font-semibold bg-card">
          <div />
          <div className="text-center text-white">Dragon</div>
          <div className="text-center text-white">Tiger</div>
          <div className="text-center text-white">Lion</div>
        </div>

        {["Odd", "Even"].map((v) => (
          <div key={v} className="grid grid-cols-4 border-t">
            <div className="p-2 text-xs">{v}</div>
            <Cell bet={get(`${v} D`)} />
            <Cell bet={get(`${v} T`)} />
            <Cell bet={get(`${v} L`)} />
          </div>
        ))}
      </div>

      {/* ================= CARD VALUE (A-K) ================= */}
      <div className="border">
        <div className="grid grid-cols-4 text-xs font-semibold bg-card">
          <div />
          <div className="text-center text-white">Dragon</div>
          <div className="text-center text-white">Tiger</div>
          <div className="text-center text-white">Lion</div>
        </div>

        {cardRanks.map((r) => (
          <div key={r} className="grid grid-cols-4 border-t">
            <CardLabel rank={r} />
            <Cell bet={get(`Dragon ${r}`)} />
            <Cell bet={get(`Tiger ${r}`)} />
            <Cell bet={get(`Lion ${r}`)} />
          </div>
        ))}
      </div>

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="bg-slate-800 text-white px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          {selectedBet && (
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedBet.nat}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Odds: <span className="font-bold text-blue-600 dark:text-blue-400">{formatOdds(getOdds(selectedBet))}</span>
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
                  {(parseFloat(amount) * (Number(getOdds(selectedBet)) > 1000 ? Number(getOdds(selectedBet)) / 100000 : Number(getOdds(selectedBet)))).toFixed(2)}
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
        <DialogContent className="max-w-md text-sm">
          <DialogHeader>
            <DialogTitle>20-20 D T L Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              20-20 DTL (Dragon Tiger Lion) is a 52 playing cards game.  
              In DTL game, 3 hands are dealt – one for each player.
              The player bets on which hand will win.
            </p>

            <p>
              The ranking of cards is from lowest to highest:
              Ace, 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen and King,
              where Ace is "1" and King is "13".
            </p>

            <p>
              On same card with different suit, winner will be declared
              based on the following winning suit sequence:
            </p>

            <p className="font-semibold">
              ♠ Spade &nbsp; 1st <br />
              ♥ Heart &nbsp; 2nd <br />
              ♣ Club &nbsp; 3rd <br />
              ♦ Diamond &nbsp; 4th
            </p>
          </div>
        </DialogContent>
      </Dialog>

    </>
  ); 
};
