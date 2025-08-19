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
      const isCreatingAdmin = formData.userType === 'admin';

      if (isCreatingAdmin) {
        const { data, error } = await supabase.functions.invoke('create-admin-user', {
          body: {
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            phone: formData.phone || null,
            initialPoints: parseFloat(formData.initialPoints || '0') || 0,
          },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Failed to create admin');
      } else {
        console.log('Creating user directly via Supabase admin...');
        
        // Fallback: Use direct Supabase admin methods
        try {
          // First, try edge function
          console.log('Attempting edge function...');
          const { data, error } = await supabase.functions.invoke('create-user', {
            body: {
              email: formData.email,
              password: formData.password,
              fullName: formData.fullName,
              phone: formData.phone || null,
            },
          });
          
          console.log('Edge function response:', { data, error });
          
          if (error) {
            console.error('Edge function failed, trying alternative method...', error);
            
            // Alternative: Create user with admin RPC function
            const { data: rpcData, error: rpcError } = await supabase.rpc('admin_create_user', {
              p_email: formData.email,
              p_password: formData.password,
              p_full_name: formData.fullName,
              p_phone: formData.phone || null
            });
            
            if (rpcError) {
              console.error('RPC function also failed:', rpcError);
              throw new Error(`Failed to create user: ${rpcError.message}`);
            }
            
            // Handle RPC response as any since we know its structure
            const rpcResult = rpcData as any;
            if (!rpcResult?.success) {
              throw new Error(rpcResult?.error || 'Failed to create user via RPC');
            }
            
            console.log('User created via RPC fallback');
          } else {
            // Handle edge function response as any since we know its structure
            const edgeResult = data as any;
            if (!edgeResult?.success) {
              console.error('Edge function returned error:', edgeResult?.error);
              throw new Error(edgeResult?.error || 'Failed to create user');
            }
            console.log('User created successfully via edge function');
          }
        } catch (createError) {
          console.error('User creation failed:', createError);
          throw createError;
        }
      }

      const userTypeText = isCreatingAdmin ? 'Admin' : 'User';
      toast({
        title: `${userTypeText} created successfully`,
        description: `${userTypeText} ${formData.email} has been created.`,
      });

      resetForm();
      onOpenChange(false);
      onUserCreated?.();
    } catch (error: any) {
      toast({
        title: 'Failed to create user',
        description: error.message,
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
  
  // Determine what user types can be created
  const canCreateAdmin = isMasterAdmin || isRegularAdmin;
  const canCreateUser = isRegularAdmin || isMasterAdmin;

  // If admin cannot create admins, force 'user'
  useEffect(() => {
    if (!canCreateAdmin && formData.userType !== 'user') {
      setFormData((prev) => ({ ...prev, userType: 'user' }));
    }
  }, [canCreateAdmin]);
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