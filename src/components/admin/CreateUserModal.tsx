import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Lock, User, Phone, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: () => void;
}

type UserType = 'user' | 'admin';

export const CreateUserModal = ({ open, onOpenChange, onUserCreated }: CreateUserModalProps) => {
  const { data: adminAuth } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    userType: 'user' as UserType,
    initialPoints: '0'
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      userType: 'user',
      initialPoints: '0'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating user with data:', {
        email: formData.email,
        userType: formData.userType,
        fullName: formData.fullName
      });

      // Call RPC function
      const { data, error } = await supabase.rpc('create_user_simple', {
        p_email: formData.email,
        p_password: formData.password,
        p_full_name: formData.fullName,
        p_phone: formData.phone || null,
        p_user_type: formData.userType
      });

      console.log('RPC Response:', { data, error });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      
      const result = data as any;
      console.log('Parsed result:', result);
      
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create user');
      }

      const userTypeText = formData.userType === 'admin' ? 'Admin' : 'User';
      toast({
        title: `${userTypeText} created successfully`,
        description: result.message || `${userTypeText} ${formData.email} has been created.`,
      });

      resetForm();
      onOpenChange(false);
      onUserCreated?.();
    } catch (error: any) {
      console.error('Create user error:', error);
      
      // Show user-friendly error messages
      let errorMessage = error.message;
      if (errorMessage.includes('User already registered')) {
        errorMessage = 'A user with this email already exists.';
      } else if (errorMessage.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorMessage.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (errorMessage.includes('Only master admins')) {
        errorMessage = 'Only master admins can create admin users.';
      } else if (errorMessage.includes('Only admins')) {
        errorMessage = 'You do not have permission to create users.';
      }

      toast({
        title: 'Failed to create user',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isMasterAdmin = adminAuth?.role === 'master_admin';
  const isRegularAdmin = adminAuth?.role === 'admin';
  
  // Determine what user types can be created (simple rule)
  const canCreateAdmin = isMasterAdmin; // only master admin can create admins
  const canCreateUser = isRegularAdmin || isMasterAdmin;

  // Force regular admins to 'user'
  useEffect(() => {
    if (isRegularAdmin && formData.userType !== 'user') {
      setFormData((prev) => ({ ...prev, userType: 'user' }));
    }
  }, [isRegularAdmin]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            {isMasterAdmin 
              ? "Create a new user or admin account."
              : "Create a new user account. The user will be able to login immediately with these credentials."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(canCreateAdmin || canCreateUser) && (
            <div className="space-y-2">
              <Label htmlFor="userType">Account Type *</Label>
              <Select value={formData.userType} onValueChange={(value) => handleInputChange('userType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {canCreateUser && <SelectItem value="user">Regular User</SelectItem>}
                  {canCreateAdmin && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          {canCreateAdmin && formData.userType === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="initialPoints">Initial Points (for Admin)</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="initialPoints"
                  type="number"
                  min={0}
                  step="1"
                  placeholder="Enter points to allocate"
                  value={formData.initialPoints}
                  onChange={(e) => handleInputChange('initialPoints', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min. 6 characters)"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-10"
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create {formData.userType === 'admin' ? 'Admin' : 'User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};