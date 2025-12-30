import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ================= TYPES ================= */

export interface ABJResultHistoryItem {
  mid: string | number;
  win: "Andar" | "Bahar";
  card?: string;
}

interface AbjBettingProps {
  betTypes: any[];
  selectedBet: string;
  onSelect: (bet: any, side: "back") => void;
  formatOdds: (v: any) => string;
  resultHistory?: ABJResultHistoryItem[];
  onResultClick: (res: ABJResultHistoryItem) => void;
  amount?: string;
  onAmountChange?: (amount: string) => void;
  onPlaceBet?: (betData: any) => Promise<void>;
  loading?: boolean;
}

/* ================= CONSTANTS ================= */

const CARD_ORDER = [
  "A","2","3","4","5","6","7","8","9","10","J","Q","K"
];

/* ================= HELPERS ================= */

const isSuspended = (b: any) =>
  !b || b?.gstatus === "SUSPENDED" || b?.status === "suspended";

const byName = (betTypes: any[], k: string) =>
  betTypes.find((b: any) =>
    (b.nat || b.type || "").toLowerCase().includes(k)
  );

const getJokerBet = (betTypes: any[], card: string) =>
  betTypes.find(
    (b: any) =>
      (b.nat || "").toLowerCase() === `joker ${card.toLowerCase()}`
  );

/* ================= COMPONENT ================= */

export const AbjBetting = ({
  betTypes,
  selectedBet,
  onSelect,
  formatOdds,
  resultHistory = [],
  onResultClick,
  amount,
  onAmountChange,
  onPlaceBet,
  loading = false,
}: AbjBettingProps) => {
  const [localAmount, setLocalAmount] = useState("100");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

  const currentAmount = amount ?? localAmount;
  const setAmount = onAmountChange ?? setLocalAmount;

  const SA = byName(betTypes, "sa");
  const SB = byName(betTypes, "sb");
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

  const last10 = resultHistory.slice(0, 10);

  const getOdds = (bet: any) =>
    bet?.l ?? bet?.back ?? bet?.b ?? bet?.odds ?? 0;

  const handleBetClick = (bet: any) => {
    if (!bet || isSuspended(bet)) return;
    setSelectedBetData(bet);
    setModalOpen(true);
    onSelect?.(bet, "back");
  };

  return (
    <div className="space-y-5">

      {/* SA / SB */}
      <div className="flex justify-between gap-4">
        {[{ label: "A", bet: SA }, { label: "B", bet: SB }].map(
          ({ label, bet }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="font-bold">{label}</span>
              <div
                onClick={() => handleBetClick(bet)}
                className={`w-[90px] h-[44px] border rounded flex flex-col items-center justify-center
                  ${
                    isSuspended(bet)
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer border-yellow-400"
                  }`}
              >
                <div className="font-bold">{label === "A" ? "SA" : "SB"}</div>
                <div className="text-xs">
                  {formatOdds(getOdds(bet))}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* ODD EVEN */}
      <div className="grid grid-cols-2 gap-4">
        {[{ label: "ODD", bet: odd }, { label: "EVEN", bet: even }].map(
          ({ label, bet }) => (
            <div key={label} className="text-center">
              <div className="font-bold">{label}</div>
              <div
                onClick={() => handleBetClick(bet)}
                className={`h-[44px] rounded flex items-center justify-center font-bold
                  ${
                    isSuspended(bet)
                      ? "opacity-50 cursor-not-allowed bg-sky-400"
                      : "cursor-pointer bg-sky-400"
                  }`}
              >
                {formatOdds(getOdds(bet))}
              </div>
            </div>
          )
        )}
      </div>

      {/* SUITS */}
      <div className="grid grid-cols-4 gap-3 text-center">
        {suits.map((s) => (
          <div key={s.key}>
            <div className="text-xl">{s.icon}</div>
            <div
              onClick={() => handleBetClick(s.bet)}
              className={`h-[44px] rounded flex items-center justify-center font-bold
                ${
                  isSuspended(s.bet)
                    ? "opacity-50 cursor-not-allowed bg-sky-400"
                    : "cursor-pointer bg-sky-400"
                }`}
            >
              {formatOdds(getOdds(s.bet))}
            </div>
          </div>
        ))}
      </div>

      {/* JOKER CARDS */}
      <div className="flex flex-wrap justify-center gap-2">
        {CARD_ORDER.map((card) => {
          const bet = getJokerBet(betTypes, card);
          const locked = isSuspended(bet);

          return (
            <div
              key={card}
              onClick={() => !locked && handleBetClick(bet)}
              className={`w-[42px] h-[60px] border rounded flex flex-col items-center justify-center
                ${
                  locked
                    ? "bg-gray-600 text-white"
                    : "bg-white cursor-pointer border-yellow-400"
                }`}
            >
              <div className="font-bold text-xs">{card}</div>
              {locked && <Lock className="w-3 h-3 mt-1" />}
            </div>
          );
        })}
      </div>

      {/* LAST 10 */}
      <div className="pt-2 border-t">
        <p className="text-xs mb-1">Last 10 Results</p>
        <div className="flex gap-1">
          {last10.map((r, i) => (
            <Button
              key={i}
              size="sm"
              variant="outline"
              className="w-9 h-9 p-0 font-bold"
              onClick={() => onResultClick(r)}
            >
              {r.win === "Andar" ? "A" : "B"}
            </Button>
          ))}
        </div>
      </div>

      {/* MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
          </DialogHeader>

          <Label>Amount</Label>
          <Input
            value={currentAmount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Button
            className="w-full mt-3"
            disabled={loading}
            onClick={async () => {
              await onPlaceBet?.({
                amount: Number(currentAmount),
                betType: selectedBetData?.nat || selectedBetData?.type,
                odds: getOdds(selectedBetData),
                sid: selectedBetData?.sid,
              });
              setModalOpen(false);
            }}
          >
            Place Bet
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
