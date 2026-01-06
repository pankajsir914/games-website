import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock } from "lucide-react";

interface PokerBettingBoardProps {
  bets?: any[];
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

const QUICK_CHIPS = [100, 500, 1000, 5000];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

const isSuspended = (bet: any) => {
  if (!bet) return true;
  if (bet.status === "suspended" || bet.gstatus === "SUSPENDED" || bet.gstatus === "0") return true;
  const odds = bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0;
  return Number(odds) <= 0;
};

export const PokerBettingBoard = ({
  bets = [],
  locked = false,
  min = 100,
  max = 100000,
  onPlaceBet,
}: PokerBettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));

  const totalBets = useMemo(() => {
    const bet = bets.find((b: any) => (b.type === selectedBet || b.nat === selectedBet));
    const amt = parseFloat(amount) || 0;
    return bet ? amt : 0;
  }, [bets, selectedBet, amount]);

  const handlePlace = async () => {
    const bet = bets.find((b: any) => (b.type === selectedBet || b.nat === selectedBet));
    const amt = parseFloat(amount);
    if (!bet || !amt || amt <= 0 || locked) return;
    
    const suspended = isSuspended(bet);
    if (suspended) return;
    
    const odds = Number(
      bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0
    );
    await onPlaceBet({
      betType: bet.type || bet.nat || selectedBet,
      amount: Math.min(Math.max(amt, min), max),
      odds: odds > 1000 ? odds / 100000 : odds,
      roundId: bet?.mid,
      sid: bet?.sid,
      side: "back",
    });
    setSelectedBet("");
    setAmount(String(min));
  };

  const handleBetClick = (bet: any) => {
    const suspended = isSuspended(bet);
    if (suspended || locked) return;
    setSelectedBet(bet.type || bet.nat || "");
  };

  return (
    <Card className="border border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Poker Bets</CardTitle>
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
        {/* Show ALL buttons - always visible, locked if suspended */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {bets.map((bet: any, idx: number) => {
            const back = formatOdds(bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0);
            const suspended = isSuspended(bet);
            const disabled = locked || suspended;
            const isSelected = (bet.type === selectedBet || bet.nat === selectedBet);
            
            return (
              <button
                key={`${bet?.type || bet?.nat || idx}-${idx}`}
                disabled={disabled}
                onClick={() => handleBetClick(bet)}
                className={`
                  relative rounded-md border px-3 py-3 text-left transition-all text-sm
                  ${isSelected 
                    ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary" 
                    : "hover:border-primary/40"
                  }
                  ${disabled 
                    ? "opacity-60 cursor-not-allowed bg-muted/30" 
                    : "cursor-pointer"
                  }
                `}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs truncate">
                    {bet?.type || bet?.nat || `Bet ${idx + 1}`}
                  </span>
                  <Badge 
                    variant={suspended ? "destructive" : "secondary"} 
                    className="text-[10px] px-1 shrink-0"
                  >
                    {suspended ? "--" : back}
                  </Badge>
                </div>
                {suspended && (
                  <Lock className="w-4 h-4 text-muted-foreground absolute -top-2 -right-2 bg-background rounded-full p-0.5" />
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

