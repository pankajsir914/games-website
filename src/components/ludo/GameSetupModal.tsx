import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Coins, Trophy, Clock } from 'lucide-react';

interface GameSetupModalProps {
  open: boolean;
  onClose: () => void;
  onStartGame: (playerCount: 2 | 4, entryFee: number) => void;
  walletBalance: number;
}

const GameSetupModal: React.FC<GameSetupModalProps> = ({
  open,
  onClose,
  onStartGame,
  walletBalance
}) => {
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<2 | 4>(2);
  const [selectedEntryFee, setSelectedEntryFee] = useState(100);

  const entryFeeOptions = [100, 250, 500, 1000, 2500];

  const handleStartGame = () => {
    onStartGame(selectedPlayerCount, selectedEntryFee);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-ludo-board border-0 text-black">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center text-gray-800 mb-6">
            🎲 Setup Your Ludo Game
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Count Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Choose Players
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all duration-300 ${
                  selectedPlayerCount === 2 
                    ? 'ring-4 ring-ludo-blue shadow-ludo-board scale-105' 
                    : 'hover:scale-102 hover:shadow-lg'
                }`}
                onClick={() => setSelectedPlayerCount(2)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <h4 className="font-bold text-lg mb-2">2 Players</h4>
                  <p className="text-sm text-gray-600">Quick & Intense</p>
                  <Badge className="mt-2 bg-ludo-blue text-white">Recommended</Badge>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-300 ${
                  selectedPlayerCount === 4 
                    ? 'ring-4 ring-ludo-blue shadow-ludo-board scale-105' 
                    : 'hover:scale-102 hover:shadow-lg'
                }`}
                onClick={() => setSelectedPlayerCount(4)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">👥👥</div>
                  <h4 className="font-bold text-lg mb-2">4 Players</h4>
                  <p className="text-sm text-gray-600">Classic Mode</p>
                  <Badge className="mt-2 bg-ludo-green text-white">Traditional</Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Entry Fee Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Entry Fee
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {entryFeeOptions.map((fee) => (
                <Button
                  key={fee}
                  variant={selectedEntryFee === fee ? "default" : "outline"}
                  className={`h-16 flex flex-col ${
                    selectedEntryFee === fee 
                      ? 'bg-gaming-gold text-black shadow-gaming' 
                      : 'hover:bg-gray-100'
                  } ${walletBalance < fee ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setSelectedEntryFee(fee)}
                  disabled={walletBalance < fee}
                >
                  <span className="font-bold">₹{fee}</span>
                  <span className="text-xs">Win ₹{fee * 2}</span>
                </Button>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">Your Balance: ₹{walletBalance}</span>
              <span className="flex items-center gap-1 text-green-600">
                <Trophy className="w-4 h-4" />
                Winner gets 2x entry fee
              </span>
            </div>
          </div>

          {/* Game Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Game Rules
              </h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Only you are the real player, others are AI bots</li>
                <li>• Each player gets 15 seconds per turn</li>
                <li>• Auto-move happens if timer expires</li>
                <li>• First player to get all tokens home wins</li>
                <li>• Winner gets 2x the entry fee amount</li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartGame}
              className="flex-1 bg-gaming-gold text-black hover:bg-gaming-gold/90 shadow-gaming"
              disabled={walletBalance < selectedEntryFee}
            >
              Start Game - ₹{selectedEntryFee}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameSetupModal;