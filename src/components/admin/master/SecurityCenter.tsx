import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Settings
} from 'lucide-react';

const securityAlerts = [
  {
    id: '1',
    type: 'high',
    title: 'Multiple failed login attempts',
    description: 'User john.doe@example.com has 5 failed login attempts in the last hour',
    timestamp: '2024-01-07 10:30 AM',
    status: 'active'
  },
  {
    id: '2',
    type: 'medium',
    title: 'Unusual API usage pattern',
    description: 'Detected abnormal API request volume from IP 192.168.1.100',
    timestamp: '2024-01-07 09:15 AM',
    status: 'investigating'
  },
  {
    id: '3',
    type: 'low',
    title: 'Admin login from new location',
    description: 'Admin user logged in from new geographic location',
    timestamp: '2024-01-07 08:45 AM',
    status: 'resolved'
  }
];

const auditLogs = [
  {
    id: '1',
    action: 'User Created',
    admin: 'Master Admin',
    target: 'user@example.com',
    timestamp: '2024-01-07 10:45 AM',
    status: 'success'
  },
  {
    id: '2',
    action: 'Role Modified',
    admin: 'John Doe',
    target: 'jane@example.com',
    timestamp: '2024-01-07 10:30 AM',
    status: 'success'
  },
  {
    id: '3',
    action: 'Settings Updated',
    admin: 'Master Admin',
    target: 'Platform Settings',
    timestamp: '2024-01-07 10:15 AM',
    status: 'success'
  }
];

const getAlertColor = (type: string) => {
  switch (type) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'medium':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'low':
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
  }
};

export const SecurityCenter = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Security Center</h2>
        <p className="text-muted-foreground">Monitor and manage platform security</p>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Currently blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure platform security features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Two-Factor Authentication</div>
              <div className="text-xs text-muted-foreground">Require 2FA for all admin accounts</div>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Rate Limiting</div>
              <div className="text-xs text-muted-foreground">Enable API rate limiting</div>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">IP Whitelisting</div>
              <div className="text-xs text-muted-foreground">Restrict admin access to specific IPs</div>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Session Timeout</div>
              <div className="text-xs text-muted-foreground">Auto-logout inactive admin sessions</div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Alerts
              </CardTitle>
              <CardDescription>Recent security events requiring attention</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 border rounded-lg ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm opacity-80 mt-1">{alert.description}</div>
                      <div className="text-xs opacity-70 mt-2">{alert.timestamp}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {alert.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>Recent administrative actions and changes</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Full Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-sm text-muted-foreground">
                      by {log.admin} → {log.target}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-muted-foreground">{log.timestamp}</div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};