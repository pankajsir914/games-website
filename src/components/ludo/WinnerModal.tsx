
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/ludo';
import { Trophy, Sparkles } from 'lucide-react';

interface WinnerModalProps {
  winner: Player;
  onPlayAgain: () => void;
}

const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onPlayAgain }) => {
  const getWinnerColor = () => {
    const colors = {
      red: 'text-red-500',
      yellow: 'text-yellow-500',
      green: 'text-green-500',
      blue: 'text-blue-500'
    };
    return colors[winner];
  };

  const getWinnerName = () => {
    return winner.charAt(0).toUpperCase() + winner.slice(1);
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-gaming-gold" />
            Game Over!
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-6">
          <div className="bg-gradient-card rounded-lg p-6 mb-6">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-3xl font-bold mb-2">
              <span className={getWinnerColor()}>
                {getWinnerName()} Player
              </span>
            </h2>
            <p className="text-xl text-foreground font-medium">
              Wins the Game! 🎉
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Congratulations on bringing all your tokens home!
            </p>
            
            <Button
              onClick={onPlayAgain}
              className="w-full py-3 text-lg font-medium shadow-gaming"
            >
              Play Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;
