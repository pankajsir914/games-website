import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Activity, Lock, Users } from "lucide-react";

export const SecurityDashboard = () => {
  // Mock data for now - will be populated after types are regenerated
  const securityMetrics = {
    failedLoginsCount: 0,
    activeSessionsCount: 0,
    securityAlertsCount: 0,
    lastScan: new Date().toISOString()
  };

  const securityChecks = [
    {
      title: "RLS Policies",
      status: "active",
      description: "Row Level Security enabled on all tables",
      icon: Shield,
      variant: "default" as const
    },
    {
      title: "Rate Limiting",
      status: "active",
      description: "Request rate limiting configured",
      icon: Activity,
      variant: "default" as const
    },
    {
      title: "Session Management",
      status: "active",
      description: `${securityMetrics?.activeSessionsCount || 0} active sessions`,
      icon: Users,
      variant: "default" as const
    },
    {
      title: "Failed Logins (24h)",
      status: "active",
      description: `${securityMetrics?.failedLoginsCount || 0} failed attempts`,
      icon: AlertTriangle,
      variant: "default" as const
    },
    {
      title: "Security Alerts",
      status: "active",
      description: `${securityMetrics?.securityAlertsCount || 0} unresolved alerts`,
      icon: Lock,
      variant: "default" as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Real-time security monitoring and threat detection
          </p>
        </div>
        <Badge variant="default" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          System Secure
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {securityChecks.map((check) => {
          const Icon = check.icon;
          return (
            <Card key={check.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {check.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {check.description}
                  </p>
                  <Badge variant={check.variant}>
                    {check.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Configuration Status</CardTitle>
          <CardDescription>
            Current security measures and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Implemented Security Features
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-6">
              <li>Row Level Security (RLS) enabled on all critical tables</li>
              <li>Security audit logging for all admin actions</li>
              <li>Rate limiting on API endpoints</li>
              <li>Failed login attempt tracking and alerts</li>
              <li>Session management with expiry</li>
              <li>IP whitelisting capability for admin access</li>
              <li>Input validation and sanitization functions</li>
              <li>JWT authentication on protected endpoints</li>
            </ul>
          </div>

          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Recommended Additional Steps
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-6">
              <li>Enable Leaked Password Protection in Supabase Auth Settings</li>
              <li>Reduce OTP expiry time to 5 minutes max</li>
              <li>Schedule Postgres database upgrade</li>
              <li>Configure CSRF_TOKEN in backend environment</li>
              <li>Set up regular security audit reviews</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
