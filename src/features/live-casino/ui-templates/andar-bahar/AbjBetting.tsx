import React from "react";
import { Lock } from "lucide-react";

/* ===============================
   TYPES
================================ */

interface AbjBettingProps {
  betTypes: any[];
  selectedBet: string;
  onSelect: (bet: any, side: "back") => void;
  formatOdds: (v: any) => string;
  result?: any;
}

/* ===============================
   CONSTANTS
================================ */

const CARD_ORDER = [
  "A","2","3","4","5","6","7","8","9","10","J","Q","K"
];

/* ===============================
   HELPERS
================================ */

const isSuspended = (b: any) => !b || b?.gstatus === "SUSPENDED";

const byName = (betTypes: any[], k: string) =>
  betTypes.find((b: any) =>
    (b.nat || "").toLowerCase().includes(k)
  );

const getJokerBet = (betTypes: any[], card: string) =>
  betTypes.find(
    (b: any) =>
      (b.nat || "").toLowerCase() === `joker ${card.toLowerCase()}`
  );

/* ===============================
   COMPONENT
================================ */

export const AbjBetting = ({
  betTypes,
  selectedBet,
  onSelect,
  formatOdds,
}: AbjBettingProps) => {
  /* ---------- MAP BETS ---------- */

  const SA = byName(betTypes, "sa");
  const SB = byName(betTypes, "sb");
  const first = byName(betTypes, "1st");
  const second = byName(betTypes, "2nd");

  const odd = byName(betTypes, "odd");
  const even = byName(betTypes, "even");

  const suits = [
    { key: "spade", icon: "♠️" },
    { key: "club", icon: "♣️" },
    { key: "heart", icon: "♥️" },
    { key: "diamond", icon: "♦️" },
  ].map((s) => ({
    ...s,
    bet: byName(betTypes, s.key),
  }));

  /* ===============================
     UI
  ================================ */

  return (
    <div className="space-y-5">

      {/* ================= A / B ================= */}
      <div className="flex justify-between items-center">
        {/* A */}
        <div className="flex items-center gap-2">
          <span className="font-bold">A</span>

          <div className="w-[90px] h-[46px] border-2 border-yellow-400 rounded flex flex-col items-center justify-center">
            <div className="font-bold">SA</div>
            <div className="text-xs">{formatOdds(SA?.b)}</div>
          </div>

          <div
            onClick={() => first && onSelect(first, "back")}
            className="w-[90px] h-[46px] bg-blue-600 text-white rounded flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="font-bold">First Bet</div>
            <div className="text-xs">{formatOdds(first?.b)}</div>
          </div>

          <div className="relative w-[90px] h-[46px] bg-[#3a3f45] text-white rounded flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* B */}
        <div className="flex items-center gap-2">
          <span className="font-bold">B</span>

          <div className="w-[90px] h-[46px] border-2 border-yellow-400 rounded flex flex-col items-center justify-center">
            <div className="font-bold">SB</div>
            <div className="text-xs">{formatOdds(SB?.b)}</div>
          </div>

          <div
            onClick={() => first && onSelect(first, "back")}
            className="w-[90px] h-[46px] bg-blue-600 text-white rounded flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="font-bold">First Bet</div>
            <div className="text-xs">{formatOdds(first?.b)}</div>
          </div>

          <div className="relative w-[90px] h-[46px] bg-[#3a3f45] text-white rounded flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ================= ODD / EVEN ================= */}
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center space-y-1">
          <div className="font-bold">ODD</div>
          <div
            onClick={() => odd && onSelect(odd, "back")}
            className="h-[44px] bg-sky-400 rounded flex items-center justify-center font-bold cursor-pointer"
          >
            {formatOdds(odd?.b)}
          </div>
        </div>

        <div className="text-center space-y-1">
          <div className="font-bold">EVEN</div>
          <div
            onClick={() => even && onSelect(even, "back")}
            className="h-[44px] bg-sky-400 rounded flex items-center justify-center font-bold cursor-pointer"
          >
            {formatOdds(even?.b)}
          </div>
        </div>
      </div>

      {/* ================= SUITS ================= */}
      <div className="grid grid-cols-4 gap-4 text-center">
        {suits.map((s) => {
          const locked = isSuspended(s.bet);
          return (
            <div key={s.key} className="space-y-1">
              <div className="text-2xl">{s.icon}</div>
              <div
                onClick={() => !locked && s.bet && onSelect(s.bet, "back")}
                className={`relative h-[44px] bg-sky-400 rounded flex items-center justify-center font-bold
                  ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {formatOdds(s.bet?.b)}
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= CARDS A–K (ALWAYS SHOW) ================= */}
      <div className="flex justify-center gap-1 flex-wrap">
        {CARD_ORDER.map((card) => {
          const bet = getJokerBet(betTypes, card);
          const locked = isSuspended(bet);

          return (
            <div
              key={card}
              onClick={() => !locked && bet && onSelect(bet, "back")}
              className={`relative w-[40px] h-[56px] bg-white border-2 border-yellow-400 rounded text-center
                ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="font-bold text-xs">{card}</div>
              <div className="text-[10px] leading-none">♠️ ♥️</div>
              <div className="text-[10px] leading-none">♦️ ♣️</div>

              {locked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-black" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
