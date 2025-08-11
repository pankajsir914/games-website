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
  useSidebar
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Search, Crown, Gamepad2, Star, Trophy, Zap, Coins, Clock, Users, TrendingUp, Gift, Target, Dice1, Heart, Shield, Sparkles } from 'lucide-react';

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const sidebarItems = [
    { 
      id: 'heated', 
      title: 'Heated', 
      icon: Heart, 
      path: '/color-prediction',
      count: 24,
      color: 'text-red-500'
    },
    { 
      id: 'games', 
      title: '1win Games', 
      icon: Crown, 
      path: '/games',
      count: 16,
      color: 'text-gaming-gold'
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
      path: '/games',
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
      id: 'exclusive', 
      title: 'Only on 1win', 
      icon: Crown, 
      path: '/games',
      count: 42,
      color: 'text-blue-600'
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
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-primary rounded-lg p-2">
            <Crown className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              GameZone
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 bg-sidebar-accent border-sidebar-border"
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">
            CATEGORIES
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    className={`
                      w-full justify-between p-3 rounded-lg transition-all
                      ${isActive(item.path) 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : 'hover:bg-sidebar-accent/50'
                      }
                    `}
                  >
                    <button onClick={() => navigate(item.path)}>
                      <div className="flex items-center space-x-3">
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        {!collapsed && (
                          <span className="text-sm font-medium">{item.title}</span>
                        )}
                      </div>
                      {!collapsed && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {item.count}
                        </span>
                      )}
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