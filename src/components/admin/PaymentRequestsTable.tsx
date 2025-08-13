import React from 'react';
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
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { useMasterAdminFinance } from '@/hooks/useMasterAdminFinance';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentRequestsTableProps {
  filters?: {
    search: string;
    status: string;
    dateRange: string;
  };
}

export const PaymentRequestsTable = ({ filters }: PaymentRequestsTableProps) => {
  const { financeData, isLoading, processPaymentRequest, isProcessing } = useMasterAdminFinance();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-yellow-600">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-gaming-success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = (id: string) => {
    processPaymentRequest({ requestId: id, action: 'approve' });
  };

  const handleReject = (id: string) => {
    processPaymentRequest({ requestId: id, action: 'reject' });
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

  const paymentRequests = financeData?.payment_requests || [];

  // Apply filters
  const filteredRequests = paymentRequests.filter(request => {
    if (filters?.search && !request.id.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters?.status !== 'all' && request.status !== filters.status) {
      return false;
    }
    return true;
  });

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <span className="font-mono text-sm">{request.id.slice(0, 8)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{request.user_id.slice(0, 8)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">₹{request.amount?.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>{request.payment_method || 'UPI'}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">No receipt</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(request.id)}
                          className="bg-gaming-success hover:bg-gaming-success/90"
                          disabled={isProcessing}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                          disabled={isProcessing}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status === 'approved' && (
                      <Button size="sm" variant="outline" disabled>
                        <Clock className="mr-1 h-3 w-3" />
                        Processed
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No payment requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};