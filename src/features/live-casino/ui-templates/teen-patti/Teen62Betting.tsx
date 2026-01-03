
import { useMemo } from "react";
import { Lock } from "lucide-react";

/* =====================================================
   TYPES
===================================================== */

interface Teen62BettingProps {
  betTypes?: any[];
  selectedBet?: string;
  betType?: "back" | "lay";
  onSelect?: (bet: any, side: "back" | "lay") => void;
  formatOdds?: (val: any) => string;
  table?: any;
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
}: Teen62BettingProps) => {
  /* ================= FIND BETS ================= */
  const byNat = (nat: string) =>
    betTypes.find(
      (b: any) =>
        (b.nat || b.type || "").toLowerCase() === nat.toLowerCase()
    );

  const cardBet = (n: number) =>
    betTypes.find((b: any) => {
      const nat = (b.nat || b.type || "").toLowerCase().replace(/\s+/g, "");
      return nat === `card${n}`;
    });

  const conA = betTypes.find(
    (b: any) =>
      b.subtype === "con" &&
      (b.nat || "").toLowerCase() === "player a"
  );

  const conB = betTypes.find(
    (b: any) =>
      b.subtype === "con" &&
      (b.nat || "").toLowerCase() === "player b"
  );

  /* ================= HELPERS ================= */
  const getOdds = (bet: any, side: "back" | "lay") => {
    if (!bet) return 0;
    return side === "back"
      ? Number(bet.back ?? bet.b ?? 0)
      : Number(bet.lay ?? bet.l ?? 0);
  };

  const isSuspendedBet = (bet: any) =>
    !bet ||
    bet.status === "suspended" ||
    bet.gstatus === "SUSPENDED" ||
    bet.gstatus === "0";

  const handleBetClick = (bet: any, side: "back" | "lay", label: string) => {
    if (!bet || isSuspendedBet(bet) || !onSelect) return;
    onSelect({ ...bet, type: label }, side);
  };

  /* ================= CELL ================= */
  const Cell = ({
    bet,
    side,
    odds,
    label,
    color,
  }: any) => {
    const suspended = isSuspendedBet(bet);
    const selected = selectedBet === label && betType === side;

    return (
      <div
        onClick={() => !suspended && handleBetClick(bet, side, label)}
        className={`
          relative flex items-center justify-center
          h-8 sm:h-9
          text-[10px] sm:text-xs font-semibold
          rounded
          ${color}
          ${suspended ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
          ${selected ? "ring-2 ring-yellow-400" : ""}
        `}
      >
        {odds > 0 ? formatOdds(odds) : "--"}
        {suspended && (
          <Lock className="absolute w-3 h-3 text-black" />
        )}
      </div>
    );
  };

  const playerA = byNat("Player A");
  const playerB = byNat("Player B");

  return (
    <div className="border rounded bg-white text-xs overflow-x-auto">
      <div className="min-w-[640px]">

        {/* HEADER */}
        <div className="grid grid-cols-[1fr_60px_60px_1fr_60px_60px] sm:grid-cols-[1fr_80px_80px_1fr_80px_80px] bg-gray-100 font-bold text-center">
          <div className="p-2 text-left">Player A</div>
          <div className="bg-sky-300 p-2">Back</div>
          <div className="bg-pink-300 p-2">Lay</div>
          <div className="p-2 text-left">Player B</div>
          <div className="bg-sky-300 p-2">Back</div>
          <div className="bg-pink-300 p-2">Lay</div>
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-[1fr_60px_60px_1fr_60px_60px] sm:grid-cols-[1fr_80px_80px_1fr_80px_80px] border-t">
          <div className="p-2 bg-gray-500 text-white">Main</div>
          <Cell bet={playerA} side="back" odds={getOdds(playerA, "back")} label="Player A" color="bg-sky-400" />
          <Cell bet={playerA} side="lay" odds={getOdds(playerA, "lay")} label="Player A" color="bg-pink-300" />

          <div className="p-2 bg-gray-500 text-white">Main</div>
          <Cell bet={playerB} side="back" odds={getOdds(playerB, "back")} label="Player B" color="bg-sky-400" />
          <Cell bet={playerB} side="lay" odds={getOdds(playerB, "lay")} label="Player B" color="bg-pink-300" />
        </div>

        {/* CONSECUTIVE */}
        {(conA || conB) && (
          <div className="grid grid-cols-[1fr_60px_60px_1fr_60px_60px] sm:grid-cols-[1fr_80px_80px_1fr_80px_80px] border-t">
            <div className="p-2">Consecutive</div>
            <Cell bet={conA} side="back" odds={getOdds(conA, "back")} label="Consecutive A" color="bg-sky-400" />
            <Cell bet={conA} side="lay" odds={getOdds(conA, "lay")} label="Consecutive A" color="bg-pink-300" />

            <div className="p-2">Consecutive</div>
            <Cell bet={conB} side="back" odds={getOdds(conB, "back")} label="Consecutive B" color="bg-sky-400" />
            <Cell bet={conB} side="lay" odds={getOdds(conB, "lay")} label="Consecutive B" color="bg-pink-300" />
          </div>
        )}

        {/* CARD HEADER */}
        <div className="grid grid-cols-[60px_repeat(6,1fr)] sm:grid-cols-[80px_repeat(6,1fr)] bg-gray-100 font-bold border-t">
          <div />
          {[1,2,3,4,5,6].map(c => (
            <div key={c} className="p-2 text-center bg-gray-500 text-white">
              {c}
            </div>
          ))}
        </div>

        {/* ODD / EVEN */}
        {["Odd", "Even"].map(type => (
          <div
            key={type}
            className="grid grid-cols-[60px_repeat(6,1fr)] sm:grid-cols-[80px_repeat(6,1fr)] border-t text-center"
          >
            <div className="p-2 font-bold bg-gray-500 text-white">{type}</div>
            {[1,2,3,4,5,6].map(cardNo => {
              const bet = cardBet(cardNo);
              const odds = getOdds(bet, "back");
              const label = `Card ${cardNo} ${type}`;
              const suspended = isSuspendedBet(bet);
              const selected = selectedBet === label;

              return (
                <div
                  key={cardNo}
                  onClick={() => !suspended && handleBetClick(bet, "back", label)}
                  className={`
                    relative h-8 sm:h-9 flex items-center justify-center
                    font-semibold rounded
                    ${suspended ? "bg-slate-500 opacity-40" : "bg-sky-400 cursor-pointer"}
                    ${selected ? "ring-2 ring-yellow-400" : ""}
                  `}
                >
                  {odds > 0 ? formatOdds(odds) : "--"}
                  {suspended && <Lock className="absolute w-3 h-3 text-white" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
