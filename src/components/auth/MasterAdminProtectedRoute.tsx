import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMasterAdminAuth } from '@/hooks/useMasterAdminAuth';

interface MasterAdminProtectedRouteProps {
  children: React.ReactNode;
}

export const MasterAdminProtectedRoute = ({ children }: MasterAdminProtectedRouteProps) => {
  const { user, loading, isMasterAdmin, session } = useMasterAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying master admin access...</p>
          <p className="text-xs text-muted-foreground mt-2">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Require both user and session for master admin access
  if (!user || !session || !isMasterAdmin) {
    console.log('Master admin access denied:', { user: !!user, session: !!session, isMasterAdmin });
    return <Navigate to="/master-admin/login" replace />;
  }

  return <>{children}</>;
};