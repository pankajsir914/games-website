import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Lock, 
  Globe,
  Clock,
  User,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useSecurityValidation } from '@/hooks/useSecurityValidation';
import { useMasterAdminAuth } from '@/hooks/useMasterAdminAuth';
import { supabase } from '@/integrations/supabase/client';

interface SecurityDashboardProps {
  className?: string;
}

export const SecurityDashboard = ({ className }: SecurityDashboardProps) => {
  const { securityCheck, isValidating, performSecurityCheck } = useSecurityValidation();
  const { user } = useMasterAdminAuth();
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [securitySettings, setSecuritySettings] = useState<any>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoadingData(true);
    try {
      // Load recent security alerts
      const { data: alerts } = await supabase
        .from('admin_alerts')
        .select('*')
        .eq('alert_type', 'security_event')
        .order('created_at', { ascending: false })
        .limit(5);

      // Load security settings
      const { data: settings } = await supabase
        .from('admin_security_settings')
        .select('*');

      setRecentAlerts(alerts || []);
      
      // Convert settings array to object for easier access
      const settingsObj = (settings || []).reduce((acc: any, setting: any) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});
      
      setSecuritySettings(settingsObj);
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

  const getAlertSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-gaming-danger text-gaming-danger-foreground">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gaming-success text-gaming-success-foreground">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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

      {/* Security Settings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Session Timeout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {securitySettings.session_timeout_hours || 8}h
            </div>
            <p className="text-xs text-muted-foreground">Auto logout time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Failed Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-danger">
              {securitySettings.max_failed_attempts || 5}
            </div>
            <p className="text-xs text-muted-foreground">Before lockout</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              IP Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">
              {Array.isArray(securitySettings.allowed_ip_ranges) ? 
                securitySettings.allowed_ip_ranges.length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Allowed ranges</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Alerts */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gaming-danger" />
            Recent Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading security alerts...
            </div>
          ) : recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <Alert key={alert.id} className="bg-background/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-muted-foreground">{alert.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                    {getAlertSeverityBadge(alert.severity)}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gaming-success" />
              No recent security alerts
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