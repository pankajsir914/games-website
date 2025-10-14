import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Search, Crown, Gamepad2, Star, Trophy, Zap, Coins, Clock, Users, TrendingUp, Gift, Target, Dice1, Heart, Shield, Sparkles, Headphones } from 'lucide-react';

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const sidebarItems = [
    { 
      id: 'support', 
      title: 'Support', 
      icon: Headphones, 
      path: '/support',
      count: 0,
      color: 'text-purple-500'
    },
    { 
      id: 'heated', 
      title: 'Heated', 
      icon: Heart, 
      path: '/color-prediction',
      count: 24,
      color: 'text-red-500'
    },
    { 
      id: 'ludo', 
      title: 'Ludo Game', 
      icon: Dice1, 
      path: '/ludo-game',
      count: 12,
      color: 'text-cyan-500'
    },
    { 
      id: 'sports', 
      title: 'Sports', 
      icon: Shield, 
      path: '/sports',
      count: 0,
      color: 'text-blue-500'
    },
    { 
      id: 'recommended', 
      title: 'Recommended games', 
      icon: Star, 
      path: '/games',
      count: 48,
      color: 'text-blue-500'
    },
    { 
      id: 'top', 
      title: 'Top games', 
      icon: Trophy, 
      path: '/games',
      count: 446,
      color: 'text-gaming-success'
    },
    { 
      id: 'crash', 
      title: 'Crash Games', 
      icon: TrendingUp, 
      path: '/aviator',
      count: 105,
      color: 'text-orange-500'
    },
    { 
      id: 'live-casino', 
      title: 'Live Casino', 
      icon: Users, 
      path: '/live-casino',
      count: 677,
      color: 'text-purple-500'
    },
    { 
      id: 'bonus', 
      title: 'Bonus Wagering', 
      icon: Gift, 
      path: '/games',
      count: 2278,
      color: 'text-pink-500'
    },
    { 
      id: 'slots', 
      title: 'Slots', 
      icon: Coins, 
      path: '/games',
      count: 10428,
      color: 'text-gaming-gold'
    },
   
    { 
      id: 'drops', 
      title: 'Drops & Wins', 
      icon: Target, 
      path: '/games',
      count: 77,
      color: 'text-green-500'
    },
    { 
      id: 'new', 
      title: 'New', 
      icon: Sparkles, 
      path: '/games',
      count: 414,
      color: 'text-cyan-500'
    },
    { 
      id: 'quick', 
      title: 'Quick games', 
      icon: Zap, 
      path: '/games',
      count: 678,
      color: 'text-yellow-500'
    },
    { 
      id: 'shows', 
      title: 'Game shows', 
      icon: Clock, 
      path: '/games',
      count: 76,
      color: 'text-indigo-500'
    },
    { 
      id: 'spinoleague', 
      title: 'Spinoleague', 
      icon: Dice1, 
      path: '/games',
      count: 440,
      color: 'text-violet-500'
    },
    { 
      id: 'all', 
      title: 'All games', 
      icon: Gamepad2, 
      path: '/games',
      count: 19568,
      color: 'text-muted-foreground'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-3 sm:p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-primary rounded-lg p-1.5 sm:p-2">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                GameZone
              </span>
            )}
          </div>
        </div>
        {!collapsed && (
          <div className="relative mt-3 sm:mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 bg-sidebar-accent border-sidebar-border text-sm"
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-1.5 sm:p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-2 sm:px-3 mb-2">
            CATEGORIES
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 sm:space-y-1">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    className={`
                      w-full justify-between p-2.5 sm:p-3 rounded-lg transition-all min-h-[44px]
                      ${isActive(item.path) 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : 'hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70'
                      }
                    `}
                  >
                    <button onClick={() => navigate(item.path)}>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${item.color}`} />
                        {!collapsed && (
                          <span className="text-sm font-medium truncate">{item.title}</span>
                        )}
                      </div>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
