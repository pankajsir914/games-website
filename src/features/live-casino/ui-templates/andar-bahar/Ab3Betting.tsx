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

  // Debug: Log bet types to understand the structure
  if (betTypes.length > 0 && process.env.NODE_ENV === 'development') {
    console.log('Ab3Betting - betTypes:', betTypes.slice(0, 5)); // Log first 5 for debugging
  }

  const getBet = (side: "andar" | "bahar", card: string) => {
    const sideLower = side.toLowerCase();
    const normalizeType = (b: any) => {
      const type = b.type || b.name || b.label || b.nat || "";
      return String(type).toLowerCase().trim().replace(/\s+/g, " ");
    };
    
    // Strategy 1: Try exact matching with side + card
    let matchedBet = betTypes.find((b: any) => {
      const typeStr = normalizeType(b);
      if (!typeStr) return false;
      
      // Must contain the side (andar/bahar) - try variations
      const sideVariants = [
        sideLower, 
        sideLower.charAt(0).toUpperCase() + sideLower.slice(1),
        side === "andar" ? "a" : "b", // Single letter
        side === "andar" ? "and" : "bah", // Partial
      ];
      const hasSide = sideVariants.some(variant => typeStr.includes(variant));
      if (!hasSide) return false;
      
      // Try to match the card - handle different formats
      const cardVariants = [
        card, // "A", "2", "3", etc.
        card.toLowerCase(), // "a", "2", "3", etc.
        card.toUpperCase(), // "A", "2", "3", etc.
      ];
      
      // Special handling for "10" which might be written as "T" or "Ten"
      if (card === "10") {
        cardVariants.push("t", "T", "ten", "Ten", "TEN", "0");
      }
      
      // Special handling for face cards
      if (card === "J") cardVariants.push("jack", "Jack", "JACK", "j");
      if (card === "Q") cardVariants.push("queen", "Queen", "QUEEN", "q");
      if (card === "K") cardVariants.push("king", "King", "KING", "k");
      if (card === "A") cardVariants.push("ace", "Ace", "ACE", "a", "1");
      
      // Check if any card variant matches - be flexible with matching
      const hasCard = cardVariants.some(variant => {
        // Simple substring match (most flexible)
        if (typeStr.includes(variant)) return true;
        // Try with spaces around it
        if (typeStr.includes(` ${variant} `) || 
            typeStr.includes(` ${variant}`) || 
            typeStr.includes(`${variant} `)) return true;
        return false;
      });
      
      // Return match if side and card match
      return hasSide && hasCard;
    });

    // Strategy 2: If no match, try matching by index/position
    // AB3 might have bets in order: Andar A, Andar 2, ..., Andar K, Bahar A, ..., Bahar K
    if (!matchedBet && betTypes.length >= 26) {
      const sideIndex = side === "andar" ? 0 : 13;
      const cardIndex = CARD_ORDER.indexOf(card);
      if (cardIndex >= 0) {
        const betIndex = sideIndex + cardIndex;
        if (betIndex < betTypes.length) {
          const potentialBet = betTypes[betIndex];
          // Verify it matches the side
          const typeStr = normalizeType(potentialBet);
          const sideVariants = [sideLower, side === "andar" ? "a" : "b"];
          if (sideVariants.some(v => typeStr.includes(v))) {
            matchedBet = potentialBet;
          }
        }
      }
    }

    // Strategy 3: If still no match, try to find any bet with the side and create a synthetic bet
    if (!matchedBet) {
      // Try to find any bet for this side (without card requirement)
      const sideBet = betTypes.find((b: any) => {
        const typeStr = normalizeType(b);
        const sideVariants = [
          sideLower, 
          sideLower.charAt(0).toUpperCase() + sideLower.slice(1),
          side === "andar" ? "a" : "b",
        ];
        return sideVariants.some(variant => typeStr.includes(variant));
      });

      // If we found a side bet, use it as a template but modify the type
      if (sideBet) {
        return {
          ...sideBet,
          type: `${side.charAt(0).toUpperCase() + side.slice(1)} ${card}`,
          originalType: sideBet.type,
        };
      }
    }

    return matchedBet;
  };

  const BetCard = ({ bet, side, card }: any) => {
    const suspended = bet?.status === "suspended";
    const betType = bet?.type || `${side.charAt(0).toUpperCase() + side.slice(1)} ${card}`;
    const selected = selectedBet === betType || selectedBet === bet?.type;
    
    // Get odds value - try multiple fields
    const oddsValue = bet?.back || bet?.odds || bet?.lay || bet?.b1 || bet?.b || 0;
    const hasOdds = oddsValue > 0;

    const handleClick = () => {
      if (suspended) return;
      
      // Create bet object if it doesn't exist
      const betToSelect = bet || {
        type: betType,
        back: 0,
        odds: 0,
        side: side,
        card: card,
      };
      
      onSelect(betToSelect, "back");
    };

    return (
      <div
        onClick={handleClick}
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
            : "cursor-pointer hover:bg-white/10 active:scale-95 transition-transform"}
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
