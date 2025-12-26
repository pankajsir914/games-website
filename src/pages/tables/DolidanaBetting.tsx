// src/pages/tables/DolidanaBetting.tsx

import { Lock } from "lucide-react";

export const DolidanaBetting = ({
  betTypes,
  selectedBet,
  betType,
  onSelect,
  formatOdds,
}: any) => {
  const find = (keys: string[]) =>
    betTypes.find((b: any) =>
      keys.some((k) =>
        (b.type || "").toLowerCase().includes(k.toLowerCase())
      )
    );

  const playerA = find(["player a"]);
  const playerB = find(["player b"]);
  const odd = find(["odd"]);
  const even = find(["even"]);

  const BetCell = ({ bet, side }: any) => {
    const suspended = bet?.status === "suspended";
    const selected = selectedBet === bet?.type && betType === side;

    return (
      <div
        onClick={() => !suspended && onSelect(bet, side)}
        className={`relative p-2 rounded text-center text-xs font-semibold
        ${side === "back" ? "bg-blue-500" : "bg-pink-500"}
        ${selected ? "ring-2 ring-primary" : ""}
        ${suspended ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        text-white`}
      >
        {formatOdds(bet?.[side])}
        {suspended && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {[playerA, playerB].map((bet, i) => (
        <div key={i} className="border rounded p-2 space-y-1">
          <div className="text-center text-xs font-semibold">
            {i === 0 ? "Player A" : "Player B"}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <BetCell bet={bet} side="back" />
            <BetCell bet={bet} side="lay" />
          </div>
        </div>
      ))}

      {[odd, even].map((bet, i) => (
        <div
          key={i}
          onClick={() => bet && onSelect(bet, "back")}
          className="col-span-1 p-3 rounded bg-gray-700 text-white text-center cursor-pointer"
        >
          <div className="text-xs">{i === 0 ? "Odd" : "Even"}</div>
          <div className="font-bold">{formatOdds(bet?.back)}</div>
        </div>
      ))}
    </div>
  );
};
