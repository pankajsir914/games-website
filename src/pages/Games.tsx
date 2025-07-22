
import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Gamepad2, 
  Target, 
  Plane, 
  Spade,
  Users, 
  Trophy, 
  Clock,
  Star
} from 'lucide-react';

const Games = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'color-prediction',
      title: 'Color Prediction',
      description: 'Predict the next color and win big! Fast-paced betting game.',
      icon: Target,
      route: '/color-prediction',
      players: '1.2K+',
      winRate: '45%',
      minBet: '₹1',
      status: 'live',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      id: 'ludo',
      title: 'Ludo',
      description: 'Classic board game with modern twists. Play with friends!',
      icon: Gamepad2,
      route: '/ludo',
      players: '850+',
      winRate: '25%',
      minBet: '₹5',
      status: 'live',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'aviator',
      title: 'Aviator',
      description: 'Crash game where timing is everything. Cash out before it crashes!',
      icon: Plane,
      route: '/aviator',
      players: '2.1K+',
      winRate: '38%',
      minBet: '₹1',
      status: 'live',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'rummy',
      title: 'Indian Rummy',
      description: 'Traditional 13-card rummy with multiplayer tournaments.',
      icon: Spade,
      route: '/rummy',
      players: '950+',
      winRate: '33%',
      minBet: '₹10',
      status: 'new',
      gradient: 'from-purple-500 to-violet-500'
    }
  ];

  const handlePlayGame = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Game Zone
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Choose your favorite game and start winning
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/70">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>5K+ Active Players</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>₹10L+ Daily Prizes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>24/7 Gaming</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {games.map((game) => {
            const IconComponent = game.icon;
            return (
              <Card 
                key={game.id} 
                className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 group overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${game.gradient}`} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${game.gradient}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-xl">{game.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {game.status === 'new' && (
                            <Badge className="bg-green-600 text-xs">NEW</Badge>
                          )}
                          {game.status === 'live' && (
                            <Badge className="bg-red-600 text-xs animate-pulse">LIVE</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <p className="text-white/80">{game.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-white/60 text-sm">Players</p>
                      <p className="text-white font-semibold">{game.players}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Win Rate</p>
                      <p className="text-green-400 font-semibold">{game.winRate}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Min Bet</p>
                      <p className="text-white font-semibold">{game.minBet}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePlayGame(game.route)}
                    className={`w-full bg-gradient-to-r ${game.gradient} hover:opacity-90 text-white font-semibold py-3 transform group-hover:scale-105 transition-all duration-300`}
                  >
                    Play Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Teen Patti', icon: '🃏' },
              { name: 'Dragon Tiger', icon: '🐉' },
              { name: 'Andar Bahar', icon: '🎯' }
            ].map((game, index) => (
              <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="py-8 text-center">
                  <div className="text-4xl mb-3">{game.icon}</div>
                  <h3 className="text-white font-semibold">{game.name}</h3>
                  <p className="text-white/60 text-sm mt-2">Coming Soon</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;
