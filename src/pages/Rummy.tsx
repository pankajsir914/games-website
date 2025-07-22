
import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { RummyLobby } from '@/components/rummy/RummyLobby';
import { RummyGameTable } from '@/components/rummy/RummyGameTable';
import { RummyRulesModal } from '@/components/rummy/RummyRulesModal';
import { Button } from '@/components/ui/button';
import { HelpCircle, Trophy, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Rummy = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'lobby' | 'game'>('lobby');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const handleJoinGame = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentView('game');
  };

  const handleLeaveGame = () => {
    setCurrentSessionId(null);
    setCurrentView('lobby');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Please login to play Rummy</h2>
            <p className="text-lg opacity-90">Join exciting multiplayer rummy games!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />
      
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Indian Rummy</h1>
              <div className="flex items-center space-x-2 text-white/80">
                <Users className="h-4 w-4" />
                <span className="text-sm">2-6 Players</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRules(true)}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                How to Play
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <div>
                <h3 className="font-semibold">Active Tables</h3>
                <p className="text-sm opacity-80">Join ongoing games</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <h3 className="font-semibold">Players Online</h3>
                <p className="text-sm opacity-80">Ready to play</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-green-400" />
              <div>
                <h3 className="font-semibold">Quick Match</h3>
                <p className="text-sm opacity-80">Fast gameplay</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {currentView === 'lobby' ? (
          <RummyLobby onJoinGame={handleJoinGame} />
        ) : (
          <RummyGameTable 
            sessionId={currentSessionId!} 
            onLeaveGame={handleLeaveGame}
          />
        )}
      </div>

      {/* Rules Modal */}
      <RummyRulesModal 
        isOpen={showRules} 
        onClose={() => setShowRules(false)} 
      />
    </div>
  );
};

export default Rummy;
