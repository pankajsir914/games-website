
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const TransactionHistory = () => {
  const { transactions, transactionsLoading } = useWallet();

  if (transactionsLoading) {
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

  if (!transactions || transactions.length === 0) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-80 overflow-y-auto space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {transaction.type === 'credit' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
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
                <p
                  className={`font-semibold ${
                    transaction.type === 'credit'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
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
