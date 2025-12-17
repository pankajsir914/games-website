import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  MapPin,
  UserPlus,
  Download,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Coins
} from 'lucide-react';
import { useMasterAdminUsers } from '@/hooks/useMasterAdminUsers';
import { PointsCreditModal } from '@/components/admin/PointsCreditModal';
import { UserProfileModal } from '@/components/admin/UserProfileModal';
import { toast } from '@/hooks/use-toast';

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creditModalUser, setCreditModalUser] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [profileModalUser, setProfileModalUser] = useState<any>(null);
  const [actionType, setActionType] = useState<'block' | 'unblock' | 'suspend' | null>(null);
  const [reason, setReason] = useState('');
  
  const { users: usersResponse, isLoading, refetch, updateUserStatus, isUpdating } = useMasterAdminUsers();
  
  const users = usersResponse?.users || [];
  const stats = usersResponse || { total_count: 0, blocked_users: 0, high_risk_users: 0 };

  const getStatusBadge = (user: any) => {
    const isBlocked = user.is_blocked;
    if (isBlocked) {
      return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Blocked</Badge>;
    }
    return <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>;
  };


  const handleUserAction = async (user: any, action: 'block' | 'unblock' | 'suspend') => {
    setSelectedUser(user);
    setActionType(action);
    setActionModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedUser || !actionType) return;
    
    try {
      await updateUserStatus({ 
        userId: selectedUser.id, 
        action: actionType, 
        reason 
      });
      toast({
        title: "Action completed",
        description: `User has been ${actionType}ed successfully.`,
      });
      setActionModalOpen(false);
      setReason('');
      refetch();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = (user: any) => {
    setProfileModalUser(user);
  };

  const handleViewWallet = (user: any) => {
    toast({
      title: "Wallet View",
      description: `Opening wallet for ${user.full_name || 'User'} - Balance: ₹${user.current_balance}`,
    });
  };

  const handleEditUser = (user: any) => {
    toast({
      title: "Edit User",
      description: `Opening edit form for ${user.full_name || 'User'}`,
    });
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['ID', 'Name', 'Email', 'Phone', 'Balance', 'Status', 'Created At'].join(','),
      ...users.map(user => [
        user.id,
        user.full_name || 'N/A',
        user.email,
        user.phone || 'N/A',
        user.current_balance,
        user.is_blocked ? 'Blocked' : 'Active',
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    
    toast({
      title: "Export Complete",
      description: "Users data has been exported to CSV",
    });
  };

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !user.is_blocked) ||
      (statusFilter === 'blocked' && user.is_blocked);
    
    return matchesSearch && matchesStatus;
  });

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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{stats.total_count}</p>
              </div>
              <Users className="h-8 w-8 text-gaming-gold" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Users</p>
                <p className="text-2xl font-bold text-gaming-danger">{stats.blocked_users}</p>
              </div>
              <Ban className="h-8 w-8 text-gaming-danger" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-gaming-danger">{stats.high_risk_users}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gaming-danger" />
            </div>
          </CardContent>
        </Card>
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
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExportUsers} className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 bg-primary">
                      <AvatarFallback className="text-primary-foreground font-semibold">
                        {(() => {
                          const name = user.full_name || 'Anonymous User';
                          return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{user.full_name || 'Anonymous User'}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.phone || 'No phone'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {getStatusBadge(user)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Balance</div>
                    <div className="font-semibold text-gaming-gold">₹{user.current_balance?.toLocaleString() || '0'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Deposits</div>
                    <div className="font-semibold text-gaming-success">₹{user.total_deposits?.toLocaleString() || '0'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Withdrawals</div>
                    <div className="font-semibold text-gaming-danger">₹{user.total_withdrawals?.toLocaleString() || '0'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Games</div>
                    <div className="font-semibold text-primary">{user.games_played || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Last Seen</div>
                    <div className="font-semibold text-muted-foreground text-xs">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Joined</div>
                    <div className="font-semibold text-muted-foreground text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewProfile(user)}>
                      <Eye className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
<<<<<<< HEAD
=======
                    <Button size="sm" variant="outline" onClick={() => handleViewWallet(user)}>
                      <Wallet className="h-3 w-3 mr-1" />
                      Wallet
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCreditModalUser(user.id)}>
                      <Coins className="h-3 w-3 mr-1" />
                      Credit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
                  </div>
                  
                  <div className="flex gap-2">
                    {!user.is_blocked ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gaming-danger hover:bg-gaming-danger hover:text-gaming-danger-foreground"
                        onClick={() => handleUserAction(user, 'block')}
                        disabled={isUpdating}
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Block
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gaming-success hover:bg-gaming-success hover:text-gaming-success-foreground"
                        onClick={() => handleUserAction(user, 'unblock')}
                        disabled={isUpdating}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Unblock
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-orange-500 hover:bg-orange-500 hover:text-white"
                      onClick={() => handleUserAction(user, 'suspend')}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Suspend
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredUsers.length === 0 && (
            <Card className="bg-gradient-card">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Points Credit Modal */}
      <PointsCreditModal
        open={!!creditModalUser}
        targetUserId={creditModalUser || ''}
        onOpenChange={(open) => { if (!open) setCreditModalUser(null); }}
        onComplete={() => {
          setCreditModalUser(null);
          refetch();
        }}
      />

      {/* Action Confirmation Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {actionType ? actionType.charAt(0).toUpperCase() + actionType.slice(1) : 'Action'} User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to {actionType} user <strong>{selectedUser?.full_name || 'this user'}</strong>?
            </p>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for this action..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={isUpdating}>
              {isUpdating ? 'Processing...' : `${actionType ? actionType.charAt(0).toUpperCase() + actionType.slice(1) : 'Confirm'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <UserProfileModal
        user={profileModalUser}
        isOpen={!!profileModalUser}
        onClose={() => setProfileModalUser(null)}
      />
    </div>
  );
};