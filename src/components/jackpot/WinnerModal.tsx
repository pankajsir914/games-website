
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useJackpot } from '@/hooks/useJackpot';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Sparkles, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WinnerModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [winnerData, setWinnerData] = useState<any>(null);
  const { winnersHistory } = useJackpot();
  const { user } = useAuth();

  useEffect(() => {
    if (!winnersHistory || winnersHistory.length === 0) return;

    const latestWinner = winnersHistory[0];
    const winTime = new Date(latestWinner.created_at).getTime();
    const now = new Date().getTime();
    
    // Show modal if the winner was announced in the last 2 minutes
    if (now - winTime < 120000) {
      setWinnerData(latestWinner);
      setShowModal(true);
      
      // Trigger confetti animation
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [winnersHistory]);

  if (!winnerData) return null;

  const isCurrentUser = user?.id === winnerData.user_id;

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-yellow-400/50">
        <div className="text-center p-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-ping w-32 h-32 bg-yellow-400/20 rounded-full"></div>
            </div>
            <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-6 mx-auto w-32 h-32 flex items-center justify-center">
              <Trophy className="h-16 w-16 text-black" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">
                {isCurrentUser ? '🎉 YOU WON! 🎉' : '🎊 Winner Announced! 🎊'}
              </h2>
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </div>

            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <p className="text-lg text-white mb-2">
                {isCurrentUser ? 'Congratulations!' : winnerData.profiles?.full_name || 'Anonymous Player'}
              </p>
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                ₹{winnerData.prize_amount.toFixed(2)}
              </div>
              <p className="text-sm text-gray-300">
                Winning Ticket: #{winnerData.winning_ticket_number}
              </p>
              <p className="text-sm text-gray-300">
                {winnerData.tier.toUpperCase()} Stakes Jackpot
              </p>
            </div>

            {isCurrentUser && (
              <div className="bg-green-500/20 p-4 rounded-lg border border-green-500/50">
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <Gift className="h-5 w-5" />
                  <p className="font-semibold">Prize credited to your wallet!</p>
                </div>
              </div>
            )}

            <Button 
              onClick={() => setShowModal(false)}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
            >
              {isCurrentUser ? 'Claim My Prize!' : 'Congratulations!'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
