// src/features/live-casino/ui-templates/andar-bahar/AbjBetting.tsx

import React from "react";
import { Button } from "@/components/ui/button";
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
  onResultClick: (res: any) => void;
}

/* ===============================
   CONSTANTS
================================ */

const CARD_ORDER = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

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
  result,
  onResultClick,
}: AbjBettingProps) => {

  /* ---------- MAP BETS ---------- */

  const SA = byName(betTypes, "sa");
  const SB = byName(betTypes, "sb");
  const first = byName(betTypes, "1st");
  const odd = byName(betTypes, "odd");
  const even = byName(betTypes, "even");

  const suits = [
    { key: "spade", icon: "♠" },
    { key: "club", icon: "♣" },
    { key: "heart", icon: "♥" },
    { key: "diamond", icon: "♦" },
  ].map((s) => ({
    ...s,
    bet: byName(betTypes, s.key),
  }));

  const last10Results = result?.results || result?.res || [];

  return (
    <div className="space-y-6">

      {/* ================= A / B ================= */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        {/* A */}
        <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
          <span className="font-bold">A</span>

          <div className="w-[80px] sm:w-[90px] h-[44px] border-2 border-yellow-400 rounded flex flex-col items-center justify-center">
            <div className="font-bold">SA</div>
            <div className="text-xs">{formatOdds(SA?.b)}</div>
          </div>

          <div
            onClick={() => first && onSelect(first, "back")}
            className="w-[80px] sm:w-[90px] h-[44px] bg-blue-600 text-white rounded flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="font-bold text-xs sm:text-sm">First Bet</div>
            <div className="text-xs">{formatOdds(first?.b)}</div>
          </div>

          <div className="w-[80px] sm:w-[90px] h-[44px] bg-[#3a3f45] text-white rounded flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* B */}
        <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
          <span className="font-bold">B</span>

          <div className="w-[80px] sm:w-[90px] h-[44px] border-2 border-yellow-400 rounded flex flex-col items-center justify-center">
            <div className="font-bold">SB</div>
            <div className="text-xs">{formatOdds(SB?.b)}</div>
          </div>

          <div
            onClick={() => first && onSelect(first, "back")}
            className="w-[80px] sm:w-[90px] h-[44px] bg-blue-600 text-white rounded flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="font-bold text-xs sm:text-sm">First Bet</div>
            <div className="text-xs">{formatOdds(first?.b)}</div>
          </div>

          <div className="w-[80px] sm:w-[90px] h-[44px] bg-[#3a3f45] text-white rounded flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ================= ODD / EVEN ================= */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {[
          { label: "ODD", bet: odd },
          { label: "EVEN", bet: even },
        ].map(({ label, bet }) => (
          <div key={label} className="text-center space-y-1">
            <div className="font-bold">{label}</div>
            <div
              onClick={() => bet && onSelect(bet, "back")}
              className="h-[40px] sm:h-[44px] bg-sky-400 rounded flex items-center justify-center font-bold cursor-pointer"
            >
              {formatOdds(bet?.b)}
            </div>
          </div>
        ))}
      </div>

      {/* ================= SUITS ================= */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 text-center">
        {suits.map((s) => {
          const locked = isSuspended(s.bet);
          return (
            <div key={s.key}>
              <div className="text-xl sm:text-2xl">{s.icon}</div>
              <div
                onClick={() => !locked && s.bet && onSelect(s.bet, "back")}
                className={`relative h-[40px] sm:h-[44px] bg-sky-400 rounded flex items-center justify-center font-bold
                  ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {formatOdds(s.bet?.b)}
                {locked && <Lock className="absolute w-4 h-4" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= CARDS ================= */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {CARD_ORDER.map((card) => {
          const bet = getJokerBet(betTypes, card);
          const locked = isSuspended(bet);

          return (
            <div
              key={card}
              onClick={() => !locked && bet && onSelect(bet, "back")}
              className={`
                relative
                w-[36px] h-[52px]
                sm:w-[40px] sm:h-[56px]
                md:w-[44px] md:h-[60px]
                rounded border-2
                flex flex-col items-center justify-center
                ${
                  locked
                    ? "bg-gray-700 border-gray-500 cursor-not-allowed"
                    : "bg-white border-yellow-400 cursor-pointer"
                }
              `}
            >
              <div className={`font-bold text-xs ${locked ? "text-white" : "text-black"}`}>
                {card}
              </div>

              <div className={`text-[10px] leading-none ${locked ? "text-white" : "text-black"}`}>
                ♠ ♥
              </div>
              <div className={`text-[10px] leading-none ${locked ? "text-white" : "text-black"}`}>
                ♦ ♣
              </div>

              {locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                  <Lock className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      {last10Results.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
            Last 10 Results
          </p>

          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {last10Results.slice(0, 10).map((res: any, idx: number) => (
              <Button
                key={res.mid || idx}
                size="sm"
                variant="outline"
                className="w-10 h-10 p-0 font-bold"
                onClick={() => onResultClick(res)}
              >
                {res.win || res.result || res.winner || "N/A"}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
