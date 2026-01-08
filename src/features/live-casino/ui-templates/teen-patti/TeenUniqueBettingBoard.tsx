import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TeenUniqueBettingBoardProps {
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
  odds?: any;
}

const QUICK_CHIPS = [10, 50, 100, 500, 1000];

const TEEN_UNIQUE_CARDS = [
  { rank: "3", suit: "♣", color: "text-black" },
  { rank: "9", suit: "♥", color: "text-red-500" },
  { rank: "5", suit: "♦", color: "text-red-500" },
  { rank: "6", suit: "♥", color: "text-red-500" },
  { rank: "9", suit: "♠", color: "text-black" },
  { rank: "3", suit: "♠", color: "text-black" },
];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

export const TeenUniqueBettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
}: TeenUniqueBettingBoardProps) => {
  const [amount, setAmount] = useState<string>(String(min));
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const baseBet = bets[0];
  const rawOdds = baseBet?.back ?? baseBet?.b ?? baseBet?.odds ?? 0;
  const oddsValue = rawOdds > 1000 ? rawOdds / 100000 : rawOdds;
  const displayOdds = formatOdds(oddsValue);

  const handleToggleCard = (index: number) => {
    if (locked) return;
    setSelectedIndexes((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      if (prev.length >= 3) return prev;
      return [...prev, index];
    });
  };

  const handlePlace = async () => {
    const numericAmount = parseFloat(amount);
    if (!baseBet || locked || !numericAmount || numericAmount <= 0) return;
    if (selectedIndexes.length !== 3) return;

    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds =
      raw?.mid ||
      raw?.round_id ||
      raw?.round ||
      raw?.gmid ||
      raw?.game_id ||
      odds?.mid ||
      odds?.round_id ||
      odds?.round ||
      odds?.gmid ||
      odds?.game_id;

    await onPlaceBet({
      betType: baseBet?.nat || baseBet?.type || "TeenUnique",
      amount: Math.min(Math.max(numericAmount, min), max),
      odds: oddsValue,
      roundId: roundIdFromOdds,
      sid: baseBet?.sid,
      side: "back",
    });

    setModalOpen(false);
    setSelectedIndexes([]);
    setAmount(String(min));
  };

  const isSelected = (index: number) => selectedIndexes.includes(index);
  const getSelectionNumber = (index: number) =>
    selectedIndexes.indexOf(index) >= 0 ? selectedIndexes.indexOf(index) + 1 : null;

  const numericAmount = parseFloat(amount) || 0;
  const potentialWin = Number((numericAmount * (oddsValue || 0)).toFixed(2));

  return (
    <>
      <Card className="border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              TeenUnique Bets
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                  className="text-[10px] sm:text-xs px-2 sm:px-3"
                >
                  ₹{chip}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="w-full bg-slate-800 text-white text-center text-sm sm:text-base py-2 rounded">
            Select any 3 cards of your choice and experience TeenPatti in a unique way.
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pt-1">
            {TEEN_UNIQUE_CARDS.map((card, index) => {
              const selected = isSelected(index);
              const selectionNumber = getSelectionNumber(index);

              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="mb-1 h-5 sm:h-6 flex items-center justify-center">
                    {selectionNumber && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-700 text-white text-[10px] sm:text-xs flex items-center justify-center">
                        {selectionNumber}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleCard(index)}
                    disabled={locked}
                    className={`w-[60px] h-[85px] sm:w-[80px] sm:h-[110px] rounded border-2 flex flex-col items-center justify-center font-bold transition-all relative bg-white ${
                      selected
                        ? "border-yellow-400 shadow-lg scale-105"
                        : "border-yellow-300 hover:border-yellow-400 hover:shadow-md"
                    } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className={`text-xl sm:text-3xl mb-1 ${card.color}`}>{card.rank}</div>
                    <div className={`text-xl sm:text-3xl ${card.color}`}>{card.suit}</div>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                Odds: <span className="font-semibold">{displayOdds}</span>
              </div>
              <Input
                type="number"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked}
                className="flex-1 sm:max-w-[140px]"
                placeholder="Enter amount"
              />
              <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                Min ₹{min} · Max ₹{max}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs sm:text-sm">
                Win: <span className="font-semibold">₹{potentialWin}</span>
              </div>
              <Button
                size="sm"
                disabled={
                  locked || !baseBet || numericAmount <= 0 || selectedIndexes.length !== 3
                }
                onClick={() => setModalOpen(true)}
                className="text-xs sm:text-sm"
              >
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Place Bet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm TeenUnique Bet</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Selected Cards</Label>
              <div className="mt-2 flex gap-2 flex-wrap">
                {selectedIndexes.map((i) => {
                  const card = TEEN_UNIQUE_CARDS[i];
                  return (
                    <div
                      key={i}
                      className="w-[60px] h-[80px] rounded border-2 border-yellow-400 bg-white flex flex-col items-center justify-center font-bold"
                    >
                      <div className={`text-2xl mb-1 ${card.color}`}>{card.rank}</div>
                      <div className={`text-2xl ${card.color}`}>{card.suit}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked}
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Potential Win</div>
              <div className="text-lg font-bold">₹{potentialWin}</div>
            </div>

            <Button
              className="w-full"
              disabled={
                locked || !baseBet || numericAmount <= 0 || selectedIndexes.length !== 3
              }
              onClick={handlePlace}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Confirm Bet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

