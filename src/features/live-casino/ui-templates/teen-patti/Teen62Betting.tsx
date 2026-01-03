import { useMemo, useState } from "react";
import { Lock, X } from "lucide-react";

/* =====================================================
   TYPES
===================================================== */

type RawBet = any;

type Bet = {
  key: string;
  label: string;
  odds: number;
  sid?: number | string;
  mid?: number | string;
  suspended: boolean;
  rawBet?: any; // Store original bet for Card bets with nested odds
};

/* =====================================================
   PROPS
===================================================== */

interface Teen62BettingProps {
  betTypes: RawBet[];
  selectedBet?: string;
  betType?: "back" | "lay";
  onSelect?: (bet: any, side: "back" | "lay") => void;
  formatOdds?: (val: any) => string;
  table: any;
  onPlaceBet?: (payload: any) => Promise<void>;
  loading?: boolean;
}

const formatDefaultOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* =====================================================
   COMPONENT
===================================================== */

export const Teen62Betting = ({
  betTypes = [],
  selectedBet = "",
  betType = "back",
  onSelect,
  formatOdds = formatDefaultOdds,
  table,
  onPlaceBet,
  loading = false,
}: Teen62BettingProps) => {
  /* ================= NORMALIZE BETS ================= */
  const betMap = useMemo(() => {
    const map: Record<string, Bet> = {};

    betTypes.forEach((b: any) => {
      const label = b.type || b.nat || "";
      if (!label) return;

      // Check if this bet has nested odds array (for Card bets)
      if (Array.isArray(b.odds) && b.odds.length > 0) {
        // Handle Card bets with nested Odd/Even odds
        b.odds.forEach((o: any) => {
          if (o && o.nat) {
            const nestedLabel = `${label} ${o.nat}`;
            const oddsValue = Number(o.b || o.back || o.odds || 0);
            map[nestedLabel] = {
              key: nestedLabel,
              label: nestedLabel,
              odds: oddsValue,
              sid: `${b.sid}-${o.sid || o.nat}`,
              mid: b.mid,
              suspended:
                b.status === "suspended" ||
                b.gstatus === "SUSPENDED" ||
                oddsValue === 0,
              rawBet: { ...b, oddsItem: o },
            };
          }
        });
      } else {
        // Handle regular bets (Player A, Player B, Consecutive, etc.)
        const oddsValue = Number(b.back ?? b.b ?? b.odds ?? 0);
        const layOdds = Number(b.lay ?? b.l ?? 0);

        // Back bet
        map[label] = {
          key: label,
          label,
          odds: oddsValue,
          sid: b.sid,
          mid: b.mid,
          suspended:
            b.status === "suspended" ||
            b.gstatus === "SUSPENDED" ||
            oddsValue === 0,
          rawBet: b,
        };

        // Lay bet (if exists)
        if (layOdds > 0) {
          map[`${label} Lay`] = {
            key: `${label} Lay`,
            label: `${label} Lay`,
            odds: layOdds,
            sid: b.sid,
            mid: b.mid,
            suspended:
              b.status === "suspended" ||
              b.gstatus === "SUSPENDED" ||
              layOdds === 0,
            rawBet: b,
          };
        }
      }
    });

    return map;
  }, [betTypes]);

  /* ================= STATE ================= */
  const [betSlip, setBetSlip] = useState<Bet | null>(null);
  const [amount, setAmount] = useState("");

  /* ================= HELPERS ================= */
  const openBet = (key: string, side: "back" | "lay" = "back") => {
    const bet = betMap[key];
    if (!bet || bet.suspended) return;

    // If onSelect is provided (BettingPanel integration), use it
    if (onSelect && bet.rawBet) {
      onSelect(bet.rawBet, side);
      return;
    }

    // Otherwise, open modal (standalone use)
    setAmount("");
    setBetSlip(bet);
  };

  const confirmBet = async () => {
    if (!betSlip || !amount || Number(amount) <= 0) return;

    if (onPlaceBet) {
      await onPlaceBet({
        tableId: table.id,
        tableName: table.name,
        betType: betSlip.label,
        odds: betSlip.odds,
        amount: Number(amount),
        sid: betSlip.sid,
        roundId: betSlip.mid,
        side: "back",
      });

      setBetSlip(null);
      setAmount("");
    }
  };

  /* ================= CELL COMPONENT ================= */
  const Cell = ({
    betKey,
    side = "back",
  }: {
    betKey: string;
    side?: "back" | "lay";
  }) => {
    const bet = betMap[betKey];
    const locked = !bet || bet.suspended;
    const isSelected = selectedBet === betKey && betType === side;

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!locked) {
        openBet(betKey, side);
      }
    };

    return (
      <div
        onClick={handleClick}
        onMouseDown={(e) => e.preventDefault()} // Prevent double-click issue
        className={`
          relative h-9 flex items-center justify-center font-semibold rounded
          ${locked
            ? "bg-slate-400 opacity-40 cursor-not-allowed"
            : "bg-sky-400 cursor-pointer hover:brightness-110 active:scale-95"}
          ${isSelected ? "ring-2 ring-yellow-400 ring-offset-1" : ""}
        `}
      >
        {bet ? formatOdds(bet.odds) : "0.00"}
        {locked && <Lock className="absolute w-3 h-3 text-black" />}
      </div>
    );
  };

  /* ================= FINDERS ================= */
  const playerA = betMap["Player A"];
  const playerB = betMap["Player B"];
  const conA = betTypes.find(
    (b: any) => b.subtype === "con" && (b.nat === "Player A" || b.type === "Player A")
  );
  const conB = betTypes.find(
    (b: any) => b.subtype === "con" && (b.nat === "Player B" || b.type === "Player B")
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <div className="border rounded-md overflow-hidden text-xs bg-white">
        {/* HEADER */}
        <div className="grid grid-cols-[1fr_80px_80px_1fr_80px_80px] bg-gray-100 font-bold text-center">
          <div className="p-2 text-left">Player A</div>
          <div className="bg-sky-300 p-2">Back</div>
          <div className="bg-pink-300 p-2">Lay</div>
          <div className="p-2 text-left">Player B</div>
          <div className="bg-sky-300 p-2">Back</div>
          <div className="bg-pink-300 p-2">Lay</div>
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-[1fr_80px_80px_1fr_80px_80px] border-t">
          <div className="p-2">Main</div>
          <Cell betKey="Player A" side="back" />
          <Cell betKey="Player A Lay" side="lay" />

          <div className="p-2">Main</div>
          <Cell betKey="Player B" side="back" />
          <Cell betKey="Player B Lay" side="lay" />
        </div>

        {/* CONSECUTIVE */}
        {(conA || conB) && (
          <div className="grid grid-cols-[1fr_80px_80px_1fr_80px_80px] border-t">
            <div className="p-2">Consecutive</div>
            <Cell
              betKey={conA ? (conA.type || conA.nat || "Consecutive A") : "Consecutive A"}
              side="back"
            />
            <Cell
              betKey={conA ? `${conA.type || conA.nat || "Consecutive A"} Lay` : "Consecutive A Lay"}
              side="lay"
            />

            <div className="p-2">Consecutive</div>
            <Cell
              betKey={conB ? (conB.type || conB.nat || "Consecutive B") : "Consecutive B"}
              side="back"
            />
            <Cell
              betKey={conB ? `${conB.type || conB.nat || "Consecutive B"} Lay` : "Consecutive B Lay"}
              side="lay"
            />
          </div>
        )}

        {/* CARD HEADER */}
        <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-gray-100 font-bold text-center border-t">
          <div />
          {[1, 2, 3, 4, 5, 6].map((c) => (
            <div key={c} className="p-2">
              Card {c}
            </div>
          ))}
        </div>

        {/* ODD / EVEN */}
        {["Odd", "Even"].map((type) => (
          <div
            key={type}
            className="grid grid-cols-[80px_repeat(6,1fr)] border-t text-center"
          >
            <div className="p-2 font-bold">{type}</div>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Cell key={n} betKey={`Card ${n} ${type}`} side="back" />
            ))}
          </div>
        ))}
      </div>

      {/* ================= MODAL (Only for standalone use) ================= */}
      {betSlip && onPlaceBet && !onSelect && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[90%] max-w-sm p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Place Bet</h3>
              <X
                className="w-4 h-4 cursor-pointer"
                onClick={() => setBetSlip(null)}
              />
            </div>

            <div className="text-sm space-y-1">
              <div>
                <b>Bet:</b> {betSlip.label}
              </div>
              <div>
                <b>Odds:</b> {formatOdds(betSlip.odds)}
              </div>
            </div>

            <input
              type="number"
              className="w-full border text-black rounded px-3 py-2 text-sm"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button
              onClick={confirmBet}
              disabled={!amount || loading}
              className="w-full py-2 rounded bg-blue-600 text-white font-bold disabled:opacity-50"
            >
              {loading ? "Placing..." : "Confirm Bet"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
