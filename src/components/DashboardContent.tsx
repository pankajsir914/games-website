import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
  Crown, Clock, Gift, Dice1, Heart, Trophy, Coins, Users, Star, LogOut
} from 'lucide-react';

export function DashboardContent() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'sports' | 'casino' | 'rrb'>('sports');

  // Category banners
  const categoryBanners = {
    sports: [
      {
        image: "/lovable-uploads/cricketposter.jpeg",
        alt: "Cricket Betting",
        title: "Live Cricket"
      },
      {
        image: "/placeholder.svg",
        alt: "Football Betting",
        title: "Football Leagues"
      },
      {
        image: "/placeholder.svg",
        alt: "Sports Promotions",
        title: "Sports Bonus"
      }
    ],
    casino: [
      {
        image: "/lovable-uploads/teen3.jpg",
        alt: "Teen Patti Live",
        title: "Teen Patti Live"
      },
      {
        image: "/lovable-uploads/roulette13.jpg",
        alt: "Roulette Live",
        title: "Live Roulette"
      },
      {
        image: "/lovable-uploads/andarbaharposter.png",
        alt: "Andar Bahar Live",
        title: "Andar Bahar Live"
      }
    ],
    rrb: [
      {
        image: "/lovable-uploads/chickenposter.png",
        alt: "Chicken Run",
        title: "Chicken Run"
      },
      {
        image: "/lovable-uploads/colorgameposter.jpeg",
        alt: "Color Prediction",
        title: "Color Prediction"
      },
      {
        image: "/lovable-uploads/aviatorposter.png",
        alt: "Aviator",
        title: "Aviator"
      }
    ]
  };

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
      image: "/lovable-uploads/chickenposter.png",
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
      image: "/lovable-uploads/jackpotposter.png",
      path: "/jackpot",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      title: "Roulette",
      provider: "RRB Games",
      image: "/lovable-uploads/rouletteposter.png",
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
    },
    {
      title: "🎰 Live Casino",
      provider: "Diamond Casino",
      image: "/lovable-uploads/roulette13.jpg",
      path: "/live-casino",
      gradient: "from-purple-600 to-pink-600",
      isNew: true,
      badge: "LIVE 🔴"
    }
  ];

  return (
    <main className="flex-1 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <SidebarTrigger />
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Home
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sports
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Casino
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/live-casino')}
              className="text-muted-foreground hover:text-foreground"
            >
              Live-games
            </Button>
            <Button variant="ghost" size="sm" className="text-primary font-medium">
              RRB Games
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Trading
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Poker
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              More
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => {
              // TODO: Add notification functionality
              console.log('Notifications clicked');
            }}
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/wallet')} className="hidden sm:flex">
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate('/wallet')} className="sm:hidden h-8 w-8">
            <Wallet className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
              >
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                  <AvatarFallback className="text-xs sm:text-sm">
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background z-50" align="end" forceMount>
              <DropdownMenuItem className="flex flex-col items-start cursor-default focus:bg-transparent">
                <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/wallet')}>
                <Wallet className="mr-2 h-4 w-4" />
                <span>Wallet</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <div className="p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
        {/* Banner Promotions Carousel */}
        <BannerCarousel />

        {/* Category Buttons */}
        <div className="flex gap-2 sm:gap-4 justify-center">
          <Button
            variant={selectedCategory === 'sports' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('sports')}
            className="flex-1 sm:flex-initial sm:min-w-[140px] h-10 sm:h-11 text-sm sm:text-base transition-all"
          >
            <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Sports
          </Button>
          <Button
            variant={selectedCategory === 'casino' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('casino')}
            className="flex-1 sm:flex-initial sm:min-w-[140px] h-10 sm:h-11 text-sm sm:text-base transition-all"
          >
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Live Casino
          </Button>
          <Button
            variant={selectedCategory === 'rrb' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('rrb')}
            className="flex-1 sm:flex-initial sm:min-w-[140px] h-10 sm:h-11 text-sm sm:text-base transition-all"
          >
            <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            RRB Games
          </Button>
        </div>

        {/* Category Banners */}
        <div className="animate-fade-in">
          <Carousel className="w-full">
            <CarouselContent>
              {categoryBanners[selectedCategory].map((banner, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-0 relative aspect-video">
                        <img
                          src={banner.image}
                          alt={banner.alt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                          <h3 className="text-white font-bold text-lg">{banner.title}</h3>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        {/* Popular Games Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Popular</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {popularGames.map((game, index) => (
              <Card 
                key={index}
                className="group cursor-pointer hover:shadow-lg active:scale-95 transition-all duration-300 bg-card border-border relative"
                onClick={() => navigate(game.path)}
              >
                {game.isNew && (
                  <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 bg-red-500 text-white text-xs px-1.5 sm:px-2">
                    NEW
                  </Badge>
                )}
                {game.badge && (
                  <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 bg-red-500 text-white text-xs px-1.5 sm:px-2">
                    {game.badge}
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-lg">
                    {game.image && game.image !== "/placeholder.svg" ? (
                      <div className="relative h-28 sm:h-32 md:h-36 lg:h-40">
                        <img 
                          src={game.image} 
                          alt={game.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className={`h-28 sm:h-32 md:h-36 lg:h-40 bg-gradient-to-br ${game.gradient} flex items-center justify-center`}>
                        <div className="text-white font-bold text-sm sm:text-base lg:text-lg text-center px-2">
                          {game.title}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
