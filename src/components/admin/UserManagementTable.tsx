
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, Edit, Trash2, Ban, Coins, Sliders } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Skeleton } from '@/components/ui/skeleton';
import { PointsCreditModal } from '@/components/admin/PointsCreditModal';
import { BetLimitModal } from '@/components/admin/BetLimitModal';
import { useMasterAdminUsers } from '@/hooks/useMasterAdminUsers';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/hooks/use-toast';
interface UserFilters {
  search: string;
  status: string;
  dateRange: string;
}

interface UserManagementTableProps {
  filters: UserFilters;
}

export const UserManagementTable = ({ filters }: UserManagementTableProps) => {
  const { data: adminAuth } = useAdminAuth();
  const { users: usersResponse, isLoading, refetch, updateUserStatus, isUpdating } = useMasterAdminUsers();
  const [creditModalUser, setCreditModalUser] = useState<string | null>(null);
  const [limitsModalUser, setLimitsModalUser] = useState<{ id: string; name?: string } | null>(null);
  const users = usersResponse?.users || [];
  const isMasterAdmin = adminAuth?.role === 'master_admin';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-gaming-success">Active</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUserAction = async (userId: string, action: 'block' | 'unblock' | 'suspend') => {
    try {
      await updateUserStatus({ userId, action, reason: `${action} by admin` });
      refetch();
      toast({
        title: 'Success',
        description: `User ${action}ed successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} user`,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Apply filters
  const filteredUsers = users?.filter(user => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = user.full_name?.toLowerCase().includes(searchLower);
      const matchesEmail = user.email?.toLowerCase().includes(searchLower);
      const matchesPhone = user.phone?.toLowerCase().includes(searchLower);
      const matchesId = user.id.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesEmail && !matchesPhone && !matchesId) {
        return false;
      }
    }
    
    // Status filter - for now we only have active users since we can't modify auth.users
    if (filters.status !== 'all' && filters.status !== 'active') {
      return false;
    }
    
    // Date filter
    if (filters.dateRange !== 'all') {
      const userDate = new Date(user.created_at);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          if (userDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (userDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (userDate < monthAgo) return false;
          break;
      }
    }
    
    return true;
  });

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Total Deposits</TableHead>
              <TableHead>Total Withdrawals</TableHead>
              {isMasterAdmin && <TableHead>Created By</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers && filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.full_name?.slice(0, 2).toUpperCase() || user.id.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.full_name || 'No Name'}</div>
                      <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{user.email}</div>
                    <div className="text-muted-foreground">{user.phone || 'No phone'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">₹{user.current_balance?.toLocaleString() || '0'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gaming-success">₹{user.total_deposits?.toLocaleString() || '0'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gaming-danger">₹{user.total_withdrawals?.toLocaleString() || '0'}</span>
                </TableCell>
                {isMasterAdmin && (
                  <TableCell>
                    {user.creator_name ? (
                      <div className="flex items-center gap-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{user.creator_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.creator_name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">System</span>
                    )}
                  </TableCell>
                )}
                <TableCell>{getStatusBadge('active')}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setCreditModalUser(user.id)}>
                        <Coins className="mr-2 h-4 w-4" />
                        Credit Points
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLimitsModalUser({ id: user.id, name: user.full_name })}>
                        <Sliders className="mr-2 h-4 w-4" />
                        Set Bet Limits
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUserAction(user.id, 'block')}
                        disabled={isUpdating}
                        className="text-destructive"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Block User
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUserAction(user.id, 'unblock')}
                        disabled={isUpdating}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Unblock User
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUserAction(user.id, 'suspend')}
                        disabled={isUpdating}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={isMasterAdmin ? 9 : 8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {filters.search || filters.status !== 'all' || filters.dateRange !== 'all' 
                      ? 'No users found matching your filters.' 
                      : 'No users found.'}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PointsCreditModal
          open={!!creditModalUser}
          targetUserId={creditModalUser || ''}
          onOpenChange={(open) => { if (!open) setCreditModalUser(null); }}
          onComplete={() => setCreditModalUser(null)}
        />
        <BetLimitModal
          open={!!limitsModalUser}
          userId={limitsModalUser?.id || ''}
          userName={limitsModalUser?.name}
          onOpenChange={(open) => { if (!open) setLimitsModalUser(null); }}
        />
      </CardContent>
    </Card>
  );
};
