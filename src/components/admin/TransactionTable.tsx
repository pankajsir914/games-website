
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TransactionFilters {
  search: string;
  type: string;
  status: string;
  dateRange: string;
}

interface TransactionTableProps {
  filters: TransactionFilters;
}

const mockTransactions = [
  {
    id: 'TXN001',
    user: 'John Doe',
    type: 'deposit',
    amount: 5000,
    status: 'completed',
    method: 'UPI',
    timestamp: '2024-01-20 14:30:00',
    avatar: 'JD'
  },
  {
    id: 'TXN002',
    user: 'Jane Smith',
    type: 'withdrawal',
    amount: 8000,
    status: 'pending',
    method: 'Bank Transfer',
    timestamp: '2024-01-20 13:45:00',
    avatar: 'JS'
  },
  {
    id: 'TXN003',
    user: 'Mike Johnson',
    type: 'game_win',
    amount: 12500,
    status: 'completed',
    method: 'Ludo Match',
    timestamp: '2024-01-20 12:15:00',
    avatar: 'MJ'
  }
];

export const TransactionTable = ({ filters }: TransactionTableProps) => {
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
            {mockTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <span className="font-mono text-sm">{transaction.id}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/placeholder-${transaction.id}.jpg`} />
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
