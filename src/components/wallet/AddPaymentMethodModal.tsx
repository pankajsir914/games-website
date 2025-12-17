import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AddPaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddPaymentMethodModal = ({ open, onOpenChange }: AddPaymentMethodModalProps) => {
  const [methodType, setMethodType] = useState<'bank_account' | 'upi'>('upi');
  const [isPrimary, setIsPrimary] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    upi_id: '',
  });

  const { addPaymentMethod } = usePaymentMethods();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (methodType === 'upi' && !formData.upi_id) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your UPI ID',
        variant: 'destructive',
      });
      return;
    }

    if (methodType === 'bank_account') {
      if (!formData.bank_name || !formData.account_number || !formData.ifsc_code || !formData.account_holder_name) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all bank account details',
          variant: 'destructive',
        });
        return;
      }
    }

    const methodData = {
      method_type: methodType,
      is_primary: isPrimary,
      nickname: formData.nickname || undefined,
      ...(methodType === 'upi' 
        ? { upi_id: formData.upi_id }
        : {
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            ifsc_code: formData.ifsc_code,
            account_holder_name: formData.account_holder_name,
          }
      ),
    };

    try {
      await addPaymentMethod.mutateAsync(methodData);
      onOpenChange(false);
      // Reset form
      setFormData({
        nickname: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        account_holder_name: '',
        upi_id: '',
      });
      setMethodType('upi');
      setIsPrimary(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a bank account or UPI ID for withdrawals
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup value={methodType} onValueChange={(value: any) => setMethodType(value)}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/5">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                <Smartphone className="h-4 w-4" />
                UPI ID
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/5">
              <RadioGroupItem value="bank_account" id="bank_account" />
              <Label htmlFor="bank_account" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-4 w-4" />
                Bank Account
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname (Optional)</Label>
            <Input
              id="nickname"
              placeholder="e.g., My Primary Account"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
          </div>

          {methodType === 'upi' ? (
            <div className="space-y-2">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                placeholder="yourname@upi"
                value={formData.upi_id}
                onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                required
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  placeholder="e.g., State Bank of India"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_holder_name">Account Holder Name</Label>
                <Input
                  id="account_holder_name"
                  placeholder="Full name as per bank records"
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  placeholder="Enter account number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  placeholder="e.g., SBIN0001234"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="primary" className="text-sm">
              Set as primary payment method
            </Label>
            <Switch
              id="primary"
              checked={isPrimary}
              onCheckedChange={setIsPrimary}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addPaymentMethod.isPending}
              className="flex-1"
            >
              {addPaymentMethod.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Payment Method'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};