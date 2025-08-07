import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  CreditCard,
  Banknote,
  Receipt,
  Settings
} from 'lucide-react';

export const WalletFinanceControl = () => {
  const [withdrawals] = useState([
    {
      id: 1,
      user: 'Rahul Sharma',
      amount: '₹5,000',
      method: 'Bank Transfer',
      account: '****1234',
      status: 'pending',
      date: '2024-01-15 14:30',
      documents: true
    },
    {
      id: 2,
      user: 'Priya Patel',
      amount: '₹12,500',
      method: 'UPI',
      account: 'priya@paytm',
      status: 'pending',
      date: '2024-01-15 13:15',
      documents: true
    },
    {
      id: 3,
      user: 'Amit Kumar',
      amount: '₹8,200',
      method: 'Bank Transfer',
      account: '****5678',
      status: 'approved',
      date: '2024-01-15 11:45',
      documents: true
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-orange-500 text-white">Pending</Badge>;
      case 'approved': return <Badge className="bg-gaming-success text-gaming-success-foreground">Approved</Badge>;
      case 'rejected': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Rejected</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Wallet & Finance Control</h2>
          <p className="text-muted-foreground">Manage wallets, payments, and financial operations</p>
        </div>
        <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
          <Receipt className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Balance</CardTitle>
            <Wallet className="h-4 w-4 text-gaming-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-gold">₹2.4M</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <TrendingUp className="h-4 w-4 text-gaming-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">₹1.8M</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +18% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-danger/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-gaming-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-danger">₹1.2M</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-gaming-success" />
              +8% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">₹156K</div>
            <div className="flex items-center text-xs text-muted-foreground">
              23 requests pending
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Requests */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-gaming-gold" />
            Withdrawal Requests
          </CardTitle>
          <CardDescription>Review and process user withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-semibold">{withdrawal.user}</h4>
                    <p className="text-sm text-muted-foreground">{withdrawal.method} • {withdrawal.account}</p>
                    <p className="text-xs text-muted-foreground">{withdrawal.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-lg">{withdrawal.amount}</div>
                    {withdrawal.documents && (
                      <div className="text-xs text-gaming-success">Documents attached</div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(withdrawal.status)}
                  </div>
                  
                  {withdrawal.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-gaming-danger">
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Wallet Adjustment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Manual Wallet Adjustment
            </CardTitle>
            <CardDescription>Add or deduct balance from user wallets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-search">User Email/Phone</Label>
              <Input id="user-search" placeholder="Enter user email or phone" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" placeholder="Enter amount" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (Add Balance)</SelectItem>
                  <SelectItem value="debit">Debit (Deduct Balance)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" placeholder="Enter reason for adjustment" className="bg-background" />
            </div>
            
            <Button className="w-full bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
              Process Adjustment
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-500" />
              Payment Gateway Settings
            </CardTitle>
            <CardDescription>Configure payment methods and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="min-deposit">Minimum Deposit (₹)</Label>
              <Input id="min-deposit" type="number" defaultValue="100" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-deposit">Maximum Deposit (₹)</Label>
              <Input id="max-deposit" type="number" defaultValue="100000" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min-withdrawal">Minimum Withdrawal (₹)</Label>
              <Input id="min-withdrawal" type="number" defaultValue="500" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-withdrawal">Maximum Withdrawal (₹)</Label>
              <Input id="max-withdrawal" type="number" defaultValue="50000" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="withdrawal-fee">Withdrawal Fee (%)</Label>
              <Input id="withdrawal-fee" type="number" defaultValue="2" className="bg-background" />
            </div>
            
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Update Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Summary */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gaming-success" />
            Today's Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gaming-success">₹124.5K</div>
              <div className="text-sm text-muted-foreground">Total Deposits Today</div>
              <div className="text-xs text-gaming-success">+15% vs yesterday</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gaming-danger">₹89.2K</div>
              <div className="text-sm text-muted-foreground">Total Withdrawals Today</div>
              <div className="text-xs text-gaming-success">-5% vs yesterday</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gaming-gold">₹35.3K</div>
              <div className="text-sm text-muted-foreground">Net Platform Gain</div>
              <div className="text-xs text-gaming-success">+28% profit margin</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};