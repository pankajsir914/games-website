import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamManagement, TeamMember } from '@/hooks/useTeamManagement';
import { 
  Users,
  Shield,
  UserCog,
  Crown,
  Search,
  Eye,
  Edit,
  MoreVertical,
  RefreshCw,
  UserPlus,
  Mail,
  Phone,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditProfileModal } from './EditProfileModal';
import { AdminProfileModal } from './AdminProfileModal';
import { CreateAdminModal } from './CreateAdminModal';

export const TeamManagement = () => {
  const { teamMembers, isLoading, error, refetch } = useTeamManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filteredMembers = teamMembers?.filter(member => {
    const search = searchQuery.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search) ||
      member.role.toLowerCase().includes(search)
    );
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master_admin': return <Crown className="h-4 w-4 text-gaming-gold" />;
      case 'admin': return <Shield className="h-4 w-4 text-gaming-danger" />;
      case 'moderator': return <UserCog className="h-4 w-4 text-primary" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master_admin': return <Badge className="bg-gaming-gold text-gaming-gold-foreground">Master Admin</Badge>;
      case 'admin': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Admin</Badge>;
      case 'moderator': return <Badge className="bg-primary text-primary-foreground">Moderator</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>;
      case 'inactive': return <Badge className="bg-orange-500 text-white">Inactive</Badge>;
      case 'suspended': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Suspended</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleViewMember = (member: TeamMember) => {
    setSelectedMember(member);
    setViewModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setEditModalOpen(true);
  };

  // Team stats
  const stats = {
    total: teamMembers?.length || 0,
    masterAdmins: teamMembers?.filter(m => m.role === 'master_admin').length || 0,
    admins: teamMembers?.filter(m => m.role === 'admin').length || 0,
    moderators: teamMembers?.filter(m => m.role === 'moderator').length || 0,
    active: teamMembers?.filter(m => m.status === 'active').length || 0,
  };

  if (error) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-gaming-danger mx-auto" />
            <h3 className="text-lg font-semibold">Error Loading Team Data</h3>
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
          <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
          <p className="text-muted-foreground">Manage admins and moderators</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Create Admin
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4 text-gaming-gold" />
              Master Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-gold">{stats.masterAdmins}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-gaming-danger" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-danger">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              Moderators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.moderators}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gaming-success" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            All administrators and moderators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredMembers && filteredMembers.length > 0 ? (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 bg-primary">
                      <AvatarFallback className="text-primary-foreground font-semibold">
                        {member.full_name?.split(' ').map(n => n[0]).join('') || member.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <span className="font-semibold">{member.full_name || 'No Name'}</span>
                        {getRoleBadge(member.role)}
                        {getStatusBadge(member.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          Balance: ₹{member.wallet_balance?.toLocaleString() || '0'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Joined: {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMember(member)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewMember(member)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditMember(member)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No team members match your search' : 'No team members found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AdminProfileModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        member={selectedMember}
        onUpdate={refetch}
      />

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        member={selectedMember}
        onUpdate={refetch}
      />

      <CreateAdminModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
};
