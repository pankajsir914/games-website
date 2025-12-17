import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TransactionHistoryProps {
  limit?: number;
  compact?: boolean;
}

export const TransactionHistory = ({ limit, compact = false }: TransactionHistoryProps) => {
  const { transactions, transactionsLoading } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch rejected payment requests
  const { data: rejectedRequests, isLoading: isLoadingRejected } = useQuery({
    queryKey: ['rejected-payment-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'rejected')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isLoading = transactionsLoading || isLoadingRejected;

  // Merge and sort transactions and rejected requests
  const allTransactions = React.useMemo(() => {
    const merged: any[] = [
      ...(transactions || []).map(t => ({ ...t, itemType: 'transaction' as const })),
      ...(rejectedRequests || []).map(r => ({ 
        ...r, 
        itemType: 'rejected_deposit' as const,
        reason: `Deposit Rejected - ₹${r.amount}`,
      })),
    ];
    
    return merged.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limit);
  }, [transactions, rejectedRequests, limit]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!allTransactions || allTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No transactions yet
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {allTransactions.map((item: any) => {
          const isRejected = item.itemType === 'rejected_deposit';
          const isCredit = item.type === 'credit';
          
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                compact && "p-2"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  isRejected ? "bg-red-100 text-red-600" :
                  isCredit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {isRejected ? (
                    <XCircle className={cn("h-4 w-4", compact && "h-3 w-3")} />
                  ) : isCredit ? (
                    <ArrowUpCircle className={cn("h-4 w-4", compact && "h-3 w-3")} />
                  ) : (
                    <ArrowDownCircle className={cn("h-4 w-4", compact && "h-3 w-3")} />
                  )}
                </div>
                <div className="space-y-1">
                  <p className={cn(
                    "font-medium",
                    compact ? "text-sm" : "text-base"
                  )}>
                    {item.reason}
                  </p>
                  <p className={cn(
                    "text-muted-foreground",
                    compact ? "text-xs" : "text-sm"
                  )}>
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  {isRejected && item.admin_notes && (
                    <p className={cn(
                      "text-red-600 italic",
                      compact ? "text-xs" : "text-sm"
                    )}>
                      Reason: {item.admin_notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-semibold",
                  compact ? "text-base" : "text-lg",
                  isRejected ? "text-red-600" :
                  isCredit ? "text-green-600" : "text-red-600"
                )}>
                  {isRejected ? '-' : isCredit ? '+' : '-'}₹{item.amount}
                </p>
              </div>
            </div>
          );
        })}
        {limit && allTransactions && allTransactions.length >= limit && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/wallet')}
          >
            View all transactions
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allTransactions.map((item: any) => {
            const isRejected = item.itemType === 'rejected_deposit';
            const isCredit = item.type === 'credit';
            
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    isRejected ? "bg-red-100 text-red-600" :
                    isCredit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {isRejected ? (
                      <XCircle className="h-4 w-4" />
                    ) : isCredit ? (
                      <ArrowUpCircle className="h-4 w-4" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{item.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                    {isRejected && item.admin_notes && (
                      <p className="text-sm text-red-600 italic">
                        Reason: {item.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-semibold",
                    isRejected ? "text-red-600" :
                    isCredit ? "text-green-600" : "text-red-600"
                  )}>
                    {isRejected ? '-' : isCredit ? '+' : '-'}₹{item.amount}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
