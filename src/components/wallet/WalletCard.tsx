import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Lock, Coins, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface WalletCardProps {
  variant?: 'default' | 'compact';
}

export const WalletCard = ({ variant = 'default' }: WalletCardProps) => {
  const { wallet, walletLoading } = useWallet();

  if (walletLoading) {
    if (variant === 'compact') {
      return (
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      );
    }
    
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Points Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    if (variant === 'compact') {
      return (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Wallet not found</span>
        </div>
      );
    }
    
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

  if (variant === 'compact') {
    return (
      <div className="flex items-center animate-fade-in">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-primary/10 rounded-full p-2 sm:p-2.5">
            <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Balance</p>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              ₹{Math.floor(wallet.current_balance).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className="bg-primary/20 rounded-full p-2">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            My Points Wallet
          </span>
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
          <div className="flex items-baseline justify-between">
            <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ₹{Math.floor(wallet.current_balance).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">+12% today</span>
            </div>
          </div>
        </div>


        <div className="text-xs text-muted-foreground flex items-center justify-between pt-2 border-t">
          <p>Last updated: {new Date(wallet.updated_at).toLocaleTimeString()}</p>
          <Badge variant="outline" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            Secured
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};