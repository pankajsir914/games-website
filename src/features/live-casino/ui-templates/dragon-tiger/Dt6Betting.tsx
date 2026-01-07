// src/pages/tables/Dt6Betting.tsx

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

interface Dt6BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) =>
  !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string) =>
  bets.find((b) => {
    const betNat = (b.nat || "").toLowerCase();
    const betType = (b.type || "").toLowerCase();
    const searchTerm = nat.toLowerCase();
    return betNat === searchTerm || betType === searchTerm;
  });

// Get odds from multiple possible fields
const getOdds = (bet: any) => {
  if (!bet) return 0;
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? bet.l ?? 0;
};

// Format odds value
const formatOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* ================= COMPONENT ================= */

export const Dt6Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
}: Dt6BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  const dragon = find(betTypes, "Dragon");
  const tiger = find(betTypes, "Tiger");
  const pair = find(betTypes, "Pair");

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
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold
          ${
            suspended
              ? "bg-gray-200 text-gray-500"
              : "bg-sky-400 text-white hover:bg-sky-500"
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
        <h3 className="text-sm font-semibold">Dragon Tiger</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= DRAGON / TIGER ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-3 text-xs font-semibold bg-gray-100">
          <div />
          <div className="text-center bg-sky-300">Back</div>
          <div className="text-center bg-pink-300">Lay</div>
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Dragon</div>
          <Cell bet={dragon} />
          <div className="bg-pink-200 flex items-center justify-center">0</div>
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Tiger</div>
          <Cell bet={tiger} />
          <div className="bg-pink-200 flex items-center justify-center">0</div>
        </div>
      </div>

      {/* ================= PAIR ================= */}
      {pair && (
        <div className="border mb-3">
          <div className="grid grid-cols-2">
            <div className="p-2 text-sm">12</div>
            <button
              disabled={isSuspended(pair) || loading || formatOdds(getOdds(pair)) === "0.00"}
              onClick={() => openBetModal(pair)}
              className={`h-10 bg-gradient-to-r from-sky-600 to-slate-700 text-white font-semibold ${
                isSuspended(pair) || formatOdds(getOdds(pair)) === "0.00"
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-sky-700 hover:to-slate-800"
              }`}
            >
              {isSuspended(pair) || formatOdds(getOdds(pair)) === "0.00" ? (
                <Lock size={14} />
              ) : (
                `Pair ${formatOdds(getOdds(pair))}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= EVEN / ODD ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-3 text-xs font-semibold bg-gray-100">
          <div />
          <div className="text-center bg-sky-300">Even</div>
          <div className="text-center bg-sky-300">Odd</div>
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Dragon</div>
          <Cell bet={get("Dragon Even")} />
          <Cell bet={get("Dragon Odd")} />
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Tiger</div>
          <Cell bet={get("Tiger Even")} />
          <Cell bet={get("Tiger Odd")} />
        </div>
      </div>

      {/* ================= RED / BLACK ================= */}
      <div className="border mb-2">
        <div className="grid grid-cols-3 text-xs font-semibold bg-gray-100">
          <div />
          <div className="text-center bg-sky-300">Red ♦</div>
          <div className="text-center bg-sky-300">Black ♠</div>
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Dragon</div>
          <Cell bet={get("Dragon Red")} />
          <Cell bet={get("Dragon Black")} />
        </div>

        <div className="grid grid-cols-3 border-t">
          <div className="p-2 text-sm">Tiger</div>
          <Cell bet={get("Tiger Red")} />
          <Cell bet={get("Tiger Black")} />
        </div>
      </div>

      {/* ================= SUITS ================= */}
      <div className="border">
        <div className="grid grid-cols-5 text-xs font-semibold bg-gray-100">
          <div />
          <div className="text-center">♠</div>
          <div className="text-center text-red-500">♥</div>
          <div className="text-center">♣</div>
          <div className="text-center text-red-500">♦</div>
        </div>

        {["Dragon", "Tiger"].map((side) => (
          <div key={side} className="grid grid-cols-5 border-t">
            <div className="p-2 text-sm">{side}</div>
            <Cell bet={get(`${side} Spade`)} />
            <Cell bet={get(`${side} Heart`)} />
            <Cell bet={get(`${side} Club`)} />
            <Cell bet={get(`${side} Diamond`)} />
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
            <DialogTitle>Dragon Tiger Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>
              • Dragon Tiger game me 2 hands deal hoti hain – ek Dragon ke liye aur
              ek Tiger ke liye. Player bet karta hai kaunsa jeetega ya tie hoga.
            </p>

            <p>
              • Har side ko ek hi card milta hai. Highest ranking card winner hota
              hai.
            </p>

            <p>
              • Game 1 deck (52 cards) se khela jata hai.
            </p>

            <p>
              • Card ranking (lowest se highest): <br />
              <b>Ace (1), 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen, King (13)</b>
            </p>

            <p>
              • Agar same rank ka card aaye (jaise Ace vs Ace), to winner suit
              priority se decide hota hai:
            </p>

            <p className="font-semibold">
              ♠ Spade &gt; ♥ Heart &gt; ♣ Club &gt; ♦ Diamond
            </p>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
};
