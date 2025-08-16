import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Bot, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WalletCard } from '@/components/wallet/WalletCard';

interface GameMode {
  id: string;
  name: string;
  description: string;
  entry_fee: number;
  min_bet: number;
  max_bet: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface TeenPattiLobbyProps {
  onJoinGame: (gameId: string) => void;
}

export function TeenPattiLobby({ onJoinGame }: TeenPattiLobbyProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const { toast } = useToast();

  const [newGame, setNewGame] = useState({
    entryFee: 50,
    minBet: 10,
    maxBet: 1000,
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard'
  });

  const gameModes: GameMode[] = [
    {
      id: 'beginner',
      name: 'Beginner Table',
      description: 'Perfect for learning the basics',
      entry_fee: 25,
      min_bet: 5,
      max_bet: 100,
      difficulty: 'Easy'
    },
    {
      id: 'classic',
      name: 'Classic Table',
      description: 'Standard gameplay for regular players',
      entry_fee: 50,
      min_bet: 10,
      max_bet: 500,
      difficulty: 'Medium'
    },
    {
      id: 'high_stakes',
      name: 'High Stakes Table',
      description: 'For experienced players only',
      entry_fee: 100,
      min_bet: 25,
      max_bet: 2000,
      difficulty: 'Hard'
    }
  ];

  const startGame = async (mode: GameMode) => {
    try {
      setCreateLoading(true);
      const { data, error } = await supabase.functions.invoke('teen-patti-manager', {
        body: { 
          action: 'start-game',
          gameMode: mode.id,
          entryFee: mode.entry_fee,
          minBet: mode.min_bet,
          maxBet: mode.max_bet,
          difficulty: mode.difficulty
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Game Started!",
          description: "Starting your Teen Patti game against the system"
        });
        onJoinGame(data.gameId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
        variant: "destructive"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const createCustomGame = async () => {
    setCreateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager', {
        body: { 
          action: 'start-game',
          gameMode: 'custom',
          entryFee: newGame.entryFee,
          minBet: newGame.minBet,
          maxBet: newGame.maxBet,
          difficulty: newGame.difficulty
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Custom Game Started!",
          description: "Starting your custom Teen Patti game"
        });
        setShowCreateDialog(false);
        setNewGame({
          entryFee: 50,
          minBet: 10,
          maxBet: 1000,
          difficulty: 'Medium'
        });
        onJoinGame(data.gameId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start custom game",
        variant: "destructive"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-600';
      case 'Medium': return 'bg-yellow-600';
      case 'Hard': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Wallet Card */}
        <div className="lg:col-span-1">
          <WalletCard />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Teen Patti - System vs Player</h1>
              <p className="text-gray-300">Choose your game mode and challenge the system!</p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Play className="mr-2 h-4 w-4" />
                  Custom Game
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Custom Game</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entryFee" className="text-gray-300">Entry Fee (₹)</Label>
                      <Input
                        id="entryFee"
                        type="number"
                        value={newGame.entryFee}
                        onChange={(e) => setNewGame({ ...newGame, entryFee: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minBet" className="text-gray-300">Min Bet (₹)</Label>
                      <Input
                        id="minBet"
                        type="number"
                        value={newGame.minBet}
                        onChange={(e) => setNewGame({ ...newGame, minBet: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxBet" className="text-gray-300">Max Bet (₹)</Label>
                      <Input
                        id="maxBet"
                        type="number"
                        value={newGame.maxBet}
                        onChange={(e) => setNewGame({ ...newGame, maxBet: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="difficulty" className="text-gray-300">AI Difficulty</Label>
                      <select
                        id="difficulty"
                        value={newGame.difficulty}
                        onChange={(e) => setNewGame({ ...newGame, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={createCustomGame} 
                    disabled={createLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    {createLoading ? 'Starting...' : 'Start Custom Game'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Game Modes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {gameModes.map((mode) => (
              <Card key={mode.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-xl">{mode.name}</CardTitle>
                    <Badge className={`${getDifficultyColor(mode.difficulty)} text-white`}>
                      {mode.difficulty}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm">{mode.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Bot className="h-16 w-16 text-blue-400" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Entry Fee:</span>
                      <span className="text-yellow-400 font-semibold flex items-center">
                        <Coins className="h-3 w-3 mr-1" />
                        ₹{mode.entry_fee}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Bet Range:</span>
                      <span className="text-green-400">₹{mode.min_bet} - ₹{mode.max_bet}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Players:</span>
                      <span className="text-blue-400 flex items-center">
                        <Bot className="h-3 w-3 mr-1" />
                        You vs System
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => startGame(mode)}
                    disabled={createLoading}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {createLoading ? 'Starting...' : 'Start Game'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}