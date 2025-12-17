
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentRequest {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  admin_notes?: string;
}

export const PaymentRequestsCard = () => {
  const { user } = useAuth();

  const { data: paymentRequests, isLoading } = useQuery({
    queryKey: ['payment-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as PaymentRequest[];
    },
    enabled: !!user?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'approved':
        return <CheckCircle className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payment Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {!paymentRequests || paymentRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No payment requests yet
          </p>
        ) : (
          <div className="space-y-3">
            {paymentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">₹{request.amount}</span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(request.status)}`}
                    >
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                  {request.admin_notes && request.status === 'rejected' && (
                    <p className="text-xs text-red-600 italic mt-1">
                      Reason: {request.admin_notes}
                    </p>
                  )}
                  {request.admin_notes && (
                    <p className="text-xs text-muted-foreground italic">
                      Note: {request.admin_notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase">
                    {request.payment_method}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
