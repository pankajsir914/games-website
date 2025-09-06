import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { TeenPattiCard } from './TeenPattiCard';
import { BettingControls } from './BettingControls';
import ChipStack from '@/components/game/ChipStack';
import { useGameSounds } from '@/hooks/useGameSounds';
import { Coins, Eye, EyeOff, Trophy, User, Bot } from 'lucide-react';

interface PlayerData {
  id: string;
  name: string;
  cards: any[];
  isDealer?: boolean;
  isSeen?: boolean;
  isActive?: boolean;
  hasFolded?: boolean;
  totalBet?: number;
  lastAction?: string;
}

interface TeenPattiTableProps {
  gameState: any;
  onPlaceBet: (amount: number, action: string) => void;
  onFold: () => void;
  onShow: () => void;
  userBalance: number;
  isLoading?: boolean;
}

export const TeenPattiTable = ({ 
  gameState, 
  onPlaceBet, 
  onFold, 
  onShow, 
  userBalance,
  isLoading 
}: TeenPattiTableProps) => {
  const [showPlayerCards, setShowPlayerCards] = useState(false);
  const [potAnimation, setPotAnimation] = useState(false);
  const { playCardFlip, playChipPlace, playWin, playLose } = useGameSounds();

  // Player positions for 2-player game (You vs System)
  const playerPosition = { bottom: '10%', left: '50%', transform: 'translateX(-50%)' };
  const dealerPosition = { top: '10%', left: '50%', transform: 'translateX(-50%)' };

  const handleCardReveal = () => {
    setShowPlayerCards(!showPlayerCards);
    playCardFlip();
  };

  useEffect(() => {
    if (gameState?.lastAction === 'bet') {
      setPotAnimation(true);
      playChipPlace();
      setTimeout(() => setPotAnimation(false), 500);
    }
  }, [gameState?.totalPot]);

  useEffect(() => {
    if (gameState?.winner) {
      if (gameState.winner === 'player') {
        playWin();
      } else {
        playLose();
      }
    }
  }, [gameState?.winner]);

  const getChipStacks = (amount: number) => {
    const stacks = [];
    const chips = [500, 100, 50, 25, 10, 5];
    let remaining = amount;

    for (const chip of chips) {
      const count = Math.floor(remaining / chip);
      if (count > 0) {
        stacks.push({ value: chip, count: Math.min(count, 5) });
        remaining -= chip * count;
      }
    }
    return stacks;
  };

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-green-900 via-green-800 to-green-900 rounded-3xl shadow-2xl overflow-hidden">
      {/* Table Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" 
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`,
          }}
        />
      </div>

      {/* Table Border */}
      <div className="absolute inset-4 rounded-3xl border-4 border-yellow-600/30 shadow-inner" />
      
      {/* Center Pot Area */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={potAnimation ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <div className="bg-black/30 rounded-full w-48 h-48 flex flex-col items-center justify-center backdrop-blur-sm border-2 border-yellow-500/30">
            <Coins className="w-8 h-8 text-yellow-400 mb-2" />
            <span className="text-yellow-400 text-sm font-medium">POT</span>
            <span className="text-white text-3xl font-bold">₹{gameState?.totalPot || 0}</span>
            
            {/* Chip Stacks around pot */}
            {gameState?.totalPot > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-32 h-32">
                  {getChipStacks(gameState.totalPot).map((stack, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        top: `${50 + 30 * Math.sin((i * 2 * Math.PI) / 4)}%`,
                        left: `${50 + 30 * Math.cos((i * 2 * Math.PI) / 4)}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <ChipStack
                        value={stack.value}
                        count={stack.count}
                        size="sm"
                        color={
                          stack.value >= 500 ? 'purple' :
                          stack.value >= 100 ? 'black' :
                          stack.value >= 50 ? 'blue' :
                          stack.value >= 25 ? 'green' :
                          'red'
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Dealer/System Player */}
      <motion.div
        className="absolute"
        style={dealerPosition}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-black/40 rounded-full p-4 backdrop-blur-sm border-2 border-red-500/50">
            <Bot className="w-12 h-12 text-red-400" />
          </div>
          <div className="text-center">
            <span className="text-white font-bold text-lg">Dealer</span>
            {gameState?.dealerAction && (
              <Badge className="bg-red-500/80 text-white mt-1">
                {gameState.dealerAction}
              </Badge>
            )}
          </div>
          
          {/* Dealer Cards */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, rotateY: 180 }}
                animate={{ opacity: 1, rotateY: gameState?.showDealerCards ? 0 : 180 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <TeenPattiCard
                  card={gameState?.dealerCards?.[i - 1]}
                  isVisible={gameState?.showDealerCards}
                  size="medium"
                />
              </motion.div>
            ))}
          </div>

          {gameState?.dealerBet > 0 && (
            <div className="text-yellow-400 font-bold">
              Bet: ₹{gameState.dealerBet}
            </div>
          )}
        </div>
      </motion.div>

      {/* Player */}
      <motion.div
        className="absolute"
        style={playerPosition}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center space-y-3">
          {/* Player Cards */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                onClick={handleCardReveal}
                className="cursor-pointer"
              >
                <TeenPattiCard
                  card={gameState?.playerCards?.[i - 1]}
                  isVisible={showPlayerCards}
                  size="large"
                />
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <span className="text-white font-bold text-lg">You</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-500/80 text-white">
                ₹{userBalance}
              </Badge>
              {showPlayerCards ? (
                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                  <Eye className="w-3 h-3 mr-1" />
                  Seen
                </Badge>
              ) : (
                <Badge variant="outline" className="border-gray-500 text-gray-400">
                  <EyeOff className="w-3 h-3 mr-1" />
                  Blind
                </Badge>
              )}
            </div>
          </div>

          <div className="bg-black/40 rounded-full p-4 backdrop-blur-sm border-2 border-green-500/50">
            <User className="w-12 h-12 text-green-400" />
          </div>
        </div>
      </motion.div>

      {/* Game Status */}
      {gameState?.status && (
        <div className="absolute top-4 right-4">
          <Badge className="px-4 py-2 text-lg" variant={
            gameState.status === 'active' ? 'default' :
            gameState.status === 'waiting' ? 'secondary' :
            'outline'
          }>
            {gameState.status.toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Winner Announcement */}
      <AnimatePresence>
        {gameState?.winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-8 rounded-2xl shadow-2xl">
              <Trophy className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white text-center mb-2">
                {gameState.winner === 'player' ? 'You Win!' : 'Dealer Wins!'}
              </h2>
              <p className="text-yellow-200 text-center text-lg">
                {gameState.winningHand}
              </p>
              {gameState.winAmount && (
                <p className="text-2xl font-bold text-yellow-300 text-center mt-4">
                  +₹{gameState.winAmount}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};