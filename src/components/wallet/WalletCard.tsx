import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Lock, Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const WalletCard = () => {
  const { wallet, walletLoading } = useWallet();

  if (walletLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Points Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Points Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Wallet not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          My Points Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available Points</p>
            <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
              <Coins className="h-5 w-5" />
              {Math.floor(wallet.current_balance).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Locked Points</p>
            <p className="text-lg font-semibold text-orange-600 flex items-center gap-1">
              <Lock className="h-4 w-4" />
              {Math.floor(wallet.locked_balance).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Total Points: {Math.floor(wallet.current_balance + wallet.locked_balance).toLocaleString()}</p>
          <p>Last updated: {new Date(wallet.updated_at).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};