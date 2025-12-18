import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import type { DateRange } from 'react-day-picker';
import { 
  FileText, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Calendar as CalendarIcon,
  Search,
  DollarSign,
  Users,
  Gamepad2,
  BarChart3
} from 'lucide-react';
import { useTransactionsReports } from '@/hooks/useTransactionsReports';
import { format } from 'date-fns';

export const TransactionsReports = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [search, setSearch] = useState('');
  const [transactionType, setTransactionType] = useState('all');
  const [status, setStatus] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState<{
    dateRange?: DateRange;
    search?: string;
    transactionType?: string;
    status?: string;
  }>({});

  const { data, isLoading, error } = useTransactionsReports({
    dateRange: appliedFilters.dateRange,
    transactionType: appliedFilters.transactionType,
    status: appliedFilters.status,
    search: appliedFilters.search
  });

  const transactions = data?.transactions || [];
  const stats = data?.stats;

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit': return <Badge className="bg-gaming-success text-gaming-success-foreground">Deposit</Badge>;
      case 'withdrawal': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Withdrawal</Badge>;
      case 'game_win': return <Badge className="bg-gaming-gold text-gaming-gold-foreground">Win</Badge>;
      case 'game_bet': return <Badge className="bg-primary text-primary-foreground">Bet</Badge>;
      default: return <Badge variant="outline">Other</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-gaming-success text-gaming-success-foreground">Completed</Badge>;
      case 'pending': return <Badge className="bg-orange-500 text-white">Pending</Badge>;
      case 'failed': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Failed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = `₹${amount.toLocaleString()}`;
    return type === 'withdrawal' || type === 'game_bet' ? `-${formatted}` : `+${formatted}`;
  };

  const getAmountColor = (type: string) => {
    return type === 'withdrawal' || type === 'game_bet' ? 'text-gaming-danger' : 'text-gaming-success';
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      dateRange,
      search,
      transactionType,
      status
    });
  };

  const handleResetFilters = () => {
    setDateRange(undefined);
    setSearch('');
    setTransactionType('all');
    setStatus('all');
    setAppliedFilters({});
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return 'Select date range';
    if (!dateRange.to) return format(dateRange.from, 'PPP');
    return `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}`;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error loading reports: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transactions & Reports</h2>
          <p className="text-muted-foreground">Comprehensive transaction logs and financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="bg-gradient-card border-gaming-success/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <FileText className="h-4 w-4 text-gaming-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gaming-success">
                  {stats?.totalTransactions.toLocaleString() || '0'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
                  Filtered results
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-gaming-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-gaming-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gaming-gold">
                  ₹{stats?.transactionVolume ? (stats.transactionVolume >= 1000000 
                    ? `${(stats.transactionVolume / 1000000).toFixed(1)}M`
                    : stats.transactionVolume >= 1000
                    ? `${(stats.transactionVolume / 1000).toFixed(1)}K`
                    : stats.transactionVolume.toLocaleString()) : '0'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
                  Total volume
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  ₹{stats?.averageTransaction ? Math.round(stats.averageTransaction).toLocaleString() : '0'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <BarChart3 className="h-3 w-3 mr-1 text-primary" />
                  Per transaction
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-500">
                  {stats?.successRate ? stats.successRate.toFixed(1) : '0'}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
                  Completed rate
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filter Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="User, ID, or reference..." 
                  className="pl-10 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="game_win">Game Wins</SelectItem>
                  <SelectItem value="game_bet">Game Bets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-background justify-start text-left font-normal w-full">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gaming-gold" />
            Transaction History
          </CardTitle>
          <CardDescription>Detailed transaction logs with full audit trail</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        {transaction.type === 'deposit' && <TrendingUp className="h-5 w-5 text-gaming-success" />}
                        {transaction.type === 'withdrawal' && <TrendingDown className="h-5 w-5 text-gaming-danger" />}
                        {transaction.type === 'game_win' && <Gamepad2 className="h-5 w-5 text-gaming-gold" />}
                        {transaction.type === 'game_bet' && <Gamepad2 className="h-5 w-5 text-primary" />}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{transaction.user_name}</h4>
                          {getTransactionTypeBadge(transaction.type)}
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {transaction.id.slice(0, 8)}... • {transaction.method}</p>
                        {transaction.game && (
                          <p className="text-xs text-muted-foreground">Game: {transaction.game}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`font-semibold text-lg ${getAmountColor(transaction.type)}`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ref: {transaction.reference}
                        </div>
                      </div>
                      
                      {getStatusBadge(transaction.status)}
                      
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Quick Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Daily Transaction Summary
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="h-4 w-4 mr-2" />
              Weekly Revenue Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              User Activity Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Gamepad2 className="h-4 w-4 mr-2" />
              Game Performance Report
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gaming-success" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Deposits:</span>
                  <span className="font-semibold text-gaming-success">
                    ₹{stats?.totalDeposits ? (stats.totalDeposits >= 1000000 
                      ? `${(stats.totalDeposits / 1000000).toFixed(1)}M`
                      : stats.totalDeposits >= 1000
                      ? `${(stats.totalDeposits / 1000).toFixed(1)}K`
                      : stats.totalDeposits.toLocaleString()) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Withdrawals:</span>
                  <span className="font-semibold text-gaming-danger">
                    ₹{stats?.totalWithdrawals ? (stats.totalWithdrawals >= 1000000 
                      ? `${(stats.totalWithdrawals / 1000000).toFixed(1)}M`
                      : stats.totalWithdrawals >= 1000
                      ? `${(stats.totalWithdrawals / 1000).toFixed(1)}K`
                      : stats.totalWithdrawals.toLocaleString()) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Game Revenue:</span>
                  <span className="font-semibold text-gaming-gold">
                    ₹{stats?.gameRevenue ? (Math.abs(stats.gameRevenue) >= 1000000 
                      ? `${(Math.abs(stats.gameRevenue) / 1000000).toFixed(1)}M`
                      : Math.abs(stats.gameRevenue) >= 1000
                      ? `${(Math.abs(stats.gameRevenue) / 1000).toFixed(1)}K`
                      : Math.abs(stats.gameRevenue).toLocaleString()) : '0'}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Net Platform Gain:</span>
                  <span className={`font-semibold ${stats?.netPlatformGain && stats.netPlatformGain >= 0 ? 'text-gaming-success' : 'text-gaming-danger'}`}>
                    ₹{stats?.netPlatformGain ? (Math.abs(stats.netPlatformGain) >= 1000000 
                      ? `${(Math.abs(stats.netPlatformGain) / 1000000).toFixed(1)}M`
                      : Math.abs(stats.netPlatformGain) >= 1000
                      ? `${(Math.abs(stats.netPlatformGain) / 1000).toFixed(1)}K`
                      : Math.abs(stats.netPlatformGain).toLocaleString()) : '0'}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
