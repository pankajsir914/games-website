import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface BettingPanelProps {
  table: any;
  odds: any;
  onPlaceBet: (betData: any) => Promise<void>;
  loading: boolean;
}

export const BettingPanel = ({ table, odds, onPlaceBet, loading }: BettingPanelProps) => {
  const [amount, setAmount] = useState<string>('100');
  const [selectedBet, setSelectedBet] = useState<string>('');

  const quickAmounts = [100, 500, 1000, 5000];
  const betTypes = odds?.bets || [
    { type: 'Red', odds: 2.5 },
    { type: 'Black', odds: 2.5 },
    { type: 'Green', odds: 14 }
  ];

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) {
      return;
    }

    const bet = betTypes.find((b: any) => b.type === selectedBet);

    await onPlaceBet({
      tableId: table.id,
      tableName: table.name,
      amount: parseFloat(amount),
      betType: selectedBet,
      odds: bet?.odds || 1,
      roundId: table.data?.currentRound || undefined
    });

    setAmount('100');
    setSelectedBet('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Place Your Bet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Quick amounts */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            Quick Amount
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                variant={amount === amt.toString() ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(amt.toString())}
                className="h-8 sm:h-10 text-xs sm:text-sm"
              >
                ₹{amt}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div>
          <Label htmlFor="custom-amount" className="text-sm">
            Custom Amount
          </Label>
          <Input
            id="custom-amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="10"
            className="mt-1"
          />
        </div>

        {/* Bet types */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            Select Bet
          </Label>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {betTypes.map((bet: any) => (
              <Button
                key={bet.type}
                variant={selectedBet === bet.type ? "default" : "outline"}
                onClick={() => setSelectedBet(bet.type)}
                className="h-auto py-2 sm:py-3 flex flex-col items-center gap-1"
              >
                <span className="font-semibold text-sm sm:text-base">{bet.type}</span>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {bet.odds}x
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Place bet button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!selectedBet || !amount || loading}
          className="w-full h-10 sm:h-12 text-base sm:text-lg font-bold"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Placing Bet...
            </>
          ) : (
            `Place Bet ₹${amount || 0}`
          )}
        </Button>

        {selectedBet && amount && (
          <div className="text-sm text-center text-muted-foreground">
            Potential win: ₹
            {(parseFloat(amount) * (betTypes.find((b: any) => b.type === selectedBet)?.odds || 1)).toFixed(2)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
