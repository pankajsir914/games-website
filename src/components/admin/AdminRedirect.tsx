import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export const AdminRedirect = () => {
  const { data: adminAuth } = useAdminAuth();
  
  // Master admin goes to users, regular admin goes to dashboard
  if (adminAuth?.isMasterAdmin) {
    return <Navigate to="/admin/users" replace />;
  }
  
  return <Navigate to="/admin/dashboard" replace />;
};







