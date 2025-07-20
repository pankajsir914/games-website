
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, GameController2, TrendingUp } from 'lucide-react';

const stats = [
  {
    title: 'Total Users',
    value: '12,345',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    title: 'Total Revenue',
    value: '₹8,45,320',
    change: '+8%',
    changeType: 'positive' as const,
    icon: CreditCard,
  },
  {
    title: 'Active Games',
    value: '8',
    change: '+2',
    changeType: 'positive' as const,
    icon: GameController2,
  },
  {
    title: 'Growth Rate',
    value: '24.5%',
    change: '+3.2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
  },
];

export const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stat.changeType === 'positive' ? 'text-gaming-success' : 'text-gaming-danger'}>
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
