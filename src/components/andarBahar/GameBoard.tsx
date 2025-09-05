
import { AndarBaharRound } from '@/types/andarBahar';
import { AndarBaharTable } from './AndarBaharTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameBoardProps {
  currentRound: AndarBaharRound | null;
}

export const GameBoard = ({ currentRound }: GameBoardProps) => {
  const getStatusBadge = () => {
    if (!currentRound) return null;
    switch (currentRound.status) {
      case 'betting':
        return <Badge className="bg-green-600 text-white animate-pulse">Betting Open</Badge>;
      case 'dealing':
        return <Badge className="bg-yellow-600 text-white">Dealing Cards</Badge>;
      case 'completed':
        return (
          <Badge className="bg-blue-600 text-white">
            {currentRound.winning_side?.toUpperCase()} Wins!
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Round #{currentRound?.round_number || '--'}</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AndarBaharTable
          jokerCard={currentRound?.joker_card}
          andarCards={currentRound?.andar_cards || []}
          baharCards={currentRound?.bahar_cards || []}
          winningSide={currentRound?.winning_side}
          winningCard={currentRound?.winning_card}
          isDealing={currentRound?.status === 'dealing'}
        />
      </CardContent>
    </Card>
  );
};
