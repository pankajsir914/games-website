// src/pages/tables/Ab3Betting.tsx

import { Lock } from "lucide-react";
import { useEffect } from "react";

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

  // Debug: Log betTypes
  useEffect(() => {
    if (betTypes.length > 0) {
      console.log('Ab3Betting - Total betTypes:', betTypes.length);
      console.log('Ab3Betting - First 10 betTypes:', betTypes.slice(0, 10).map((b: any) => ({
        type: b.type || b.name || b.label || 'NO_TYPE',
        back: b.back || b.odds || b.b1 || b.b || 0,
        lay: b.lay || b.l1 || b.l || 0,
        status: b.status,
      })));
    }
  }, [betTypes]);

  // =========================
  // GET BET OBJECT FOR CARD
  // =========================
  const getBet = (side: "andar" | "bahar", card: string) => {
    const sideLower = side.toLowerCase();
    const cardUpper = card.toUpperCase();

    // Try to find exact or flexible match
    let matchedBet = betTypes.find((b: any) => {
      const typeStr = (b.type || b.name || b.label || "").toLowerCase();
      const hasSide = typeStr.includes(sideLower) || typeStr.includes(sideLower[0]);
      const hasCard =
        typeStr.includes(cardUpper) ||
        typeStr.includes(cardUpper[0]) ||
        (cardUpper === "10" && ["10","t","ten"].some(v => typeStr.includes(v)));
      return hasSide && hasCard;
    });

    // Fallback: use index-based mapping (Andar 0-12, Bahar 13-25)
    if (!matchedBet && betTypes.length >= 26) {
      const sideIndex = side === "andar" ? 0 : 13;
      const cardIndex = CARD_ORDER.indexOf(card);
      if (cardIndex >= 0) {
        const betIndex = sideIndex + cardIndex;
        if (betIndex < betTypes.length) matchedBet = betTypes[betIndex];
      }
    }

    // Final fallback: create synthetic bet with 0 odds
    if (!matchedBet) {
      return {
        type: `${side.charAt(0).toUpperCase() + side.slice(1)} ${card}`,
        back: 0,
        lay: 0,
        status: "suspended",
        side,
        card,
      };
    }

    return matchedBet;
  };

  // =========================
  // BET CARD COMPONENT
  // =========================
  const BetCard = ({ bet, side, card }: any) => {
    const suspended = bet?.status === "suspended";
    const betType = bet?.type || `${side.charAt(0).toUpperCase() + side.slice(1)} ${card}`;
    const selected = selectedBet === betType || selectedBet === bet?.type;

    // Get odds from multiple fields
    const oddsValue = bet?.back ?? bet?.odds ?? bet?.b1 ?? bet?.b ?? 0;
    const hasOdds = oddsValue > 0;

    const handleClick = () => {
      if (!hasOdds || suspended) return;
      onSelect(bet, "back");
    };

    return (
      <div
        onClick={handleClick}
        className={`
          relative w-[44px] h-[66px]
          rounded-md
          flex flex-col items-center justify-between
          text-[11px] font-bold select-none
          ${side === "andar" ? "bg-[#4b3a3a] text-white" : "bg-[#ffe98a] text-black"}
          ${selected ? "ring-2 ring-green-400" : ""}
          ${suspended ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-white/10 active:scale-95 transition-transform"}
        `}
      >
        <div className="mt-1 text-[12px] font-extrabold">{card}</div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[12px] leading-none">
          {SUITS.map((s) => (
            <span key={s} className={suitColor(s)}>{s}</span>
          ))}
        </div>

        <div className="mb-1 text-[11px] font-extrabold">
          {hasOdds ? formatOdds(oddsValue) : "--"}
        </div>

        {suspended && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  // =========================
  // MOBILE LAYOUT
  // =========================
  const renderMobileRows = (side: "andar" | "bahar") => (
    <div className="space-y-1 flex flex-col items-center">
      <div className={`mb-1 px-4 py-[2px] text-xs font-bold rounded
        ${side === "andar" ? "bg-[#3b2a3a] text-white" : "bg-yellow-300 text-black"}`}>
        {side.toUpperCase()}
      </div>

      <div className="flex gap-1 justify-center">
        {FIRST_ROW.map((card) => (
          <BetCard key={`${side}-${card}`} card={card} side={side} bet={getBet(side, card)} />
        ))}
      </div>

      <div className="flex gap-1 justify-center">
        {SECOND_ROW.map((card) => (
          <BetCard key={`${side}-${card}`} card={card} side={side} bet={getBet(side, card)} />
        ))}
      </div>
    </div>
  );

  // =========================
  // DESKTOP LAYOUT
  // =========================
  const renderDesktopRow = (side: "andar" | "bahar") => (
    <div className="flex items-center justify-center gap-2">
      <div className={`w-[70px] text-center text-xs font-bold
        ${side === "andar" ? "bg-[#3b2a3a] text-white" : "bg-yellow-300 text-black"}`}>
        {side.toUpperCase()}
      </div>

      <div className="flex gap-1">
        {CARD_ORDER.map((card) => (
          <BetCard key={`${side}-${card}`} card={card} side={side} bet={getBet(side, card)} />
        ))}
      </div>
    </div>
  );

  // =========================
  // MAIN RENDER
  // =========================
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="block sm:hidden">{renderMobileRows("andar")}</div>
        <div className="hidden sm:block">{renderDesktopRow("andar")}</div>
      </div>

      <div className="flex justify-center">
        <div className="block sm:hidden">{renderMobileRows("bahar")}</div>
        <div className="hidden sm:block">{renderDesktopRow("bahar")}</div>
      </div>
    </div>
  );
};
