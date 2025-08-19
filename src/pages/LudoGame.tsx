import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import LudoLobby from '@/components/ludo/LudoLobby';
import { LudoAuth } from '@/components/ludo/LudoAuth';
import { useLudoAuth } from '@/hooks/useLudoAuth';
import { useLudoGame } from '@/hooks/useLudoGame';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins } from 'lucide-react';

export default function LudoGame() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout, loading: authLoading } = useLudoAuth();
  const { 
    currentMatch, 
    gameState, 
    createMatch, 
    rollDice, 
    makeMove, 
    getMatchHistory,
    loading: gameLoading 
  } = useLudoGame();
  
  const [gameMode, setGameMode] = useState<'lobby' | 'game'>('lobby');

  // Handle creating a new match
  const handleCreateMatch = async (mode: '2p' | '4p', entryFee: number, botDifficulty: 'easy' | 'normal' | 'pro') => {
    try {
      const result = await createMatch(mode, entryFee, botDifficulty);
      if (result.success) {
        setGameMode('game');
      }
    } catch (error) {
      console.error('Failed to create match:', error);
    }
  };

  // Handle going back to lobby
  const handleBackToLobby = () => {
    setGameMode('lobby');
  };

  // Handle dice roll
  const handleRollDice = async () => {
    if (!currentMatch) return;
    
    try {
      const idempotencyKey = `roll_${Date.now()}_${Math.random()}`;
      await rollDice(currentMatch.id, idempotencyKey);
    } catch (error) {
      console.error('Failed to roll dice:', error);
    }
  };

  // Handle token move
  const handleTokenMove = async (moveId: string, stateHash: string) => {
    if (!currentMatch) return;
    
    try {
      const idempotencyKey = `move_${Date.now()}_${Math.random()}`;
      await makeMove(currentMatch.id, moveId, stateHash, idempotencyKey);
    } catch (error) {
      console.error('Failed to make move:', error);
    }
  };

  // Show authentication screen if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">🎲 Ludo Game</h1>
              <p className="text-gray-300">Play classic Ludo with tokens and win big!</p>
            </div>
            <LudoAuth onLogin={login} loading={authLoading} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Navigation />
      
      <div className="pt-20 px-4">
        {/* Header with user info */}
        <div className="max-w-6xl mx-auto mb-6">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {gameMode === 'game' && (
                    <Button
                      variant="outline"
                      onClick={handleBackToLobby}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Lobby
                    </Button>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">Welcome, {user?.username}!</h2>
                    <div className="flex items-center gap-2 text-yellow-300">
                      <Coins className="w-4 h-4" />
                      <span className="font-semibold">{user?.walletBalance} tokens</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={logout}
                  className="bg-red-500/20 border-red-500/30 text-white hover:bg-red-500/30"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main game content */}
        <div className="max-w-6xl mx-auto">
          {gameMode === 'lobby' ? (
            <LudoLobby
              user={user!}
              onCreateMatch={handleCreateMatch}
              onGetHistory={getMatchHistory}
              loading={gameLoading}
            />
          ) : (
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-4">Game Board Coming Soon</h2>
              <p>Game board component will be implemented next</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}