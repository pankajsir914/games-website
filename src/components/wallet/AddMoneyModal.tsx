
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
import { QrCode, Upload, CreditCard } from 'lucide-react';

interface AddMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddMoneyModal = ({ open, onOpenChange }: AddMoneyModalProps) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleProceedToPayment = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₹10",
        variant: "destructive",
      });
      return;
    }
    setShowQR(true);
  };

  const handleSubmitRequest = async () => {
    if (!user || !receiptFile) {
      toast({
        title: "Missing Information",
        description: "Please upload payment receipt",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload receipt to storage (you'll need to set up storage bucket)
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      // For now, we'll just create the payment request without file upload
      // You can implement file upload to Supabase Storage later
      
      const { error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          // receipt_url: will be added when storage is implemented
        });

      if (error) throw error;

      toast({
        title: "Payment Request Submitted",
        description: "Your payment request has been submitted for review. You will be notified once it's processed.",
      });

      // Reset form
      setAmount('');
      setReceiptFile(null);
      setShowQR(false);
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

  const upiId = "gamehub@upi"; // Replace with your actual UPI ID
  const qrCodeUrl = `upi://pay?pa=${upiId}&pn=GameHub&am=${amount}&cu=INR&tn=Add%20Money%20to%20Wallet`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Money to Wallet
          </DialogTitle>
        </DialogHeader>

        {!showQR ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10"
              />
              <p className="text-xs text-muted-foreground">
                Minimum amount: ₹10 • Exchange rate: ₹1 = 1 Point
              </p>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('upi')}
                  className="h-12"
                >
                  UPI
                </Button>
                <Button
                  variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('bank')}
                  className="h-12"
                >
                  Bank Transfer
                </Button>
              </div>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Enter the amount you want to add</li>
                  <li>Make payment using the provided QR code</li>
                  <li>Upload payment receipt/screenshot</li>
                  <li>Wait for admin approval (usually within 24 hours)</li>
                  <li>Points will be added to your wallet</li>
                </ol>
              </CardContent>
            </Card>

            <Button onClick={handleProceedToPayment} className="w-full">
              Proceed to Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Make Payment</h3>
              <p className="text-sm text-muted-foreground">
                Amount: ₹{amount} • Method: {paymentMethod.toUpperCase()}
              </p>
            </div>

            <Separator />

            {paymentMethod === 'upi' ? (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <QrCode className="h-24 w-24 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground">QR Code</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scan with any UPI app
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  UPI ID: {upiId}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <h4 className="font-semibold">Bank Details:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Account Name:</strong> GameHub Pvt Ltd</p>
                  <p><strong>Account Number:</strong> 1234567890</p>
                  <p><strong>IFSC Code:</strong> SBIN0001234</p>
                  <p><strong>Bank:</strong> State Bank of India</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="receipt">Upload Payment Receipt</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              {receiptFile && (
                <p className="text-xs text-green-600">
                  ✓ {receiptFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQR(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={!receiptFile || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
