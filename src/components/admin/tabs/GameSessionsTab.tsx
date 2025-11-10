import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCompleteDetails } from '@/hooks/useUserCompleteDetails';
import { format } from 'date-fns';

interface GameSessionsTabProps {
  data: UserCompleteDetails;
}

export const GameSessionsTab = ({ data }: GameSessionsTabProps) => {
  const { gameSessions } = data;

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Completed</Badge>;
      case 'active':
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Active</Badge>;
      case 'waiting':
        return <Badge variant="secondary">Waiting</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Created</TableHead>
                <TableHead className="whitespace-nowrap">Game</TableHead>
                <TableHead className="whitespace-nowrap">Fee</TableHead>
                <TableHead className="whitespace-nowrap">Players</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="hidden sm:table-cell whitespace-nowrap">Started</TableHead>
                <TableHead className="hidden sm:table-cell whitespace-nowrap">Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gameSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No game sessions found
                  </TableCell>
                </TableRow>
              ) : (
                gameSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                      {format(new Date(session.created_at), 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {session.game_type?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm whitespace-nowrap">
                      ₹{Number(session.entry_fee || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {session.current_players || 0}/{session.max_players || 0}
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs sm:text-sm whitespace-nowrap">
                      {session.started_at 
                        ? format(new Date(session.started_at), 'dd/MM/yy HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs sm:text-sm whitespace-nowrap">
                      {session.completed_at 
                        ? format(new Date(session.completed_at), 'dd/MM/yy HH:mm')
                        : '-'}
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
