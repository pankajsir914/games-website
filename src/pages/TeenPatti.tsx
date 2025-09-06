import { useState } from 'react';
import { TeenPattiGameplay } from '@/components/teenPatti/TeenPattiGameplay';
import { TeenPattiLive } from '@/components/teenPatti/TeenPattiLive';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Activity, Gamepad2 } from 'lucide-react';

export default function TeenPatti() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(!user);
  const [gameMode, setGameMode] = useState<'live' | 'classic'>('live');

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
    <div className="min-h-screen">
      <Navigation />
      
      {/* Game Mode Selector */}
      <div className="max-w-7xl mx-auto p-4 mb-4">
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={gameMode === 'live' ? 'default' : 'outline'}
              onClick={() => setGameMode('live')}
              className="flex items-center gap-2"
              size="lg"
            >
              <Activity className="w-5 h-5" />
              Live Teen Patti
            </Button>
            <Button
              variant={gameMode === 'classic' ? 'default' : 'outline'}
              onClick={() => setGameMode('classic')}
              className="flex items-center gap-2"
              size="lg"
            >
              <Gamepad2 className="w-5 h-5" />
              Classic Teen Patti
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Game Component */}
      {gameMode === 'live' ? <TeenPattiLive /> : <TeenPattiGameplay />}
    </div>
  );
}