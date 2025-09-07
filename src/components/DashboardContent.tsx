import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { BannerCarousel } from '@/components/dashboard/BannerCarousel';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  Menu, Bell, User, Wallet, Play, Target, Zap, TrendingUp, Gamepad2, 
  Crown, Clock, Gift, Dice1, Heart, Trophy, Coins, Users, Star
} from 'lucide-react';

export function DashboardContent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const promotionalImages = [
    {
      image: "/lovable-uploads/d76d31c1-2f9d-457e-9033-0c2dbda73658.png",
      alt: "Promotional Banner 1"
    },
    {
      image: "/placeholder.svg",
      alt: "Promotional Banner 2"
    },
    {
      image: "/placeholder.svg", 
      alt: "Promotional Banner 3"
    }
  ];

  const popularGames = [
    {
      title: "🐓 Chicken Run India",
      provider: "RRB Games",
      image: "/lovable-uploads/chicken road.jpeg",
      path: "/chicken-run",
      gradient: "from-yellow-400 to-orange-500",
      isNew: true
    },
    {
      title: "Teen Patti",
      provider: "RRB Games",
      image: "/lovable-uploads/teenpattiposter.jpeg",
      path: "/teen-patti",
      gradient: "from-yellow-600 to-orange-700"
    },
    {
      title: "Super Andar Bahar",
      provider: "Evolution",
      image: "/lovable-uploads/andarbaharposter.png", 
      path: "/andar-bahar",
      gradient: "from-red-600 to-red-800"
    },
    {
      title: "Aviator",
      provider: "Spribe",
      image: "/lovable-uploads/aviatorposter.png",
      path: "/aviator",
      gradient: "from-red-600 to-red-800"
    },
    {
      title: "Color Prediction",
      provider: "RRB Games",
      image: "/lovable-uploads/colorgameposter.jpeg",
      path: "/color-prediction",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Jackpot",
      provider: "RRB Games",
      image: "/placeholder.svg",
      path: "/jackpot",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      title: "Roulette",
      provider: "RRB Games",
      image: "/placeholder.svg",
      path: "/roulette",
      gradient: "from-red-500 to-rose-600"
    },
    {
      title: "Poker",
      provider: "RRB Games", 
      image: "/lovable-uploads/pokerposter.jpeg",
      path: "/poker",
      gradient: "from-blue-600 to-indigo-700"
    },
    {
      title: "Ludo Multiplayer",
      provider: "RRB Games",
      image: "/lovable-uploads/ludoposter.png",
      path: "/ludo-game",
      gradient: "from-cyan-500 to-blue-600"
    },
    {
      title: "Rummy",
      provider: "RRB Games",
      image: "/lovable-uploads/rummyposter.png",
      path: "/rummy",
      gradient: "from-green-600 to-teal-600"
    },
    {
      title: "Sports Betting",
      provider: "RRB Games",
      image: "/lovable-uploads/cricketposter.jpeg",
      path: "/sports",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  return (
    <main className="flex-1 bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="lg:hidden" />
          <div className="hidden lg:flex items-center space-x-6">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Home
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Sports
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Casino
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Live-games
            </Button>
            <Button variant="ghost" className="text-primary font-medium">
              RRB Games
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Trading
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Poker
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              More
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="outline" onClick={() => navigate('/wallet')}>
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </Button>
          <Button variant="outline" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Banner Promotions Carousel */}
        <BannerCarousel />

        {/* Popular Games Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {popularGames.map((game, index) => (
              <Card 
                key={index}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 bg-card border-border relative"
                onClick={() => navigate(game.path)}
              >
                {game.isNew && (
                  <Badge className="absolute top-2 right-2 z-10 bg-red-500 text-white">
                    NEW
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-lg">
                    {game.image && game.image !== "/placeholder.svg" ? (
                      <div className="relative h-40">
                        <img 
                          src={game.image} 
                          alt={game.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`h-40 bg-gradient-to-br ${game.gradient} flex items-center justify-center`}>
                        <div className="text-white font-bold text-lg text-center px-2">
                          {game.title}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
