import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
<<<<<<< HEAD
=======
import { Separator } from '@/components/ui/separator';
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
import { 
  Crown, 
  LogOut, 
  User, 
<<<<<<< HEAD
  Home
=======
  Home,
  ArrowLeft
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
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

<<<<<<< HEAD
=======
  const handleBackToAdmin = () => {
    navigate('/admin');
  };

>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
<<<<<<< HEAD
=======
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToAdmin}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <Separator orientation="vertical" className="h-6" />
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
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