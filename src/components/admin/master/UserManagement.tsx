import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Filter, 
  Ban, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  Shield,
  Wallet,
  Clock,
  MapPin
} from 'lucide-react';

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const users = [
    {
      id: 1,
      name: 'Rahul Sharma',
      email: 'rahul.s@gmail.com',
      phone: '+91 98765*****',
      balance: '₹15,420',
      status: 'active',
      kyc: 'verified',
      lastSeen: '2 mins ago',
      location: 'Mumbai, IN',
      totalDeposits: '₹45,000',
      totalWithdrawals: '₹32,000',
      gamesPlayed: 247,
      joinDate: '2024-01-15'
    },
    {
      id: 2,
      name: 'Priya Patel',
      email: 'priya.p@gmail.com',
      phone: '+91 87654*****',
      balance: '₹8,750',
      status: 'active',
      kyc: 'pending',
      lastSeen: '5 mins ago',
      location: 'Delhi, IN',
      totalDeposits: '₹25,000',
      totalWithdrawals: '₹18,500',
      gamesPlayed: 156,
      joinDate: '2024-02-03'
    },
    {
      id: 3,
      name: 'Amit Kumar',
      email: 'amit.k@gmail.com',
      phone: '+91 76543*****',
      balance: '₹2,340',
      status: 'blocked',
      kyc: 'rejected',
      lastSeen: '2 hours ago',
      location: 'Bangalore, IN',
      totalDeposits: '₹12,000',
      totalWithdrawals: '₹15,000',
      gamesPlayed: 89,
      joinDate: '2024-01-28'
    },
    {
      id: 4,
      name: 'Sneha Reddy',
      email: 'sneha.r@gmail.com',
      phone: '+91 65432*****',
      balance: '₹22,890',
      status: 'active',
      kyc: 'verified',
      lastSeen: '1 hour ago',
      location: 'Hyderabad, IN',
      totalDeposits: '₹75,000',
      totalWithdrawals: '₹55,000',
      gamesPlayed: 445,
      joinDate: '2023-12-10'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>;
      case 'blocked': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Blocked</Badge>;
      case 'suspended': return <Badge className="bg-orange-500 text-white">Suspended</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getKYCBadge = (kyc: string) => {
    switch (kyc) {
      case 'verified': return <Badge className="bg-gaming-success text-gaming-success-foreground">Verified</Badge>;
      case 'pending': return <Badge className="bg-orange-500 text-white">Pending</Badge>;
      case 'rejected': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Rejected</Badge>;
      default: return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Monitor and manage all platform users</p>
        </div>
        <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
          <Users className="h-4 w-4 mr-2" />
          Export Users
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle>Search & Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 bg-primary">
                    <AvatarFallback className="text-primary-foreground font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{user.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {getStatusBadge(user.status)}
                  {getKYCBadge(user.kyc)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Balance</div>
                  <div className="font-semibold text-gaming-gold">{user.balance}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Deposits</div>
                  <div className="font-semibold text-gaming-success">{user.totalDeposits}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Withdrawals</div>
                  <div className="font-semibold text-gaming-danger">{user.totalWithdrawals}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Games</div>
                  <div className="font-semibold text-primary">{user.gamesPlayed}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Last Seen</div>
                  <div className="font-semibold text-muted-foreground text-xs">{user.lastSeen}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Joined</div>
                  <div className="font-semibold text-muted-foreground text-xs">{user.joinDate}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline">
                    <Wallet className="h-3 w-3 mr-1" />
                    Wallet
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  {user.status === 'active' ? (
                    <Button size="sm" variant="outline" className="text-gaming-danger">
                      <Ban className="h-3 w-3 mr-1" />
                      Block
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-gaming-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unblock
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gaming-gold" />
            Bulk Actions & Quick Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Ban className="h-4 w-4 mr-2" />
              Bulk Block Users
            </Button>
            <Button variant="outline" className="justify-start">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Pending KYC
            </Button>
            <Button variant="outline" className="justify-start">
              <XCircle className="h-4 w-4 mr-2" />
              Reject KYC Documents
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};