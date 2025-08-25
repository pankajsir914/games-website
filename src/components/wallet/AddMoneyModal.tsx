import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Coins, Gift, Trophy } from 'lucide-react';

interface AddMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddMoneyModal = ({ open, onOpenChange }: AddMoneyModalProps) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const quickAmounts = [100, 500, 1000, 5000, 10000];

  const handleAddPoints = async () => {
    const pointsAmount = parseInt(amount);
    if (!pointsAmount || pointsAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum points to add is 100",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Not Authenticated",
        description: "Please login to add points",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate bonus points
      const bonusMultiplier = pointsAmount >= 10000 ? 1.15 : 
                             pointsAmount >= 5000 ? 1.10 : 
                             pointsAmount >= 1000 ? 1.05 : 1;
      const totalPoints = Math.floor(pointsAmount * bonusMultiplier);

      // Use the update_wallet_balance function
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: totalPoints,
        p_type: 'credit',
        p_reason: `Points Added${bonusMultiplier > 1 ? ' (with bonus)' : ''}`,
        p_game_type: null,
        p_game_session_id: null
      });

      if (error) throw error;

      toast({
        title: "Points Added Successfully",
        description: `${totalPoints.toLocaleString()} points have been added to your wallet`,
      });
      
      onOpenChange(false);
      setAmount('');
      
      // Trigger a refresh of wallet data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-gaming-primary" />
            Add Points to Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Points Amount</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant={amount === quickAmount.toString() ? "default" : "outline"}
                  onClick={() => setAmount(quickAmount.toString())}
                  className="relative"
                >
                  {quickAmount >= 5000 && (
                    <Trophy className="absolute -top-2 -right-2 h-4 w-4 text-gaming-gold" />
                  )}
                  {quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">Or Enter Custom Amount</Label>
            <div className="relative">
              <Coins className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="custom-amount"
                type="number"
                placeholder="Enter points amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="100"
              />
            </div>
            <p className="text-xs text-muted-foreground">Minimum: 100 points</p>
          </div>


          {amount && parseInt(amount) >= 100 && (
            <Card className="bg-gaming-primary/5">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Points to Add:</span>
                    <span className="font-bold">{parseInt(amount || '0').toLocaleString()}</span>
                  </div>
                  {parseInt(amount) >= 1000 && (
                    <div className="flex justify-between text-gaming-success">
                      <span className="text-sm">Bonus Points:</span>
                      <span className="font-bold">
                        +{Math.floor(
                          parseInt(amount) * 
                          (parseInt(amount) >= 10000 ? 0.15 : parseInt(amount) >= 5000 ? 0.10 : 0.05)
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Total Points:</span>
                    <span className="font-bold text-gaming-primary">
                      {Math.floor(
                        parseInt(amount || '0') * 
                        (parseInt(amount) >= 10000 ? 1.15 : parseInt(amount) >= 5000 ? 1.10 : parseInt(amount) >= 1000 ? 1.05 : 1)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleAddPoints}
            disabled={!amount || parseInt(amount) < 100 || isSubmitting}
            className="w-full bg-gaming-primary hover:bg-gaming-primary/90"
          >
            {isSubmitting ? (
              "Adding Points..."
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Add {amount ? parseInt(amount).toLocaleString() : ''} Points
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};