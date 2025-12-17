import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMasterAdminFinanceMonitoring } from '@/hooks/useMasterAdminFinanceMonitoring';
import { Wallet, TrendingUp, TrendingDown, Users, UserCog, Download, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const FinanceMonitoringDashboard = () => {
  const { financeData, isLoading, refetch } = useMasterAdminFinanceMonitoring();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const getRoleBadge = (role: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      master_admin: 'default',
      admin: 'secondary',
      moderator: 'outline',
    };

    const labels: { [key: string]: string } = {
      master_admin: 'Master Admin',
      admin: 'Admin',
      moderator: 'Moderator',
    };

    return (
      <Badge variant={variants[role] || 'secondary'}>
        {labels[role] || role}
      </Badge>
    );
  };

  const exportToCSV = () => {
    if (!financeData || !financeData.admin_accounts.length) return;

    const csvData = financeData.admin_accounts.map(a => ({
      'Admin Name': a.full_name,
      'Role': a.role,
      'Admin Credits': a.admin_credits,
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-credits-${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredAdminAccounts = financeData?.admin_accounts.filter(a => {
    const matchesSearch = a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || a.role === filterRole;
    return matchesSearch && matchesRole;
  }) || [];

  const filteredTransactions = financeData?.recent_transactions.filter(t => {
    const matchesSearch = t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.admin_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.tx_type === filterType;
    const matchesRole = filterRole === 'all' || t.role === filterRole;
    return matchesSearch && matchesType && matchesRole;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Credits Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admin Credits</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{financeData?.total_admin_credits?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Available for distribution to users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{financeData?.total_points_allocated_today?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Credits given to admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distributed Today</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{financeData?.total_points_distributed_today?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Credits given to users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <UserCog className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{financeData?.total_admins || 0}</div>
            <p className="text-xs text-muted-foreground">Active admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Moderators</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{financeData?.total_moderators || 0}</div>
            <p className="text-xs text-muted-foreground">Active moderators</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by admin name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="master_admin">Master Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="allocation">Allocation</SelectItem>
              <SelectItem value="distribution">Distribution</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      {/* Admin Credits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Credit Accounts</CardTitle>
          <CardDescription>Credits that admins can distribute to users (admins cannot play games)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Available Credits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdminAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No admin accounts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdminAccounts.map((admin) => (
                  <TableRow key={admin.id} className={!admin.has_credit_account ? 'bg-yellow-500/5' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {admin.full_name?.charAt(0)?.toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{admin.full_name}</p>
                            {!admin.has_credit_account && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>No credits allocated yet</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{admin.user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell className="font-bold text-primary text-lg">
                      ₹{admin.admin_credits.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Credit Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Credit Transactions</CardTitle>
          <CardDescription>Admin credit allocations and distributions to users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>To User</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No credit transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.full_name}</p>
                        {getRoleBadge(transaction.role || 'unknown')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.tx_type === 'allocation' ? 'default' : 'secondary'}>
                        {transaction.tx_type === 'allocation' ? 'Received' : 'Distributed'}
                      </Badge>
                    </TableCell>
                    <TableCell className={transaction.tx_type === 'allocation' ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                      {transaction.tx_type === 'allocation' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.to_user_name || (transaction.tx_type === 'allocation' ? '-' : 'Unknown User')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {transaction.notes}
                    </TableCell>
                    <TableCell>{formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Credit Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Credits Allocated to Admins</p>
              <p className="text-2xl font-bold text-green-600">₹{financeData?.total_points_allocated_today?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Credits Distributed to Users</p>
              <p className="text-2xl font-bold text-orange-600">₹{financeData?.total_points_distributed_today?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Net Admin Credit Pool</p>
              <p className={`text-2xl font-bold ${(financeData?.total_points_allocated_today || 0) - (financeData?.total_points_distributed_today || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{((financeData?.total_points_allocated_today || 0) - (financeData?.total_points_distributed_today || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
