import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock } from "lucide-react";

interface LuckyBettingBoardProps {
  bets: any[];
  locked?: boolean;
  min?: number;
  max?: number;
  onPlaceBet: (betData: {
    betType: string;
    amount: number;
    odds: number;
    roundId?: string;
    sid?: string | number;
    side?: "back" | "lay";
  }) => Promise<void>;
}

const QUICK_CHIPS = [10, 50, 100, 500];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

export const LuckyBettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
}: LuckyBettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));

  const totalBets = useMemo(() => {
    const bet = bets.find((b: any) => b.type === selectedBet);
    const amt = parseFloat(amount) || 0;
    return bet ? amt : 0;
  }, [bets, selectedBet, amount]);

  const handlePlace = async () => {
    const bet = bets.find((b: any) => b.type === selectedBet);
    const amt = parseFloat(amount);
    if (!bet || !amt || amt <= 0 || locked) return;
    const odds = Number(
      bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0
    );
    await onPlaceBet({
      betType: bet.type,
      amount: Math.min(Math.max(amt, min), max),
      odds: odds > 1000 ? odds / 100000 : odds,
      roundId: bet?.mid,
      sid: bet?.sid,
      side: "back",
    });
    setSelectedBet("");
    setAmount(String(min));
  };

  return (
    <Card className="border border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Lucky Bets</CardTitle>
          <div className="flex items-center gap-2">
            {QUICK_CHIPS.map((chip) => (
              <Button
                key={chip}
                size="sm"
                variant="outline"
                disabled={locked}
                onClick={() =>
                  setAmount((prev) => {
                    const current = Number(prev) || 0;
                    const next = current + chip;
                    return String(next);
                  })
                }
                className="text-xs"
              >
                ₹{chip}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-1.5">
          {bets.map((bet: any, idx: number) => {
            const back = formatOdds(bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds);
            const disabled = locked || back === "0.00" || bet.status === "suspended";
            const isSelected = bet.type === selectedBet;
            return (
              <button
                key={`${bet?.type}-${idx}`}
                disabled={disabled}
                onClick={() => setSelectedBet(bet.type)}
                className={`relative rounded-md border px-2 py-2 text-left transition-all text-sm ${
                  isSelected ? "border-primary bg-primary/10 shadow-sm" : "hover:border-primary/40"
                } ${disabled ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs truncate">{bet.type}</span>
                  <Badge variant="secondary" className="text-[10px] px-1">
                    {back === "0.00" ? "--" : back}
                  </Badge>
                </div>
                {disabled && (
                  <Lock className="w-4 h-4 text-muted-foreground absolute -top-2 -right-2" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={min}
            max={max}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={locked}
            className="max-w-[160px]"
          />
          <div className="text-xs text-muted-foreground">
            Min ₹{min} · Max ₹{max}
          </div>
          <div className="ml-auto text-sm">
            Total: <span className="font-semibold">₹{totalBets}</span>
          </div>
          <Button
            size="sm"
            onClick={handlePlace}
            disabled={locked || !selectedBet || totalBets === 0}
            className="flex items-center gap-1"
          >
            <TrendingUp className="w-4 h-4" />
            Place Bet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

