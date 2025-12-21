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
    try {
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
    } catch (error) {
      // Error is already handled by onPlaceBet with toast
      console.error("Bet placement error:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          Place Your Bet
          {hasRealOdds && <Badge variant="outline" className="text-green-500 border-green-500 text-xs">LIVE</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-2.5 px-3 sm:px-4 pb-3 sm:pb-4">
        {isRestricted && (
          <div className="flex items-center gap-1.5 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-500">Betting disabled — this table is restricted.</span>
          </div>
        )}

        {!hasRealOdds && !isRestricted && (
          <div className="flex items-center justify-between gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-500">
                {odds?.error ? "Failed to load odds. Retrying..." : "Waiting for live odds..."}
              </span>
            </div>
            {odds?.error && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="text-xs h-6 px-2"
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {hasRealOdds && !isRestricted && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Select Bet (Live Odds)</Label>
            <div className="grid grid-cols-4 gap-0.5 sm:gap-1">
              {betTypes.map((bet: any, index: number) => {
                const backVal = bet?.back ?? bet?.odds ?? 0;
                const layVal = bet?.lay ?? 0;
                const backText = backVal && Number(backVal) > 0 ? Number(backVal).toFixed(2) : bet?.odds && Number(bet.odds) > 0 ? Number(bet.odds).toFixed(2) : "-";
                const layText = layVal && Number(layVal) > 0 ? Number(layVal).toFixed(2) : "-";
                // Create unique key by always including index to ensure uniqueness
                const uniqueKey = `${bet?.id || bet?.mid || bet?.type || 'bet'}-${index}`;
                return (
                  <div key={uniqueKey} className={`p-0.5 sm:p-1.5 rounded border transition-all cursor-pointer ${selectedBet === bet.type ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"} ${bet.status === "suspended" ? "opacity-50 pointer-events-none" : ""}`} onClick={() => bet.status !== "suspended" && setSelectedBet(bet.type)}>
                    <div className="flex items-center justify-center mb-0.5 sm:mb-1">
                      <span className="font-medium text-[9px] sm:text-xs truncate text-center">{bet.type}</span>
                      {bet.status === "suspended" && <Badge variant="destructive" className="text-[9px] px-0.5 py-0 h-3 hidden sm:inline-flex">Suspended</Badge>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <Button size="sm" variant={selectedBet === bet.type && betType === "back" ? "default" : "outline"} className={`w-full sm:flex-1 h-4 sm:h-6 text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0`} onClick={(e) => { e.stopPropagation(); setSelectedBet(bet.type); setBetType("back"); }} disabled={bet.status === "suspended" || !(Number(backVal) > 0 || Number(bet?.odds ?? 0) > 0)}>
                        <span className="hidden sm:inline"><TrendingUp className="w-2.5 h-2.5 mr-0.5" /></span>
                        <span className="font-semibold">{backText}</span>
                      </Button>

                      {Number(layVal) > 0 && (
                        <Button size="sm" variant={selectedBet === bet.type && betType === "lay" ? "default" : "outline"} className={`w-full sm:flex-1 h-4 sm:h-6 text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0`} onClick={(e) => { e.stopPropagation(); setSelectedBet(bet.type); setBetType("lay"); }} disabled={bet.status === "suspended"}>
                          <span className="hidden sm:inline"><TrendingDown className="w-2.5 h-2.5 mr-0.5" /></span>
                          <span className="font-semibold">{layText}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Quick Amount</Label>
          <div className="grid grid-cols-4 gap-1">
            {quickAmounts.map((amt) => (
              <Button key={amt} variant={amount === amt.toString() ? "default" : "outline"} size="sm" onClick={() => setAmount(amt.toString())} className="h-7 text-xs px-1.5">
                ₹{amt}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="custom-amount" className="text-xs mb-1 block">Custom Amount</Label>
          <Input id="custom-amount" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} min="10" className="h-8 text-sm" />
        </div>

        <Button onClick={handlePlaceBet} disabled={!selectedBet || !amount || loading || !hasRealOdds || isRestricted} className={`w-full h-9 text-sm font-semibold ${betType === "back" ? "bg-blue-500 hover:bg-blue-600" : "bg-pink-500 hover:bg-pink-600"}`}>
          {loading ? (<><Loader2 className="w-3 h-3 mr-2 animate-spin" />Placing Bet...</>) : (`${betType === "back" ? "Back" : "Lay"} ₹${amount || 0}`)}
        </Button>

        {selectedBet && amount && hasRealOdds && !isRestricted && (
          <div className="text-xs text-center text-muted-foreground">
            {betType === "back" ? "Potential win" : "Liability"}: ₹{(parseFloat(amount) * (getSelectedBetOdds() - 1)).toFixed(2)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
