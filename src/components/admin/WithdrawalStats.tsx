
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAdminWithdrawals } from '@/hooks/useAdminWithdrawals';
import { Skeleton } from '@/components/ui/skeleton';

export const WithdrawalStats = () => {
  const { data: withdrawals, isLoading } = useAdminWithdrawals();

  const stats = useMemo(() => {
    if (!withdrawals) return null;

    const pending = withdrawals.filter(w => w.status === 'pending');
    const approved = withdrawals.filter(w => w.status === 'approved');
    const rejected = withdrawals.filter(w => w.status === 'rejected');

    const pendingAmount = pending.reduce((sum, w) => sum + w.amount, 0);
    const approvedAmount = approved.reduce((sum, w) => sum + w.amount, 0);
    const rejectedAmount = rejected.reduce((sum, w) => sum + w.amount, 0);

    return [
      {
        title: 'Pending Approvals',
        value: pending.length.toString(),
        amount: `₹${pendingAmount.toLocaleString()}`,
        icon: Clock,
        color: 'text-yellow-500'
      },
      {
        title: 'Approved Today',
        value: approved.length.toString(),
        amount: `₹${approvedAmount.toLocaleString()}`,
        icon: CheckCircle,
        color: 'text-gaming-success'
      },
      {
        title: 'Rejected',
        value: rejected.length.toString(),
        amount: `₹${rejectedAmount.toLocaleString()}`,
        icon: XCircle,
        color: 'text-gaming-danger'
      }
    ];
  }, [withdrawals]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[
          { title: 'Pending Approvals', value: '0', amount: '₹0', icon: Clock, color: 'text-yellow-500' },
          { title: 'Approved Today', value: '0', amount: '₹0', icon: CheckCircle, color: 'text-gaming-success' },
          { title: 'Rejected', value: '0', amount: '₹0', icon: XCircle, color: 'text-gaming-danger' }
        ].map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-sm ${stat.color}`}>
                {stat.amount}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-sm ${stat.color}`}>
              {stat.amount}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
