// src/components/live-casino/BettingPanel.tsx
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
  const [amount, setAmount] = useState<string>("100");
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [betType, setBetType] = useState<"back" | "lay">("back");

  const quickAmounts = [100, 500, 1000, 5000];
  const betTypes = odds?.bets || [];

  const hasRealOdds = betTypes.length > 0 && betTypes.some((b: any) => {
    const backVal = b?.back ?? b?.odds ?? 0;
    const layVal = b?.lay ?? 0;
    return backVal > 0 || layVal > 0;
  });

  const isRestricted = table?.status === "restricted";

  const getSelectedBetOdds = () => {
    const bet = betTypes.find((b: any) => b.type === selectedBet);
    if (!bet) return 1;
    const backVal = bet?.back ?? bet?.odds ?? 1;
    const layVal = bet?.lay ?? backVal;
    const raw = betType === "back" ? backVal : layVal;
    const num = typeof raw === "number" ? raw : Number(raw);
    return num > 0 ? num : 1;
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;
    const bet = betTypes.find((b: any) => b.type === selectedBet);
    const selectedOdds = getSelectedBetOdds();
    await onPlaceBet({
      tableId: table.id,
      tableName: table.name,
      amount: parseFloat(amount),
      betType: selectedBet,
      odds: selectedOdds,
      roundId: table.data?.currentRound || bet?.mid || undefined,
      sid: bet?.sid,
      side: betType,
    });
    setAmount("100");
    setSelectedBet("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          Place Your Bet
          {hasRealOdds && <Badge variant="outline" className="text-green-500 border-green-500">LIVE</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {isRestricted && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-500">Betting disabled — this table is restricted.</span>
          </div>
        )}

        {!hasRealOdds && !isRestricted && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-yellow-500">Waiting for live odds...</span>
          </div>
        )}

        {hasRealOdds && !isRestricted && (
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Select Bet (Live Odds)</Label>
            <div className="grid gap-2">
              {betTypes.map((bet: any) => {
                const backVal = bet?.back ?? bet?.odds ?? 0;
                const layVal = bet?.lay ?? 0;
                const backText = backVal && Number(backVal) > 0 ? Number(backVal).toFixed(2) : bet?.odds && Number(bet.odds) > 0 ? Number(bet.odds).toFixed(2) : "-";
                const layText = layVal && Number(layVal) > 0 ? Number(layVal).toFixed(2) : "-";
                return (
                  <div key={bet.type} className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedBet === bet.type ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"} ${bet.status === "suspended" ? "opacity-50 pointer-events-none" : ""}`} onClick={() => bet.status !== "suspended" && setSelectedBet(bet.type)}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{bet.type}</span>
                      {bet.status === "suspended" && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant={selectedBet === bet.type && betType === "back" ? "default" : "outline"} className={`flex-1`} onClick={(e) => { e.stopPropagation(); setSelectedBet(bet.type); setBetType("back"); }} disabled={bet.status === "suspended" || !(Number(backVal) > 0 || Number(bet?.odds ?? 0) > 0)}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span className="font-bold">{backText}</span>
                      </Button>

                      {Number(layVal) > 0 && (
                        <Button size="sm" variant={selectedBet === bet.type && betType === "lay" ? "default" : "outline"} className={`flex-1`} onClick={(e) => { e.stopPropagation(); setSelectedBet(bet.type); setBetType("lay"); }} disabled={bet.status === "suspended"}>
                          <TrendingDown className="w-3 h-3 mr-1" />
                          <span className="font-bold">{layText}</span>
                        </Button>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Min: ₹{bet.min || 100}</span>
                      <span>Max: ₹{(bet.max || 100000).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Quick Amount</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {quickAmounts.map((amt) => (
              <Button key={amt} variant={amount === amt.toString() ? "default" : "outline"} size="sm" onClick={() => setAmount(amt.toString())} className="h-8 sm:h-10 text-xs sm:text-sm">
                ₹{amt}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="custom-amount" className="text-sm">Custom Amount</Label>
          <Input id="custom-amount" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} min="10" className="mt-1" />
        </div>

        <Button onClick={handlePlaceBet} disabled={!selectedBet || !amount || loading || !hasRealOdds || isRestricted} className={`w-full h-10 sm:h-12 text-base sm:text-lg font-bold ${betType === "back" ? "bg-blue-500 hover:bg-blue-600" : "bg-pink-500 hover:bg-pink-600"}`} size="lg">
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Placing Bet...</>) : (`${betType === "back" ? "Back" : "Lay"} ₹${amount || 0}`)}
        </Button>

        {selectedBet && amount && hasRealOdds && !isRestricted && (
          <div className="text-sm text-center text-muted-foreground">
            {betType === "back" ? "Potential win" : "Liability"}: ₹{(parseFloat(amount) * (getSelectedBetOdds() - 1)).toFixed(2)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
