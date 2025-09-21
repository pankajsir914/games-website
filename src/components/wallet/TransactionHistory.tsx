
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { History, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TransactionHistoryProps {
  limit?: number;
  compact?: boolean;
}

export const TransactionHistory = ({ limit, compact = false }: TransactionHistoryProps = {}) => {
  const { transactions, transactionsLoading } = useWallet();
  
  const displayTransactions = transactions && limit ? transactions.slice(0, limit) : transactions;

  if (transactionsLoading) {
    if (compact) {
      return (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!displayTransactions || displayTransactions.length === 0) {
    if (compact) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent transactions
        </p>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No transactions yet
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div className="flex items-center gap-2">
              {transaction.type === 'credit' ? (
                <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-1">
                  <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-1">
                  <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{transaction.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <p className={cn(
              "text-sm font-semibold",
              transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
            )}>
              {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(0)}
            </p>
          </div>
        ))}
        {limit && transactions && transactions.length > limit && (
          <button className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
            View all transactions
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-full p-2">
            <History className="h-5 w-5 text-primary" />
          </div>
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {displayTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {transaction.type === 'credit' ? (
                    <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-1.5 group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-1.5 group-hover:scale-110 transition-transform">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                  <span className="font-medium">{transaction.reason}</span>
                  {transaction.game_type && (
                    <Badge variant="secondary" className="text-xs">
                      {transaction.game_type}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Balance after: ₹{transaction.balance_after.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold text-lg",
                  transaction.type === 'credit' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
