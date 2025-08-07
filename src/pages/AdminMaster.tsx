import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Settings, 
  Shield, 
  Activity, 
  AlertTriangle, 
  Crown,
  UserCog,
  Database,
  Globe,
  Lock,
  Eye,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminRoleManagement } from '@/components/admin/master/AdminRoleManagement';
import { SystemMonitoring } from '@/components/admin/master/SystemMonitoring';
import { SecurityCenter } from '@/components/admin/master/SecurityCenter';
import { PlatformSettings } from '@/components/admin/master/PlatformSettings';

const AdminMaster = () => {
  const { data: adminAuth, isLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('roles');

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!adminAuth?.hasAccess || adminAuth?.role !== 'master_admin') {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-center">
            This area is restricted to Master Administrators only.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-primary rounded-lg p-2">
                <Crown className="h-6 w-6 text-gaming-gold-foreground" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Master Admin Panel
              </h1>
            </div>
            <p className="text-muted-foreground">
              Advanced system administration and management tools
            </p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Crown className="h-3 w-3 mr-1" />
            Master Admin
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <p className="text-xs text-muted-foreground">Uptime this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">3</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">+15% from yesterday</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Role Management
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Monitoring
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Center
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Platform Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-6">
            <AdminRoleManagement />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <SystemMonitoring />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityCenter />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMaster;