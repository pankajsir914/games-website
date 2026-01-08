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

interface Aaa2BettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const find = (bets: any[], nat: string) =>
  bets.find((b) => (b.nat || "").toLowerCase() === nat.toLowerCase());

const getOdds = (bet: any, side: "back" | "lay" = "back") => {
  if (side === "lay") {
    return bet?.lay ?? bet?.l ?? 0;
  }
  return bet?.back ?? bet?.b ?? bet?.b1 ?? bet?.odds ?? 0;
};

const formatOdds = (val: any): string => {
  const num = Number(val);
  if (!num || isNaN(num)) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* ================= COMPONENT ================= */

export const Aaa2Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
}: Aaa2BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"back" | "lay">("back");
  const [amount, setAmount] = useState("100");

  const quickAmounts = [100, 500, 1000, 5000];

  const openBetModal = (bet: any, side: "back" | "lay" = "back") => {
    if (!bet || isSuspended(bet)) return;
    const odds = getOdds(bet, side);
    if (formatOdds(odds) === "0.00") return;
    setSelectedBet(bet);
    setSelectedSide(side);
    setAmount("100");
    setBetModalOpen(true);
  };

  const placeBet = async () => {
    if (!selectedBet) return;
    await onPlaceBet({
      sid: selectedBet.sid,
      nat: selectedBet.nat,
      odds: getOdds(selectedBet, selectedSide),
      amount: Number(amount),
      side: selectedSide,
    });
    setBetModalOpen(false);
  };

  // Main bet header with back/lay boxes
  const MainBetHeader = ({ bet, label }: { bet: any; label: string }) => {
    const suspended = isSuspended(bet);
    const backOdds = formatOdds(getOdds(bet, "back"));
    const layOdds = formatOdds(getOdds(bet, "lay"));
    
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs font-semibold text-gray-700">{label}</div>
        <div className="flex gap-1 w-full">
          <button
            disabled={suspended || loading || backOdds === "0.00"}
            onClick={() => openBetModal(bet, "back")}
            className={`
              flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all
              ${
                suspended || backOdds === "0.00"
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-200 hover:bg-blue-300 text-blue-900 cursor-pointer"
              }
            `}
          >
            {backOdds}
          </button>
          <button
            disabled={suspended || loading || layOdds === "0.00"}
            onClick={() => openBetModal(bet, "lay")}
            className={`
              flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all
              ${
                suspended || layOdds === "0.00"
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-pink-200 hover:bg-pink-300 text-pink-900 cursor-pointer"
              }
            `}
          >
            {layOdds}
          </button>
        </div>
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock size={12} />
          </div>
        )}
      </div>
    );
  };

  // Fancy bet button with gradient
  const FancyBetButton = ({ bet, label, icon }: { bet: any; label: string; icon?: React.ReactNode }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative w-full flex flex-col items-center justify-center
          py-4 px-2 rounded-md transition-all
          bg-gradient-to-b from-blue-500 to-blue-700 text-white
          ${
            suspended
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-blue-600 hover:to-blue-800 cursor-pointer"
          }
        `}
      >
        <div className="text-xs font-semibold mb-1">{odds}</div>
        <div className="text-sm font-bold flex items-center gap-1">
          {icon}
          {label}
        </div>
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded">
            <Lock size={16} />
          </div>
        )}
      </button>
    );
  };

  // Card Cell with yellow border and suit icons
  const CardCell = ({ bet, card }: { bet: any; card: string }) => {
    const suspended = isSuspended(bet);
    const odds = formatOdds(getOdds(bet));
    
    return (
      <button
        disabled={suspended || loading}
        onClick={() => openBetModal(bet)}
        className={`
          relative border-2 border-yellow-400 bg-white rounded-md
          flex flex-col items-center justify-center w-full
          transition-all p-1 min-h-[45px]
          ${
            suspended
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-yellow-50 cursor-pointer hover:border-yellow-500"
          }
        `}
      >
        <div className="font-bold text-gray-900 mb-0.5 text-xs">{card}</div>
        <div className="grid grid-cols-2 gap-0.5 text-[10px]">
          <span className="text-black">♠</span>
          <span className="text-red-500">♥</span>
          <span className="text-black">♣</span>
          <span className="text-red-500">♦</span>
        </div>
        {odds !== "0.00" && (
          <div className="text-gray-600 mt-0.5 text-[8px]">{odds}</div>
        )}
        {suspended && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 rounded">
            <Lock size={10} />
          </div>
        )}
      </button>
    );
  };

  // Get bets
  const amarBet = find(betTypes, "Amar");
  const akbarBet = find(betTypes, "Akbar");
  const anthonyBet = find(betTypes, "Anthony");
  const evenBet = find(betTypes, "Even");
  const oddBet = find(betTypes, "Odd");
  const redBet = find(betTypes, "Red");
  const blackBet = find(betTypes, "Black");
  const under7Bet = find(betTypes, "Under 7");
  const over7Bet = find(betTypes, "Over 7");

  // Card bets - map Card A, Card 2, etc.
  const cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const cardBets = cards.map((card) => {
    // Try exact match first
    let bet = find(betTypes, `Card ${card}`);
    // If not found, try with space variations or just the card name
    if (!bet) {
      bet = betTypes.find((b: any) => {
        const nat = (b.nat || "").toLowerCase();
        return nat === `card ${card.toLowerCase()}` || 
               nat === `card${card.toLowerCase()}` ||
               nat === card.toLowerCase();
      });
    }
    return bet;
  });

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">Amar Akbar Anthony 2</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= MAIN BETS (Amar, Akbar, Anthony) ================= */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <MainBetHeader bet={amarBet} label="A. Amar" />
        <MainBetHeader bet={akbarBet} label="B. Akbar" />
        <MainBetHeader bet={anthonyBet} label="C. Anthony" />
      </div>

      {/* ================= FANCY BETS SECTION ================= */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Column A: Even/Odd */}
        <div className="flex flex-col gap-2">
          <FancyBetButton bet={evenBet} label="Even" />
          <FancyBetButton bet={oddBet} label="Odd" />
        </div>

        {/* Column B: Red/Black */}
        <div className="flex flex-col gap-2">
          <FancyBetButton 
            bet={redBet} 
            label="Red" 
            icon={
              <span className="flex gap-0.5">
                <span className="text-red-500">♥</span>
                <span className="text-red-500">♦</span>
              </span>
            }
          />
          <FancyBetButton 
            bet={blackBet} 
            label="Black"
            icon={
              <span className="flex gap-0.5">
                <span className="text-black">♠</span>
                <span className="text-black">♣</span>
              </span>
            }
          />
        </div>

        {/* Column C: Under 7/Over 7 */}
        <div className="flex flex-col gap-2">
          <FancyBetButton bet={under7Bet} label="Under 7" />
          <FancyBetButton bet={over7Bet} label="Over 7" />
        </div>
      </div>

      {/* ================= CARDS SECTION ================= */}
      <div className="border rounded-lg p-2">
        <div className="text-center text-sm font-bold mb-2 text-gray-700">12</div>
        <div 
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
        >
          {cards.map((card, idx) => (
            <CardCell key={card} bet={cardBets[idx]} card={card} />
          ))}
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
                Side: <span className="font-bold capitalize">{selectedSide}</span>
              </div>
              <div className="text-xs text-gray-600">
                Odds: <span className="font-bold">{formatOdds(getOdds(selectedBet, selectedSide))}</span>
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
                  {selectedSide === "back" ? "Potential win" : "Liability"}: ₹
                  {(
                    parseFloat(amount) *
                    (Number(getOdds(selectedBet, selectedSide)) > 1000
                      ? Number(getOdds(selectedBet, selectedSide)) / 100000
                      : Number(getOdds(selectedBet, selectedSide))) -
                    (selectedSide === "lay" ? parseFloat(amount) : 0)
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
        <DialogContent className="max-w-md text-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Amar Akbar Anthony 2 Rules</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <p className="font-semibold mb-1">Main Bets:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>If the card is ACE, 2, 3, 4, 5, or 6 → <strong>Amar</strong> Wins</li>
                <li>If the card is 7, 8, 9 or 10 → <strong>Akbar</strong> Wins</li>
                <li>If the card is J, Q or K → <strong>Anthony</strong> Wins</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Even (Payout 2.12):</p>
              <ul className="list-disc pl-4">
                <li>If the card is 2, 4, 6, 8, 10, Q</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Odd (Payout 1.83):</p>
              <ul className="list-disc pl-4">
                <li>If the card is A, 3, 5, 7, 9, J, K</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Red (Payout 1.97):</p>
              <ul className="list-disc pl-4">
                <li>If the card color is DIAMOND or HEART</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Black (Payout 1.97):</p>
              <ul className="list-disc pl-4">
                <li>If the card color is CLUB or SPADE</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Under 7 (Payout 2.0):</p>
              <ul className="list-disc pl-4">
                <li>If the card is A, 2, 3, 4, 5, 6</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Over 7 (Payout 2.0):</p>
              <ul className="list-disc pl-4">
                <li>If the card is 8, 9, 10, J, Q, K</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-2 rounded">
              <p className="font-semibold text-yellow-800">Note:</p>
              <p className="text-yellow-700">
                If the card is 7, bets on Under 7 and Over 7 will lose 50% of the bet amount.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">Cards (Payout 12.0):</p>
              <ul className="list-disc pl-4">
                <li>A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
