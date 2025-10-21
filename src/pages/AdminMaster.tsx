import React, { useState } from 'react';
import { MasterAdminLayout } from '@/components/admin/master/MasterAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Settings, 
  Shield, 
  Activity, 
  AlertTriangle, 
  Crown,
  UserCog,
  Database,
  Globe,
  Lock,
  Eye,
  Gamepad2,
  Wallet,
  BarChart3,
  Bell,
  FileText,
  Wrench,
  Trophy
} from 'lucide-react';
import { useMasterAdminAuth } from '@/hooks/useMasterAdminAuth';
import { useMasterAdminAnalytics } from '@/hooks/useMasterAdminAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminRoleManagement } from '@/components/admin/master/AdminRoleManagement';
import { SecurityCenter } from '@/components/admin/master/SecurityCenter';
import { PlatformSettings } from '@/components/admin/master/PlatformSettings';
import { GameManagement } from '@/components/admin/master/GameManagement';
import { UserManagement } from '@/components/admin/master/UserManagement';
import { FinanceMonitoringDashboard } from '@/components/admin/master/FinanceMonitoringDashboard';
import { TransactionsReports } from '@/components/admin/master/TransactionsReports';
import { AnalyticsDashboard } from '@/components/admin/master/AnalyticsDashboard';
import { PromotionsNotifications } from '@/components/admin/master/PromotionsNotifications';
import { TeamManagement } from '@/components/admin/master/TeamManagement';
import { EnhancedLiveSportsIntegration } from '@/components/admin/master/sports/EnhancedLiveSportsIntegration';

import { MobileRestriction } from '@/components/MobileRestriction';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

const AdminMaster = () => {
  const { user, loading, isMasterAdmin } = useMasterAdminAuth();
  const { analytics } = useMasterAdminAnalytics();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();

  // Block access on mobile/tablet devices
  if (isMobile || isTablet) {
    return <MobileRestriction />;
  }

  if (loading) {
    return (
      <MasterAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MasterAdminLayout>
    );
  }

  if (!user || !isMasterAdmin) {
    return (
      <MasterAdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-center">
            This area is restricted to Master Administrators only.
          </p>
        </div>
      </MasterAdminLayout>
    );
  }

  return (
    <MasterAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-primary rounded-lg p-2">
                <Crown className="h-6 w-6 text-gaming-gold-foreground" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Master Admin Panel
              </h1>
            </div>
            <p className="text-muted-foreground">
              Advanced system administration and management tools
            </p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Crown className="h-3 w-3 mr-1" />
            Master Admin
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-gradient-card border-gaming-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gaming-gold" />
            </CardHeader>
            <CardContent>
              {analytics ? (
                <>
                  <div className="text-2xl font-bold text-gaming-gold">{analytics.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+{analytics.newUsersToday} today</p>
                </>
              ) : (
                <Skeleton className="h-8 w-20" />
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-gaming-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Games</CardTitle>
              <Gamepad2 className="h-4 w-4 text-gaming-success" />
            </CardHeader>
            <CardContent>
              {analytics ? (
                <>
                  <div className="text-2xl font-bold text-gaming-success">{analytics.activeGames}</div>
                  <p className="text-xs text-muted-foreground">All running</p>
                </>
              ) : (
                <Skeleton className="h-8 w-12" />
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {analytics ? (
                <>
                  <div className="text-2xl font-bold text-primary">₹{(analytics.totalDeposits / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground">Platform total</p>
                </>
              ) : (
                <Skeleton className="h-8 w-16" />
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
              <Activity className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-500">142</div>
              <p className="text-xs text-muted-foreground">Active now</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Profit</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {analytics ? (
                <>
                  <div className="text-2xl font-bold text-purple-500">₹{(analytics.platformProfit / 1000).toFixed(1)}K</div>
                  <p className="text-xs text-muted-foreground">+18% vs yesterday</p>
                </>
              ) : (
                <Skeleton className="h-8 w-16" />
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Users</CardTitle>
              <Eye className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              {analytics ? (
                <>
                  <div className="text-2xl font-bold text-cyan-500">{analytics.liveUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Online now</p>
                </>
              ) : (
                <Skeleton className="h-8 w-16" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-10 gap-2 h-auto p-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs p-2">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden lg:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2 text-xs p-2">
              <Gamepad2 className="h-3 w-3" />
              <span className="hidden lg:inline">Games</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 text-xs p-2">
              <Users className="h-3 w-3" />
              <span className="hidden lg:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2 text-xs p-2">
              <Wallet className="h-3 w-3" />
              <span className="hidden lg:inline">Finance</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2 text-xs p-2">
              <FileText className="h-3 w-3" />
              <span className="hidden lg:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2 text-xs p-2">
              <Bell className="h-3 w-3" />
              <span className="hidden lg:inline">Promo</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2 text-xs p-2">
              <UserCog className="h-3 w-3" />
              <span className="hidden lg:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 text-xs p-2">
              <Shield className="h-3 w-3" />
              <span className="hidden lg:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 text-xs p-2">
              <Settings className="h-3 w-3" />
              <span className="hidden lg:inline">System</span>
            </TabsTrigger>
            <TabsTrigger value="sports" className="flex items-center gap-2 text-xs p-2">
              <Trophy className="h-3 w-3" />
              <span className="hidden lg:inline">Sports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <GameManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <FinanceMonitoringDashboard />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionsReports />
          </TabsContent>

          <TabsContent value="promotions" className="space-y-6">
            <PromotionsNotifications />
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityCenter />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <PlatformSettings />
          </TabsContent>

          <TabsContent value="sports" className="space-y-6">
            <EnhancedLiveSportsIntegration />
          </TabsContent>
        </Tabs>
      </div>
    </MasterAdminLayout>
  );
};

export default AdminMaster;