// src/pages/tables/Dt6Betting.tsx

import { Lock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  bets.find((b) => (b.nat || "").toLowerCase() === nat.toLowerCase());

/* ================= COMPONENT ================= */

export const Dt6Betting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
}: Dt6BettingProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);

  const dragon = find(betTypes, "Dragon");
  const tiger = find(betTypes, "Tiger");
  const pair = find(betTypes, "Pair");

  const get = (nat: string) => find(betTypes, nat);

  const Cell = ({ bet }: { bet: any }) => (
    <button
      disabled={isSuspended(bet) || loading}
      onClick={() =>
        onPlaceBet({ sid: bet.sid, odds: bet.b, nat: bet.nat })
      }
      className={`
        h-10 w-full flex items-center justify-center
        text-sm font-semibold
        ${
          isSuspended(bet)
            ? "bg-gray-200 text-gray-500"
            : "bg-sky-400 text-white hover:bg-sky-500"
        }
      `}
    >
      {isSuspended(bet) ? <Lock size={14} /> : bet.b}
    </button>
  );

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
              onClick={() =>
                onPlaceBet({ sid: pair.sid, odds: pair.b, nat: pair.nat })
              }
              className="h-10 bg-gradient-to-r from-sky-600 to-slate-700 text-white font-semibold"
            >
              Pair
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

      {/* ================= RULES MODAL ================= */}
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
