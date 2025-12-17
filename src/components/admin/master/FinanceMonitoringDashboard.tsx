import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMasterAdminFinanceMonitoring } from '@/hooks/useMasterAdminFinanceMonitoring';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  PiggyBank,
  Coins,
  BarChart3
} from 'lucide-react';

export const FinanceMonitoringDashboard = () => {
  const { financeData, isLoading, error, refetch } = useMasterAdminFinanceMonitoring();
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  if (error) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-gaming-danger mx-auto" />
            <h3 className="text-lg font-semibold">Error Loading Finance Data</h3>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Finance Monitoring</h2>
          <p className="text-muted-foreground">Real-time financial analytics and tracking</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gaming-gold" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gaming-gold">
                  {formatCurrency(financeData?.totalRevenue || 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gaming-success mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+12.5% from last month</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Deposits */}
        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gaming-success" />
              Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gaming-success">
                  {formatCurrency(financeData?.totalDeposits || 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {financeData?.depositCount || 0} transactions
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Withdrawals */}
        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-gaming-danger" />
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gaming-danger">
                  {formatCurrency(financeData?.totalWithdrawals || 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {financeData?.withdrawalCount || 0} transactions
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Net Balance */}
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Platform Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(financeData?.platformBalance || 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Available for operations
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Payments */}
        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-yellow-500" />
              Pending Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{financeData?.pendingDeposits || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(financeData?.pendingDepositsAmount || 0)} total
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-orange-500" />
              Pending Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{financeData?.pendingWithdrawals || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(financeData?.pendingWithdrawalsAmount || 0)} total
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* House Profit */}
        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4 text-gaming-gold" />
              House Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gaming-gold">
                  {formatCurrency(financeData?.houseProfit || 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  From game commissions
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Financial Analytics
          </CardTitle>
          <CardDescription>
            Detailed breakdown of platform finances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-background/50 rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Today's Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Deposits Today</span>
                      <span className="font-medium text-gaming-success">
                        {formatCurrency(financeData?.todayDeposits || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Withdrawals Today</span>
                      <span className="font-medium text-gaming-danger">
                        {formatCurrency(financeData?.todayWithdrawals || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Net Flow</span>
                      <span className={`font-bold ${(financeData?.todayDeposits || 0) - (financeData?.todayWithdrawals || 0) >= 0 ? 'text-gaming-success' : 'text-gaming-danger'}`}>
                        {formatCurrency((financeData?.todayDeposits || 0) - (financeData?.todayWithdrawals || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">User Wallet Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Total User Wallets</span>
                      <span className="font-medium">{financeData?.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Combined Balance</span>
                      <span className="font-medium text-primary">
                        {formatCurrency(financeData?.totalUserBalance || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Balance</span>
                      <span className="font-medium">
                        {formatCurrency(financeData?.avgUserBalance || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deposits" className="space-y-4 mt-4">
              <div className="p-4 bg-background/50 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Deposit Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gaming-success">
                      {financeData?.depositCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Deposits</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(financeData?.totalDeposits || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(financeData?.avgDepositAmount || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Average Deposit</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {financeData?.pendingDeposits || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-4 mt-4">
              <div className="p-4 bg-background/50 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Withdrawal Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gaming-danger">
                      {financeData?.withdrawalCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Withdrawals</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(financeData?.totalWithdrawals || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(financeData?.avgWithdrawalAmount || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Average Withdrawal</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {financeData?.pendingWithdrawals || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
