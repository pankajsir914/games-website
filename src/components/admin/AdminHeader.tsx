
import React from 'react';
import { Bell, Menu, User, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/hooks/use-toast';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  const { data: adminAuth, logout } = useAdminAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleIcon = () => {
    if (adminAuth?.isAdmin) return <Shield className="h-3 w-3 text-gaming-danger" />;
    return <User className="h-3 w-3 text-primary" />;
  };

  const getRoleBadge = () => {
    if (adminAuth?.isAdmin) return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Admin</Badge>;
    if (adminAuth?.isModerator) return <Badge className="bg-primary text-primary-foreground">Moderator</Badge>;
    return <Badge variant="outline">User</Badge>;
  };

  const getInitials = () => {
    if (adminAuth?.user?.email) {
      const email = adminAuth.user.email;
      return email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <header className="bg-card border-b border-border">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Role Badge */}
          {adminAuth?.role && (
            <div className="hidden md:flex">
              {getRoleBadge()}
            </div>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative min-h-[44px] min-w-[44px]">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              3
            </Badge>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Admin" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-screen sm:w-56 max-w-sm" align="end">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2">
                  {getRoleIcon()}
                  <div>
                    <p className="text-sm font-medium">{adminAuth?.user?.email}</p>
                    <p className="text-xs text-muted-foreground">{adminAuth?.role || 'No role'}</p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </header>
  );
};
