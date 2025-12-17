import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  X,
  DollarSign,
  Trophy,
  Info,
  AlertCircle,
  ShoppingCart,
  Calculator,
  Clock,
  Trash2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';

interface BetSlip {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  odds: number;
  bookmaker: string;
  stake: number;
  potentialWin: number;
  isExchange?: boolean;
  type: 'back' | 'lay';
}

interface BettingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  betSlips: BetSlip[];
  onUpdateStake: (id: string, stake: number) => void;
  onRemoveBet: (id: string) => void;
  onPlaceBets: () => void;
}

export const BettingInterface: React.FC<BettingInterfaceProps> = ({
  isOpen,
  onClose,
  betSlips,
  onUpdateStake,
  onRemoveBet,
  onPlaceBets
}) => {
  const { user } = useAuth();
  const { wallet, walletLoading } = useWallet();
  const { toast } = useToast();
  const walletBalance = wallet?.current_balance || 0;
  const [isPlacing, setIsPlacing] = useState(false);
  const [defaultStake, setDefaultStake] = useState(10);

  const totalStake = betSlips.reduce((sum, bet) => sum + (bet.stake || 0), 0);
  const totalPotentialWin = betSlips.reduce((sum, bet) => sum + (bet.potentialWin || 0), 0);
  const totalPotentialProfit = totalPotentialWin - totalStake;

  const handlePlaceBets = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to place bets",
        variant: "destructive"
      });
      return;
    }

    if (totalStake > walletBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${totalStake - walletBalance} more to place these bets`,
        variant: "destructive"
      });
      return;
    }

    setIsPlacing(true);
    try {
      // Place each bet
      for (const bet of betSlips) {
        const { error } = await supabase.from('sports_mock_bets').insert({
          user_id: user.id,
          match_id: bet.matchId,
          sport_type: 'multi',
          bet_type: bet.isExchange ? 'exchange' : 'fixed',
          team_name: bet.selection,
          odds_at_bet: bet.odds,
          bet_amount: bet.stake,
          potential_payout: bet.potentialWin,
          status: 'pending'
        });

        if (error) throw error;
      }

      toast({
        title: "Bets Placed Successfully",
        description: `${betSlips.length} bets placed for total stake of ₹${totalStake}`,
      });
      
      onPlaceBets();
    } catch (error) {
      toast({
        title: "Failed to place bets",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsPlacing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-xl z-50 flex flex-col animate-slide-in-right">
      <div className="p-4 border-b bg-gradient-to-r from-gaming-primary/10 to-gaming-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-lg font-bold">Bet Slip</h2>
            {betSlips.length > 0 && (
              <Badge className="bg-gaming-primary text-gaming-primary-foreground">
                {betSlips.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {betSlips.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Your bet slip is empty</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click on odds to add selections
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {betSlips.map((bet) => (
              <Card key={bet.id} className="relative overflow-hidden">
                {bet.isExchange && (
                  <div className="absolute top-0 right-0 px-2 py-1 bg-gaming-primary text-xs text-gaming-primary-foreground rounded-bl">
                    Exchange
                  </div>
                )}
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{bet.homeTeam} vs {bet.awayTeam}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {bet.selection} @ {bet.odds}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs mt-1",
                            bet.type === 'back' ? 'border-gaming-success text-gaming-success' : 'border-gaming-danger text-gaming-danger'
                          )}
                        >
                          {bet.type === 'back' ? 'Back' : 'Lay'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onRemoveBet(bet.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={bet.stake || ''}
                        onChange={(e) => onUpdateStake(bet.id, parseFloat(e.target.value) || 0)}
                        placeholder="Stake"
                        className="h-8"
                        min="1"
                        step="1"
                      />
                      <div className="text-sm text-right flex-1">
                        <p className="text-xs text-muted-foreground">Potential Win</p>
                        <p className="font-bold text-gaming-success">
                          ₹{(bet.stake * bet.odds).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {betSlips.length > 0 && (
        <div className="border-t p-4 space-y-3">
          {/* Quick stake buttons */}
          <div className="flex gap-2">
            {[10, 50, 100, 500].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => {
                  betSlips.forEach(bet => onUpdateStake(bet.id, amount));
                }}
                className="flex-1"
              >
                ₹{amount}
              </Button>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <div className="flex justify-between text-sm">
              <span>Total Stake</span>
              <span className="font-medium">₹{totalStake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Potential Win</span>
              <span className="font-medium text-gaming-success">₹{totalPotentialWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t">
              <span>Potential Profit</span>
              <span className={cn(
                totalPotentialProfit > 0 ? 'text-gaming-success' : 'text-gaming-danger'
              )}>
                ₹{totalPotentialProfit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Wallet balance */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gaming-primary/10">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Wallet Balance</span>
            </div>
            <span className="font-bold">₹{walletBalance.toFixed(2)}</span>
          </div>

          {/* Place bet button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePlaceBets}
            disabled={isPlacing || totalStake === 0 || totalStake > walletBalance}
          >
            {isPlacing ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Placing Bets...
              </>
            ) : (
              <>
                Place {betSlips.length} Bet{betSlips.length > 1 ? 's' : ''}
                <span className="ml-2">₹{totalStake.toFixed(2)}</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};