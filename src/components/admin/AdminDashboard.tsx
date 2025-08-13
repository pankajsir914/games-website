import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewDashboard } from './OverviewDashboard';
import { GameManagementPanel } from './GameManagementPanel';
import { BetLogsPage } from './BetLogsPage';
import { PlayerWalletInsights } from './PlayerWalletInsights';
import { ResultManagement } from './ResultManagement';
import { AdminLayout } from './AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Shield } from 'lucide-react';

export const AdminDashboard = () => {
  const { data: auth, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!auth?.hasAccess) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the admin dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {auth.user.email}! Role: {auth.role}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Admin Panel</span>
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="games">Game Management</TabsTrigger>
            <TabsTrigger value="bets">Bet Logs</TabsTrigger>
            <TabsTrigger value="wallets">Player Wallets</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewDashboard />
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <GameManagementPanel />
          </TabsContent>

          <TabsContent value="bets" className="space-y-6">
            <BetLogsPage />
          </TabsContent>

          <TabsContent value="wallets" className="space-y-6">
            <PlayerWalletInsights />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ResultManagement />
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
};