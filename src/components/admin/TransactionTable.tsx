
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAdminTransactions } from '@/hooks/useAdminTransactions';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionFilters {
  search: string;
  type: string;
  status: string;
  dateRange: string;
}

interface TransactionTableProps {
  filters: TransactionFilters;
}

export const TransactionTable = ({ filters }: TransactionTableProps) => {
  const { data: transactions, isLoading } = useAdminTransactions();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-gaming-success">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Badge variant="outline" className="text-gaming-success border-gaming-success">Deposit</Badge>;
      case 'withdrawal':
        return <Badge variant="outline" className="text-gaming-danger border-gaming-danger">Withdrawal</Badge>;
      case 'game_win':
        return <Badge className="bg-gaming-gold">Game Win</Badge>;
      case 'game_loss':
        return <Badge variant="outline">Game Loss</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[...Array(10)].map((_, i) => (
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
  const filteredTransactions = transactions?.filter(transaction => {
    if (filters.search && !transaction.user.toLowerCase().includes(filters.search.toLowerCase()) && 
        !transaction.id.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }
    if (filters.status !== 'all' && transaction.status !== filters.status) {
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
              <TableHead>Transaction ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <span className="font-mono text-sm">{transaction.id.slice(0, 8)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{transaction.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{transaction.user}</span>
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                <TableCell>
                  <span className="font-semibold">₹{transaction.amount.toLocaleString()}</span>
                </TableCell>
                <TableCell>{transaction.method}</TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{transaction.timestamp}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
