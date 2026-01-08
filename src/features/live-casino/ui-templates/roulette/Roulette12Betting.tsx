import { Lock, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

/* ================= TYPES ================= */

interface Roulette12BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
}

/* ================= HELPERS ================= */

// Check if bet is suspended (s=0 or odds=0)
const isSuspended = (bet: any, side: "back" | "lay") => {
  if (!bet) return true;
  // API uses 's' field: 0 = suspended, 1 = open
  if (bet.s === 0 || bet.s === "0") return true;
  // Check odds based on side
  const odds = side === "back" 
    ? (bet?.b ?? bet?.back ?? bet?.b1 ?? bet?.odds ?? 0)
    : (bet?.l ?? bet?.lay ?? bet?.l1 ?? 0);
  return Number(odds) <= 0;
};

// Find bet by name/number (handles both raw API format and transformed format)
const find = (bets: any[], name: string) => {
  return bets.find((b) => {
    // Handle both raw API format (n) and transformed format (nat, type)
    const betName = (b.n || b.nat || b.type || "").toString().trim();
    const searchName = name.toString().trim();
    return betName === searchName || betName.toLowerCase() === searchName.toLowerCase();
  });
};

const getOdds = (bet: any, side: "back" | "lay") => {
  if (side === "back") {
    return bet?.b ?? bet?.back ?? bet?.b1 ?? bet?.odds ?? 0;
  } else {
    return bet?.l ?? bet?.lay ?? bet?.l1 ?? 0;
  }
};

const formatOdds = (val: any): string => {
  const num = Number(val);
  if (!num || isNaN(num)) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

// Roulette number colors (standard single-zero)
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const getNumberColor = (num: number): "red" | "black" | "green" => {
  if (num === 0) return "green";
  return redNumbers.includes(num) ? "red" : "black";
};

// Roulette number layout (3 rows x 12 columns)
const ROW1 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
const ROW2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
const ROW3 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];

/* ================= COMPONENT ================= */

