// src/pages/tables/Ab3Betting.tsx

import { Lock } from "lucide-react";

/* ===============================
   CONSTANTS
================================ */

const CARD_ORDER = [
  "A","2","3","4","5","6","7","8","9","10","J","Q","K"
];

const FIRST_ROW = CARD_ORDER.slice(0, 6);
const SECOND_ROW = CARD_ORDER.slice(6);

const SUITS = ["♠", "♥", "♦", "♣"];

const suitColor = (s: string) =>
  s === "♥" || s === "♦" ? "text-red-600" : "text-black";

/* ===============================
   COMPONENT
================================ */

export const Ab3Betting = ({
  betTypes = [],
  selectedBet,
  onSelect,
  formatOdds,
}: any) => {

  const getBet = (side: "andar" | "bahar", card: string) =>
    betTypes.find((b: any) =>
      (b.type || "").toLowerCase().includes(side) &&
      (b.type || "").includes(card)
    );

  const BetCard = ({ bet, side, card }: any) => {
    const suspended = bet?.status === "suspended";
    const selected = selectedBet === bet?.type;

    return (
      <div
        onClick={() => !suspended && bet && onSelect(bet, side)}
        className={`
          relative w-[44px] h-[66px]
          rounded-md
          flex flex-col items-center justify-between
          text-[11px] font-bold select-none
          ${side === "andar"
            ? "bg-[#4b3a3a] text-white"
            : "bg-[#ffe98a] text-black"}
          ${selected ? "ring-2 ring-green-400" : ""}
          ${suspended
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:bg-white/10"}
        `}
      >
        <div className="mt-1 text-[12px] font-extrabold">{card}</div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[12px] leading-none">
          {SUITS.map((s) => (
            <span key={s} className={suitColor(s)}>{s}</span>
          ))}
        </div>

        <div className="mb-1 text-[11px] font-extrabold">
          {bet ? formatOdds(bet.back) : "--"}
        </div>

        {suspended && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  /* ---------- MOBILE ---------- */

const renderMobileRows = (side: "andar" | "bahar") => (
  <div className="space-y-1 flex flex-col items-center">
    {/* MOBILE LABEL */}
    <div
      className={`
        mb-1 px-4 py-[2px] text-xs font-bold rounded
        ${side === "andar"
          ? "bg-[#3b2a2a] text-white"
          : "bg-yellow-300 text-black"}
      `}
    >
      {side.toUpperCase()}
    </div>

    {/* FIRST ROW – 6 CARDS */}
    <div className="flex gap-1 justify-center">
      {FIRST_ROW.map((card) => (
        <BetCard
          key={`${side}-${card}`}
          card={card}
          side={side}
          bet={getBet(side, card)}
        />
      ))}
    </div>

    {/* SECOND ROW – 7 CARDS */}
    <div className="flex gap-1 justify-center">
      {SECOND_ROW.map((card) => (
        <BetCard
          key={`${side}-${card}`}
          card={card}
          side={side}
          bet={getBet(side, card)}
        />
      ))}
    </div>
  </div>
);


  /* ---------- DESKTOP ---------- */

  const renderDesktopRow = (side: "andar" | "bahar") => (
    <div className="flex items-center justify-center gap-2">
      {/* Label */}
      <div
        className={`w-[70px] text-center text-xs font-bold
        ${side === "andar"
          ? "bg-[#3b2a2a] text-white"
          : "bg-yellow-300 text-black"}`}
      >
        {side.toUpperCase()}
      </div>

      {/* Cards */}
      <div className="flex gap-1">
        {CARD_ORDER.map((card) => (
          <BetCard
            key={`${side}-${card}`}
            card={card}
            side={side}
            bet={getBet(side, card)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ANDAR */}
      <div className="flex justify-center">
        <div className="block sm:hidden">
          {renderMobileRows("andar")}
        </div>
        <div className="hidden sm:block">
          {renderDesktopRow("andar")}
        </div>
      </div>

      {/* BAHAR */}
      <div className="flex justify-center">
        <div className="block sm:hidden">
          {renderMobileRows("bahar")}
        </div>
        <div className="hidden sm:block">
          {renderDesktopRow("bahar")}
        </div>
      </div>
    </div>
  );
};
