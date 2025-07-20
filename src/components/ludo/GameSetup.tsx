
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Users, Bot, Play } from 'lucide-react';

interface GameSetupProps {
  onStartGame: (playerCount: number, withAI: boolean) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [withAI, setWithAI] = useState<boolean>(false);

  const handleStartGame = () => {
    onStartGame(playerCount, withAI);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-yellow-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-4 border-yellow-400">
        <CardHeader className="text-center bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-t-lg">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Users className="w-8 h-8" />
            Ludo Game Setup
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-8 space-y-8">
          {/* Player Count Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-700">Number of Players:</Label>
            <RadioGroup 
              value={playerCount.toString()} 
              onValueChange={(value) => setPlayerCount(parseInt(value))}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
                <RadioGroupItem value="2" id="2-players" />
                <Label htmlFor="2-players" className="font-medium cursor-pointer">
                  2 Players
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
                <RadioGroupItem value="4" id="4-players" />
                <Label htmlFor="4-players" className="font-medium cursor-pointer">
                  4 Players
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* AI Option */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-700">Game Mode:</Label>
            <RadioGroup 
              value={withAI ? "ai" : "human"} 
              onValueChange={(value) => setWithAI(value === "ai")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
                <RadioGroupItem value="human" id="human" />
                <Label htmlFor="human" className="font-medium cursor-pointer flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Play with Friends
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
                <RadioGroupItem value="ai" id="ai" />
                <Label htmlFor="ai" className="font-medium cursor-pointer flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Play with AI
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Start Game Button */}
          <Button 
            onClick={handleStartGame}
            className="w-full py-4 text-lg font-bold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all shadow-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSetup;
