import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  LogOut, 
  User, 
  Home
} from 'lucide-react';
import { useMasterAdminAuth } from '@/hooks/useMasterAdminAuth';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { SendNotificationModal } from './SendNotificationModal';

interface MasterAdminLayoutProps {
  children: React.ReactNode;
}

export const MasterAdminLayout = ({ children }: MasterAdminLayoutProps) => {
  const { user: masterUser, signOut: masterSignOut } = useMasterAdminAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await masterSignOut();
    navigate('/master-admin/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-primary rounded-lg p-2">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Master Admin Console
                </h1>
                <p className="text-sm text-muted-foreground">
                  Ultimate system control & management
                </p>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <SendNotificationModal />
            
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Crown className="h-3 w-3 mr-1" />
              Master Admin
            </Badge>
            
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4" />
              <span>{masterUser?.username}</span>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};
