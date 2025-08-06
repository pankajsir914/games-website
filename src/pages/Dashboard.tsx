import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardContent } from '@/components/DashboardContent';

const Dashboard = () => {
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <DashboardContent />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;