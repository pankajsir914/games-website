
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RecentActivity } from '@/components/admin/RecentActivity';


const Admin = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your platform.</p>
        </div>

        <DashboardStats />

        <RecentActivity />
      </div>
    </AdminLayout>
  );
};

export default Admin;
