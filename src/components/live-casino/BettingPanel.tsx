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

  // Check if we have betting options (even with 0 odds, they should be shown)
  // Suspended items should also be displayed with their odds
  const hasRealOdds = betTypes.length > 0 && betTypes.some((b: any) => {
    const backVal = b?.back ?? b?.odds ?? 0;
    const layVal = b?.lay ?? 0;
    // Include items with valid odds OR items with valid bet types (even if odds are 0)
    return (backVal > 0 || layVal > 0) || (b?.type && b.type.trim() !== '');
  });

  const isRestricted = table?.status === "restricted";

  const getSelectedBetOdds = () => {
    const bet = betTypes.find((b: any) => b.type === selectedBet);
    if (!bet) return 1;
    
    // Format odds properly - convert from points to decimal if needed
    const formatOdds = (oddsValue: any) => {
      if (!oddsValue || oddsValue === 0) return 1;
      
      const num = Number(oddsValue);
      
      // If odds is very large (like 300000), it's in points format
      // Convert to decimal odds (divide by 100000)
      if (num > 1000) {
        const decimal = num / 100000;
        return decimal > 0 ? decimal : 1;
      }
      
      // Already in decimal format
      return num > 0 ? num : 1;
    };
    
    const rawBackVal = bet?.back ?? bet?.odds ?? 1;
    const rawLayVal = bet?.lay ?? rawBackVal;
    const raw = betType === "back" ? rawBackVal : rawLayVal;
    
    return formatOdds(raw);
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
        roundId: bet?.mid || undefined,
        sid: bet?.sid,
        side: betType,
      });
      setAmount("100");
      setSelectedBet("");
    } catch (error) {
      // Error is already handled by onPlaceBet with toast
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
                // Format odds properly - convert from points to decimal if needed
                const formatOdds = (oddsValue: any) => {
                  // Check for null, undefined, or empty string
                  if (oddsValue === null || oddsValue === undefined || oddsValue === '') return "0.00";
                  
                  const num = Number(oddsValue);
                  
                  // Check if it's a valid number - if NaN, return 0.00
                  if (isNaN(num)) return "0.00";
                  
                  // If odds is 0, still show 0.00 (not null)
                  if (num === 0) return "0.00";
                  
                  // If odds is very large (like 300000), it's in points format
                  // Convert to decimal odds (divide by 100000)
                  if (num > 1000) {
                    const decimal = num / 100000;
                    return decimal > 0 ? decimal.toFixed(2) : "0.00";
                  }
                  
                  // Already in decimal format, just format to 2 decimal places
                  return num > 0 ? num.toFixed(2) : "0.00";
                };
                
                // Try multiple field names for back/lay values
                const rawBackVal = bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds ?? 0;
                const rawLayVal = bet?.lay ?? bet?.l1 ?? bet?.l ?? 0;
                
                const backVal = formatOdds(rawBackVal);
                const layVal = formatOdds(rawLayVal);
                
                // Always show odds value (even if 0.00)
                const backText = backVal;
                const layText = layVal;
                
                // Create unique key by always including index to ensure uniqueness
                const uniqueKey = `${bet?.id || bet?.mid || bet?.type || 'bet'}-${index}`;
                return (
                  <div key={uniqueKey} className={`p-0.5 sm:p-1.5 rounded border transition-all ${bet.status === "suspended" ? "opacity-75 border-muted" : "cursor-pointer"} ${selectedBet === bet.type ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`} onClick={() => bet.status !== "suspended" && setSelectedBet(bet.type)}>
                    <div className="flex items-center justify-center mb-0.5 sm:mb-1">
                      <span className={`font-medium text-[9px] sm:text-xs truncate text-center ${bet.status === "suspended" ? "text-muted-foreground" : ""}`}>{bet.type}</span>
                      {bet.status === "suspended" && <Badge variant="destructive" className="text-[9px] px-0.5 py-0 h-3 hidden sm:inline-flex ml-1">Suspended</Badge>}
                    </div>
                    {/* Always show odds even if suspended - odds are still visible */}
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <Button size="sm" variant={selectedBet === bet.type && betType === "back" ? "default" : "outline"} className={`w-full sm:flex-1 h-4 sm:h-6 text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0 ${bet.status === "suspended" ? "opacity-60" : ""}`} onClick={(e) => { e.stopPropagation(); if (bet.status !== "suspended") { setSelectedBet(bet.type); setBetType("back"); } }} disabled={bet.status === "suspended" || backText === "0.00"}>
                        <span className="hidden sm:inline"><TrendingUp className="w-2.5 h-2.5 mr-0.5" /></span>
                        <span className="font-semibold">{backText}</span>
                      </Button>

                      <Button size="sm" variant={selectedBet === bet.type && betType === "lay" ? "default" : "outline"} className={`w-full sm:flex-1 h-4 sm:h-6 text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0 ${bet.status === "suspended" ? "opacity-60" : ""}`} onClick={(e) => { e.stopPropagation(); if (bet.status !== "suspended") { setSelectedBet(bet.type); setBetType("lay"); } }} disabled={bet.status === "suspended" || layText === "0.00"}>
                        <span className="hidden sm:inline"><TrendingDown className="w-2.5 h-2.5 mr-0.5" /></span>
                        <span className="font-semibold">{layText}</span>
                      </Button>
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
