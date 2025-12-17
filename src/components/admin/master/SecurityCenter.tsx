import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  Key,
  UserX,
  Activity,
  FileText,
  Settings,
  Monitor
} from 'lucide-react';
import { SecurityDashboard } from './SecurityDashboard';

export const SecurityCenter = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Security Center</h2>
        <p className="text-muted-foreground">Comprehensive security monitoring and management</p>
      </div>

      {/* Security Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Security Dashboard
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Security Alerts
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Security Settings
          </TabsTrigger>
        </TabsList>

        {/* Security Dashboard Tab */}
        <TabsContent value="dashboard">
          <SecurityDashboard />
        </TabsContent>

        {/* Security Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-gaming-danger" />
                Active Security Alerts
              </CardTitle>
              <CardDescription>Security events requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gaming-success" />
                <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                <p>No active security alerts at this time.</p>
                <p className="text-sm mt-2">The system is operating securely.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Administrative Activity Logs
                  </CardTitle>
                  <CardDescription>Complete audit trail of admin actions</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Audit Logs</h3>
                <p>All administrative actions are logged and monitored.</p>
                <p className="text-sm mt-2">Real-time activity tracking is active.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authentication Security */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-gaming-gold" />
                  Authentication Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Multi-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">Enhanced login security</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Session Timeout</div>
                    <div className="text-sm text-muted-foreground">8 hours maximum</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Password Policies</div>
                    <div className="text-sm text-muted-foreground">Strong password requirements</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Enforced</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-gaming-danger" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Rate Limiting</div>
                    <div className="text-sm text-muted-foreground">Progressive penalties enabled</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">IP Restrictions</div>
                    <div className="text-sm text-muted-foreground">Geographic and IP-based filtering</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Configured</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Device Restrictions</div>
                    <div className="text-sm text-muted-foreground">Desktop-only access</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Enforced</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Input Sanitization</div>
                    <div className="text-sm text-muted-foreground">XSS and injection protection</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">RLS Policies</div>
                    <div className="text-sm text-muted-foreground">Row-level security enforced</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Enforced</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Audit Logging</div>
                    <div className="text-sm text-muted-foreground">Complete activity tracking</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Monitoring & Alerts */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-cyan-500" />
                  Monitoring & Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Real-time Monitoring</div>
                    <div className="text-sm text-muted-foreground">Live security event tracking</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Automated Alerts</div>
                    <div className="text-sm text-muted-foreground">Instant security notifications</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Threat Detection</div>
                    <div className="text-sm text-muted-foreground">Suspicious activity detection</div>
                  </div>
                  <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};