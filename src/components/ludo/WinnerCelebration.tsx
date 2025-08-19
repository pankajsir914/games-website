import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Coins, Sparkles, Star } from 'lucide-react';
import { ActivePlayer } from '@/types/ludo';

interface WinnerCelebrationProps {
  winner: ActivePlayer | null;
  winAmount: number;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
  isOpen: boolean;
}

const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({
  winner,
  winAmount,
  onPlayAgain,
  onBackToLobby,
  isOpen
}) => {
  useEffect(() => {
    if (isOpen && winner) {
      // Create confetti effect
      createConfetti();
    }
  }, [isOpen, winner]);

  const createConfetti = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
    
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        confetti.style.animation = 'fall 3s linear forwards';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 3000);
      }, i * 50);
    }
  };

  const getWinnerColor = () => {
    const colors = {
      red: 'text-ludo-red',
      yellow: 'text-ludo-yellow',
      green: 'text-ludo-green',
      blue: 'text-ludo-blue',
    };
    return winner ? colors[winner] || colors.red : '';
  };

  const getWinnerName = () => {
    if (!winner) return '';
    return winner === 'red' ? 'You' : `${winner.charAt(0).toUpperCase() + winner.slice(1)} Bot`;
  };

  const isPlayerWin = winner === 'red';

  return (
    <>
      <Dialog open={isOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 border-0">
          <div className="text-center py-6 space-y-6">
            {/* Trophy and celebration icons */}
            <div className="relative">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-ludo-board animate-float">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              
              {/* Floating sparkles */}
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-pulse" />
              <Star className="absolute -bottom-2 -left-2 w-6 h-6 text-orange-500 animate-bounce" />
              <Star className="absolute top-2 -left-4 w-4 h-4 text-red-500 animate-ping" />
            </div>

            {/* Winner announcement */}
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-800">
                {isPlayerWin ? '🎉 Congratulations! 🎉' : '😔 Game Over!'}
              </h2>
              
              <div className="bg-white/70 rounded-2xl p-4 shadow-lg">
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {isPlayerWin ? 'You Won!' : `${getWinnerName()} Won!`}
                </p>
                <div className={`text-2xl font-bold ${getWinnerColor()}`}>
                  {getWinnerName()}
                </div>
              </div>
            </div>

            {/* Winning amount */}
            {isPlayerWin && (
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-4 shadow-lg border-2 border-green-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="w-6 h-6 text-green-600" />
                  <span className="font-semibold text-green-800">You Won</span>
                </div>
                <div className="text-3xl font-bold text-green-600 animate-bounce">
                  ₹{winAmount}
                </div>
                <div className="text-sm text-green-700 mt-2">
                  🎊 Credited to your wallet! 🎊
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={onPlayAgain}
                className="w-full py-3 text-lg font-medium bg-gaming-gold text-black hover:bg-gaming-gold/90 shadow-gaming"
              >
                🎲 Play Again
              </Button>
              
              <Button
                onClick={onBackToLobby}
                variant="outline"
                className="w-full py-3 text-lg font-medium"
              >
                🏠 Back to Lobby
              </Button>
            </div>

            {/* Fun facts */}
            <div className="text-sm text-gray-600 bg-white/50 rounded-lg p-3">
              {isPlayerWin 
                ? "🌟 Great strategy! All your tokens made it home safely!" 
                : "🎯 Better luck next time! Practice makes perfect!"
              }
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confetti animation styles */}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default WinnerCelebration;