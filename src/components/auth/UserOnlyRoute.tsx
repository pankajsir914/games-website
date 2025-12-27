import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield } from 'lucide-react';

interface UserOnlyRouteProps {
  children: React.ReactNode;
}

export const UserOnlyRoute = ({ children }: UserOnlyRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsChecking(false);
          return;
        }

        // Check user's highest role
        const { data: highestRole, error } = await supabase.rpc('get_user_highest_role', {
          _user_id: session.user.id
        });

        if (error) {
          console.error('Error checking user role:', error);
          setIsChecking(false);
          return;
        }

        const role = highestRole as string | null;
        setIsAdmin(role === 'admin' || role === 'moderator');
        setIsMasterAdmin(role === 'master_admin');
        setIsChecking(false);
      } catch (error) {
        console.error('Error in role check:', error);
        setIsChecking(false);
      }
    };

    checkUserRole();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Block admin and master admin from accessing website
  if (isAdmin || isMasterAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md bg-gradient-card border-destructive/20">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Access Restricted</CardTitle>
            <CardDescription>
              This website is only accessible to regular users. Admin accounts cannot access the main website.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                {isMasterAdmin ? (
                  <p>You are logged in as Master Admin. Please use the Master Admin portal to manage the system.</p>
                ) : (
                  <p>You are logged in as Admin. Please use the Admin portal to manage users and transactions.</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isMasterAdmin ? (
                <Button 
                  onClick={() => window.location.href = '/master-admin/login'}
                  className="w-full"
                >
                  Go to Master Admin Portal
                </Button>
              ) : (
                <Button 
                  onClick={() => window.location.href = '/admin/login'}
                  className="w-full"
                >
                  Go to Admin Portal
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Allow regular users to access
  return <>{children}</>;
};

