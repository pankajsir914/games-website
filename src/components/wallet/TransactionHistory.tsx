
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
            className="flex items-center justify-between py-3 px-2 border-b last:border-0 min-h-[56px] hover:bg-muted/30 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {transaction.type === 'credit' ? (
                <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-1.5 flex-shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-1.5 flex-shrink-0">
                  <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium truncate">{transaction.reason}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <p className={cn(
              "text-sm sm:text-base font-semibold whitespace-nowrap ml-2",
              transaction.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(0)}
            </p>
          </div>
        ))}
        {limit && transactions && transactions.length > limit && (
          <Button
            variant="ghost"
            className="w-full text-sm text-primary hover:text-primary/90 flex items-center justify-center gap-2 min-h-[44px] mt-2"
            onClick={() => window.location.hash = '#transactions'}
            aria-label="View all transactions"
          >
            View all transactions
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="px-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="bg-primary/10 rounded-full p-2">
            <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 sm:px-6">
        <div className="space-y-2">
          {displayTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group min-h-[72px]"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {transaction.type === 'credit' ? (
                    <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-1.5 group-hover:scale-110 transition-transform flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-1.5 group-hover:scale-110 transition-transform flex-shrink-0">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                  <span className="font-medium text-sm sm:text-base truncate">{transaction.reason}</span>
                  {transaction.game_type && (
                    <Badge variant="secondary" className="text-xs">
                      {transaction.game_type}
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleString([], { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Balance: ₹{transaction.balance_after.toFixed(0)}
                </p>
              </div>
              <div className="text-right ml-2 flex-shrink-0">
                <p className={cn(
                  "font-bold text-base sm:text-lg whitespace-nowrap",
                  transaction.type === 'credit' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
