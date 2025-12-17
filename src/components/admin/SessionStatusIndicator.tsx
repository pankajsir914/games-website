import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const SessionStatusIndicator = () => {
  const [sessionStatus, setSessionStatus] = useState<'active' | 'warning' | 'error'>('active');
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setSessionStatus('error');
          setExpiresIn(null);
          return;
        }

        // Calculate time until expiry
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = expiresAt - now;
          setExpiresIn(timeLeft);

          // Set status based on time remaining
          if (timeLeft < 300) { // Less than 5 minutes
            setSessionStatus('warning');
          } else {
            setSessionStatus('active');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setSessionStatus('error');
      }
    };

    // Check immediately
    checkSessionStatus();

    // Check every 30 seconds
    const interval = setInterval(checkSessionStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (sessionStatus) {
      case 'active':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case 'error':
        return <WifiOff className="h-3 w-3 text-destructive" />;
    }
  };

  const getStatusText = () => {
    switch (sessionStatus) {
      case 'active':
        return 'Session Active';
      case 'warning':
        return expiresIn ? `Expires in ${Math.floor(expiresIn / 60)}m` : 'Session Expiring Soon';
      case 'error':
        return 'Session Expired';
    }
  };

  const getTooltipText = () => {
    switch (sessionStatus) {
      case 'active':
        return 'Your session is active and secure';
      case 'warning':
        return 'Your session will expire soon. Activity will refresh it automatically.';
      case 'error':
        return 'Your session has expired. Please log in again.';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="hidden sm:flex items-center gap-1.5 cursor-help"
          >
            {getStatusIcon()}
            <span className="text-xs">{getStatusText()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
