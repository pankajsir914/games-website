
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RummyRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RummyRulesModal: React.FC<RummyRulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">How to Play Indian Rummy</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-white">
          {/* Basic Rules */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-green-400">Basic Rules</h3>
              <ul className="space-y-2 text-sm">
                <li>• Each player gets 13 cards</li>
                <li>• Form sequences and sets to declare</li>
                <li>• Minimum 2 sequences required (1 must be pure)</li>
                <li>• One joker is selected randomly each game</li>
                <li>• Players take turns to pick and discard cards</li>
              </ul>
            </CardContent>
          </Card>

          {/* Sequences */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-blue-400">Sequences</h3>
              <div className="space-y-3">
                <div>
                  <Badge className="bg-green-600 mb-2">Pure Sequence</Badge>
                  <p className="text-sm">3 or more consecutive cards of the same suit without joker</p>
                  <p className="text-xs text-gray-400">Example: 4♥ 5♥ 6♥</p>
                </div>
                <div>
                  <Badge className="bg-blue-600 mb-2">Impure Sequence</Badge>
                  <p className="text-sm">3 or more consecutive cards with joker</p>
                  <p className="text-xs text-gray-400">Example: 4♥ Joker 6♥</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sets */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-purple-400">Sets</h3>
              <div>
                <p className="text-sm">3 or 4 cards of the same rank but different suits</p>
                <p className="text-xs text-gray-400">Example: 7♠ 7♥ 7♦</p>
              </div>
            </CardContent>
          </Card>

          {/* Jokers */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-yellow-400">Jokers</h3>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Printed Joker:</strong> The joker cards in the deck</li>
                <li>• <strong>Wild Joker:</strong> Randomly selected card for that game</li>
                <li>• Can substitute any card except in pure sequences</li>
                <li>• Essential for forming impure sequences and sets</li>
              </ul>
            </CardContent>
          </Card>

          {/* How to Win */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-orange-400">How to Win</h3>
              <ol className="space-y-2 text-sm">
                <li>1. Form at least 2 sequences (1 must be pure)</li>
                <li>2. Remaining cards can be sequences or sets</li>
                <li>3. Click "Declare" when ready</li>
                <li>4. System will validate your hand</li>
                <li>5. If valid, you win the round!</li>
              </ol>
            </CardContent>
          </Card>

          {/* Game Types */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-red-400">Game Types</h3>
              <div className="space-y-3">
                <div>
                  <Badge className="bg-blue-600 mb-2">Points Rummy</Badge>
                  <p className="text-sm">Single deal game, winner takes all</p>
                </div>
                <div>
                  <Badge className="bg-green-600 mb-2">Pool Rummy</Badge>
                  <p className="text-sm">Play until players reach score limit</p>
                </div>
                <div>
                  <Badge className="bg-purple-600 mb-2">Deals Rummy</Badge>
                  <p className="text-sm">Fixed number of deals, best score wins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-pink-400">Pro Tips</h3>
              <ul className="space-y-2 text-sm">
                <li>• Focus on forming pure sequence first</li>
                <li>• Discard high-value cards early</li>
                <li>• Watch opponent's picks and discards</li>
                <li>• Use jokers wisely in impure sequences</li>
                <li>• Drop early if hand looks bad</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
