
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Settings, AlertTriangle } from 'lucide-react';

export const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full justify-start" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add New Game
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Create Admin User
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Site Maintenance
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <AlertTriangle className="mr-2 h-4 w-4" />
          View Reports
        </Button>
      </CardContent>
    </Card>
  );
};
