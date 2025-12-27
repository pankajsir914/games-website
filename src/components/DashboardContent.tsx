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
import { useWallet } from '@/hooks/useWallet';
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
  const { wallet, walletLoading } = useWallet();

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
      title: "Ludo Multiplayer",
      provider: "RRB Games",
      image: "/lovable-uploads/ludoposter.png",
      path: "/ludo-game",
      gradient: "from-cyan-500 to-blue-600"
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
    <main className="flex-1 bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-3 sm:p-4 flex items-center justify-between max-w-full overflow-x-hidden">
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/support')}
              className="text-muted-foreground hover:text-foreground"
            >
              Support
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
          <Button variant="outline" size="sm" onClick={() => navigate('/wallet')} className="hidden sm:flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="font-medium">
              {walletLoading ? (
                'Loading...'
              ) : (
                `${wallet?.current_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
              )}
            </span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/wallet')} className="sm:hidden h-8 px-2.5 items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">
              {walletLoading ? (
                '...'
              ) : (
                `${wallet?.current_balance?.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}`
              )}
            </span>
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
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
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
      <div className="p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8 max-w-full overflow-x-hidden">
        {/* Banner Promotions Carousel */}
        <BannerCarousel />

        {/* Category Buttons */}
        <div className="flex gap-2 sm:gap-4 justify-center max-w-full overflow-x-auto scrollbar-hide px-2">
          <div className="flex gap-2 sm:gap-4 min-w-max mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/sports')}
            className="sm:min-w-[140px] h-8 sm:h-11 text-xs sm:text-base transition-all hover:scale-105 active:scale-95 whitespace-nowrap px-3 sm:px-4"
          >
            <Target className="h-3 w-3 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
            Sports
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/live-casino')}
            className="sm:min-w-[140px] h-8 sm:h-11 text-xs sm:text-base transition-all hover:scale-105 active:scale-95 whitespace-nowrap px-3 sm:px-4"
          >
            <Crown className="h-3 w-3 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
            Live Casino
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/games')}
            className="sm:min-w-[140px] h-8 sm:h-11 text-xs sm:text-base transition-all hover:scale-105 active:scale-95 whitespace-nowrap px-3 sm:px-4"
          >
            <Gamepad2 className="h-3 w-3 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
            RRB Games
          </Button>
          </div>
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
