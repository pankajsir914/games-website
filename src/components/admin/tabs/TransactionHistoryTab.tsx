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
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Amount</TableHead>
                <TableHead className="whitespace-nowrap">Reason</TableHead>
                <TableHead className="whitespace-nowrap">ID</TableHead>
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
                    <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                      {format(new Date(txn.created_at), 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {txn.type === 'credit' ? (
                          <>
                            <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                              Credit
                            </Badge>
                          </>
                        ) : (
                          <>
                            <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                            <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs">
                              Debit
                            </Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={`font-semibold text-sm whitespace-nowrap ${txn.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                      {txn.type === 'credit' ? '+' : '-'}₹{Number(txn.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-[100px] sm:max-w-xs truncate text-xs sm:text-sm">
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
