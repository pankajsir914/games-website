import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit2, Trash2, CreditCard, Smartphone, QrCode, Upload, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentMethod {
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
  is_active: boolean;
}

export const AdminPaymentMethods = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    method_type: 'bank' as 'bank' | 'upi' | 'qr',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    upi_id: '',
    qr_code_url: '',
    qr_code_type: '',
    nickname: '',
    is_primary: false,
    is_active: true
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchPaymentMethods();
    }
  }, [user?.id]);

  const fetchPaymentMethods = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_payment_methods')
        .select('*')
        .eq('admin_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMethods((data || []) as PaymentMethod[]);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment methods: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      let qrCodeUrl = formData.qr_code_url;
      
      // Upload QR code if provided
      if (qrFile && formData.method_type === 'qr') {
        const fileExt = qrFile.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('admin-payment-qr')
          .upload(fileName, qrFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('admin-payment-qr')
          .getPublicUrl(fileName);
        
        qrCodeUrl = publicUrl;
      }

      const payload = {
        admin_id: user?.id,
        method_type: formData.method_type,
        bank_name: formData.method_type === 'bank' ? formData.bank_name : null,
        account_number: formData.method_type === 'bank' ? formData.account_number : null,
        ifsc_code: formData.method_type === 'bank' ? formData.ifsc_code : null,
        account_holder_name: formData.method_type === 'bank' ? formData.account_holder_name : null,
        upi_id: formData.method_type === 'upi' ? formData.upi_id : null,
        qr_code_url: formData.method_type === 'qr' ? qrCodeUrl : null,
        qr_code_type: formData.method_type === 'qr' ? formData.qr_code_type : null,
        nickname: formData.nickname || null,
        is_primary: formData.is_primary,
        is_active: formData.is_active
      };

      if (editingMethod) {
        const { error } = await supabase
          .from('admin_payment_methods')
          .update(payload)
          .eq('id', editingMethod.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Payment method updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('admin_payment_methods')
          .insert(payload);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Payment method added successfully",
        });
      }

      // If setting as primary, update other methods
      if (formData.is_primary) {
        await supabase
          .from('admin_payment_methods')
          .update({ is_primary: false })
          .eq('admin_id', user?.id)
          .neq('id', editingMethod?.id || '');
      }

      setIsModalOpen(false);
      resetForm();
      fetchPaymentMethods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
      const { error } = await supabase
        .from('admin_payment_methods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
      
      fetchPaymentMethods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      // First, set all methods as non-primary
      await supabase
        .from('admin_payment_methods')
        .update({ is_primary: false })
        .eq('admin_id', user?.id);
      
      // Then set the selected one as primary
      const { error } = await supabase
        .from('admin_payment_methods')
        .update({ is_primary: true })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Primary payment method updated",
      });
      
      fetchPaymentMethods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_payment_methods')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Payment method ${isActive ? 'activated' : 'deactivated'}`,
      });
      
      fetchPaymentMethods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      method_type: 'bank',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      account_holder_name: '',
      upi_id: '',
      qr_code_url: '',
      qr_code_type: '',
      nickname: '',
      is_primary: false,
      is_active: true
    });
    setQrFile(null);
    setEditingMethod(null);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      method_type: method.method_type,
      bank_name: method.bank_name || '',
      account_number: method.account_number || '',
      ifsc_code: method.ifsc_code || '',
      account_holder_name: method.account_holder_name || '',
      upi_id: method.upi_id || '',
      qr_code_url: method.qr_code_url || '',
      qr_code_type: method.qr_code_type || '',
      nickname: method.nickname || '',
      is_primary: method.is_primary,
      is_active: method.is_active
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage payment methods that your users will use to add money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>

          {methods.length === 0 ? (
            <Alert>
              <AlertDescription>
                No payment methods added yet. Add your first payment method to start receiving payments.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {methods.map((method) => (
                <Card key={method.id} className={`relative ${!method.is_active ? 'opacity-60' : ''}`}>
                  {method.is_primary && (
                    <div className="absolute -top-2 -right-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {method.method_type === 'bank' && <CreditCard className="h-4 w-4" />}
                      {method.method_type === 'upi' && <Smartphone className="h-4 w-4" />}
                      {method.method_type === 'qr' && <QrCode className="h-4 w-4" />}
                      {method.nickname || method.method_type.toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {method.method_type === 'bank' && (
                      <>
                        <p className="text-sm"><strong>Bank:</strong> {method.bank_name}</p>
                        <p className="text-sm"><strong>Account:</strong> {method.account_number}</p>
                        <p className="text-sm"><strong>IFSC:</strong> {method.ifsc_code}</p>
                        <p className="text-sm"><strong>Name:</strong> {method.account_holder_name}</p>
                      </>
                    )}
                    {method.method_type === 'upi' && (
                      <p className="text-sm"><strong>UPI ID:</strong> {method.upi_id}</p>
                    )}
                    {method.method_type === 'qr' && method.qr_code_url && (
                      <img src={method.qr_code_url} alt="QR Code" className="w-32 h-32 mx-auto" />
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Switch
                        checked={method.is_active}
                        onCheckedChange={(checked) => handleToggleActive(method.id, checked)}
                      />
                      <div className="flex gap-1">
                        {!method.is_primary && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSetPrimary(method.id)}
                            title="Set as Primary"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(method)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={formData.method_type} onValueChange={(v) => setFormData({...formData, method_type: v as any})}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bank">Bank</TabsTrigger>
              <TabsTrigger value="upi">UPI</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bank" className="space-y-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                  placeholder="e.g., State Bank of India"
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({...formData, ifsc_code: e.target.value})}
                  placeholder="e.g., SBIN0001234"
                />
              </div>
              <div>
                <Label htmlFor="account_holder_name">Account Holder Name</Label>
                <Input
                  id="account_holder_name"
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                  placeholder="Enter account holder name"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="upi" className="space-y-4">
              <div>
                <Label htmlFor="upi_id">UPI ID</Label>
                <Input
                  id="upi_id"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({...formData, upi_id: e.target.value})}
                  placeholder="e.g., name@upi"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="qr" className="space-y-4">
              <div>
                <Label htmlFor="qr_upload">QR Code Image</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    id="qr_upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="qr_upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {qrFile ? qrFile.name : formData.qr_code_url ? 'Current QR uploaded' : 'Click to upload QR code'}
                    </p>
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="qr_code_type">QR Type (Optional)</Label>
                <Input
                  id="qr_code_type"
                  value={formData.qr_code_type}
                  onChange={(e) => setFormData({...formData, qr_code_type: e.target.value})}
                  placeholder="e.g., PhonePe, Google Pay, Paytm"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nickname">Nickname (Optional)</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                placeholder="e.g., Main Account, Business UPI"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => setFormData({...formData, is_primary: checked})}
              />
              <Label htmlFor="is_primary">Set as primary payment method</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingMethod ? 'Update' : 'Add'} Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};