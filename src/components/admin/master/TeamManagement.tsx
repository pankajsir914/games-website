import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserCog, 
  Shield, 
  Crown,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  MapPin,
  Mail,
  Phone,
  MoreVertical,
  Wallet,
  Settings
} from 'lucide-react';
import { CreateAdminModal } from './CreateAdminModal';
import { AdminProfileModal } from './AdminProfileModal';
import { EditProfileModal } from './EditProfileModal';
import { useTeamManagement, TeamMember } from '@/hooks/useTeamManagement';
<<<<<<< HEAD
import { useQueryClient } from '@tanstack/react-query';
=======
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515

export const TeamManagement = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { teamMembers, isLoading, updateUserStatus, isUpdating } = useTeamManagement();
<<<<<<< HEAD
  const queryClient = useQueryClient();
=======
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master_admin': return <Crown className="h-4 w-4 text-gaming-gold" />;
      case 'admin': return <Shield className="h-4 w-4 text-gaming-danger" />;
      case 'moderator': return <UserCog className="h-4 w-4 text-primary" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Filter team members based on search term
  const filteredMembers = teamMembers?.filter(member => 
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate role counts
  const roleStats = {
    master_admin: teamMembers?.filter(m => m.role === 'master_admin').length || 0,
    admin: teamMembers?.filter(m => m.role === 'admin').length || 0,
    moderator: teamMembers?.filter(m => m.role === 'moderator').length || 0,
  };

  const formatLastLogin = (lastSignIn: string | null) => {
    if (!lastSignIn) return 'Never';
    return new Date(lastSignIn).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewProfile = (member: TeamMember) => {
    setSelectedMember(member);
    setShowProfile(true);
  };

  const handleProfileUpdate = () => {
    // Refresh team data after profile update
<<<<<<< HEAD
    queryClient.invalidateQueries({ queryKey: ['team-members'] });
=======
    window.location.reload();
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team & Admin Management</h2>
          <p className="text-muted-foreground">Manage admin roles, permissions, and team access</p>
        </div>
        <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Master Admins</CardTitle>
            <Crown className="h-4 w-4 text-gaming-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-gold">{roleStats.master_admin}</div>
            <p className="text-xs text-muted-foreground">Ultimate access</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-danger/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-gaming-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-danger">{roleStats.admin}</div>
            <p className="text-xs text-muted-foreground">Full management access</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderators</CardTitle>
            <UserCog className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{roleStats.moderator}</div>
            <p className="text-xs text-muted-foreground">Content & user moderation</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle>Search Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add New Admin Modal */}
      <CreateAdminModal 
        open={showCreate} 
        onOpenChange={setShowCreate} 
      />

      {/* Admin Profile Modal */}
      <AdminProfileModal
        open={showProfile}
        onOpenChange={setShowProfile}
        member={selectedMember}
        onUpdate={handleProfileUpdate}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
        member={selectedMember}
        onUpdate={handleProfileUpdate}
      />

      {/* Team Members List */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members ({filteredMembers.length})
          </CardTitle>
          <CardDescription>Manage existing team members and their access levels</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 bg-primary">
                      <AvatarFallback className="text-primary-foreground font-semibold">
                        {member.full_name?.split(' ').map(n => n[0]).join('') || member.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{member.full_name || 'No Name'}</h4>
                        {getRoleIcon(member.role)}
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
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last login: {formatLastLogin(member.last_sign_in_at)}
                        </div>
<<<<<<< HEAD
                        <div>Credits: ₹{(member.admin_credits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
=======
                        <div>Balance: ₹{(member.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.status)}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" disabled={isUpdating}>
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                          <Eye className="h-3 w-3 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                          <Wallet className="h-3 w-3 mr-2" />
                          Manage Points
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedMember(member);
                          setShowEditProfile(true);
                        }}>
                          <Settings className="h-3 w-3 mr-2" />
                          Edit Profile
                        </DropdownMenuItem>
                        {member.role !== 'master_admin' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => updateUserStatus({
                                userId: member.id,
                                action: member.status === 'active' ? 'suspend' : 'unblock',
                                reason: `Status change by master admin`
                              })}
                            >
                              <Shield className="h-3 w-3 mr-2" />
                              {member.status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-gaming-danger"
                              onClick={() => updateUserStatus({
                                userId: member.id,
                                action: 'block',
                                reason: 'Account blocked by master admin'
                              })}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Remove Access
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              
              {filteredMembers.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  No team members found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gaming-danger" />
            Permission Matrix
          </CardTitle>
          <CardDescription>Overview of role-based permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Permission</th>
                  <th className="text-center p-2">Master Admin</th>
                  <th className="text-center p-2">Admin</th>
                  <th className="text-center p-2">Moderator</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                <tr className="border-b border-border/50">
                  <td className="p-2">User Management</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">❌</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2">Game Management</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">❌</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2">Financial Control</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">❌</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2">Content Management</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2">Admin Management</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">❌</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};