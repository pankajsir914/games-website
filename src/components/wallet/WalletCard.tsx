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
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Available Points</p>
          <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
            <Coins className="h-5 w-5" />
            {Math.floor(wallet.current_balance).toLocaleString()}
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Last updated: {new Date(wallet.updated_at).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};