import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeenPattiTable } from './TeenPattiTable';
import { BettingControls } from './BettingControls';
import { useWallet } from '@/hooks/useWallet';
import { useGameSounds } from '@/hooks/useGameSounds';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Trophy, Coins, TrendingUp, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  biggestWin: number;
  currentStreak: number;
}

export const TeenPattiGameplay = () => {
  const [gameState, setGameState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bootAmount] = useState(10);
  const [currentBet, setCurrentBet] = useState(10);
  const [isBlind, setIsBlind] = useState(true);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    biggestWin: 0,
    currentStreak: 0
  });
  
  const { wallet } = useWallet();
  const { playClick, playWin, playLose, playCardFlip } = useGameSounds();
  const balance = wallet?.current_balance || 0;

  // Start new game
  const startNewGame = async () => {
    if (balance < bootAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ₹${bootAmount} to start a game`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    playClick();

    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager', {
        body: { 
          action: 'start-game',
          bootAmount 
        }
      });

      if (error) throw error;

      setGameState(data.gameState);
      setIsBlind(true);
      
      toast({
        title: "Game Started!",
        description: "Cards have been dealt. Good luck!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Place bet action
  const placeBet = async (amount: number, action: string) => {
    if (!gameState || gameState.status !== 'active') return;

    setIsLoading(true);
    playClick();

    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager', {
        body: {
          action: 'place-bet',
          gameId: gameState.id,
          betAmount: amount,
          betAction: action,
          isBlind
        }
      });

      if (error) throw error;

      setGameState(data.gameState);
      setCurrentBet(amount);
      
      // Check if game ended
      if (data.gameState.winner) {
        handleGameEnd(data.gameState);
      }

    } catch (error: any) {
      toast({
        title: "Bet Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fold action
  const fold = async () => {
    if (!gameState || gameState.status !== 'active') return;

    setIsLoading(true);
    playLose();

    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager', {
        body: {
          action: 'fold',
          gameId: gameState.id
        }
      });

      if (error) throw error;

      setGameState(data.gameState);
      handleGameEnd(data.gameState);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show cards
  const show = async () => {
    if (!gameState || gameState.status !== 'active') return;
    if (gameState.totalPot < currentBet * 4) {
      toast({
        title: "Cannot Show",
        description: "Pot must be at least 4x the current bet to show",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    playCardFlip();

    try {
      const { data, error } = await supabase.functions.invoke('teen-patti-manager', {
        body: {
          action: 'show',
          gameId: gameState.id
        }
      });

      if (error) throw error;

      setGameState(data.gameState);
      handleGameEnd(data.gameState);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle game end
  const handleGameEnd = (state: any) => {
    if (state.winner === 'player') {
      playWin();
      setGameStats(prev => ({
        ...prev,
        totalGames: prev.totalGames + 1,
        totalWins: prev.totalWins + 1,
        currentStreak: prev.currentStreak + 1,
        biggestWin: Math.max(prev.biggestWin, state.winAmount || 0)
      }));
      
      toast({
        title: "🎉 You Win!",
        description: `Won ₹${state.winAmount} with ${state.winningHand}`,
      });
    } else {
      playLose();
      setGameStats(prev => ({
        ...prev,
        totalGames: prev.totalGames + 1,
        totalLosses: prev.totalLosses + 1,
        currentStreak: 0
      }));
      
      toast({
        title: "Dealer Wins",
        description: `Dealer had ${state.winningHand}`,
        variant: "destructive"
      });
    }
  };

  // Toggle blind/seen
  const toggleBlindSeen = () => {
    if (!gameState || gameState.status !== 'active') return;
    setIsBlind(!isBlind);
    playCardFlip();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            Teen Patti - Classic
          </motion.h1>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2 border-primary/50 text-primary">
              <Star className="w-4 h-4 mr-1" />
              Interactive Gameplay
            </Badge>
            <Badge variant="outline" className="px-4 py-2 border-accent/50 text-accent">
              <Trophy className="w-4 h-4 mr-1" />
              Player vs Dealer
            </Badge>
          </div>
        </div>

        {/* Stats Bar */}
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Coins className="w-4 h-4" />
                <span className="text-xs">Balance</span>
              </div>
              <p className="text-xl font-bold text-primary">₹{balance}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs">Wins</span>
              </div>
              <p className="text-xl font-bold text-green-500">{gameStats.totalWins}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Games</span>
              </div>
              <p className="text-xl font-bold">{gameStats.totalGames}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Streak</span>
              </div>
              <p className="text-xl font-bold text-orange-500">{gameStats.currentStreak}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Star className="w-4 h-4" />
                <span className="text-xs">Best Win</span>
              </div>
              <p className="text-xl font-bold text-yellow-500">₹{gameStats.biggestWin}</p>
            </div>
          </div>
        </Card>

        {/* Game Table */}
        {gameState ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <TeenPattiTable
              gameState={gameState}
              onPlaceBet={placeBet}
              onFold={fold}
              onShow={show}
              userBalance={balance}
              isLoading={isLoading}
            />
          </motion.div>
        ) : (
          <Card className="p-12 bg-card/80 backdrop-blur-sm border-border/50 text-center">
            <Trophy className="w-24 h-24 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Play Teen Patti?</h2>
            <p className="text-muted-foreground mb-8">
              Boot amount: ₹{bootAmount} | Classic 3-card poker game
            </p>
            <Button
              size="lg"
              className="px-8 py-6 text-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              onClick={startNewGame}
              disabled={isLoading || balance < bootAmount}
            >
              {isLoading ? "Starting..." : "Start New Game"}
            </Button>
          </Card>
        )}

        {/* Betting Controls */}
        {gameState?.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BettingControls
              isMyTurn={true}
              currentBet={currentBet}
              isBlind={isBlind}
              isSeen={!isBlind}
              onPlaceBet={(betType: string, amount: number) => placeBet(amount, betType)}
              activePlayers={2}
            />
          </motion.div>
        )}

        {/* Game Rules */}
        <Card className="p-6 bg-card/60 backdrop-blur-sm border-border/30">
          <h3 className="text-lg font-bold mb-4">Game Rules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-2">Hand Rankings (Highest to Lowest):</p>
              <ul className="space-y-1">
                <li>• <span className="text-yellow-500">Trail/Set</span> - Three of same rank</li>
                <li>• <span className="text-orange-500">Pure Sequence</span> - Sequence in same suit</li>
                <li>• <span className="text-blue-500">Sequence</span> - Three consecutive cards</li>
                <li>• <span className="text-green-500">Color</span> - Three cards of same suit</li>
                <li>• <span className="text-purple-500">Pair</span> - Two of same rank</li>
                <li>• <span className="text-gray-500">High Card</span> - None of above</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">Betting Options:</p>
              <ul className="space-y-1">
                <li>• <span className="text-blue-500">Blind</span> - Play without seeing cards (1x bet)</li>
                <li>• <span className="text-green-500">Chaal</span> - Play after seeing cards (2x bet)</li>
                <li>• <span className="text-orange-500">Show</span> - Compare cards (min 4x pot)</li>
                <li>• <span className="text-red-500">Pack/Fold</span> - Give up and lose bet</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};