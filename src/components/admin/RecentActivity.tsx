
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminTransactions } from '@/hooks/useAdminTransactions';
import { Skeleton } from '@/components/ui/skeleton';

export const RecentActivity = () => {
  const { data: transactions, isLoading } = useAdminTransactions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Badge variant="outline" className="text-gaming-success border-gaming-success">Deposit</Badge>;
      case 'withdrawal':
        return <Badge variant="outline" className="text-gaming-danger border-gaming-danger">Withdrawal</Badge>;
      case 'game_win':
        return <Badge className="bg-gaming-gold">Game Win</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions?.slice(0, 10).map((transaction) => (
            <div key={transaction.id} className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">{transaction.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {transaction.user}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transaction.method} • {transaction.timestamp}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getTypeBadge(transaction.type)}
                <span className="text-sm font-medium">₹{transaction.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
