
import { Lock } from "lucide-react";

/* =====================================================
   COMPONENT
===================================================== */

export const Teen62Betting = ({
  betTypes = [],
  selectedBet = "",
  betType = "back",
  onSelect,
  formatOdds = (v: any) => (v > 0 ? Number(v).toFixed(2) : "--"),
}: any) => {
  /* ================= HELPERS ================= */
  const byNat = (nat: string) =>
    betTypes.find(
      (b: any) =>
        (b.nat || b.type || "").toLowerCase() === nat.toLowerCase()
    );

  const cardBet = (n: number) =>
    betTypes.find((b: any) =>
      (b.nat || b.type || "")
        .toLowerCase()
        .replace(/\s+/g, "") === `card${n}`
    );

  const getOdds = (bet: any, side: "back" | "lay") => {
    if (!bet) return 0;
    return side === "back"
      ? Number(bet.back ?? bet.b ?? 0)
      : Number(bet.lay ?? bet.l ?? 0);
  };

  const isSuspended = (bet: any) =>
    !bet ||
    bet.status === "suspended" ||
    bet.gstatus === "SUSPENDED" ||
    bet.gstatus === "0";

  const clickBet = (bet: any, side: "back" | "lay", label: string) => {
    if (!bet || isSuspended(bet) || !onSelect) return;
    onSelect({ ...bet, type: label }, side);
  };

  const playerA = byNat("Player A");
  const playerB = byNat("Player B");

  /* =====================================================
     MOBILE VIEW
  ===================================================== */
  return (
    <>
      {/* ================= MOBILE ================= */}
      <div className="sm:hidden space-y-3">

        {/* ODD / EVEN HEADER */}
        <div className="grid grid-cols-2 gap-2 font-bold text-center">
          {["Odd", "Even"].map((t) => (
            <div
              key={t}
              className="bg-gray-800 text-white py-2 rounded"
            >
              {t}
            </div>
          ))}
        </div>

        {/* CARDS */}
        {[1, 2, 3, 4, 5, 6].map((cardNo) => {
          const bet = cardBet(cardNo);
          const suspended = isSuspended(bet);

          return (
            <div key={cardNo} className="border rounded p-2 space-y-2">

              {/* CARD TITLE */}
              <div className="text-center font-bold bg-gray-200 py-1 rounded">
                Card {cardNo}
              </div>

              {/* PLAYER A */}
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center">
                <div className="text-xs font-semibold">Player A</div>

                {["back", "lay"].map((side: any) => (
                  <div
                    key={side}
                    onClick={() =>
                      !suspended &&
                      clickBet(
                        bet,
                        side,
                        `Card ${cardNo} Player A`
                      )
                    }
                    className={`
                      h-8 flex items-center justify-center rounded text-xs font-bold
                      ${side === "back" ? "bg-sky-400" : "bg-pink-300"}
                      ${suspended ? "opacity-40" : "cursor-pointer"}
                    `}
                  >
                    {formatOdds(getOdds(bet, side))}
                    {suspended && (
                      <Lock className="w-3 h-3 ml-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* PLAYER B */}
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center">
                <div className="text-xs font-semibold">Player B</div>

                {["back", "lay"].map((side: any) => (
                  <div
                    key={side}
                    onClick={() =>
                      !suspended &&
                      clickBet(
                        bet,
                        side,
                        `Card ${cardNo} Player B`
                      )
                    }
                    className={`
                      h-8 flex items-center justify-center rounded text-xs font-bold
                      ${side === "back" ? "bg-sky-400" : "bg-pink-300"}
                      ${suspended ? "opacity-40" : "cursor-pointer"}
                    `}
                  >
                    {formatOdds(getOdds(bet, side))}
                    {suspended && (
                      <Lock className="w-3 h-3 ml-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden sm:block border rounded bg-white text-xs">

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
          <div className="p-2 bg-gray-500 text-white">Main</div>

          {["back", "lay"].map((side: any) => (
            <div
              key={side}
              onClick={() =>
                !isSuspended(playerA) &&
                clickBet(playerA, side, "Player A")
              }
              className={`
                h-9 flex items-center justify-center font-semibold rounded
                ${side === "back" ? "bg-sky-400" : "bg-pink-300"}
                ${isSuspended(playerA) ? "opacity-40" : "cursor-pointer"}
              `}
            >
              {formatOdds(getOdds(playerA, side))}
            </div>
          ))}

          <div className="p-2 bg-gray-500 text-white">Main</div>

          {["back", "lay"].map((side: any) => (
            <div
              key={side}
              onClick={() =>
                !isSuspended(playerB) &&
                clickBet(playerB, side, "Player B")
              }
              className={`
                h-9 flex items-center justify-center font-semibold rounded
                ${side === "back" ? "bg-sky-400" : "bg-pink-300"}
                ${isSuspended(playerB) ? "opacity-40" : "cursor-pointer"}
              `}
            >
              {formatOdds(getOdds(playerB, side))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
