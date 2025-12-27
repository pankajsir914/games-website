// src/components/admin/master/UserManagement.tsx

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMasterAdminUsers } from '@/hooks/useMasterAdminUsers';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  MoreVertical,
  Eye,
  Ban,
  RefreshCw,
  Mail,
  Phone,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { UserCompleteDetailsModal } from '../UserCompleteDetailsModal';

export const UserManagement = () => {
  const {
    users,
    isLoading,
    error,
    refetch,
    updateUserStatus,
    isUpdating,
  } = useMasterAdminUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const filteredUsers = users?.filter((user) => {
    const search = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (isBlocked: boolean) =>
    isBlocked ? (
      <Badge variant="destructive">Blocked</Badge>
    ) : (
      <Badge className="bg-gaming-success text-gaming-success-foreground">
        Active
      </Badge>
    );

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setDetailsModalOpen(true);
  };

  const handleToggleBlock = async (
    userId: string,
    currentlyBlocked: boolean
  ) => {
    try {
      const action = currentlyBlocked ? 'activate' : 'block';
      await updateUserStatus({
        userId,
        action,
        reason: `User ${action}d by master admin`,
      });
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error('Error toggling user block status:', error);
    }
  };

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u) => !u.is_blocked).length || 0,
    blocked: users?.filter((u) => u.is_blocked).length || 0,
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-gaming-danger mx-auto" />
          <h3 className="text-lg font-semibold">Error Loading Users</h3>
          <p className="text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${
              isLoading ? 'animate-spin' : ''
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Active Users"
          value={stats.active}
          valueClass="text-gaming-success"
          icon={<UserCheck className="h-4 w-4 text-gaming-success" />}
        />
        <StatCard
          title="Blocked Users"
          value={stats.blocked}
          valueClass="text-gaming-danger"
          icon={<UserX className="h-4 w-4 text-gaming-danger" />}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search users by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Complete list of platform users</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.full_name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.full_name || 'No Name'}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Admin (Created By) */}
                    <TableCell>
                      {user.created_by_name ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {user.created_by_name[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {user.created_by_name}
                            </div>
                            {user.created_by_email && (
                              <div className="text-xs text-muted-foreground">
                                {user.created_by_email}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          System
                        </span>
                      )}
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Balance */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Wallet className="h-4 w-4 text-gaming-gold" />
                        ₹{user.wallet_balance?.toLocaleString() || '0'}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusBadge(user.is_blocked)}
                    </TableCell>

                    {/* Joined */}
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewUser(user.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isUpdating}
                            onClick={() =>
                              handleToggleBlock(user.id, user.is_blocked)
                            }
                            className={
                              user.is_blocked
                                ? 'text-gaming-success'
                                : 'text-gaming-danger'
                            }
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {user.is_blocked
                              ? 'Unblock User'
                              : 'Block User'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <UserCompleteDetailsModal
        open={detailsModalOpen}
        userId={selectedUserId}
        onOpenChange={setDetailsModalOpen}
      />
    </div>
  );
};

/* ---------- Helper ---------- */
const StatCard = ({
  title,
  value,
  icon,
  valueClass = '',
}: any) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
    </CardContent>
  </Card>
);
