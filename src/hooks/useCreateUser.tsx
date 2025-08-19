import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  userType: 'user' | 'admin';
}

interface CreateUserResponse {
  success: boolean;
  userId?: string;
  error?: string;
}

export const useCreateUser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createUser = async (userData: CreateUserData): Promise<CreateUserResponse> => {
    setIsLoading(true);
    
    try {
      // Validate input
      if (!userData.email || !userData.password || !userData.fullName) {
        throw new Error('Email, password, and full name are required');
      }

      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check admin permissions
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('You must be logged in to create users');
      }

      // Get current user's role
      const { data: roleData } = await supabase.rpc('get_user_highest_role', {
        _user_id: currentUser.user.id
      });

      const currentUserRole = roleData as string;
      
      if (!['admin', 'master_admin'].includes(currentUserRole)) {
        throw new Error('Only admins can create users');
      }

      if (userData.userType === 'admin' && currentUserRole !== 'master_admin') {
        throw new Error('Only master admins can create admin users');
      }

      // Create auth user using admin API
      const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.fullName,
          phone: userData.phone || null
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!newUser.user) {
        throw new Error('Failed to create user account');
      }

      const userId = newUser.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userData.fullName,
          phone: userData.phone || null,
          created_by: currentUser.user.id
        });

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      // Create wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          current_balance: 0
        });

      if (walletError) {
        // Clean up auth user and profile if wallet creation fails
        await supabase.auth.admin.deleteUser(userId);
        await supabase.from('profiles').delete().eq('id', userId);
        throw new Error(`Failed to create user wallet: ${walletError.message}`);
      }

      // Assign admin role if needed
      if (userData.userType === 'admin') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin',
            assigned_by: currentUser.user.id
          });

        if (roleError) {
          console.warn('Failed to assign admin role:', roleError.message);
          // Don't fail the entire operation for role assignment
        }
      }

      // Log admin activity (best effort)
      try {
        await supabase.rpc('log_admin_activity', {
          p_action_type: userData.userType === 'admin' ? 'create_admin_user' : 'create_user',
          p_target_type: 'user',
          p_target_id: userId,
          p_details: {
            email: userData.email,
            full_name: userData.fullName,
            user_type: userData.userType,
            created_by: currentUser.user.id
          }
        });
      } catch (logError) {
        console.warn('Failed to log admin activity:', logError);
      }

      toast({
        title: "Success",
        description: `${userData.userType === 'admin' ? 'Admin' : 'User'} created successfully`,
      });

      return {
        success: true,
        userId: userId
      };

    } catch (error: any) {
      console.error('Create user error:', error);
      
      let errorMessage = error.message || 'An unexpected error occurred';
      
      // Handle specific error cases
      if (errorMessage.includes('User already registered') || errorMessage.includes('already exists')) {
        errorMessage = 'A user with this email already exists';
      } else if (errorMessage.includes('invalid email') || errorMessage.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address';
      } else if (errorMessage.includes('Password') || errorMessage.includes('password')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (errorMessage.includes('Only master admins')) {
        errorMessage = 'Only master admins can create admin users';
      } else if (errorMessage.includes('Only admins')) {
        errorMessage = 'You do not have permission to create users';
      } else if (errorMessage.includes('required')) {
        errorMessage = 'Please fill in all required fields';
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createUser,
    isLoading
  };
};