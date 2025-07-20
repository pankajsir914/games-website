
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Lock, Plus, Minus, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const WalletCard = () => {
  const { wallet, walletLoading, updateBalance, isUpdating } = useWallet();

  if (walletLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Wallet not found</p>
        </CardContent>
      </Card>
    );
  }

  const handleAddFunds = () => {
    updateBalance({
      amount: 100,
      type: 'credit',
      reason: 'Add funds',
    });
  };

  const handleTestDebit = () => {
    updateBalance({
      amount: 10,
      type: 'debit',
      reason: 'Test debit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          My Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{wallet.current_balance.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Locked Balance</p>
            <p className="text-lg font-semibold text-orange-600 flex items-center gap-1">
              <Lock className="h-4 w-4" />
              ₹{wallet.locked_balance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleAddFunds} 
            disabled={isUpdating}
            className="flex-1"
            size="sm"
          >
            {isUpdating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add ₹100
          </Button>
          <Button 
            onClick={handleTestDebit} 
            disabled={isUpdating || wallet.current_balance < 10}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <Minus className="mr-2 h-4 w-4" />
            Test Debit ₹10
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Total: ₹{(wallet.current_balance + wallet.locked_balance).toFixed(2)}</p>
          <p>Last updated: {new Date(wallet.updated_at).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};
