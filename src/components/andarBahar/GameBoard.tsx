
import { CardComponent } from './CardComponent';
import { AndarBaharRound } from '@/types/andarBahar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameBoardProps {
  currentRound: AndarBaharRound | null;
}

export const GameBoard = ({ currentRound }: GameBoardProps) => {
  if (!currentRound) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Waiting for next round...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (currentRound.status) {
      case 'betting':
        return <Badge variant="default">Betting Open</Badge>;
      case 'dealing':
        return <Badge variant="secondary">Dealing Cards</Badge>;
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-100">
            {currentRound.winning_side?.toUpperCase()} Wins!
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Round #{currentRound.round_number}</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Joker Card */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-3">Joker Card</h3>
          <div className="flex justify-center">
            <CardComponent 
              card={currentRound.joker_card} 
              isJoker={true} 
              size="large" 
            />
          </div>
        </div>

        {/* Game Piles */}
        <div className="grid grid-cols-2 gap-8">
          {/* Andar Side */}
          <div className="text-center">
            <h3 className={`text-lg font-semibold mb-3 ${
              currentRound.winning_side === 'andar' ? 'text-green-600' : ''
            }`}>
              Andar
              {currentRound.winning_side === 'andar' && (
                <span className="ml-2 text-sm">🏆 WINNER</span>
              )}
            </h3>
            <div className="grid grid-cols-3 gap-2 justify-items-center min-h-[80px]">
              {currentRound.andar_cards.map((card, index) => (
                <CardComponent 
                  key={`andar-${index}`} 
                  card={card} 
                  size="medium"
                  className={
                    currentRound.winning_card && 
                    card.suit === currentRound.winning_card.suit && 
                    card.rank === currentRound.winning_card.rank 
                      ? 'ring-2 ring-green-400' 
                      : ''
                  }
                />
              ))}
            </div>
          </div>

          {/* Bahar Side */}
          <div className="text-center">
            <h3 className={`text-lg font-semibold mb-3 ${
              currentRound.winning_side === 'bahar' ? 'text-green-600' : ''
            }`}>
              Bahar
              {currentRound.winning_side === 'bahar' && (
                <span className="ml-2 text-sm">🏆 WINNER</span>
              )}
            </h3>
            <div className="grid grid-cols-3 gap-2 justify-items-center min-h-[80px]">
              {currentRound.bahar_cards.map((card, index) => (
                <CardComponent 
                  key={`bahar-${index}`} 
                  card={card} 
                  size="medium"
                  className={
                    currentRound.winning_card && 
                    card.suit === currentRound.winning_card.suit && 
                    card.rank === currentRound.winning_card.rank 
                      ? 'ring-2 ring-green-400' 
                      : ''
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-muted p-4 rounded-lg text-sm">
          <p className="font-semibold mb-2">How to Play:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• A Joker card is drawn at the start</li>
            <li>• Cards are dealt alternately to Andar and Bahar sides</li>
            <li>• Bet on which side will receive a card matching the Joker's rank first</li>
            <li>• Andar pays 1.9x, Bahar pays 2.0x</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
