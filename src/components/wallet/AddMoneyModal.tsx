import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Coins, Copy, CreditCard, Smartphone, QrCode, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AdminPaymentMethod {
  id: string;
  method_type: 'bank' | 'upi' | 'qr';
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  upi_id?: string;
  qr_code_url?: string;
  qr_code_type?: string;
  nickname?: string;
  is_primary: boolean;
}

export const AddMoneyModal = ({ open, onOpenChange }: AddMoneyModalProps) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<AdminPaymentMethod | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const quickAmounts = [100, 500, 1000, 5000, 10000];

  useEffect(() => {
    if (open && user?.id) {
      fetchAdminPaymentMethods();
    }
  }, [open, user?.id]);

  const fetchAdminPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_payment_methods_for_user');
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && 'admin_id' in data) {
        const typedData = data as unknown as { admin_id: string | null; payment_methods: AdminPaymentMethod[] };
        setAdminId(typedData.admin_id);
        setPaymentMethods(typedData.payment_methods || []);
        
        // Auto-select primary method
        const primaryMethod = typedData.payment_methods?.find((m: AdminPaymentMethod) => m.is_primary);
        if (primaryMethod) {
          setSelectedMethod(primaryMethod);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch payment methods",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Details copied to clipboard",
    });
  };

  const handleSubmitPaymentRequest = async () => {
    const pointsAmount = parseInt(amount);
    if (!pointsAmount || pointsAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum points to add is 100",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!transactionRef) {
      toast({
        title: "Transaction Reference Required",
        description: "Please enter transaction reference/ID",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload proof if provided
      let screenshotUrl = null;
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, proofFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);
        
        screenshotUrl = publicUrl;
      }

      // Create payment request
      const { error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user?.id,
          admin_id: adminId,
          payment_method_id: selectedMethod.id,
          amount: pointsAmount,
          transaction_ref: transactionRef,
          screenshot_url: screenshotUrl,
          status: 'pending',
          payment_method: selectedMethod.method_type
        });

      if (error) throw error;

      toast({
        title: "Payment Request Submitted",
        description: "Your request has been submitted. Points will be added after verification.",
      });
      
      onOpenChange(false);
      resetForm();
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

  const resetForm = () => {
    setAmount('');
    setTransactionRef('');
    setProofFile(null);
  };

  const renderPaymentMethod = (method: AdminPaymentMethod) => {
    switch (method.method_type) {
      case 'bank':
        return (
          <Card className={`cursor-pointer transition-all ${selectedMethod?.id === method.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedMethod(method)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Bank Transfer
                {method.is_primary && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Primary</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bank:</span>
                <span className="text-sm font-medium">{method.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Account:</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{method.account_number}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(method.account_number || '');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">IFSC:</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{method.ifsc_code}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(method.ifsc_code || '');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{method.account_holder_name}</span>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'upi':
        return (
          <Card className={`cursor-pointer transition-all ${selectedMethod?.id === method.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedMethod(method)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                UPI Payment
                {method.is_primary && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Primary</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">UPI ID:</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{method.upi_id}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(method.upi_id || '');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'qr':
        return (
          <Card className={`cursor-pointer transition-all ${selectedMethod?.id === method.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedMethod(method)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code Payment
                {method.is_primary && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Primary</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {method.qr_code_url && (
                <img 
                  src={method.qr_code_url} 
                  alt="Payment QR Code" 
                  className="w-full max-w-[200px] mx-auto rounded-lg"
                />
              )}
              {method.nickname && (
                <p className="text-sm text-center mt-2 text-muted-foreground">{method.nickname}</p>
              )}
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Add Points to Wallet
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : paymentMethods.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No payment methods available. Please contact your admin.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue="payment" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payment">Payment Details</TabsTrigger>
                <TabsTrigger value="submit">Submit Request</TabsTrigger>
              </TabsList>
              
              <TabsContent value="payment" className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Amount</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        variant={amount === quickAmount.toString() ? "default" : "outline"}
                        onClick={() => setAmount(quickAmount.toString())}
                        size="sm"
                      >
                        ₹{quickAmount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    placeholder="Or enter custom amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Methods</Label>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => renderPaymentMethod(method))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="submit" className="space-y-4">
                {selectedMethod && (
                  <Alert className="bg-primary/5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      Selected: {selectedMethod.method_type === 'bank' ? 'Bank Transfer' : 
                               selectedMethod.method_type === 'upi' ? 'UPI' : 'QR Code'}
                      {selectedMethod.nickname && ` - ${selectedMethod.nickname}`}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="transaction-ref">Transaction Reference/ID *</Label>
                  <Input
                    id="transaction-ref"
                    placeholder="Enter transaction reference number"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof">Payment Proof (Optional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      id="proof"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="proof" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {proofFile ? proofFile.name : 'Click to upload screenshot'}
                      </p>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitPaymentRequest}
                  disabled={!amount || parseInt(amount) < 100 || !selectedMethod || !transactionRef || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : `Submit Payment Request for ₹${amount || 0}`}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};