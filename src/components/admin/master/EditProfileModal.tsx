import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, X, User, Mail, Phone } from 'lucide-react';
import { TeamMember } from '@/hooks/useTeamManagement';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onUpdate?: () => void;
}

export const EditProfileModal = ({ open, onOpenChange, member, onUpdate }: EditProfileModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: member?.full_name || '',
    phone: member?.phone || '',
  });
  const { toast } = useToast();

  React.useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name || '',
        phone: member.phone || '',
      });
    }
  }, [member]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master_admin': return <Badge className="bg-gaming-gold text-gaming-gold-foreground">Master Admin</Badge>;
      case 'admin': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Admin</Badge>;
      case 'moderator': return <Badge className="bg-primary text-primary-foreground">Moderator</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim() || null,
          phone: formData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Team member profile has been updated successfully.",
      });

      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <Card className="bg-gradient-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-primary">
                  <AvatarFallback className="text-primary-foreground text-lg font-semibold">
                    {member.full_name?.split(' ').map(n => n[0]).join('') || member.email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{member.full_name || 'No Name'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{member.email}</span>
                  </div>
                  <div className="mt-2">
                    {getRoleBadge(member.role)}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Updating...' : 'Update Profile'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};