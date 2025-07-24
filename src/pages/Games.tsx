
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { Link } from 'react-router-dom';
import { Gamepad2, Plane, Palette, Crown, Trophy } from 'lucide-react';

const Games = () => {
  const games = [
    {
      title: "Ludo Classic",
      description: "Play the classic board game with friends online",
      icon: Gamepad2,
      path: "/ludo",
      color: "from-green-400 to-blue-500"
    },
    {
      title: "Aviator",
      description: "Fly high and cash out before the crash",
      icon: Plane,
      path: "/aviator",
      color: "from-purple-400 to-pink-600"
    },
    {
      title: "Color Prediction",
      description: "Predict colors and win instant rewards",
      icon: Palette,
      path: "/color-prediction",
      color: "from-yellow-400 to-red-500"
    },
    {
      title: "Rummy",
      description: "Classic card game with real players",
      icon: Crown,
      path: "/rummy",
      color: "from-indigo-400 to-purple-600"
    },
    {
      title: "Jackpot Games",
      description: "Buy tickets and win massive jackpots",
      icon: Trophy,
      path: "/jackpot",
      color: "from-yellow-400 to-orange-500",
      featured: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Game</h1>
          <p className="text-xl text-gray-300">
            Experience the thrill of online gaming with real rewards
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {games.map((game) => {
            const IconComponent = game.icon;
            return (
              <Card 
                key={game.title} 
                className={`group hover:scale-105 transition-all duration-300 bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 ${
                  game.featured ? 'ring-2 ring-yellow-400/50' : ''
                }`}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${game.color} p-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-full h-full text-white" />
                  </div>
                  <CardTitle className="text-white text-xl">
                    {game.title}
                    {game.featured && (
                      <span className="ml-2 px-2 py-1 text-xs bg-yellow-400 text-black rounded-full font-bold">
                        NEW!
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {game.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link to={game.path}>
                    <Button 
                      className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 text-white font-semibold py-3 transition-all duration-300`}
                    >
                      Play Now
                    </Button>
                  </Link>
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
