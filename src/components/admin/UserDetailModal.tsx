import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, Wallet, Hash, Shield, Calendar } from 'lucide-react';

interface UserDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export const UserDetailModal = ({ open, onOpenChange, userId }: UserDetailModalProps) => {
  const { data: userDetails, isLoading } = useQuery({
    queryKey: ['user-details', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get wallet data
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      return {
        id: userId,
        full_name: profile?.full_name || 'N/A',
        phone: profile?.phone || 'N/A',
        email: userId.slice(0, 13) + '...', // Show partial ID as we can't fetch email directly
        current_balance: Number(wallet?.current_balance || 0),
        created_at: profile?.created_at,
        avatar: profile?.full_name?.slice(0, 2).toUpperCase() || 'U',
      };
    },
    enabled: !!userId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : userDetails ? (
          <div className="space-y-4">
            {/* User Avatar and Name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl font-semibold">
                  {userDetails.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{userDetails.full_name}</h3>
                <Badge variant="outline" className="mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>

            <Separator />

            {/* User Information Cards */}
            <div className="space-y-3">
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Hash className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm font-medium">{userDetails.id.slice(0, 8)}...</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-2">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{userDetails.full_name}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-2">
                    <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm break-all">{userDetails.email}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900/20 rounded-full p-2">
                    <Phone className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Mobile Number</p>
                    <p className="font-medium">{userDetails.phone}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900/20 rounded-full p-2">
                    <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="font-bold text-lg">₹{userDetails.current_balance.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2">
                    <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="font-medium text-sm">
                      {userDetails.created_at 
                        ? new Date(userDetails.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No user data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
