
import Navigation from '@/components/Navigation';
import AnimatedGameCard from '@/components/game/AnimatedGameCard';
import GameBackground from '@/components/game/GameBackground';
import { Sparkles, Trophy, Zap, Crown } from 'lucide-react';

const Games = () => {
  const games = [
    {
      title: 'Teen Patti',
      description: 'Classic Indian poker with 3 cards',
      icon: '🃏',
      path: '/teen-patti',
      gradient: 'from-yellow-600 to-orange-700',
      prize: '₹50K Pool',
      trending: true
    },
    {
      title: 'Ludo',
      description: 'Classic board game with real money betting',
      icon: '🎲',
      path: '/ludo',
      gradient: 'from-green-500 to-emerald-600',
      prize: '₹25K Prize'
    },
    {
      title: 'Aviator',
      description: 'High-flying multiplier crash game',
      icon: '✈️',
      path: '/aviator',
      gradient: 'from-blue-500 to-cyan-600',
      trending: true
    },
    {
      title: 'Color Prediction',
      description: 'Predict the next color and win big',
      icon: '🎨',
      path: '/color-prediction',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Andar Bahar',
      description: 'Traditional Indian card game',
      icon: '♠️',
      path: '/andar-bahar',
      gradient: 'from-red-500 to-orange-600',
      prize: '₹10K Bonus'
    },
    {
      title: 'Roulette',
      description: 'Classic casino wheel game with multiple betting options',
      icon: '🎰',
      path: '/roulette',
      gradient: 'from-purple-600 to-indigo-700',
      trending: true
    },
    {
      title: 'Rummy',
      description: 'Skill-based card game tournaments',
      icon: '🎯',
      path: '/rummy',
      gradient: 'from-yellow-500 to-amber-600',
      prize: '₹1L Tournament'
    },
    {
      title: 'Poker',
      description: 'Texas Hold\'em poker tables',
      icon: '♥️',
      path: '/poker',
      gradient: 'from-gray-700 to-gray-900',
      prize: '₹75K Tables'
    },
    {
      title: 'Jackpot',
      description: 'Progressive jackpot lottery game',
      icon: '💰',
      path: '/jackpot',
      gradient: 'from-yellow-400 to-yellow-600',
      prize: '₹10L+ Prize',
      trending: true
    },
    {
      title: 'Chicken Run',
      description: 'Bet & cross the road avoiding fire traps',
      icon: '🐔',
      path: '/chicken-run',
      gradient: 'from-orange-500 to-red-600',
      prize: '₹30K Daily',
      trending: true
    }
  ];

  return (
    <GameBackground variant="casino">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Animated Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Premium Game Hub
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-xl text-gray-300 mb-4">
            Choose your game and start winning real money!
          </p>
          
          {/* Live Stats Bar */}
          <div className="flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>2,847 Players Online</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-400">
              <Trophy className="w-4 h-4" />
              <span>₹50L+ Prize Pool Today</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Zap className="w-4 h-4" />
              <span>Instant Withdrawals</span>
            </div>
          </div>
        </div>

        {/* Featured Game Banner */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-bold">FEATURED TOURNAMENT</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Mega Jackpot Weekend</h2>
              <p className="text-white/80">Win up to ₹10 Lakhs in our biggest tournament!</p>
            </div>
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform">
              Join Now
            </button>
          </div>
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <AnimatedGameCard
              key={game.title}
              title={game.title}
              description={game.description}
              icon={game.icon}
              path={game.path}
              gradient={game.gradient}
              prize={game.prize}
              trending={game.trending}
            />
          ))}
        </div>
      </div>
    </GameBackground>
  );
};

export default Games;
