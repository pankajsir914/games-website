import { memo, useMemo, useState } from "react";
import { Lock, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ================= CONSTANTS ================= */

const CARD_ORDER = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const FIRST_ROW = CARD_ORDER.slice(0, 6);
const SECOND_ROW = CARD_ORDER.slice(6);

const SUITS = ["♠", "♥", "♦", "♣"];
const suitColor = (s: string) =>
  s === "♥" || s === "♦" ? "text-red-600" : "text-black";

/* ================= TYPES ================= */

interface Bet {
  sid?: number;
  mid?: number;
  nat?: string;
  type?: string;
  back?: number;
  b?: number;
  b1?: number;
  odds?: number;
  l?: number;
  gstatus?: string;
}

interface Ab4BettingProps {
  betTypes: Bet[];
  formatOdds: (v: any) => string;
  resultHistory?: any[];
  onPlaceBet?: (betData: any) => Promise<void>;
  loading?: boolean;
}

/* ================= HELPERS ================= */

const getOdds = (bet?: Bet | null) => {
  const odds = bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? bet?.l ?? 0;
  console.log("📈 getOdds()", bet?.nat, odds);
  return odds;
};

const isSuspended = (bet?: Bet | null) => {
  if (!bet) {
    console.log("🔒 SUSPENDED: bet missing");
    return true;
  }

  const odds = getOdds(bet);

  if (Number(odds) <= 0) {
    console.log("🔒 SUSPENDED: odds <= 0", bet.nat);
    return true;
  }

  if (bet.gstatus === "SUSPENDED") {
    console.log("🔒 SUSPENDED: gstatus", bet.nat);
    return true;
  }

  console.log("🔓 OPEN BET", bet.nat);
  return false;
};

/* ================= COMPONENT ================= */

const Ab4BettingComponent = ({
  betTypes = [],
  resultHistory = [],
  onPlaceBet,
  formatOdds,
  loading = false,
}: Ab4BettingProps) => {
  const [open, setOpen] = useState(false);
  const [activeBet, setActiveBet] = useState<Bet | null>(null);
  const [amount, setAmount] = useState("100");

  // Debug: Log betTypes structure
  console.log("🎯 Ab4Betting render", {
    betTypesCount: betTypes.length,
    resultCount: resultHistory?.length,
    betTypesSample: betTypes.slice(0, 5).map((b: any) => ({
      nat: b.nat,
      type: b.type,
      sid: b.sid,
      back: b.back,
      b: b.b,
      b1: b.b1,
      odds: b.odds,
      l: b.l,
      gstatus: b.gstatus,
    })),
  });

  /* ---------- FIND BET ---------- */
  // AB4 bets come as: "andar A", "bahar K", etc. (combined format in nat field)
  const findBet = (side: "andar" | "bahar", card: string) => {
    const searchStr = `${side} ${card}`.toLowerCase();
    
    const bet = betTypes.find((b: any) => {
      const nat = (b.nat || "").toLowerCase().trim();
      const type = (b.type || "").toLowerCase().trim();
      
      // Check if nat matches "andar A" or "bahar K" format
      if (nat === searchStr) return true;
      
      // Also check type field
      if (type === searchStr) return true;
      
      // Check if nat contains both side and card
      if (nat.includes(side.toLowerCase()) && nat.includes(card.toLowerCase())) {
        // Make sure it's an exact match pattern
        const normalizedNat = nat.replace(/[_-]/g, " ").trim();
        if (normalizedNat === searchStr || normalizedNat.startsWith(searchStr + " ") || normalizedNat.endsWith(" " + searchStr)) {
          return true;
        }
      }
      
      return false;
    }) || null;
  
    console.log("🔍 findBet()", { side, card, searchStr, bet: bet?.nat, allBetNats: betTypes.map((b: any) => b.nat || b.type) });
    return bet;
  };
  
  

  /* ---------- LAST 10 RESULTS ---------- */
  const last10 = useMemo(() => {
    console.log("📊 resultHistory changed", resultHistory);

    if (!Array.isArray(resultHistory)) return [];

    return resultHistory
      .slice(0, 10)
      .reverse()
      .map((r: any) => ({
        mid: r.mid || r.round || r.round_id,
        result:
          r.winner === "ANDAR" ? "A" :
          r.winner === "BAHAR" ? "B" :
          r.win === "0" ? "✓" : "-",
        card: r.card,
      }))
      .filter(r => r.mid);
  }, [resultHistory]);

  /* ---------- CARD ---------- */
  const CardBox = ({ side, card }: { side: "andar" | "bahar"; card: string }) => {
    const bet = findBet(side, card);
    const odds = getOdds(bet);
    const suspended = isSuspended(bet);

    return (
      <div
        onClick={() => {
          console.log("🃏 CARD CLICK", {
            side,
            card,
            bet,
            odds,
            suspended,
          });

          if (suspended || !bet) return;
          setActiveBet(bet);
          setOpen(true);
        }}
        className={`
          relative w-[44px] h-[70px] rounded-md
          flex flex-col items-center justify-between
          text-[11px] font-bold select-none
          ${side === "andar"
            ? "bg-[#3b2a3a] text-white"
            : "bg-yellow-300 text-black"}
          ${suspended
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer active:scale-95"}
        `}
      >
        <div className="mt-1">{card}</div>

        <div className="grid grid-cols-2 gap-x-2">
          {SUITS.map(s => (
            <span key={s} className={suitColor(s)}>{s}</span>
          ))}
        </div>

        <div className="mb-1">
          {odds > 0 ? formatOdds(odds) : "--"}
        </div>

        {suspended && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  /* ================= RENDER ================= */

  return (
    <div className="space-y-4">

      {/* ANDAR */}
      <div className="space-y-2">
        <div className="text-center text-xs font-bold bg-[#3b2a3a] text-white py-1 rounded">
          ANDAR
        </div>

        <div className="flex gap-1 justify-center sm:hidden">
          {FIRST_ROW.map(c => <CardBox key={c} side="andar" card={c} />)}
        </div>
        <div className="flex gap-1 justify-center sm:hidden">
          {SECOND_ROW.map(c => <CardBox key={c} side="andar" card={c} />)}
        </div>

        <div className="hidden sm:flex gap-1 justify-center">
          {CARD_ORDER.map(c => <CardBox key={c} side="andar" card={c} />)}
        </div>
      </div>

      {/* BAHAR */}
      <div className="space-y-2">
        <div className="text-center text-xs font-bold bg-yellow-300 py-1 rounded">
          BAHAR
        </div>

        <div className="flex gap-1 justify-center sm:hidden">
          {FIRST_ROW.map(c => <CardBox key={c} side="bahar" card={c} />)}
        </div>
        <div className="flex gap-1 justify-center sm:hidden">
          {SECOND_ROW.map(c => <CardBox key={c} side="bahar" card={c} />)}
        </div>

        <div className="hidden sm:flex gap-1 justify-center">
          {CARD_ORDER.map(c => <CardBox key={c} side="bahar" card={c} />)}
        </div>
      </div>

      {/* ===== BET MODAL ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
          </DialogHeader>

          {activeBet && (
            <div className="space-y-3">
              <div className="text-sm">
                Odds: <b>{formatOdds(getOdds(activeBet))}</b>
              </div>

              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
              />

              <Button
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  console.log("💰 PLACE BET", {
                    amount,
                    betType: activeBet.nat,
                    odds: getOdds(activeBet),
                    sid: activeBet.sid,
                    mid: activeBet.mid,
                  });

                  await onPlaceBet?.({
                    amount: Number(amount),
                    betType: activeBet.nat,
                    odds: getOdds(activeBet),
                    sid: activeBet.sid,
                    mid: activeBet.mid,
                  });

                  console.log("✅ BET SENT");
                  setOpen(false);
                  setAmount("100");
                }}
              >
                {loading ? "Placing..." : `Place Bet ₹${amount}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== LAST 10 RESULTS ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="w-4 h-4" />
            Last 10 Results
          </CardTitle>
        </CardHeader>

        <CardContent>
          {last10.length > 0 ? (
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {last10.map((r, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs"
                  >
                    <span>Round #{String(r.mid).slice(-6)}</span>
                    <span className="font-bold">{r.result}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4">
              No results yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const Ab4Betting = memo(Ab4BettingComponent);
