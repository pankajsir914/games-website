import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'moderator';
}

export const AdminProtectedRoute = ({ children, requiredRole = 'moderator' }: AdminProtectedRouteProps) => {
  const { data: adminAuth, isLoading, error } = useAdminAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md bg-gradient-card border-destructive/20">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Authentication Error</CardTitle>
            <CardDescription>
              Unable to verify your admin access. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = '/admin/login'}
              className="w-full"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!adminAuth?.user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check if user has required admin role
  const hasRequiredRole = requiredRole === 'moderator' 
    ? adminAuth.hasAccess 
    : adminAuth.isAdmin;

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md bg-gradient-card border-amber-500/20">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have the required permissions to access this area.
              {requiredRole === 'admin' && ' Admin role required.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              Current Role: {adminAuth.role || 'No role assigned'}
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/admin/login'}
                variant="outline"
                className="w-full"
              >
                Switch Account
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has required role
  return <>{children}</>;
};