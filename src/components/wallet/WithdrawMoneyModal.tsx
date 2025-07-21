
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Banknote } from 'lucide-react';

interface WithdrawMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WithdrawMoneyModal = ({ open, onOpenChange }: WithdrawMoneyModalProps) => {
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user || !wallet) return;

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is ₹100",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > wallet.current_balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all bank details",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: amountNum,
          bank_account_number: bankDetails.accountNumber,
          ifsc_code: bankDetails.ifscCode,
          account_holder_name: bankDetails.accountHolderName,
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted for review. Processing time: 1-3 business days.",
      });

      // Reset form
      setAmount('');
      setBankDetails({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
      });
      onOpenChange(false);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Withdraw Money
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="withdrawAmount">Amount (₹)</Label>
            <Input
              id="withdrawAmount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
            />
            <p className="text-xs text-muted-foreground">
              Minimum: ₹100 • Available: ₹{wallet?.current_balance?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Bank Details</h4>
            
            <div className="space-y-2">
              <Label htmlFor="accountHolder">Account Holder Name</Label>
              <Input
                id="accountHolder"
                placeholder="Full name as per bank"
                value={bankDetails.accountHolderName}
                onChange={(e) => setBankDetails(prev => ({
                  ...prev,
                  accountHolderName: e.target.value
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Bank account number"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails(prev => ({
                  ...prev,
                  accountNumber: e.target.value
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                placeholder="Bank IFSC code"
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails(prev => ({
                  ...prev,
                  ifscCode: e.target.value.toUpperCase()
                }))}
              />
            </div>
          </div>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Important Notes:</h4>
              <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                <li>Processing time: 1-3 business days</li>
                <li>Minimum withdrawal: ₹100</li>
                <li>No processing fee</li>
                <li>Ensure bank details are accurate</li>
              </ul>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Withdrawal Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
