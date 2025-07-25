import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Users, Activity, Lock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminSecurity = () => {
  const securityAlerts = [
    { id: 1, type: 'warning', message: 'Multiple failed login attempts detected', time: '2 minutes ago' },
    { id: 2, type: 'info', message: 'New admin user created', time: '1 hour ago' },
    { id: 3, type: 'error', message: 'Unusual betting pattern detected', time: '3 hours ago' },
  ];

  const activeAdmins = [
    { id: 1, name: 'Admin User', email: 'admin@example.com', lastActive: '5 minutes ago', status: 'online' },
    { id: 2, name: 'Moderator', email: 'mod@example.com', lastActive: '1 hour ago', status: 'away' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Monitoring</h1>
          <p className="text-muted-foreground">Monitor security events and manage access controls.</p>
        </div>

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Security Alerts
                </CardTitle>
                <CardDescription>Real-time security notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className={`h-5 w-5 ${
                          alert.type === 'error' ? 'text-red-500' : 
                          alert.type === 'warning' ? 'text-yellow-500' : 
                          'text-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">{alert.time}</p>
                        </div>
                      </div>
                      <Badge variant={
                        alert.type === 'error' ? 'destructive' : 
                        alert.type === 'warning' ? 'secondary' : 
                        'default'
                      }>
                        {alert.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Admin Sessions
                </CardTitle>
                <CardDescription>Currently logged in administrators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          admin.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{admin.status}</p>
                        <p className="text-sm text-muted-foreground">{admin.lastActive}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Permission Management
                </CardTitle>
                <CardDescription>Manage admin roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Admin Role</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Full system access</li>
                        <li>• User management</li>
                        <li>• Game control</li>
                        <li>• Financial oversight</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Moderator Role</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Game monitoring</li>
                        <li>• User support</li>
                        <li>• Content moderation</li>
                        <li>• Limited admin access</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Audit Log
                </CardTitle>
                <CardDescription>System activity and changes log</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Game settings updated</p>
                      <p className="text-sm text-muted-foreground">Admin changed Aviator max bet limit</p>
                    </div>
                    <p className="text-sm text-muted-foreground">10 minutes ago</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">User account blocked</p>
                      <p className="text-sm text-muted-foreground">Suspicious activity detected</p>
                    </div>
                    <p className="text-sm text-muted-foreground">1 hour ago</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Withdrawal processed</p>
                      <p className="text-sm text-muted-foreground">₹50,000 withdrawal approved</p>
                    </div>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSecurity;