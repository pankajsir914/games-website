
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAdminWithdrawals } from '@/hooks/useAdminWithdrawals';
import { Skeleton } from '@/components/ui/skeleton';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { TPINVerificationModal } from '@/components/admin/TPINVerificationModal';

interface WithdrawalFilters {
  search: string;
  status: string;
  dateRange: string;
}

interface WithdrawalTableProps {
  filters: WithdrawalFilters;
}

export const WithdrawalTable = ({ filters }: WithdrawalTableProps) => {
  const { data: withdrawals, isLoading, processWithdrawal, isProcessing } = useAdminWithdrawals();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  
  // TPIN verification state
  const [tpinModalOpen, setTpinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setUserModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-yellow-600">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-gaming-success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-600">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = (id: string) => {
    setPendingAction({ id, action: 'approve' });
    setTpinModalOpen(true);
  };

  const handleReject = (id: string) => {
    setPendingAction({ id, action: 'reject' });
    setTpinModalOpen(true);
  };

  const handleTPINVerified = () => {
    if (pendingAction) {
      const notes = pendingAction.action === 'approve' ? 'Approved by admin' : 'Rejected by admin';
      processWithdrawal({ id: pendingAction.id, status: pendingAction.action === 'approve' ? 'approved' : 'rejected', adminNotes: notes });
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Apply filters
  const filteredWithdrawals = withdrawals?.filter(withdrawal => {
    if (filters.search && !withdrawal.user.toLowerCase().includes(filters.search.toLowerCase()) && 
        !withdrawal.id.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && withdrawal.status !== filters.status) {
      return false;
    }
    return true;
  });

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals?.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    <span className="font-mono text-sm">{withdrawal.id.slice(0, 8)}</span>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                      onClick={() => handleUserClick(withdrawal.user_id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{withdrawal.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{withdrawal.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">₹{withdrawal.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>{withdrawal.method}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{withdrawal.accountDetails}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{withdrawal.requestTime}</span>
                  </TableCell>
                  <TableCell>
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(withdrawal.id)}
                          className="bg-gaming-success hover:bg-gaming-success/90"
                          disabled={isProcessing}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(withdrawal.id)}
                          disabled={isProcessing}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {withdrawal.status === 'approved' && (
                      <Badge variant="outline" className="text-blue-600">
                        <Clock className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                    {withdrawal.status === 'processing' && (
                      <Badge variant="outline" className="text-blue-600">
                        <Clock className="mr-1 h-3 w-3" />
                        Processing
                      </Badge>
                    )}
                    {withdrawal.status === 'rejected' && (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <UserDetailModal 
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        userId={selectedUserId}
      />
      
      <TPINVerificationModal
        open={tpinModalOpen}
        onOpenChange={(open) => {
          setTpinModalOpen(open);
          if (!open) setPendingAction(null);
        }}
        onVerified={handleTPINVerified}
        actionDescription={pendingAction?.action === 'approve' ? 'approving this withdrawal' : 'rejecting this withdrawal'}
      />
    </>
  );
};