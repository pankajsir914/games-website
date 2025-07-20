
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, CreditCard, Clock } from 'lucide-react';

const transactionStats = [
  {
    title: 'Total Deposits',
    value: '₹12,45,680',
    change: '+15%',
    icon: ArrowUpCircle,
    color: 'text-gaming-success'
  },
  {
    title: 'Total Withdrawals',
    value: '₹8,76,420',
    change: '+8%',
    icon: ArrowDownCircle,
    color: 'text-gaming-danger'
  },
  {
    title: 'Processing',
    value: '₹1,23,450',
    change: '12 pending',
    icon: Clock,
    color: 'text-yellow-500'
  },
  {
    title: 'Net Revenue',
    value: '₹3,69,260',
    change: '+22%',
    icon: CreditCard,
    color: 'text-gaming-gold'
  }
];

export const TransactionStats = () => {
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
