import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
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
      title: "Cricketer X",
      provider: "Smartsoft",
      image: "/placeholder.svg",
      path: "/games",
      gradient: "from-blue-600 to-blue-800"
    },
    {
      title: "Super Andar Bahar",
      provider: "Evolution",
      image: "/placeholder.svg", 
      path: "/andar-bahar",
      gradient: "from-red-600 to-red-800"
    },
    {
      title: "Spins Queen",
      provider: "Spinomenal",
      image: "/placeholder.svg",
      path: "/games",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      title: "Olympian Legends",
      provider: "Galaxsys",
      image: "/placeholder.svg",
      path: "/games", 
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      title: "Astronaut",
      provider: "1000IP Gaming",
      image: "/placeholder.svg",
      path: "/games",
      gradient: "from-red-500 to-orange-600"
    },
    {
      title: "Balloon",
      provider: "Smartsoft",
      image: "/placeholder.svg",
      path: "/games",
      gradient: "from-cyan-500 to-blue-600"
    },
    {
      title: "JetX",
      provider: "Smartsoft", 
      image: "/placeholder.svg",
      path: "/games",
      gradient: "from-blue-600 to-indigo-700"
    },
    {
      title: "Aviator",
      provider: "Spribe",
      image: "/placeholder.svg",
      path: "/aviator",
      gradient: "from-red-600 to-red-800"
    },
    {
      title: "Crazy Time",
      provider: "Evolution",
      image: "/placeholder.svg",
      path: "/games",
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      title: "Sushi Bar",
      provider: "Betsoft",
      image: "/placeholder.svg",
      path: "/games",
      gradient: "from-green-500 to-teal-600"
    },
    {
      title: "Valley of the Gods 2",
      provider: "Yggdrasil",
      image: "/placeholder.svg",
      path: "/games",
      gradient: "from-orange-600 to-red-700"
    },
    {
      title: "Winterberries",
      provider: "Yggdrasil",
      image: "/placeholder.svg",
      path: "/games",
      gradient: "from-blue-400 to-purple-600"
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
        {/* Promotional Carousel */}
        <Carousel className="w-full">
          <CarouselContent>
            {promotionalImages.map((promo, index) => (
              <CarouselItem key={index}>
                <Card className="overflow-hidden border-border">
                  <CardContent className="p-0">
                    <div className="relative h-64 md:h-80">
                      <img
                        src={promo.image}
                        alt={promo.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>

        {/* Popular Games Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {popularGames.map((game, index) => (
              <Card 
                key={index}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 bg-card border-border"
                onClick={() => navigate(game.path)}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <div className={`h-32 bg-gradient-to-br ${game.gradient} flex items-center justify-center`}>
                      <div className="text-white font-bold text-lg text-center px-2">
                        {game.title}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-foreground mb-1 truncate">
                      {game.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {game.provider}
                    </p>
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
