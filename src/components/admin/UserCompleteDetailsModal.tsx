import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserCompleteDetails } from '@/hooks/useUserCompleteDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { UserOverviewTab } from './tabs/UserOverviewTab';
import { BettingHistoryTab } from './tabs/BettingHistoryTab';
import { TransactionHistoryTab } from './tabs/TransactionHistoryTab';
import { GameSessionsTab } from './tabs/GameSessionsTab';
import { AlertCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserCompleteDetailsModalProps {
  open: boolean;
  userId: string | null;
  onOpenChange: (open: boolean) => void;
}

export const UserCompleteDetailsModal = ({
  open,
  userId,
  onOpenChange,
}: UserCompleteDetailsModalProps) => {
  const { data, isLoading, error } = useUserCompleteDetails(userId);

  // Fetch payment requests for this user
  // Use JOIN with profiles to check created_by
  const { data: paymentRequests, isLoading: loadingPayments, error: paymentError } = useQuery({
    queryKey: ['user-payment-requests', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      
      // Get current admin
      const { data: { user: currentAdmin } } = await supabase.auth.getUser();
      if (!currentAdmin) {
        return [];
      }

      // Check if current user is master admin
      const { data: highestRole } = await supabase
        .rpc('get_user_highest_role', { _user_id: currentAdmin.id });
      
      const isMasterAdmin = highestRole === 'master_admin';

      // If not master admin, verify user was created by this admin using RPC function
      if (!isMasterAdmin) {
        // Use RPC function to get user data (same as Overview tab uses)
        const { data: userManagementData } = await supabase
          .rpc('get_users_management_data', {
            p_limit: 10000,
            p_offset: 0,
            p_search: null,
            p_status: 'all'
          });

        const allUsers = (userManagementData as any)?.users || [];
        const userFromRpc = allUsers.find((u: any) => u.id === userId);
        
        console.log('User from RPC:', userFromRpc);
        console.log('User created_by from RPC:', userFromRpc?.created_by);
        console.log('Current admin ID:', currentAdmin.id);
        
        if (!userFromRpc) {
          console.log('User not found in RPC data');
          return [];
        }
        
        if (userFromRpc.created_by !== currentAdmin.id) {
          console.log('User not created by current admin. User created_by:', userFromRpc.created_by, 'Current admin:', currentAdmin.id);
          return [];
        }
        
        console.log('User access verified - created_by matches');
      }
      
      // Fetch payment requests - RLS will also verify access
      // Since we already verified created_by, RLS should allow access
      console.log('Fetching payment requests for user:', userId);
      
      // First, check if there are ANY payment requests in the database for this user (without RLS check)
      // This will help us understand if it's a data issue or RLS issue
      const { count: totalPaymentRequests } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      console.log('Total payment requests in DB for this user (if accessible):', totalPaymentRequests);
      
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching payment requests:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }
      
      console.log('Payment requests fetched:', data?.length || 0, 'requests');
      if (data && data.length > 0) {
        console.log('Sample payment request:', data[0]);
      } else {
        console.log('No payment requests found. This could mean:');
        console.log('1. No payment requests exist in database for this user');
        console.log('2. RLS policy is blocking access (even though created_by matches)');
      }
      return data || [];
    },
    enabled: !!userId && open,
    retry: 1,
  });

  // Fetch withdrawal requests for this user
  // Use JOIN with profiles to check created_by
  const { data: withdrawalRequests, isLoading: loadingWithdrawals, error: withdrawalError } = useQuery({
    queryKey: ['user-withdrawal-requests', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      
      // Get current admin
      const { data: { user: currentAdmin } } = await supabase.auth.getUser();
      if (!currentAdmin) {
        return [];
      }

      // Check if current user is master admin
      const { data: highestRole } = await supabase
        .rpc('get_user_highest_role', { _user_id: currentAdmin.id });
      
      const isMasterAdmin = highestRole === 'master_admin';

      // If not master admin, verify user was created by this admin using RPC function
      if (!isMasterAdmin) {
        // Use RPC function to get user data (same as Overview tab uses)
        const { data: userManagementData } = await supabase
          .rpc('get_users_management_data', {
            p_limit: 10000,
            p_offset: 0,
            p_search: null,
            p_status: 'all'
          });

        const allUsers = (userManagementData as any)?.users || [];
        const userFromRpc = allUsers.find((u: any) => u.id === userId);
        
        console.log('User from RPC:', userFromRpc);
        console.log('User created_by from RPC:', userFromRpc?.created_by);
        console.log('Current admin ID:', currentAdmin.id);
        
        if (!userFromRpc) {
          console.log('User not found in RPC data');
          return [];
        }
        
        if (userFromRpc.created_by !== currentAdmin.id) {
          console.log('User not created by current admin. User created_by:', userFromRpc.created_by, 'Current admin:', currentAdmin.id);
          return [];
        }
        
        console.log('User access verified - created_by matches');
      }
      
      // Fetch withdrawal requests - RLS will also verify access
      // Since we already verified created_by, RLS should allow access
      console.log('Fetching withdrawal requests for user:', userId);
      
      // First, check if there are ANY withdrawal requests in the database for this user (without RLS check)
      // This will help us understand if it's a data issue or RLS issue
      const { count: totalWithdrawalRequests } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      console.log('Total withdrawal requests in DB for this user (if accessible):', totalWithdrawalRequests);
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }
      
      console.log('Withdrawal requests fetched:', data?.length || 0, 'requests');
      if (data && data.length > 0) {
        console.log('Sample withdrawal request:', data[0]);
      } else {
        console.log('No withdrawal requests found. This could mean:');
        console.log('1. No withdrawal requests exist in database for this user');
        console.log('2. RLS policy is blocking access (even though created_by matches)');
      }
      return data || [];
    },
    enabled: !!userId && open,
    retry: 1,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-6xl max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-y-auto w-full p-2 sm:p-4 md:p-6">
        <DialogHeader className="px-1 sm:px-0">
          <DialogTitle className="text-sm sm:text-base md:text-lg lg:text-xl">User Complete Details</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load user details. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex w-full flex-nowrap overflow-x-auto gap-1 md:grid md:grid-cols-6 md:overflow-x-visible">
              <TabsTrigger value="overview" className="text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Overview</TabsTrigger>
              <TabsTrigger value="betting" className="text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Betting</TabsTrigger>
              <TabsTrigger value="transactions" className="text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Transactions</TabsTrigger>
              <TabsTrigger value="sessions" className="text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Sessions</TabsTrigger>
              <TabsTrigger value="payments" className="text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">
                <span className="hidden sm:inline">Payment Requests</span>
                <span className="sm:hidden">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">
                <span className="hidden sm:inline">Withdrawal Requests</span>
                <span className="sm:hidden">Withdrawals</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-2 sm:mt-4 md:mt-6 px-0 sm:px-1">
              <UserOverviewTab data={data} />
            </TabsContent>

            <TabsContent value="betting" className="mt-2 sm:mt-4 md:mt-6 px-0 sm:px-1">
              <BettingHistoryTab data={data} />
            </TabsContent>

            <TabsContent value="transactions" className="mt-2 sm:mt-4 md:mt-6 px-0 sm:px-1">
              <TransactionHistoryTab data={data} />
            </TabsContent>

            <TabsContent value="sessions" className="mt-2 sm:mt-4 md:mt-6 px-0 sm:px-1">
              <GameSessionsTab data={data} />
            </TabsContent>

            <TabsContent value="payments" className="mt-2 sm:mt-4 md:mt-6 px-0 sm:px-1">
              <Card>
                <CardContent className="p-2 sm:p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-gaming-success" />
                    Payment Requests ({paymentRequests?.length || 0})
                  </h4>
                  {paymentError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Error loading payment requests: {paymentError.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  {loadingPayments ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : paymentRequests && paymentRequests.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {paymentRequests.map((request: any) => (
                        <div key={request.id} className="p-2 sm:p-3 border rounded-lg bg-background/50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base">₹{Number(request.amount).toLocaleString()}</p>
                              <p className="text-[10px] xs:text-xs text-muted-foreground break-words">
                                {new Date(request.created_at).toLocaleString()}
                              </p>
                              <p className="text-[10px] xs:text-xs text-muted-foreground mt-1 break-words">
                                Method: {request.payment_method || 'N/A'}
                              </p>
                            </div>
                            <Badge 
                              className={
                                `text-[10px] xs:text-xs shrink-0 ${
                                  request.status === 'approved' ? 'bg-gaming-success' :
                                  request.status === 'rejected' ? 'bg-gaming-danger' :
                                  'bg-yellow-500'
                                }`
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>
                          {request.admin_notes && (
                            <p className="text-[10px] xs:text-xs text-muted-foreground mt-2 break-words">
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
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-2 sm:mt-4 md:mt-6 px-0 sm:px-1">
              <Card>
                <CardContent className="p-2 sm:p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ArrowDownCircle className="h-4 w-4 text-gaming-danger" />
                    Withdrawal Requests ({withdrawalRequests?.length || 0})
                  </h4>
                  {withdrawalError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Error loading withdrawal requests: {withdrawalError.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  {loadingWithdrawals ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : withdrawalRequests && withdrawalRequests.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {withdrawalRequests.map((request: any) => (
                        <div key={request.id} className="p-2 sm:p-3 border rounded-lg bg-background/50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base">₹{Number(request.amount).toLocaleString()}</p>
                              <p className="text-[10px] xs:text-xs text-muted-foreground break-words">
                                {new Date(request.created_at).toLocaleString()}
                              </p>
                              <p className="text-[10px] xs:text-xs text-muted-foreground mt-1 break-words">
                                {request.payment_method_type === 'upi' 
                                  ? `UPI: ${request.upi_id || 'N/A'}`
                                  : `Bank: ${request.account_holder_name || 'N/A'} (${request.bank_account_number?.slice(-4) || '••••'})`
                                }
                              </p>
                            </div>
                            <Badge 
                              className={
                                `text-[10px] xs:text-xs shrink-0 ${
                                  request.status === 'approved' ? 'bg-gaming-success' :
                                  request.status === 'rejected' ? 'bg-gaming-danger' :
                                  'bg-yellow-500'
                                }`
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>
                          {request.admin_notes && (
                            <p className="text-[10px] xs:text-xs text-muted-foreground mt-2 break-words">
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
        )}
      </DialogContent>
    </Dialog>
  );
};
