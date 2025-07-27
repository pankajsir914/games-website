
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, CreditCard, Clock } from 'lucide-react';
import { useAdminTransactions } from '@/hooks/useAdminTransactions';
import { Skeleton } from '@/components/ui/skeleton';

export const TransactionStats = () => {
  const { data: transactions, isLoading } = useAdminTransactions();

  // Calculate real stats from transactions
  const stats = React.useMemo(() => {
    if (!transactions) {
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        processing: 0,
        netRevenue: 0,
        depositsCount: 0,
        withdrawalsCount: 0
      };
    }

    const deposits = transactions.filter(t => t.type === 'deposit');
    const withdrawals = transactions.filter(t => t.type === 'withdrawal' || t.type === 'game_win');
    
    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    const netRevenue = totalDeposits - totalWithdrawals;

    return {
      totalDeposits,
      totalWithdrawals,
      processing: 0, // Would need pending transactions from a different table
      netRevenue,
      depositsCount: deposits.length,
      withdrawalsCount: withdrawals.length
    };
  }, [transactions]);

  const transactionStats = [
    {
      title: 'Total Deposits',
      value: `₹${stats.totalDeposits.toLocaleString()}`,
      change: `${stats.depositsCount} transactions`,
      icon: ArrowUpCircle,
      color: 'text-green-500'
    },
    {
      title: 'Total Withdrawals', 
      value: `₹${stats.totalWithdrawals.toLocaleString()}`,
      change: `${stats.withdrawalsCount} transactions`,
      icon: ArrowDownCircle,
      color: 'text-red-500'
    },
    {
      title: 'Processing',
      value: `₹${stats.processing.toLocaleString()}`,
      change: '0 pending',
      icon: Clock,
      color: 'text-yellow-500'
    },
    {
      title: 'Net Revenue',
      value: `₹${stats.netRevenue.toLocaleString()}`,
      change: stats.netRevenue > 0 ? '+Revenue' : '-Loss',
      icon: CreditCard,
      color: 'text-blue-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {transactionStats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stat.color}>
                {stat.change}
              </span>
              {' '}from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
