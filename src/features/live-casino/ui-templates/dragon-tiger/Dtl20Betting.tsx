import { useState, useEffect } from "react";
import { Lock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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

/* ================= COMPONENT ================= */

export const Dtl20Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  formatOdds = formatOddsValue,
}: Dtl20BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);

  // Show UI even without data - just display the structure

  const get = (nat: string) => find(betTypes, nat);

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
        onClick={() =>
          onPlaceBet({ sid: bet.sid, odds: odds, nat: bet.nat })
        }
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
        <div className="grid grid-cols-4 text-xs font-semibold bg-gray-100">
          <div />
          <div className="text-center">Dragon</div>
          <div className="text-center">Tiger</div>
          <div className="text-center">Lion</div>
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
        <div className="grid grid-cols-4 text-xs font-semibold bg-gray-100">
          <div />
          <div className="text-center">Dragon</div>
          <div className="text-center">Tiger</div>
          <div className="text-center">Lion</div>
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
        <div className="grid grid-cols-4 text-xs font-semibold bg-gray-100">
          <div />
          <div className="text-center">Dragon</div>
          <div className="text-center">Tiger</div>
          <div className="text-center">Lion</div>
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
        <div className="grid grid-cols-4 text-xs font-semibold bg-gray-100">
          <div />
          <div className="text-center">Dragon</div>
          <div className="text-center">Tiger</div>
          <div className="text-center">Lion</div>
        </div>

        {cardRanks.map((r) => (
          <div key={r} className="grid grid-cols-4 border-t">
            <div className="p-2 text-xs">{r}</div>
            <Cell bet={get(`Dragon ${r}`)} />
            <Cell bet={get(`Tiger ${r}`)} />
            <Cell bet={get(`Lion ${r}`)} />
          </div>
        ))}
      </div>

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
