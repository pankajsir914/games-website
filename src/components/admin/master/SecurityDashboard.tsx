import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Globe,
  Clock,
  User,
  Activity,
  RefreshCw,
  Users,
  Key
} from 'lucide-react';
import { useSecurityValidation } from '@/hooks/useSecurityValidation';
import { useMasterAdminAuth } from '@/hooks/useMasterAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface SecurityDashboardProps {
  className?: string;
}

export const SecurityDashboard = ({ className }: SecurityDashboardProps) => {
  const { securityCheck, isValidating, performSecurityCheck } = useSecurityValidation();
  const { user } = useMasterAdminAuth();
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeSessionsToday: 0,
    recentLogins: [] as any[],
    blockedUsers: 0
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoadingData(true);
    try {
      // Get admin count
      const { count: adminCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['master_admin', 'admin', 'moderator']);

      // Get blocked users count
      const { count: blockedCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_blocked', true);

      // Get recent admin logins (from profiles updated today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['master_admin', 'admin', 'moderator']);

      const adminIds = adminRoles?.map(r => r.user_id) || [];
      
      let recentLogins: any[] = [];
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, updated_at')
          .in('id', adminIds)
          .order('updated_at', { ascending: false })
          .limit(5);
        
        recentLogins = (profiles || []).map(p => ({
          ...p,
          role: adminRoles?.find(r => r.user_id === p.id)?.role || 'unknown'
        }));
      }

      setStats({
        totalAdmins: adminCount || 0,
        activeSessionsToday: recentLogins.length,
        recentLogins,
        blockedUsers: blockedCount || 0
      });
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (securityCheck.sessionValid) score += 25;
    if (securityCheck.ipWhitelisted) score += 25;
    if (securityCheck.rateLimited) score += 25;
    if (securityCheck.inputValidated) score += 25;
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-gaming-success';
    if (score >= 70) return 'text-yellow-500';
    return 'text-gaming-danger';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master_admin':
        return <Badge className="bg-gaming-gold text-gaming-gold-foreground text-xs">Master</Badge>;
      case 'admin':
        return <Badge className="bg-gaming-danger text-gaming-danger-foreground text-xs">Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-primary text-primary-foreground text-xs">Mod</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const securityScore = getSecurityScore();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Security Overview */}
      <Card className="bg-gradient-card border-gaming-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gaming-gold" />
            Security Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security Score */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Security Score</h3>
              <p className="text-sm text-muted-foreground">Current system security rating</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(securityScore)}`}>
                {securityScore}%
              </div>
              <p className="text-xs text-muted-foreground">Security Rating</p>
            </div>
          </div>

          {/* Security Checks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {securityCheck.sessionValid ? (
                <CheckCircle className="h-4 w-4 text-gaming-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gaming-danger" />
              )}
              <span className="text-sm">Session Valid</span>
            </div>
            
            <div className="flex items-center gap-2">
              {securityCheck.ipWhitelisted ? (
                <CheckCircle className="h-4 w-4 text-gaming-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gaming-danger" />
              )}
              <span className="text-sm">IP Authorized</span>
            </div>
            
            <div className="flex items-center gap-2">
              {securityCheck.rateLimited ? (
                <CheckCircle className="h-4 w-4 text-gaming-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gaming-danger" />
              )}
              <span className="text-sm">Rate Limit OK</span>
            </div>
            
            <div className="flex items-center gap-2">
              {securityCheck.inputValidated ? (
                <CheckCircle className="h-4 w-4 text-gaming-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gaming-danger" />
              )}
              <span className="text-sm">Input Sanitized</span>
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => performSecurityCheck('security_dashboard')}
            disabled={isValidating}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validating...' : 'Refresh Security Status'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalAdmins}
            </div>
            <p className="text-xs text-muted-foreground">Active admin accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">
              {stats.activeSessionsToday}
            </div>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Blocked Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-danger">
              {stats.blockedUsers}
            </div>
            <p className="text-xs text-muted-foreground">Blocked accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Session Timeout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              8h
            </div>
            <p className="text-xs text-muted-foreground">Auto logout time</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Admin Activity */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Admin Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading activity...
            </div>
          ) : stats.recentLogins.length > 0 ? (
            <div className="space-y-3">
              {stats.recentLogins.map((login) => (
                <div key={login.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{login.full_name || 'Unknown Admin'}</div>
                      <div className="text-xs text-muted-foreground">
                        Active {formatDistanceToNow(new Date(login.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  {getRoleBadge(login.role)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gaming-success" />
              No recent admin activity
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current User Session Info */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Current Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">User:</span>
              <div className="font-medium">{user?.username}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Role:</span>
              <div className="font-medium">Master Admin</div>
            </div>
            <div>
              <span className="text-muted-foreground">Login Time:</span>
              <div className="font-medium">{new Date().toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Session Status:</span>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-gaming-success" />
                <span className="font-medium text-gaming-success">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};