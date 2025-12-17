import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Shield, 
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Gamepad2,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';

interface UserProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal = ({ user, isOpen, onClose }: UserProfileModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch payment requests for this user
  const { data: paymentRequests, isLoading: loadingPayments } = useQuery({
    queryKey: ['user-payment-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isOpen,
  });

  // Fetch withdrawal requests for this user
  const { data: withdrawalRequests, isLoading: loadingWithdrawals } = useQuery({
    queryKey: ['user-withdrawal-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isOpen,
  });

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-gaming-success text-gaming-success-foreground';
      case 'recently_active':
        return 'bg-gaming-warning text-gaming-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getVerificationBadge = (isVerified: boolean) => {
    if (isVerified) {
      return <CheckCircle className="h-4 w-4 text-gaming-success" />;
    }
    return <XCircle className="h-4 w-4 text-gaming-danger" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">User Profile</DialogTitle>
          <DialogDescription>Complete details and activity history</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
          {/* User Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gaming-primary text-gaming-primary-foreground text-xl">
                  {user.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{user.full_name || 'Anonymous User'}</h3>
                <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(user.status)}>
                    {user.status === 'online' ? 'Online' : user.status === 'recently_active' ? 'Recently Active' : 'Offline'}
                  </Badge>
                  {user.is_blocked && (
                    <Badge variant="destructive">Blocked</Badge>
                  )}
                  {user.user_role && (
                    <Badge variant="outline">{user.user_role}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <Card className="bg-background/50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getVerificationBadge(!!user.email_confirmed_at)}
                      <span className="text-xs text-muted-foreground">
                        {user.email_confirmed_at ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Creation Info */}
          <Card className="bg-background/50 border-gaming-primary/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Account Creation Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Created On</p>
                    <p className="font-medium">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gaming-primary/10 rounded-lg border border-gaming-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Created By</p>
                    {user.created_by ? (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gaming-primary" />
                        <div>
                          <p className="font-semibold text-gaming-primary">
                            {user.creator_name || 'Admin User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Admin ID: {user.created_by.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Self-registered</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card className="bg-background/50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Financial Overview
              </h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-gaming-gold/10 to-gaming-gold/5 rounded-lg">
                  <CreditCard className="h-5 w-5 text-gaming-gold mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-bold text-gaming-gold">₹{user.current_balance?.toLocaleString() || '0'}</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-gaming-success/10 to-gaming-success/5 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-gaming-success mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Total Deposits</p>
                  <p className="text-lg font-bold text-gaming-success">₹{user.total_deposits?.toLocaleString() || '0'}</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-gaming-danger/10 to-gaming-danger/5 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-gaming-danger mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Total Withdrawals</p>
                  <p className="text-lg font-bold text-gaming-danger">₹{user.total_withdrawals?.toLocaleString() || '0'}</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-gaming-primary/10 to-gaming-primary/5 rounded-lg">
                  <Gamepad2 className="h-5 w-5 text-gaming-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Games Played</p>
                  <p className="text-lg font-bold text-gaming-primary">{user.games_played || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timestamps */}
          <Card className="bg-background/50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activity Timestamps
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Account Created</p>
                    <p className="font-medium">{new Date(user.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Sign In</p>
                    <p className="font-medium">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          {user.risk_level && (
            <Card className="bg-background/50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Assessment
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant={user.risk_level === 'high' ? 'destructive' : user.risk_level === 'medium' ? 'secondary' : 'default'}>
                    {user.risk_level.toUpperCase()} RISK
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6 mt-6">
            {/* Payment Requests */}
            <Card className="bg-background/50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-gaming-success" />
                  Payment Requests ({paymentRequests?.length || 0})
                </h4>
                {loadingPayments ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : paymentRequests && paymentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {paymentRequests.map((request: any) => (
                      <div key={request.id} className="p-3 border rounded-lg bg-background/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">₹{Number(request.amount).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Method: {request.payment_method || 'N/A'}
                            </p>
                          </div>
                          <Badge 
                            className={
                              request.status === 'approved' ? 'bg-gaming-success' :
                              request.status === 'rejected' ? 'bg-gaming-danger' :
                              'bg-yellow-500'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        {request.admin_notes && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Notes: {request.admin_notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No payment requests found
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Withdrawal Requests */}
            <Card className="bg-background/50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-gaming-danger" />
                  Withdrawal Requests ({withdrawalRequests?.length || 0})
                </h4>
                {loadingWithdrawals ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : withdrawalRequests && withdrawalRequests.length > 0 ? (
                  <div className="space-y-3">
                    {withdrawalRequests.map((request: any) => (
                      <div key={request.id} className="p-3 border rounded-lg bg-background/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">₹{Number(request.amount).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {request.payment_method_type === 'upi' 
                                ? `UPI: ${request.upi_id || 'N/A'}`
                                : `Bank: ${request.account_holder_name || 'N/A'} (${request.bank_account_number?.slice(-4) || '••••'})`
                              }
                            </p>
                          </div>
                          <Badge 
                            className={
                              request.status === 'approved' ? 'bg-gaming-success' :
                              request.status === 'rejected' ? 'bg-gaming-danger' :
                              'bg-yellow-500'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        {request.admin_notes && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Notes: {request.admin_notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No withdrawal requests found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};