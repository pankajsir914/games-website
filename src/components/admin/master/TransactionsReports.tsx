import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export const TransactionsReports = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: new Date() });
  const [transactions] = useState([
    {
      id: 'TXN001',
      user: 'Rahul Sharma',
      type: 'deposit',
      amount: 5000,
      method: 'UPI',
      game: null,
      status: 'completed',
      date: '2024-01-15 14:30:25',
      reference: 'UPI123456789'
    },
    {
      id: 'TXN002',
      user: 'Priya Patel',
      type: 'game_win',
      amount: 2500,
      method: 'wallet',
      game: 'Color Prediction',
      status: 'completed',
      date: '2024-01-15 14:25:10',
      reference: 'WIN789456123'
    },
    {
      id: 'TXN003',
      user: 'Amit Kumar',
      type: 'withdrawal',
      amount: 8200,
      method: 'Bank Transfer',
      game: null,
      status: 'pending',
      date: '2024-01-15 14:20:45',
      reference: 'WD123789456'
    },
    {
      id: 'TXN004',
      user: 'Sneha Reddy',
      type: 'game_bet',
      amount: 1000,
      method: 'wallet',
      game: 'Aviator',
      status: 'completed',
      date: '2024-01-15 14:15:30',
      reference: 'BET456123789'
    }
  ]);

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
        <Card className="bg-gradient-card border-gaming-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-gaming-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">12,847</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +23% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-gaming-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-gold">₹45.2M</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +18% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹3,521</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-gaming-danger" />
              -2% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">98.7%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +0.3% from last month
            </div>
          </CardContent>
        </Card>
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
                <Input placeholder="User, ID, or reference..." className="pl-10 bg-background" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <Select>
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
              <Select>
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
                  <Button variant="outline" className="bg-background justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Last 7 days
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
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Apply Filters
            </Button>
            <Button variant="outline">
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
                      <h4 className="font-semibold">{transaction.user}</h4>
                      {getTransactionTypeBadge(transaction.type)}
                    </div>
                    <p className="text-sm text-muted-foreground">ID: {transaction.id} • {transaction.method}</p>
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
              Showing 4 of 12,847 transactions
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
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
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Deposits:</span>
              <span className="font-semibold text-gaming-success">₹124.5K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Withdrawals:</span>
              <span className="font-semibold text-gaming-danger">₹89.2K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Game Revenue:</span>
              <span className="font-semibold text-gaming-gold">₹67.8K</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Net Platform Gain:</span>
              <span className="font-semibold text-primary">₹35.3K</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};