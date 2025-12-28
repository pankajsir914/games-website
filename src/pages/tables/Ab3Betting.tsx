// src/pages/tables/Ab3Betting.tsx

import { Lock } from "lucide-react";

export const Ab3Betting = ({
  betTypes,
  selectedBet,
  betType,
  onSelect,
  formatOdds,
}: any) => {
  /**
   * Find bet by keywords
   */
  const find = (keys: string[]) =>
    betTypes.find((b: any) =>
      keys.some((k) =>
        (b.type || "").toLowerCase().includes(k.toLowerCase())
      )
    );

  /**
   * Extract Andar / Bahar bets
   * Card wise bets are expected like:
   *  - "Andar 1", "Bahar 1"
   *  - ...
   *  - "Andar 46", "Bahar 46"
   */
  const andarBets = betTypes.filter((b: any) =>
    (b.type || "").toLowerCase().includes("andar")
  );

  const baharBets = betTypes.filter((b: any) =>
    (b.type || "").toLowerCase().includes("bahar")
  );

  /**
   * Single Bet Cell
   */
  const BetCell = ({ bet, side }: any) => {
    const suspended = bet?.status === "suspended";
    const selected = selectedBet === bet?.type;


    return (
      <div
        onClick={() => !suspended && onSelect(bet, side)}
        className={`relative p-2 rounded text-center text-xs font-semibold
        ${side === "andar" ? "bg-green-600" : "bg-orange-500"}
        ${selected ? "ring-2 ring-primary" : ""}
        ${suspended ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        text-white`}
      >
        <div className="text-[10px] opacity-80">{side.toUpperCase()}</div>
        <div className="font-bold">
          {formatOdds(bet?.back)}
        </div>

        {suspended && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  };

  /**
   * Render card rows (1–46)
   */
  const renderCards = () => {
    const rows = [];

    for (let i = 1; i <= 46; i++) {
      const andar = andarBets.find((b: any) =>
        (b.type || "").includes(String(i))
      );
      const bahar = baharBets.find((b: any) =>
        (b.type || "").includes(String(i))
      );

      rows.push(
        <div
          key={i}
          className="grid grid-cols-3 gap-1 items-center border rounded p-1"
        >
          <div className="text-center text-[10px] font-semibold text-gray-300">
            Card {i}
          </div>

          <BetCell bet={andar} side="andar" />
          <BetCell bet={bahar} side="bahar" />
        </div>
      );
    }

    return rows;
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-3 text-center text-xs font-semibold text-gray-300">
        <div>Card</div>
        <div>Andar</div>
        <div>Bahar</div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-1 max-h-[420px] overflow-y-auto">
        {renderCards()}
      </div>
    </div>
  );
};
