
import React from 'react';
import { GameState } from '@/types/ludo';
import { Crown, Timer, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface GameHeaderProps {
  gameState: GameState;
}

const GameHeader: React.FC<GameHeaderProps> = ({ gameState }) => {
  const getPlayerColor = () => {
    const colors = {
      red: 'from-red-400 to-red-600',
      yellow: 'from-yellow-400 to-yellow-600',
      green: 'from-green-400 to-green-600',
      blue: 'from-blue-400 to-blue-600'
    };
    return colors[gameState.currentPlayer];
  };

  const getPlayerName = () => {
    return gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1);
  };

  const getPlayerInitial = () => {
    return gameState.currentPlayer.charAt(0).toUpperCase();
  };

  return (
    <div className="text-center mb-4 md:mb-8 px-4">
      {/* Game Title */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-2 md:gap-3">
          <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 drop-shadow-lg" />
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Ludo Champions
          </span>
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">Premium Gaming Experience</p>
      </div>
      
      {/* Player Cards */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 max-w-4xl mx-auto">
        {/* Current Player Card */}
        <div className="bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/30 shadow-2xl w-full sm:w-auto min-w-[280px]">
          <div className="flex items-center justify-center space-x-4">
            {/* Player Avatar */}
            <div className="relative">
              <Avatar className="w-12 h-12 md:w-16 md:h-16 border-3 border-white/50 shadow-xl">
                <AvatarFallback className={`bg-gradient-to-br ${getPlayerColor()} text-white font-bold text-lg md:text-xl`}>
                  {getPlayerInitial()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Player Info */}
            <div className="text-left">
              <div className="text-xs md:text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <User className="w-3 h-3 md:w-4 md:h-4" />
                Current Turn
              </div>
              <div className="font-bold text-lg md:text-xl text-foreground mb-1">
                {getPlayerName()} Player
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Timer className="w-3 h-3 md:w-4 md:h-4" />
                <span>Last Roll: {gameState.lastRoll || '-'}</span>
              </div>
            </div>
          </div>
          
          {/* Consecutive Sixes Indicator */}
          {gameState.consecutiveSixes > 0 && (
            <div className="mt-3 md:mt-4 p-2 md:p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30">
              <div className="text-center">
                <div className="text-xs text-yellow-700 mb-1">Consecutive Sixes</div>
                <div className="text-lg md:text-xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  {Array.from({ length: gameState.consecutiveSixes }, (_, i) => (
                    <span key={i} className="text-yellow-500">⚅</span>
                  ))}
                  <span className="ml-1">{gameState.consecutiveSixes}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 text-center w-full sm:w-auto">
          {/* Red Player Stats */}
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-red-400/30 shadow-lg">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-sm md:text-base">R</span>
            </div>
            <div className="text-xs md:text-sm text-red-700 font-semibold">Red Player</div>
            <div className="text-xs text-red-600">Active</div>
          </div>

          {/* Yellow Player Stats */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-yellow-400/30 shadow-lg">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-sm md:text-base">Y</span>
            </div>
            <div className="text-xs md:text-sm text-yellow-700 font-semibold">Yellow Player</div>
            <div className="text-xs text-yellow-600">Active</div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white/90 via-white/80 to-white/90 backdrop-blur-lg border-b border-white/30 p-3 md:hidden shadow-lg">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-white/50">
              <AvatarFallback className={`bg-gradient-to-br ${getPlayerColor()} text-white font-bold text-sm`}>
                {getPlayerInitial()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-foreground">{getPlayerName()}</div>
              <div className="text-xs text-muted-foreground">Turn Active</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Last Roll</div>
            <div className="text-lg font-bold text-primary">{gameState.lastRoll || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
