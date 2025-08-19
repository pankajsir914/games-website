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

      // Use the simplified create_user_simple function that handles permissions internally
      const { data: result, error: rpcError } = await supabase.rpc('create_user_simple', {
        p_email: userData.email,
        p_password: userData.password,
        p_full_name: userData.fullName,
        p_phone: userData.phone || null,
        p_user_type: userData.userType
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const typedResult = result as { success: boolean; user_id?: string; error?: string };
      if (!typedResult?.success) {
        throw new Error(typedResult?.error || 'Failed to create user');
      }

      const userId = typedResult.user_id;

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