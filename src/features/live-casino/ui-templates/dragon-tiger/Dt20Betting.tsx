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

interface Dt20BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string) =>
  bets.find((b) => (b.nat || "").toLowerCase() === nat.toLowerCase());

const getOdds = (bet: any) =>
  bet?.back ?? bet?.b ?? bet?.b1 ?? bet?.odds ?? 0;

const formatOdds = (val: any): string => {
  const num = Number(val);
  if (!num || isNaN(num)) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* ================= COMPONENT ================= */

export const Dt20Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
}: Dt20BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet) || formatOdds(getOdds(bet)) === "0.00") return;
    setSelectedBet(bet);
    setAmount("100");
    setBetModalOpen(true);
  };

  const placeBet = async () => {
    if (!selectedBet) return;
    await onPlaceBet({
      sid: selectedBet.sid,
      nat: selectedBet.nat,
      odds: getOdds(selectedBet),
      amount: Number(amount),
    });
    setBetModalOpen(false);
  };

  // Primary Bet Cell with odds above
  const PrimaryCell = ({ bet, label }: { bet: any; label: string }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative w-full flex flex-col items-center justify-center
          py-3 px-2 rounded-md transition-all
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          }
        `}
      >
        <div className="text-xs font-semibold mb-1">{odds}</div>
        <div className="text-sm font-bold">{label}</div>
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock size={16} />
          </div>
        )}
      </button>
    );
  };

  // Regular Cell for sub-bets
  const Cell = ({ bet }: { bet: any }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          h-10 w-full text-sm font-semibold flex items-center justify-center rounded
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : odds}
      </button>
    );
  };

  // Card Cell with yellow border and suit icons
  const CardCell = ({ bet, card, small = false }: { bet: any; card: string; small?: boolean }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative border-2 border-yellow-400 bg-white rounded-md
          flex flex-col items-center justify-center w-full
          transition-all
          ${small ? 'p-0.5 min-h-[35px]' : 'p-1 min-h-[45px]'}
          ${
            suspended
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-yellow-50 cursor-pointer hover:border-yellow-500"
          }
        `}
      >
        <div className={`font-bold text-gray-900 mb-0.5 ${small ? 'text-[10px]' : 'text-xs'}`}>{card}</div>
        <div className={`grid grid-cols-2 gap-0.5 ${small ? 'text-[8px]' : 'text-[10px]'}`}>
          <span className="text-black">♠</span>
          <span className="text-red-500">♥</span>
          <span className="text-black">♣</span>
          <span className="text-red-500">♦</span>
        </div>
        {odds !== "0.00" && (
          <div className={`text-gray-600 mt-0.5 ${small ? 'text-[7px]' : 'text-[8px]'}`}>{odds}</div>
        )}
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 rounded">
            <Lock size={small ? 8 : 10} />
          </div>
        )}
      </button>
    );
  };

  // Ace = 1 (dt20 API)
  const cards = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">20-20 Dragon Tiger</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= PRIMARY BETS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <PrimaryCell bet={find(betTypes, "Dragon")} label="Dragon" />
        <PrimaryCell bet={find(betTypes, "Tie")} label="Tie" />
        <PrimaryCell bet={find(betTypes, "Tiger")} label="Tiger" />
        <PrimaryCell bet={find(betTypes, "Pair")} label="Pair" />
      </div>

      {/* ================= DRAGON & TIGER SECTIONS (SIDE BY SIDE) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* DRAGON BLOCK */}
        <div className="border rounded-lg p-2">
          <div className="text-xs font-bold mb-2 text-gray-700 text-center">DRAGON</div>
          
          {/* Headers Row */}
          <div className="grid grid-cols-4 gap-1 mb-1">
            <div className="text-xs font-semibold text-center py-1">Even</div>
            <div className="text-xs font-semibold text-center py-1">Odd</div>
            <div className="text-xs font-semibold text-center py-1 flex items-center justify-center gap-0.5">
              <span className="text-red-500">♥</span>
              <span className="text-red-500">♦</span>
            </div>
            <div className="text-xs font-semibold text-center py-1 flex items-center justify-center gap-0.5">
              <span className="text-black">♠</span>
              <span className="text-black">♣</span>
            </div>
          </div>

          {/* Odds Row */}
          <div className="grid grid-cols-4 gap-1">
            <Cell bet={find(betTypes, "Dragon Even")} />
            <Cell bet={find(betTypes, "Dragon Odd")} />
            <Cell bet={find(betTypes, "Dragon Red")} />
            <Cell bet={find(betTypes, "Dragon Black")} />
          </div>
        </div>

        {/* TIGER BLOCK */}
        <div className="border rounded-lg p-2">
          <div className="text-xs font-bold mb-2 text-gray-700 text-center">TIGER</div>
          
          {/* Headers Row */}
          <div className="grid grid-cols-4 gap-1 mb-1">
            <div className="text-xs font-semibold text-center py-1">Even</div>
            <div className="text-xs font-semibold text-center py-1">Odd</div>
            <div className="text-xs font-semibold text-center py-1 flex items-center justify-center gap-0.5">
              <span className="text-red-500">♥</span>
              <span className="text-red-500">♦</span>
            </div>
            <div className="text-xs font-semibold text-center py-1 flex items-center justify-center gap-0.5">
              <span className="text-black">♠</span>
              <span className="text-black">♣</span>
            </div>
          </div>

          {/* Odds Row */}
          <div className="grid grid-cols-4 gap-1">
            <Cell bet={find(betTypes, "Tiger Even")} />
            <Cell bet={find(betTypes, "Tiger Odd")} />
            <Cell bet={find(betTypes, "Tiger Red")} />
            <Cell bet={find(betTypes, "Tiger Black")} />
          </div>
        </div>
      </div>

      {/* ================= CARDS SECTION (DRAGON LEFT, TIGER RIGHT) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* DRAGON 12 - All 13 cards in one border */}
        <div className="border rounded-lg p-2">
          <div className="text-xs font-bold mb-2 text-gray-700 text-center">DRAGON 0</div>
          
          {/* First Row: 9 cards */}
          <div 
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}
          >
            {cards.slice(0, 9).map((c) => (
              <CardCell key={c} bet={find(betTypes, `Dragon Card ${c}`)} card={c} />
            ))}
          </div>

          {/* Second Row: 4 cards - Smaller size */}
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
          >
            {cards.slice(9, 13).map((c) => (
              <CardCell key={c} bet={find(betTypes, `Dragon Card ${c}`)} card={c} small={true} />
            ))}
          </div>
        </div>

        {/* TIGER 12 - All 13 cards in one border */}
        <div className="border rounded-lg p-2">
          <div className="text-xs font-bold mb-2 text-gray-700 text-center">TIGER 0</div>
          
          {/* First Row: 9 cards */}
          <div 
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}
          >
            {cards.slice(0, 9).map((c) => (
              <CardCell key={c} bet={find(betTypes, `Tiger Card ${c}`)} card={c} />
            ))}
          </div>

          {/* Second Row: 4 cards - Smaller size */}
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
          >
            {cards.slice(9, 13).map((c) => (
              <CardCell key={c} bet={find(betTypes, `Tiger Card ${c}`)} card={c} small={true} />
            ))}
          </div>
        </div>
      </div>

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="bg-slate-800 text-white px-3 py-2 flex justify-between items-center">
            <DialogTitle className="text-sm">Place Bet</DialogTitle>
            <button onClick={() => setBetModalOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          {selectedBet && (
            <div className="p-4 space-y-3">
              <div className="text-sm font-semibold">{selectedBet.nat}</div>
              <div className="text-xs text-gray-600">
                Odds: <span className="font-bold">{formatOdds(getOdds(selectedBet))}</span>
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
                  Potential win: ₹
                  {(
                    parseFloat(amount) *
                    (Number(getOdds(selectedBet)) > 1000
                      ? Number(getOdds(selectedBet)) / 100000
                      : Number(getOdds(selectedBet)))
                  ).toFixed(2)}
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={placeBet}
                disabled={loading || !amount || parseFloat(amount) <= 0}
              >
                {loading ? "Placing..." : `Place Bet ₹${amount}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= RULES ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md text-sm">
          <DialogHeader>
            <DialogTitle>Dragon Tiger Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-xs leading-relaxed">
            <p>• Highest card wins</p>
            <p>• Same rank → suit priority</p>
            <p className="font-semibold">
              ♠ Spade &gt; ♥ Heart &gt; ♣ Club &gt; ♦ Diamond
            </p>
            <p>• Same rank + same suit = Tie</p>
            <p>• Pair = same rank</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
