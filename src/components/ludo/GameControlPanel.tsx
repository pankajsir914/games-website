import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, RotateCcw, Users, Trophy, Clock } from 'lucide-react';
import { GameState, ActivePlayer } from '@/types/ludo';
import GameTimerComponent from './GameTimerComponent';

interface GameControlPanelProps {
  gameState: GameState;
  onResetGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playerCount: number;
  entryFee: number;
  onTimeUp: () => void;
}

const GameControlPanel: React.FC<GameControlPanelProps> = ({
  gameState,
  onResetGame,
  isMuted,
  onToggleMute,
  playerCount,
  entryFee,
  onTimeUp
}) => {
  const getCurrentPlayerName = () => {
    return gameState.currentPlayer === 'red' ? 'Your Turn' : `${gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1)} Bot`;
  };

  const getCurrentPlayerColor = () => {
    const colors = {
      red: 'bg-gradient-ludo-red',
      yellow: 'bg-gradient-ludo-yellow',
      green: 'bg-gradient-ludo-green',
      blue: 'bg-gradient-ludo-blue',
    };
    return colors[gameState.currentPlayer] || colors.red;
  };

  return (
    <div className="space-y-4">
      {/* Current Turn Indicator */}
      <Card className="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm border-2 border-white/50 shadow-ludo-board">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-center">Current Turn</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center space-y-3">
            {/* Player indicator */}
            <div className={`w-16 h-16 rounded-full ${getCurrentPlayerColor()} border-4 border-white shadow-ludo-token flex items-center justify-center`}>
              <div className="w-8 h-8 bg-white/80 rounded-full"></div>
            </div>
            
            <Badge className="text-sm font-semibold px-3 py-1">
              {getCurrentPlayerName()}
            </Badge>

            {/* Turn timer */}
            <GameTimerComponent
              timeLimit={15}
              onTimeUp={onTimeUp}
              isActive={!gameState.isRolling && !gameState.winner}
            />
          </div>
        </CardContent>
      </Card>

      {/* Game Info */}
      <Card className="bg-gradient-to-br from-blue-50/90 to-purple-50/90 backdrop-blur-sm border-2 border-white/50 shadow-ludo-board">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Game Info
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              Players:
            </span>
            <Badge variant="outline">{playerCount} Players</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Entry Fee:</span>
            <Badge className="bg-gaming-gold text-black">₹{entryFee}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Prize Pool:</span>
            <Badge className="bg-green-500 text-white">₹{entryFee * 2}</Badge>
          </div>
          
          {gameState.lastRoll && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Last Roll:</span>
              <Badge variant="outline" className="font-bold">
                🎲 {gameState.lastRoll}
              </Badge>
            </div>
          )}
          
          {gameState.consecutiveSixes > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Consecutive 6s:</span>
              <Badge variant="destructive">{gameState.consecutiveSixes}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Controls */}
      <Card className="bg-gradient-to-br from-gray-50/90 to-white/90 backdrop-blur-sm border-2 border-white/50 shadow-ludo-board">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Controls</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <Button
            onClick={onToggleMute}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isMuted ? 'Unmute' : 'Mute'} Sounds
          </Button>
          
          <Button
            onClick={onResetGame}
            variant="outline"
            className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Game
          </Button>
        </CardContent>
      </Card>

      {/* Game Rules */}
      <Card className="bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-sm border-2 border-white/50 shadow-ludo-board">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Quick Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-xs space-y-1 text-gray-700">
            <li>• Roll 6 to move token out of base</li>
            <li>• Get another turn on rolling 6</li>
            <li>• 3 consecutive 6s = lose turn</li>
            <li>• Capture opponents to send them back</li>
            <li>• First to get all tokens home wins!</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameControlPanel;