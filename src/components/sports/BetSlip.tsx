import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Calculator } from 'lucide-react';
import { useMockBetting, type BettingOdds } from '@/hooks/useSportsBetting';
import { SportsMatch } from '@/hooks/useSportsData';

interface BetSlipProps {
  match: SportsMatch;
  selectedBet: {
    odds: BettingOdds;
    type: string;
  } | null;
  onClose: () => void;
}

export function BetSlip({ match, selectedBet, onClose }: BetSlipProps) {
  const [betAmount, setBetAmount] = useState<string>('');
  const { placeMockBet, loading } = useMockBetting();

  const potentialPayout = selectedBet && betAmount ? 
    parseFloat(betAmount) * selectedBet.odds.odds : 0;

  const handlePlaceBet = async () => {
    if (!selectedBet || !betAmount) return;

    const result = await placeMockBet({
      sport_type: match.sport,
      match_id: match.id,
      bet_type: selectedBet.type,
      team_name: selectedBet.odds.team_name,
      odds: selectedBet.odds.odds,
      amount: parseFloat(betAmount)
    });

    if (result.success) {
      setBetAmount('');
      onClose();
    }
  };

  if (!selectedBet) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Bet Slip</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Select a bet to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Bet Slip</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Info */}
        <div className="text-sm space-y-1">
          <div className="font-medium">{match.teams.home} vs {match.teams.away}</div>
          <div className="text-muted-foreground">{match.league}</div>
        </div>

        {/* Bet Selection */}
        <div className="border rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{selectedBet.type}</span>
            <Badge variant="secondary">
              <TrendingUp className="h-3 w-3 mr-1" />
              {selectedBet.odds.odds.toFixed(2)}x
            </Badge>
          </div>
          {selectedBet.odds.team_name && (
            <div className="text-sm text-muted-foreground">
              {selectedBet.odds.team_name}
            </div>
          )}
        </div>

        {/* Bet Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bet Amount (₹)</label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            min="1"
            max="10000"
          />
          <div className="flex gap-2">
            {[10, 50, 100, 500].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(amount.toString())}
                className="flex-1"
              >
                ₹{amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Potential Payout */}
        {potentialPayout > 0 && (
          <div className="bg-primary/10 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calculator className="h-4 w-4" />
              Potential Payout
            </div>
            <div className="text-xl font-bold text-primary">
              ₹{potentialPayout.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              Profit: ₹{(potentialPayout - parseFloat(betAmount || '0')).toFixed(2)}
            </div>
          </div>
        )}

        {/* Place Bet Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!betAmount || loading || parseFloat(betAmount) <= 0}
          className="w-full"
          size="lg"
        >
          {loading ? 'Placing Bet...' : 'Place Mock Bet'}
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          This is a mock betting interface for demonstration purposes only. 
          No real money is involved.
        </p>
      </CardContent>
    </Card>
  );
}