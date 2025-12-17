import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Wallet, 
  Shield, 
  Clock,
  UserCog,
  Crown,
  Plus,
  Minus
} from 'lucide-react';
import { TeamMember } from '@/hooks/useTeamManagement';

interface AdminProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onUpdate?: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  open,
  onOpenChange,
  member,
  onUpdate
}) => {
  const [pointsAmount, setPointsAmount] = useState('');
  const [isUpdatingPoints, setIsUpdatingPoints] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!member) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master_admin': return <Crown className="h-4 w-4 text-gaming-gold" />;
      case 'admin': return <Shield className="h-4 w-4 text-gaming-danger" />;
      case 'moderator': return <UserCog className="h-4 w-4 text-primary" />;
      default: return <User className="h-4 w-4 text-muted-foreground" />;
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

  const allocatePoints = async () => {
    if (!pointsAmount || parseFloat(pointsAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid points amount.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPoints(true);
    try {
<<<<<<< HEAD
      const amount = parseFloat(pointsAmount);
      
      // Use allocate_admin_credits RPC to add credits that admin can distribute to users
      const { data, error } = await supabase.rpc('allocate_admin_credits', {
        p_admin_id: member.id,
        p_amount: amount,
        p_notes: `Credits allocated by Master Admin`
      });

      if (error) {
        console.error('Allocation error:', error);
        throw error;
      }

      console.log('Allocation result:', data);

      toast({
        title: "Admin Credits Allocated",
        description: `Successfully allocated ₹${pointsAmount} admin credits to ${member.full_name || member.email}. They can now distribute these to users.`,
      });
=======
      // For master admin allocating credits to admins
      if (member.role === 'admin') {
        const { data, error } = await supabase.rpc('allocate_admin_credits', {
          p_admin_id: member.id,
          p_amount: parseFloat(pointsAmount),
          p_notes: `Credits allocated by master admin`
        });

        if (error) throw error;

        toast({
          title: "Credits Allocated",
          description: `Successfully allocated ₹${pointsAmount} admin credits to ${member.full_name || member.email}`,
        });
      } else {
        // For transferring points to users from admin balance
        const { data, error } = await supabase.rpc('transfer_admin_credits_to_user', {
          p_user_id: member.id,
          p_amount: parseFloat(pointsAmount),
          p_notes: `Points transferred by master admin`
        });

        if (error) throw error;

        toast({
          title: "Points Transferred",
          description: `Successfully transferred ₹${pointsAmount} to ${member.full_name || member.email}`,
        });
      }
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
      
      setPointsAmount('');
      onUpdate?.();
    } catch (error: any) {
<<<<<<< HEAD
      console.error('Allocation failed:', error);
      toast({
        title: "Allocation Failed",
        description: error.message || 'Failed to allocate admin credits',
=======
      toast({
        title: "Transfer Failed",
        description: error.message,
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPoints(false);
    }
  };

  const updateUserStatus = async (action: 'suspend' | 'activate' | 'block') => {
    setIsUpdatingStatus(true);
    try {
      const { data, error } = await supabase.rpc('update_user_status', {
        p_user_id: member.id,
        p_action: action,
        p_reason: `Account ${action} by master admin`
      });

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Account has been ${action}d successfully.`,
      });
      
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getRoleIcon(member.role)}
            Admin Profile Management
          </DialogTitle>
          <DialogDescription>
            Manage admin profile, allocate points, and control account status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-primary">
                  <AvatarFallback className="text-primary-foreground font-semibold text-lg">
                    {member.full_name?.split(' ').map(n => n[0]).join('') || member.email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{member.full_name || 'No Name Set'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(member.role)}
                    {getStatusBadge(member.status)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{member.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Joined</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(member.created_at)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Last Login</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{member.last_sign_in_at ? formatDate(member.last_sign_in_at) : 'Never'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

<<<<<<< HEAD
          {/* Admin Credits Management */}
=======
          {/* Points Management */}
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
          {member.role !== 'master_admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
<<<<<<< HEAD
                  Admin Credits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <span className="text-sm text-muted-foreground">Available Credits</span>
                  <p className="text-3xl font-bold text-primary">₹{(member.admin_credits || 0).toFixed(2)}</p>
                  <span className="text-xs text-muted-foreground">For distributing to users</span>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="points-amount">Allocate Credits</Label>
=======
                  Points Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="font-medium">Current Balance</span>
                  <span className="text-xl font-bold text-gaming-success">₹{member.current_balance.toFixed(2)}</span>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="points-amount">Allocate Points</Label>
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
                  <div className="flex gap-2">
                    <Input
                      id="points-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={pointsAmount}
                      onChange={(e) => setPointsAmount(e.target.value)}
                      min="1"
                    />
                    <Button 
                      onClick={allocatePoints}
                      disabled={isUpdatingPoints || !pointsAmount}
<<<<<<< HEAD
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
=======
                      className="bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90"
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isUpdatingPoints ? 'Allocating...' : 'Allocate'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
<<<<<<< HEAD
                    Admin can only distribute these credits to users - admins cannot play games.
=======
                    Admin can distribute these points to users
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Controls */}
          {member.role !== 'master_admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {member.status === 'active' ? (
                    <Button
                      variant="outline"
                      onClick={() => updateUserStatus('suspend')}
                      disabled={isUpdatingStatus}
                      className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Suspend Account
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => updateUserStatus('activate')}
                      disabled={isUpdatingStatus}
                      className="border-gaming-success text-gaming-success hover:bg-gaming-success/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Activate Account
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    onClick={() => updateUserStatus('block')}
                    disabled={isUpdatingStatus}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Block Account
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Suspended accounts can be reactivated. Blocked accounts require manual intervention.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};