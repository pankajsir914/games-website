import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, History, HelpCircle, User, Mail, Phone, Calendar, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Security state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Change password mutation
  const changePassword = useMutation({
    mutationFn: async (data: { newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    },
  });

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }
    changePassword.mutate({
      newPassword,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please log in to view your profile.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your account settings and information</p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            {/* User Info Section */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  User Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your personal account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Full Name</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 border rounded-md bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm sm:text-base truncate">{profile?.full_name || user.user_metadata?.full_name || 'Not set'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Email</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 border rounded-md bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm sm:text-base truncate">{user.email}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Phone Number</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 border rounded-md bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm sm:text-base">{profile?.phone || 'Not set'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Account Created</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 border rounded-md bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : user.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">User ID</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 border rounded-md bg-muted/50">
                    <span className="font-mono text-xs sm:text-sm break-all">{user.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  Security
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10 text-sm sm:text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10 text-sm sm:text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="text-sm sm:text-base"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changePassword.isPending || !newPassword || !confirmPassword}
                  className="w-full text-sm sm:text-base"
                  size="sm"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>

                <Alert className="text-xs">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <AlertDescription className="text-xs">
                    Password must be at least 6 characters long.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-4 sm:my-6" />

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Access your account features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-3 sm:p-4"
                  onClick={() => navigate('/wallet')}
                >
                  <Wallet className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm sm:text-base">Wallet</div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">View balance and transactions</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-3 sm:p-4"
                  onClick={() => navigate('/betting-history')}
                >
                  <History className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm sm:text-base">Betting History</div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">View all your bets</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-3 sm:p-4 sm:col-span-2 md:col-span-1"
                  onClick={() => navigate('/support')}
                >
                  <HelpCircle className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm sm:text-base">Support</div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">Get help and contact support</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
