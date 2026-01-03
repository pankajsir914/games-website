import { useMemo, useState } from "react";
import { Lock, X } from "lucide-react";

/* =====================================================
   TYPES
===================================================== */

type RawBet = any;

type Bet = {
  key: string;           // unique key
  label: string;         // UI label
  odds: number;          // back odds
  sid?: number | string;
  mid?: number | string;
  suspended: boolean;
};

/* =====================================================
   PROPS
===================================================== */

interface Teen62BettingProps {
  betTypes: RawBet[];
  table: any;
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
}

/* =====================================================
   COMPONENT
===================================================== */

export const Teen62Betting = ({
  betTypes = [],
  table,
  onPlaceBet,
  loading = false,
}: Teen62BettingProps) => {

  /* ================= NORMALIZE BETS ================= */

  const betMap = useMemo(() => {
    const map: Record<string, Bet> = {};

    console.log("🟡 Teen62 RAW betTypes:", betTypes);

    betTypes.forEach((b: any) => {
      const label =
        b.type ||
        b.nat ||
        "";

      if (!label) return;

      const odds =
        Number(b.back ?? b.b ?? b.odds ?? 0);

      map[label] = {
        key: label,
        label,
        odds,
        sid: b.sid,
        mid: b.mid,
        suspended:
          b.status === "suspended" ||
          b.gstatus === "SUSPENDED" ||
          odds === 0,
      };
    });

    console.log("🟢 Teen62 betMap:", map);
    return map;
  }, [betTypes]);

  /* ================= STATE ================= */

  const [betSlip, setBetSlip] = useState<Bet | null>(null);
  const [amount, setAmount] = useState("");

  /* ================= HELPERS ================= */

  const openBet = (key: string) => {
    const bet = betMap[key];
    if (!bet || bet.suspended) return;

    setAmount("");
    setBetSlip(bet);
  };

  const confirmBet = async () => {
    if (!betSlip || !amount || Number(amount) <= 0) return;

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
  };

  /* =====================================================
     RENDER
  ===================================================== */

  const Cell = ({ betKey }: { betKey: string }) => {
    const bet = betMap[betKey];
    const locked = !bet || bet.suspended;

    return (
      <div
        onClick={locked ? undefined : () => openBet(betKey)}
        className={`
          relative h-9 flex items-center justify-center font-semibold rounded
          ${locked
            ? "bg-slate-400 opacity-40"
            : "bg-sky-400 cursor-pointer hover:brightness-110"}
        `}
      >
        {bet ? bet.odds.toFixed(2) : "0.00"}
        {locked && <Lock className="absolute w-3 h-3 text-dark" />}
      </div>
    );
  };

  return (
    <>
      <div className="border rounded-md overflow-hidden text-xs bg-dark">

        {/* HEADER */}
        <div className="grid grid-cols-[1fr_80px_80px_1fr_80px_80px] bg-gray-500 font-bold text-center">
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
          <Cell betKey="Player A" />
          <Cell betKey="Player A Lay" />

          <div className="p-2">Main</div>
          <Cell betKey="Player B" />
          <Cell betKey="Player B Lay" />
        </div>

        {/* CARD HEADER */}
        <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-gray-500 font-bold text-center border-t">
          <div />
          {[1,2,3,4,5,6].map(c => (
            <div key={c} className="p-2">Card {c}</div>
          ))}
        </div>

        {/* ODD / EVEN */}
        {["Odd", "Even"].map(type => (
          <div key={type} className="grid grid-cols-[80px_repeat(6,1fr)] border-t text-center">
            <div className="p-2 font-bold">{type}</div>
            {[1,2,3,4,5,6].map(n => (
              <Cell key={n} betKey={`Card ${n} ${type}`} />
            ))}
          </div>
        ))}
      </div>

      {/* ================= MODAL ================= */}
      {betSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-500 rounded-lg w-[90%] max-w-sm p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Place Bet</h3>
              <X className="w-4 h-4 cursor-pointer" onClick={() => setBetSlip(null)} />
            </div>

            <div className="text-sm space-y-1">
              <div><b>Bet:</b> {betSlip.label}</div>
              <div><b>Odds:</b> {betSlip.odds.toFixed(2)}</div>
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
              className="w-full py-2 rounded bg-blue-600 text-black font-bold disabled:opacity-50"
            >
              {loading ? "Placing..." : "Confirm Bet"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
