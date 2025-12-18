import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OverviewDashboard } from './OverviewDashboard';
import { AdminLayout } from './AdminLayout';
import { AdminWalletCard } from './AdminWalletCard';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { Shield, Users, Coins, TrendingUp, TrendingDown, CreditCard, Banknote, DollarSign, Activity, BarChart3 } from 'lucide-react';

export const AdminDashboard = () => {
  const { data: auth, isLoading } = useAdminAuth();
  const { stats, isLoading: isLoadingStats } = useAdminDashboardStats();

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
        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AdminWalletCard />
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
                ) : (
                  stats?.totalUsers?.toLocaleString() || '0'
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Distributed</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-20 bg-muted rounded"></div>
                ) : (
                  `₹${stats?.totalPointsDistributed?.toLocaleString() || '0'}`
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
                ) : (
                  stats?.activeSessions?.toLocaleString() || '0'
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Live users in last 30 minutes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-12 bg-muted rounded"></div>
                ) : (
                  stats?.pendingDeposits || '0'
                )}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Needs Review
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-12 bg-muted rounded"></div>
                ) : (
                  stats?.pendingWithdrawals || '0'
                )}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Needs Action
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
                ) : (
                  stats?.todayBets?.toLocaleString() || '0'
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Live bet activity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-20 bg-muted rounded"></div>
                ) : (
                  `₹${stats?.todayRevenue?.toLocaleString() || '0'}`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                House edge earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Net P&L Card */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Net Profit & Loss</CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
                  <p className="text-xl font-bold text-gaming-success">
                    {isLoadingStats ? (
                      <div className="animate-pulse h-6 w-24 bg-muted rounded"></div>
                    ) : (
                      `₹${stats?.totalDeposits?.toLocaleString() || '0'}`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Withdrawals</p>
                  <p className="text-xl font-bold text-gaming-danger">
                    {isLoadingStats ? (
                      <div className="animate-pulse h-6 w-24 bg-muted rounded"></div>
                    ) : (
                      `₹${stats?.totalWithdrawals?.toLocaleString() || '0'}`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Net P&L</p>
                  <div className="flex items-center gap-2">
                    {stats?.netPL !== undefined && stats.netPL >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-gaming-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-gaming-danger" />
                    )}
                    <p className={`text-2xl font-bold ${stats?.netPL !== undefined && stats.netPL >= 0 ? 'text-gaming-success' : 'text-gaming-danger'}`}>
                      {isLoadingStats ? (
                        <div className="animate-pulse h-7 w-32 bg-muted rounded"></div>
                      ) : (
                        `${stats?.netPL !== undefined && stats.netPL >= 0 ? '+' : ''}₹${Math.abs(stats?.netPL || 0).toLocaleString()}`
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deposits - Withdrawals + Revenue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overview Dashboard */}
        <div className="space-y-6">
          <OverviewDashboard />
        </div>
      </div>
    </AdminLayout>
  );
};
