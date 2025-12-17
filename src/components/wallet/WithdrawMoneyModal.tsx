
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Banknote, CreditCard, Smartphone, Star } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { AddPaymentMethodModal } from '@/components/wallet/AddPaymentMethodModal';

interface WithdrawMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WithdrawMoneyModal = ({ open, onOpenChange }: WithdrawMoneyModalProps) => {
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { paymentMethods, isLoading } = usePaymentMethods();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedMethodId && paymentMethods?.length) {
      const primary = paymentMethods.find((m) => m.is_primary);
      setSelectedMethodId((primary || paymentMethods[0]).id);
    }
  }, [paymentMethods, selectedMethodId]);

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

    if (!selectedMethodId) {
      toast({
        title: "Select a method",
        description: "Please choose a payment method to withdraw to.",
        variant: "destructive",
      });
      return;
    }

    const method = paymentMethods.find((m) => m.id === selectedMethodId);
    if (!method) return;

    setIsSubmitting(true);

    try {
      const payload: any = {
        user_id: user.id,
        amount: amountNum,
        payment_method_id: method.id,
        payment_method_type: method.method_type,
      };

      if (method.method_type === 'bank_account') {
        payload.account_holder_name = method.account_holder_name;
        payload.bank_account_number = method.account_number;
        payload.ifsc_code = method.ifsc_code;
      } else if (method.method_type === 'upi') {
        payload.upi_id = method.upi_id;
      }

      const { error } = await supabase.from('withdrawal_requests').insert(payload);
      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted for review. Processing time: 1-3 business days.",
      });

      setAmount('');
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
            <h4 className="font-semibold">Select Payment Method</h4>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading your payment methods...</p>
            ) : paymentMethods.length === 0 ? (
              <div className="p-4 border rounded-lg flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">No payment methods added yet.</p>
                <Button variant="outline" onClick={() => setAddModalOpen(true)}>Add Payment Method</Button>
              </div>
            ) : (
              <RadioGroup value={selectedMethodId || ''} onValueChange={setSelectedMethodId} className="space-y-3">
                {paymentMethods.map((m) => {
                  const last4 = m.account_number ? m.account_number.slice(-4) : undefined;
                  const label = m.method_type === 'bank_account'
                    ? `${m.bank_name || 'Bank'} • ****${last4 || '••••'}${m.ifsc_code ? ' • ' + m.ifsc_code : ''}`
                    : `${m.upi_id}`;

                  return (
                    <label key={m.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/5 ${selectedMethodId === m.id ? 'ring-2 ring-primary' : ''}`}>
                      <RadioGroupItem value={m.id} id={m.id} />
                      {m.method_type === 'bank_account' ? (
                        <CreditCard className="h-4 w-4" />
                      ) : (
                        <Smartphone className="h-4 w-4" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{m.nickname || (m.method_type === 'bank_account' ? 'Bank Account' : 'UPI')}</span>
                          {m.is_primary && <Star className="h-3 w-3 text-yellow-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            )}

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAddModalOpen(true)}>+ Add new method</Button>
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
        <AddPaymentMethodModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      </DialogContent>
    </Dialog>
  );
};
