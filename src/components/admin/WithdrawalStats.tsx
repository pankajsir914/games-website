
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const withdrawalStats = [
  {
    title: 'Pending Approvals',
    value: '12',
    amount: '₹1,23,450',
    icon: Clock,
    color: 'text-yellow-500'
  },
  {
    title: 'Approved Today',
    value: '28',
    amount: '₹4,56,780',
    icon: CheckCircle,
    color: 'text-gaming-success'
  },
  {
    title: 'Rejected',
    value: '3',
    amount: '₹45,200',
    icon: XCircle,
    color: 'text-gaming-danger'
  },
  {
    title: 'Under Review',
    value: '5',
    amount: '₹89,340',
    icon: AlertCircle,
    color: 'text-blue-500'
  }
];

export const WithdrawalStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {withdrawalStats.map((stat) => (
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
