
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Games = () => {
  const navigate = useNavigate();

  const games = [
    {
      title: 'Ludo',
      description: 'Classic board game with real money betting',
      icon: '🎲',
      path: '/ludo',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Aviator',
      description: 'High-flying multiplier crash game',
      icon: '✈️',
      path: '/aviator',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Color Prediction',
      description: 'Predict the next color and win big',
      icon: '🎨',
      path: '/color-prediction',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Andar Bahar',
      description: 'Traditional Indian card game',
      icon: '🃏',
      path: '/andar-bahar',
      color: 'from-red-500 to-orange-600'
    },
    {
      title: 'Roulette',
      description: 'Classic casino wheel game with multiple betting options',
      icon: '🎰',
      path: '/roulette',
      color: 'from-purple-600 to-indigo-700'
    },
    {
      title: 'Rummy',
      description: 'Skill-based card game tournaments',
      icon: '🎯',
      path: '/rummy',
      color: 'from-yellow-500 to-amber-600'
    },
    {
      title: 'Poker',
      description: 'Texas Hold\'em poker tables',
      icon: '♠️',
      path: '/poker',
      color: 'from-gray-700 to-gray-900'
    },
    {
      title: 'Jackpot',
      description: 'Progressive jackpot lottery game',
      icon: '💰',
      path: '/jackpot',
      color: 'from-yellow-400 to-yellow-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="text-center text-white mb-12">
          <h1 className="text-4xl font-bold mb-4">🎮 Game Hub</h1>
          <p className="text-xl text-gray-300">
            Choose your game and start winning real money!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <Card key={game.title} className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${game.color} flex items-center justify-center text-2xl mb-4`}>
                  {game.icon}
                </div>
                <CardTitle className="text-white text-xl">{game.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-300 mb-6 text-sm">
                  {game.description}
                </p>
                <Button 
                  onClick={() => navigate(game.path)}
                  className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 text-white font-semibold`}
                >
                  Play Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games;
