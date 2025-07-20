
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface WithdrawalFilters {
  search: string;
  status: string;
  dateRange: string;
}

interface WithdrawalTableProps {
  filters: WithdrawalFilters;
}

const mockWithdrawals = [
  {
    id: 'WD001',
    user: 'John Doe',
    amount: 5000,
    method: 'Bank Transfer',
    accountDetails: 'XXXX1234',
    status: 'pending',
    requestTime: '2024-01-20 14:30:00',
    avatar: 'JD'
  },
  {
    id: 'WD002',
    user: 'Jane Smith',
    amount: 12500,
    method: 'UPI',
    accountDetails: 'jane@upi',
    status: 'approved',
    requestTime: '2024-01-20 13:45:00',
    avatar: 'JS'
  },
  {
    id: 'WD003',
    user: 'Mike Johnson',
    amount: 8000,
    method: 'Bank Transfer',
    accountDetails: 'XXXX5678',
    status: 'processing',
    requestTime: '2024-01-20 12:15:00',
    avatar: 'MJ'
  }
];

export const WithdrawalTable = ({ filters }: WithdrawalTableProps) => {
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
    console.log('Approving withdrawal:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rejecting withdrawal:', id);
  };

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
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockWithdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell>
                  <span className="font-mono text-sm">{withdrawal.id}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/placeholder-${withdrawal.id}.jpg`} />
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
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(withdrawal.id)}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {withdrawal.status === 'approved' && (
                    <Button size="sm" variant="outline" disabled>
                      <Clock className="mr-1 h-3 w-3" />
                      Processing
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
