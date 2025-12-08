import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface BettingPanelProps {
  table: any;
  odds: any;
  onPlaceBet: (betData: any) => Promise<void>;
  loading: boolean;
}

export const BettingPanel = ({ table, odds, onPlaceBet, loading }: BettingPanelProps) => {
  const [amount, setAmount] = useState("100");
  const [selectedBet, setSelectedBet] = useState("");
  const [betType, setBetType] = useState<"back" | "lay">("back");

  const quickAmounts = [100, 500, 1000, 5000];
  const betTypes = odds?.bets || [];

  // Safe odds detection
  const hasRealOdds = betTypes.some(
    (b: any) =>
      (b?.back && b.back > 0) ||
      (b?.lay && b.lay > 0) ||
      (b?.odds && b.odds > 0)
  );

  const getSelectedBetData = () => {
    return betTypes.find((b: any) => b?.type === selectedBet);
  };

  const getSelectedOdds = () => {
    const bet = getSelectedBetData();
    if (!bet) return 1;

    if (betType === "back")
      return bet.back > 0 ? bet.back : bet.odds > 0 ? bet.odds : 1;

    return bet?.lay > 0 ? bet.lay : 1;
  };

  const handlePlaceBet = async () => {
    const amt = Number(amount);

    if (!selectedBet || !amt || isNaN(amt) || amt <= 0) return;

    const bet = getSelectedBetData();
    const oddsValue = getSelectedOdds();

    await onPlaceBet({
      tableId: table.id,
      tableName: table.name,
      amount: amt,
      betType: selectedBet,
      odds: oddsValue,
      roundId: table.data?.currentRound || bet?.mid || undefined,
      sid: bet?.sid,
    });

    setAmount("100");
    setSelectedBet("");
  };

  const calculatePotential = () => {
    const amt = Number(amount);
    const odds = getSelectedOdds();

    if (!amt || odds <= 1) return "0.00";

    return (amt * (odds - 1)).toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          Place Your Bet
          {hasRealOdds && (
            <Badge variant="outline" className="text-green-500 border-green-500">
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {!hasRealOdds && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-yellow-500">Waiting for live odds...</span>
          </div>
        )}

        {hasRealOdds && (
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Select Bet (Live Odds)
            </Label>

            <div className="grid gap-2">
              {betTypes.map((bet: any) => {
                const isSuspended = bet?.status === "suspended";

                return (
                  <div
                    key={bet.type}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedBet === bet.type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${isSuspended ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => !isSuspended && setSelectedBet(bet.type)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{bet.type}</span>

                      {isSuspended && (
                        <Badge variant="destructive" className="text-xs">
                          Suspended
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      {/* BACK */}
                      <Button
                        size="sm"
                        variant={
                          selectedBet === bet.type && betType === "back"
                            ? "default"
                            : "outline"
                        }
                        className={`flex-1 ${
                          selectedBet === bet.type && betType === "back"
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBet(bet.type);
                          setBetType("back");
                        }}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span className="font-bold">
                          {bet.back?.toFixed(2) || bet.odds?.toFixed(2) || "-"}
                        </span>
                      </Button>

                      {/* LAY */}
                      {bet?.lay > 0 && (
                        <Button
                          size="sm"
                          variant={
                            selectedBet === bet.type && betType === "lay"
                              ? "default"
                              : "outline"
                          }
                          className={`flex-1 ${
                            selectedBet === bet.type && betType === "lay"
                              ? "bg-pink-500 hover:bg-pink-600"
                              : "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBet(bet.type);
                            setBetType("lay");
                          }}
                        >
                          <TrendingDown className="w-3 h-3 mr-1" />
                          <span className="font-bold">
                            {bet.lay?.toFixed(2) || "-"}
                          </span>
                        </Button>
                      )}
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Min: ₹{bet.min || 100}</span>
                      <span>Max: ₹{(bet.max || 100000).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick amounts */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            Quick Amount
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                variant={amount === String(amt) ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(String(amt))}
                className="h-8 sm:h-10 text-xs sm:text-sm"
              >
                ₹{amt}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom */}
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

        {/* Place Bet */}
        <Button
          onClick={handlePlaceBet}
          disabled={!selectedBet || loading || !hasRealOdds}
          className={`w-full h-10 sm:h-12 text-base sm:text-lg font-bold ${
            betType === "back"
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-pink-500 hover:bg-pink-600"
          }`}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Placing Bet...
            </>
          ) : (
            `${betType === "back" ? "Back" : "Lay"} ₹${amount || 0}`
          )}
        </Button>

        {selectedBet && amount && hasRealOdds && (
          <div className="text-sm text-center text-muted-foreground">
            {betType === "back" ? "Potential win" : "Liability"}: ₹
            {calculatePotential()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
