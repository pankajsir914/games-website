import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PasswordChangeModal } from './PasswordChangeModal';

export const PasswordChangeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, requiresPasswordChange, clearPasswordChangeFlag } = useAuth();

  const handlePasswordChanged = () => {
    clearPasswordChangeFlag();
  };

  return (
    <>
      {children}
      {user && requiresPasswordChange && (
        <PasswordChangeModal 
          open={requiresPasswordChange} 
          onPasswordChanged={handlePasswordChanged}
        />
      )}
    </>
  );
};