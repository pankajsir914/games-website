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
  odds?: any; // Add odds prop to extract roundId
}

/* ================= CONSTANTS ================= */

const CARD_ORDER = [
  "A","2","3","4","5","6","7","8","9","10","J","Q","K"
];

/* ================= HELPERS ================= */

const isSuspended = (b: any) => {
  // Only consider suspended if bet exists and is actually suspended
  if (!b) return false; // Don't lock if bet doesn't exist - show card as available
  return b?.gstatus === "SUSPENDED" || b?.status === "suspended" || b?.gstatus === "0";
};

const byName = (betTypes: any[], k: string) =>
  betTypes.find((b: any) =>
    (b.nat || b.type || "").toLowerCase().includes(k)
  );

const getJokerBet = (betTypes: any[], card: string) => {
  if (!betTypes || betTypes.length === 0) return null;
  
  // Try multiple formats: "joker A", "Joker A", "JOKER A", etc.
  const searchTerm = `joker ${card.toLowerCase()}`;
  return betTypes.find(
    (b: any) => {
      const nat = (b.nat || "").toLowerCase().trim();
      const type = (b.type || "").toLowerCase().trim();
      return nat === searchTerm || type === searchTerm || 
             nat.includes(searchTerm) || type.includes(searchTerm);
    }
  ) || null;
};

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
  odds,
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

  const isLocked = (bet: any) => {
    if (!bet) return false;
    const suspended = isSuspended(bet);
    const odds = getOdds(bet);
    const oddsValue = formatOdds(odds);
    const hasZeroOdds = oddsValue === "0.00" || Number(odds) === 0;
    return suspended || hasZeroOdds;
  };

  const handleBetClick = (bet: any) => {
    if (!bet) return;
    
    if (isLocked(bet)) return;
    
    // Allow clicking if bet exists and is not locked
    setSelectedBetData(bet);
    setModalOpen(true);
    onSelect?.(bet, "back");
  };

  return (
    <div className="space-y-5">

      {/* SA / SB */}
      <div className="flex justify-between gap-4">
        {[{ label: "A", bet: SA }, { label: "B", bet: SB }].map(
          ({ label, bet }) => {
            const locked = isLocked(bet);
            return (
              <div key={label} className="flex items-center gap-2">
                <span className="font-bold">{label}</span>
                <div
                  onClick={() => handleBetClick(bet)}
                  className={`w-[90px] h-[44px] border rounded flex flex-col items-center justify-center relative
                    ${
                      locked
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer border-yellow-400"
                    }`}
                >
                  {locked && (
                    <Lock className="w-3 h-3 absolute top-1 right-1 text-red-500" />
                  )}
                  <div className="font-bold">{label === "A" ? "SA" : "SB"}</div>
                  <div className="text-xs">
                    {formatOdds(getOdds(bet))}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* ODD EVEN */}
      <div className="grid grid-cols-2 gap-4">
        {[{ label: "ODD", bet: odd }, { label: "EVEN", bet: even }].map(
          ({ label, bet }) => {
            const locked = isLocked(bet);
            return (
              <div key={label} className="text-center">
                <div className="font-bold">{label}</div>
                <div
                  onClick={() => handleBetClick(bet)}
                  className={`h-[44px] rounded flex items-center justify-center font-bold relative
                    ${
                      locked
                        ? "opacity-50 cursor-not-allowed bg-sky-400"
                        : "cursor-pointer bg-sky-400"
                    }`}
                >
                  {locked && (
                    <Lock className="w-4 h-4 absolute top-1 right-1 text-red-500" />
                  )}
                  {formatOdds(getOdds(bet))}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* SUITS */}
      <div className="grid grid-cols-4 gap-3 text-center">
        {suits.map((s) => {
          const locked = isLocked(s.bet);
          return (
            <div key={s.key}>
              <div className="text-xl">{s.icon}</div>
              <div
                onClick={() => handleBetClick(s.bet)}
                className={`h-[44px] rounded flex items-center justify-center font-bold relative
                  ${
                    locked
                      ? "opacity-50 cursor-not-allowed bg-sky-400"
                      : "cursor-pointer bg-sky-400"
                  }`}
              >
                {locked && (
                  <Lock className="w-4 h-4 absolute top-1 right-1 text-red-500" />
                )}
                {formatOdds(getOdds(s.bet))}
              </div>
            </div>
          );
        })}
      </div>

      {/* JOKER CARDS */}
      <div className="flex flex-wrap justify-center gap-2">
        {CARD_ORDER.map((card) => {
          const bet = getJokerBet(betTypes, card);
          // Show all cards always - lock if bet exists AND (is suspended OR odds are 0.00)
          const locked = bet ? isLocked(bet) : false;
          const canBet = bet && !locked;
          const hasBet = !!bet;

          return (
            <div
              key={card}
              onClick={(e) => {
                e.stopPropagation();
                if (canBet && bet) {
                  handleBetClick(bet);
                }
              }}
              className={`w-[42px] h-[60px] border-2 rounded flex flex-col items-center justify-center transition-all relative select-none
                ${
                  locked
                    ? "bg-gray-600 text-white opacity-60 cursor-not-allowed border-gray-500"
                    : hasBet && canBet
                    ? "bg-white cursor-pointer border-yellow-400 hover:border-yellow-500 hover:scale-105 hover:shadow-md active:scale-95"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                }`}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              <div className={`font-bold text-xs ${locked ? 'text-white' : hasBet && canBet ? 'text-black' : 'text-gray-400'}`}>
                {card}
              </div>
              {bet && (
                <div className={`text-[9px] mt-0.5 ${locked ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatOdds(getOdds(bet))}
                </div>
              )}
              {locked && (
                <Lock className="w-3 h-3 text-red-500 absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm" />
              )}
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
              // Extract roundId from bet data or odds
              const roundIdFromBet = selectedBetData?.mid || selectedBetData?.round_id || selectedBetData?.round;
              const roundIdFromOdds = odds?.rawData?.mid || odds?.raw?.mid || odds?.mid || 
                                     odds?.rawData?.round_id || odds?.raw?.round_id || odds?.round_id ||
                                     odds?.rawData?.round || odds?.raw?.round || odds?.round ||
                                     odds?.rawData?.gmid || odds?.raw?.gmid || odds?.gmid;
              
              await onPlaceBet?.({
                amount: Number(currentAmount),
                betType: selectedBetData?.nat || selectedBetData?.type,
                odds: getOdds(selectedBetData),
                sid: selectedBetData?.sid,
                roundId: roundIdFromBet || roundIdFromOdds || null,
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
