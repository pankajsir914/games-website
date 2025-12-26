// src/pages/tables/TeenPattiBetting.tsx

import { Lock } from "lucide-react";

export const TeenPattiBetting = ({
  betTypes,
  selectedBet,
  betType,
  onSelect,
  formatOdds,
}: any) => {
  const find = (key: string) =>
    betTypes.find((b: any) =>
      (b.type || "").toLowerCase().includes(key)
    );

  const playerA = find("player a");
  const playerB = find("player b");

  const Cell = ({ bet, side }: any) => {
    const suspended = bet?.status === "suspended";
    return (
      <div
        onClick={() => !suspended && onSelect(bet, side)}
        className={`relative rounded p-2 text-center text-xs font-semibold
        ${side === "back" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}
        ${selectedBet === bet?.type && betType === side ? "ring-2 ring-primary" : ""}
        ${suspended ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {formatOdds(bet?.[side])}
        {suspended && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {[playerA, playerB].map((bet, i) => (
        <div key={i} className="border rounded p-3 space-y-2">
          <div className="text-center text-sm font-semibold">
            {i === 0 ? "Player A" : "Player B"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Cell bet={bet} side="back" />
            <Cell bet={bet} side="lay" />
          </div>
        </div>
      ))}
    </div>
  );
};
