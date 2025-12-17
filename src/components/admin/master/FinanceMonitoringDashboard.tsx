import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMasterAdminFinanceMonitoring } from '@/hooks/useMasterAdminFinanceMonitoring';
<<<<<<< HEAD
import { Wallet, TrendingUp, TrendingDown, Users, UserCog, Download, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
=======
import { Wallet, TrendingUp, TrendingDown, DollarSign, Clock, Eye, Download, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515

export const FinanceMonitoringDashboard = () => {
  const { financeData, isLoading, refetch } = useMasterAdminFinanceMonitoring();
  const [searchQuery, setSearchQuery] = useState('');
<<<<<<< HEAD
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
=======
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
      completed: 'default',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
      </Badge>
    );
  };

<<<<<<< HEAD
  const exportToCSV = () => {
    if (!financeData || !financeData.admin_accounts.length) return;

    const csvData = financeData.admin_accounts.map(a => ({
      'Admin Name': a.full_name,
      'Role': a.role,
      'Admin Credits': a.admin_credits,
=======
  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const exportToCSV = () => {
    if (!financeData) return;

    const csvData = financeData.recent_transactions.map(t => ({
      'Transaction ID': t.id,
      'User': t.full_name,
      'Amount': t.amount,
      'Type': t.type,
      'Date': new Date(t.created_at).toLocaleString(),
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
<<<<<<< HEAD
    a.download = `admin-credits-${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredAdminAccounts = financeData?.admin_accounts.filter(a => {
    const matchesSearch = a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || a.role === filterRole;
    return matchesSearch && matchesRole;
=======
    a.download = `transactions-${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredWithdrawals = financeData?.withdrawal_requests.filter(w => {
    const matchesSearch = w.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const filteredPayments = financeData?.payment_requests.filter(p => {
    const matchesSearch = p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
  }) || [];

  const filteredTransactions = financeData?.recent_transactions.filter(t => {
    const matchesSearch = t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
<<<<<<< HEAD
                          t.admin_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.tx_type === filterType;
    const matchesRole = filterRole === 'all' || t.role === filterRole;
    return matchesSearch && matchesType && matchesRole;
=======
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
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
<<<<<<< HEAD
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
=======
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{financeData?.total_platform_balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All user wallets combined</p>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<<<<<<< HEAD
            <CardTitle className="text-sm font-medium">Allocated Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{financeData?.total_points_allocated_today?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Credits given to admins</p>
=======
            <CardTitle className="text-sm font-medium">Today's Deposits</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{financeData?.total_deposits_today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All deposits today</p>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<<<<<<< HEAD
            <CardTitle className="text-sm font-medium">Distributed Today</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{financeData?.total_points_distributed_today?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Credits given to users</p>
=======
            <CardTitle className="text-sm font-medium">Today's Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{financeData?.total_withdrawals_today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All withdrawals today</p>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<<<<<<< HEAD
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
=======
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(financeData?.pending_deposits || 0) + (financeData?.pending_withdrawals || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financeData?.pending_deposits} deposits, {financeData?.pending_withdrawals} withdrawals
            </p>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
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
<<<<<<< HEAD
            placeholder="Search by admin name or ID..."
=======
            placeholder="Search by user name or ID..."
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
<<<<<<< HEAD
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="master_admin">Master Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
=======
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
<<<<<<< HEAD
              <SelectItem value="allocation">Allocation</SelectItem>
              <SelectItem value="distribution">Distribution</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
=======
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

<<<<<<< HEAD
      {/* Admin Credits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Credit Accounts</CardTitle>
          <CardDescription>Credits that admins can distribute to users (admins cannot play games)</CardDescription>
=======
      {/* Withdrawal Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>View-only monitoring of withdrawal requests (Admin handles approvals)</CardDescription>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
<<<<<<< HEAD
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
=======
                <TableHead>User Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No withdrawal requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWithdrawals.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{request.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>₹{request.amount.toLocaleString()}</TableCell>
                    <TableCell>{request.upi_id ? 'UPI' : 'Bank Transfer'}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

<<<<<<< HEAD
      {/* Recent Credit Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Credit Transactions</CardTitle>
          <CardDescription>Admin credit allocations and distributions to users</CardDescription>
=======
      {/* Payment Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Requests</CardTitle>
          <CardDescription>View-only monitoring of deposit requests (Admin handles approvals)</CardDescription>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
<<<<<<< HEAD
                <TableHead>Admin</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>To User</TableHead>
                <TableHead>Notes</TableHead>
=======
                <TableHead>User Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No payment requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{request.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>₹{request.amount.toLocaleString()}</TableCell>
                    <TableCell>{request.payment_method}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 50 wallet transactions across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
<<<<<<< HEAD
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No credit transactions found
=======
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No transactions found
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
<<<<<<< HEAD
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
=======
                    <TableCell className="font-medium">{transaction.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{transaction.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
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
<<<<<<< HEAD
          <CardTitle>Today's Credit Summary</CardTitle>
=======
          <CardTitle>Today's Financial Summary</CardTitle>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
<<<<<<< HEAD
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
=======
              <p className="text-sm text-muted-foreground">Total Deposits</p>
              <p className="text-2xl font-bold text-green-600">₹{financeData?.total_deposits_today.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Withdrawals</p>
              <p className="text-2xl font-bold text-red-600">₹{financeData?.total_withdrawals_today.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Net Platform Gain</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{((financeData?.total_deposits_today || 0) - (financeData?.total_withdrawals_today || 0)).toLocaleString()}
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
<<<<<<< HEAD
=======

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>View-only details (Admin panel required for actions)</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User Name</p>
                  <p className="font-medium">{selectedRequest.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-medium text-xs font-mono">{selectedRequest.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">₹{selectedRequest.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                {selectedRequest.bank_account_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Account</p>
                    <p className="font-medium">{selectedRequest.bank_account_number}</p>
                  </div>
                )}
                {selectedRequest.upi_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">UPI ID</p>
                    <p className="font-medium">{selectedRequest.upi_id}</p>
                  </div>
                )}
                {selectedRequest.payment_method && (
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{selectedRequest.payment_method}</p>
                  </div>
                )}
                {selectedRequest.screenshot_url && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Payment Screenshot</p>
                    <img 
                      src={selectedRequest.screenshot_url} 
                      alt="Payment proof" 
                      className="max-w-full rounded-lg border"
                    />
                  </div>
                )}
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ⚠️ To approve/reject this request, please use the Admin panel.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
    </div>
  );
};