export const Roulette12Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
}: Roulette12BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [amount, setAmount] = useState("100");
  const [betSide, setBetSide] = useState<"back" | "lay">("back");

  const quickAmounts = [100, 500, 1000, 5000];

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet, betSide)) return;
    const odds = getOdds(bet, betSide);
    if (formatOdds(odds) === "0.00") return;
    setSelectedBet(bet);
    setAmount("100");
    setBetModalOpen(true);
  };

  const placeBet = async () => {
    if (!selectedBet) return;
    await onPlaceBet({
      sid: selectedBet.i || selectedBet.sid,
      nat: selectedBet.n || selectedBet.nat || selectedBet.type,
      odds: getOdds(selectedBet, betSide),
      amount: Number(amount),
      side: betSide,
    });
    setBetModalOpen(false);
  };

  // Number cell component
  const NumberCell = ({ num }: { num: number }) => {
    const bet = find(betTypes, num.toString());
    const suspended = bet ? isSuspended(bet, betSide) : true;
    const odds = formatOdds(getOdds(bet, betSide));
    const color = getNumberColor(num);
    
    // Use lighter colors when suspended (like in the image)
    const bgClass = suspended
      ? color === "red"
        ? "bg-pink-200"
        : color === "green"
        ? "bg-green-200"
        : "bg-gray-300"
      : color === "red"
      ? "bg-red-600 hover:bg-red-700"
      : color === "green"
      ? "bg-green-700 hover:bg-green-800"
      : "bg-gray-900 hover:bg-gray-800";
    
    const textClass = suspended ? "text-gray-700" : "text-white";
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => bet && !suspended && openBetModal(bet)}
        className={`
          relative h-12 w-full flex items-center justify-center
          font-bold text-sm rounded transition-all
          ${bgClass}
          ${suspended ? "cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {/* Content - always visible */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          <span className={textClass}>{num}</span>
          <span className={`absolute bottom-0.5 text-[8px] ${suspended ? "text-gray-600" : "text-white opacity-75"}`}>
            {odds}
          </span>
        </div>
        {/* Lock overlay - only when suspended */}
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Lock size={16} className="text-gray-900" />
          </div>
        )}
      </button>
    );
  };

  // Zero cell (spans 3 rows)
  const ZeroCell = () => {
    const bet = find(betTypes, "0");
    const suspended = bet ? isSuspended(bet, betSide) : true;
    const odds = formatOdds(getOdds(bet, betSide));
    
    const bgClass = suspended ? "bg-green-200" : "bg-green-700 hover:bg-green-800";
    const textClass = suspended ? "text-gray-700" : "text-white";
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => bet && !suspended && openBetModal(bet)}
        className={`
          relative h-full w-full flex flex-col items-center justify-center
          font-bold text-lg rounded transition-all
          ${bgClass}
          ${suspended ? "cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {/* Content - always visible */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          <span className={`text-xl ${textClass}`}>0</span>
          <span className={`text-[9px] mt-0.5 ${suspended ? "text-gray-600" : "text-white opacity-75"}`}>
            {odds}
          </span>
        </div>
        {/* Lock overlay - only when suspended */}
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Lock size={18} className="text-gray-900" />
          </div>
        )}
      </button>
    );
  };

  // Column cell (2to1)
  const ColumnCell = ({ columnNum }: { columnNum: number }) => {
    const columnNames = ["1st Column", "2nd Column", "3rd Column"];
    const bet = find(betTypes, columnNames[columnNum - 1]);
    const suspended = bet ? isSuspended(bet, betSide) : true;
    const odds = formatOdds(getOdds(bet, betSide));
    
    const bgClass = suspended ? "bg-yellow-200" : "bg-yellow-100 hover:bg-yellow-200";
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => bet && !suspended && openBetModal(bet)}
        className={`
          relative h-12 w-full flex flex-col items-center justify-center
          font-bold text-xs rounded transition-all border-2
          ${bgClass} ${suspended ? "border-gray-300" : "border-yellow-300"}
          ${suspended ? "cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {/* Content - always visible */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          <span className={suspended ? "text-gray-700 font-bold" : "text-red-600 font-bold"}>2to1</span>
          <span className={`text-[10px] mt-0.5 ${suspended ? "text-gray-600" : "text-gray-900"}`}>
            {odds}
          </span>
        </div>
        {/* Lock overlay - only when suspended */}
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Lock size={14} className="text-gray-900" />
          </div>
        )}
      </button>
    );
  };

  // Category bet cell (yellow background)
  const CategoryCell = ({ label }: { label: string }) => {
    const bet = find(betTypes, label);
    const suspended = bet ? isSuspended(bet, betSide) : true;
    const odds = formatOdds(getOdds(bet, betSide));
    
    const bgClass = suspended 
      ? "bg-yellow-200 border-gray-300" 
      : "bg-yellow-100 hover:bg-yellow-200 border-yellow-300";
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => bet && !suspended && openBetModal(bet)}
        className={`
          relative h-14 w-full flex flex-col items-center justify-center
          rounded transition-all border-2
          ${bgClass}
          ${suspended ? "cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {/* Content - always visible */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          <span className={`font-bold text-sm ${suspended ? "text-gray-700" : label === "Black" ? "text-black" : "text-red-600"}`}>
            {label}
          </span>
          <span className={`font-bold text-xs mt-1 ${suspended ? "text-gray-600" : "text-gray-900"}`}>
            {odds}
          </span>
        </div>
        {/* Lock overlay - only when suspended */}
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Lock size={16} className="text-gray-900" />
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">Beach Roulette</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= BACK/LAY TOGGLE ================= */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setBetSide("back")}
          className={`
            flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all
            ${betSide === "back"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }
          `}
        >
          Back
        </button>
        <button
          onClick={() => setBetSide("lay")}
          className={`
            flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all
            ${betSide === "lay"
              ? "bg-pink-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }
          `}
        >
          Lay
        </button>
      </div>

      {/* ================= MAIN BETTING GRID ================= */}
      <div className="grid grid-cols-[70px_repeat(12,1fr)_70px] auto-rows-[48px] gap-1 mb-4">
        {/* Zero Column (spans 3 rows) */}
        <div className="row-span-3">
          <ZeroCell />
        </div>

        {/* Row 1: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 */}
        {ROW1.map((num) => (
          <NumberCell key={num} num={num} />
        ))}

        {/* Column 1 (2to1) - Row 1 */}
        <ColumnCell columnNum={1} />

        {/* Row 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 */}
        {ROW2.map((num) => (
          <NumberCell key={num} num={num} />
        ))}

        {/* Column 2 (2to1) - Row 2 */}
        <ColumnCell columnNum={2} />

        {/* Row 3: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 */}
        {ROW3.map((num) => (
          <NumberCell key={num} num={num} />
        ))}

        {/* Column 3 (2to1) - Row 3 */}
        <ColumnCell columnNum={3} />
      </div>

      {/* ================= CATEGORY BETS ================= */}
      {/* Dozens Row */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <CategoryCell label="1st 12" />
        <CategoryCell label="2nd 12" />
        <CategoryCell label="3rd 12" />
      </div>

      {/* Outside Bets Row */}
      <div className="grid grid-cols-6 gap-2">
        <CategoryCell label="1 to 18" />
        <CategoryCell label="Even" />
        <CategoryCell label="Red" />
        <CategoryCell label="Black" />
        <CategoryCell label="Odd" />
        <CategoryCell label="19 to 36" />
      </div>

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="bg-slate-800 text-white px-3 py-2 flex justify-between items-center">
            <DialogTitle className="text-sm">Place Bet ({betSide.toUpperCase()})</DialogTitle>
            <button onClick={() => setBetModalOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          {selectedBet && (
            <div className="p-4 space-y-3">
              <div className="text-sm font-semibold">{selectedBet.n || selectedBet.nat || selectedBet.type}</div>
              <div className="text-xs text-gray-600">
                Odds: <span className="font-bold">{formatOdds(getOdds(selectedBet, betSide))}</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`py-2 px-2 rounded text-xs font-medium transition-colors ${
                      amount === String(a)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    ₹{a}
                  </button>
                ))}
              </div>

              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full"
              />

              {amount && parseFloat(amount) > 0 && (
                <div className="text-xs text-gray-600">
                  {betSide === "back" ? "Potential win" : "Liability"}: ₹
                  {(
                    parseFloat(amount) *
                    (Number(getOdds(selectedBet, betSide)) > 1000
                      ? Number(getOdds(selectedBet, betSide)) / 100000
                      : Number(getOdds(selectedBet, betSide)))
                  ).toFixed(2)}
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={placeBet}
                disabled={loading || !amount || parseFloat(amount) <= 0}
              >
                {loading ? "Placing..." : `Place ${betSide.toUpperCase()} Bet ₹${amount}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= RULES ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Beach Roulette Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <p>
                Beach Roulette is a European-style roulette game. This game is played with 
                numbered spaces from 0 to 36. You can place bets on individual numbers, 
                groups of numbers, or various outside betting options.
              </p>
            </div>

            <div>
              <p>
                Bets made on the numbered spaces on the betting area, or on the lines between 
                them, are called Inside Bets, while bets made on the special boxes below and 
                to the side of the main grid of numbers are called Outside Bets.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">INSIDE BETS:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Straight Up</strong> — place your chip directly on any single number (including zero).</li>
                <li><strong>Split Bet</strong> — place your chip on the line between any two numbers, either on the vertical or horizontal.</li>
                <li><strong>Street Bet</strong> — place your chip at the end of any row of numbers. A Street Bet covers all numbers on that Street.</li>
                <li><strong>Corner Bet</strong> — place your chip at the corner (central intersection) where four numbers meet. All numbers on that corner are covered.</li>
                <li><strong>Line Bet</strong> — place your chip at the end of two rows on the intersection between the two rows. A line bet covers all the numbers in both rows.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">OUTSIDE BETS:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Column Bet</strong> — place your chip in one of the boxes marked "2 to 1" at the end of the column that covers all numbers in that column. The zero is not covered by any column bet.</li>
                <li><strong>Dozen Bet</strong> — place your chip in one of the three boxes marked "1st 12," "2nd 12" or "3rd 12" to cover the numbers alongside the box.</li>
                <li><strong>Red/Black</strong> — place your chip in the Red or Black box to cover all red or all black numbers. The zero is not covered by these bets.</li>
                <li><strong>Even/Odd</strong> — place your chip in one of these boxes to cover the even or odd numbers. The zero is not covered by these bets.</li>
                <li><strong>1-18/19-36</strong> — place your chip in either of these boxes to cover the first or second set of numbers. The zero is not covered by these bets.</li>
              </ul>
            </div>

            <div>
              <p>
                Each bet covers a different set of numbers and offers different payout odds. 
                Bet spots will be highlighted.
              </p>
              <p className="mt-2 font-semibold">Good Luck!!!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
