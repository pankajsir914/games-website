
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, 
  Target, 
  Plane, 
  Dice6,
  Users,
  Trophy,
  Clock,
  Spade
} from 'lucide-react';

const Games = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'color-prediction',
      title: 'Color Prediction',
      description: 'Predict the winning color and win big prizes!',
      icon: Target,
      route: '/color-prediction',
      players: '1000+ Online',
      minBet: '₹1',
      status: 'Live',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      id: 'ludo',
      title: 'Ludo',
      description: 'Classic board game with real money prizes',
      icon: Dice6,
      route: '/ludo',
      players: '500+ Online',
      minBet: '₹5',
      status: 'Live',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'aviator',
      title: 'Aviator',
      description: 'Multiplier crash game - cash out before it crashes!',
      icon: Plane,
      route: '/aviator',
      players: '2000+ Online',
      minBet: '₹1',
      status: 'Live',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'rummy',
      title: 'Indian Rummy',
      description: 'Classic 13-card rummy with real cash prizes',
      icon: Spade,
      route: '/rummy',
      players: '800+ Online',
      minBet: '₹2',
      status: 'Live',
      gradient: 'from-purple-500 to-violet-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Game
          </h1>
          <p className="text-lg text-white/80">
            Play exciting games and win real money prizes!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => {
            const IconComponent = game.icon;
            return (
              <Card 
                key={game.id}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(game.route)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${game.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl">{game.title}</CardTitle>
                  <CardDescription className="text-white/70">
                    {game.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-white/80">
                      <Users className="h-4 w-4" />
                      <span>{game.players}</span>
                    </div>
                    <Badge className="bg-green-600 hover:bg-green-700">
                      {game.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <div className="flex items-center space-x-1">
                      <Trophy className="h-4 w-4" />
                      <span>Min Bet: {game.minBet}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>24/7</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(game.route);
                    }}
                  >
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Play Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Games;
