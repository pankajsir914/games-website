import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCompleteDetails } from '@/hooks/useUserCompleteDetails';
import { format } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface TransactionHistoryTabProps {
  data: UserCompleteDetails;
}

export const TransactionHistoryTab = ({ data }: TransactionHistoryTabProps) => {
  const { recentTransactions } = data;

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(txn.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {txn.type === 'credit' ? (
                          <>
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                              Credit
                            </Badge>
                          </>
                        ) : (
                          <>
                            <ArrowDownCircle className="h-4 w-4 text-red-500" />
                            <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                              Debit
                            </Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={`font-semibold ${txn.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                      {txn.type === 'credit' ? '+' : '-'}₹{Number(txn.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {txn.reason || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {txn.id.slice(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
