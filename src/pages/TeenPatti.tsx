import { useState } from 'react';
import { TeenPattiLobby } from '@/components/teenPatti/TeenPattiLobby';
import { TeenPattiGame } from '@/components/teenPatti/TeenPattiGame';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import Navigation from '@/components/Navigation';

export default function TeenPatti() {
  const { user } = useAuth();
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(!user);

  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Teen Patti</h1>
            <p className="text-gray-300 mb-8">Please sign in to play Teen Patti</p>
            <button
              onClick={() => setShowAuth(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Sign In to Play
            </button>
          </div>
        </div>
        {showAuth && <AuthModal open={showAuth} onOpenChange={setShowAuth} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navigation />
      
      {currentGameId ? (
        <TeenPattiGame 
          gameId={currentGameId} 
          onLeaveGame={() => setCurrentGameId(null)} 
        />
      ) : (
        <TeenPattiLobby onJoinGame={setCurrentGameId} />
      )}
    </div>
  );
}