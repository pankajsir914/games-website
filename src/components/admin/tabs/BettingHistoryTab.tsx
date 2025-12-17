import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCompleteDetails } from '@/hooks/useUserCompleteDetails';
import { format } from 'date-fns';

interface BettingHistoryTabProps {
  data: UserCompleteDetails;
}

export const BettingHistoryTab = ({ data }: BettingHistoryTabProps) => {
  const [selectedGame, setSelectedGame] = useState<string>('all');
  
  const { bettingHistory } = data;

  const getAllBets = () => {
    const allBets: any[] = [];
    
    bettingHistory.aviator.forEach(bet => allBets.push({ ...bet, game: 'Aviator' }));
    bettingHistory.roulette.forEach(bet => allBets.push({ ...bet, game: 'Roulette' }));
    bettingHistory.teenPatti.forEach(bet => allBets.push({ ...bet, game: 'Teen Patti' }));
    bettingHistory.andarBahar.forEach(bet => allBets.push({ ...bet, game: 'Andar Bahar' }));
    bettingHistory.colorPrediction.forEach(bet => allBets.push({ ...bet, game: 'Color Prediction' }));
    bettingHistory.casino.forEach(bet => allBets.push({ ...bet, game: bet.table_name || 'Casino' }));
    bettingHistory.jackpot.forEach(bet => allBets.push({ ...bet, game: 'Jackpot' }));
    
    return allBets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const filteredBets = selectedGame === 'all' 
    ? getAllBets()
    : getAllBets().filter(bet => bet.game.toLowerCase().includes(selectedGame.toLowerCase()));

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'won':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Won</Badge>;
      case 'lost':
        return <Badge variant="destructive">Lost</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <label className="text-sm font-medium text-foreground">Filter:</label>
          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="aviator">Aviator</SelectItem>
              <SelectItem value="roulette">Roulette</SelectItem>
              <SelectItem value="teen patti">Teen Patti</SelectItem>
              <SelectItem value="andar bahar">Andar Bahar</SelectItem>
              <SelectItem value="color">Color Prediction</SelectItem>
              <SelectItem value="casino">Casino</SelectItem>
              <SelectItem value="jackpot">Jackpot</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs sm:text-sm text-muted-foreground sm:ml-auto">
            Total: {filteredBets.length} bets
          </span>
        </div>
      </Card>

      {/* Betting History Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Game</TableHead>
                <TableHead className="whitespace-nowrap">Bet</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Payout</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No betting history found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBets.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                      {format(new Date(bet.created_at), 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{bet.game}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm whitespace-nowrap">
                      ₹{Number(bet.bet_amount || bet.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {bet.cashout_multiplier 
                        ? `${Number(bet.cashout_multiplier).toFixed(2)}x`
                        : bet.bet_type || bet.color || bet.hand_type || bet.side || '-'}
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-green-500 whitespace-nowrap">
                      {bet.payout_amount ? `₹${Number(bet.payout_amount).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(bet.status)}</TableCell>
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
