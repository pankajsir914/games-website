import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { AddPaymentMethodModal } from './AddPaymentMethodModal';
import { 
  CreditCard, 
  Smartphone, 
  Plus, 
  MoreVertical, 
  Check,
  Trash2,
  Edit,
  Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const PaymentMethodsCard = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  
  const { 
    paymentMethods, 
    isLoading, 
    updatePaymentMethod, 
    deletePaymentMethod 
  } = usePaymentMethods();

  const handleSetPrimary = async (id: string) => {
    await updatePaymentMethod.mutateAsync({ id, is_primary: true });
  };

  const handleDelete = async () => {
    if (selectedMethodId) {
      await deletePaymentMethod.mutateAsync(selectedMethodId);
      setDeleteDialogOpen(false);
      setSelectedMethodId(null);
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  };

  const maskUpiId = (upiId: string) => {
    const parts = upiId.split('@');
    if (parts.length !== 2) return upiId;
    const username = parts[0];
    const masked = username.slice(0, 2) + '***';
    return `${masked}@${parts[1]}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            Payment Methods
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setAddModalOpen(true)}
            className="min-h-[36px] px-3"
          >
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Add Method</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 px-3 sm:px-6">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">No payment methods added yet</p>
              <Button 
                onClick={() => setAddModalOpen(true)}
                className="min-h-[44px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/5 transition-colors min-h-[80px]"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {method.method_type === 'upi' ? (
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                      <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {method.nickname || 
                          (method.method_type === 'upi' ? 'UPI' : method.bank_name)}
                      </p>
                      {method.is_primary && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          Primary
                        </Badge>
                      )}
                      {method.is_verified && (
                        <Shield className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {method.method_type === 'upi' 
                        ? maskUpiId(method.upi_id!) 
                        : `${method.account_holder_name} • ${maskAccountNumber(method.account_number!)}`}
                    </p>
                    {method.method_type === 'bank_account' && (
                      <p className="text-xs text-muted-foreground">
                        IFSC: {method.ifsc_code}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="min-h-[44px] min-w-[44px] flex-shrink-0"
                      aria-label="Payment method options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background z-50">
                    {!method.is_primary && (
                      <DropdownMenuItem 
                        onClick={() => handleSetPrimary(method.id)}
                        className="min-h-[44px] cursor-pointer"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Set as Primary
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedMethodId(method.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive min-h-[44px] cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}

          {paymentMethods.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Your payment methods are securely stored and will be used for withdrawals.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddPaymentMethodModal 
        open={addModalOpen} 
        onOpenChange={setAddModalOpen} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};