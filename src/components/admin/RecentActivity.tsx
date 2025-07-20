
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const activities = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Deposited ₹5,000',
    time: '2 minutes ago',
    type: 'deposit',
    avatar: 'JD'
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Won ₹12,500 in Ludo',
    time: '15 minutes ago',
    type: 'win',
    avatar: 'JS'
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'Withdrawal request ₹8,000',
    time: '1 hour ago',
    type: 'withdrawal',
    avatar: 'MJ'
  },
  {
    id: 4,
    user: 'Sarah Wilson',
    action: 'New account created',
    time: '2 hours ago',
    type: 'signup',
    avatar: 'SW'
  }
];

const getActivityBadge = (type: string) => {
  switch (type) {
    case 'deposit':
      return <Badge variant="default" className="bg-gaming-success">Deposit</Badge>;
    case 'win':
      return <Badge variant="default" className="bg-gaming-gold">Win</Badge>;
    case 'withdrawal':
      return <Badge variant="outline">Withdrawal</Badge>;
    case 'signup':
      return <Badge variant="secondary">New User</Badge>;
    default:
      return <Badge variant="outline">Activity</Badge>;
  }
};

export const RecentActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`/placeholder-${activity.id}.jpg`} />
                <AvatarFallback>{activity.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.user}</p>
                <p className="text-sm text-muted-foreground">{activity.action}</p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                {getActivityBadge(activity.type)}
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
