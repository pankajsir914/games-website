import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Server, Globe, Database, Bell, Shield, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AdminPaymentMethods } from '@/components/admin/AdminPaymentMethods';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminSettings = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings & Configuration</h1>
          <p className="text-muted-foreground">Manage your platform settings and payment methods.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Site Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Site Settings
                  </CardTitle>
                  <CardDescription>Configure basic site information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input id="site-name" placeholder="Your Gaming Platform" />
                  </div>
                  <div>
                    <Label htmlFor="site-description">Site Description</Label>
                    <Textarea id="site-description" placeholder="Description of your platform" />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input id="contact-email" type="email" placeholder="admin@yoursite.com" />
                  </div>
                  <Button>Save Site Settings</Button>
                </CardContent>
              </Card>

              {/* Server Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Server Configuration
                  </CardTitle>
                  <CardDescription>Configure server and performance settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <Switch id="maintenance-mode" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="debug-mode">Debug Mode</Label>
                    <Switch id="debug-mode" />
                  </div>
                  <div>
                    <Label htmlFor="max-users">Max Concurrent Users</Label>
                    <Input id="max-users" type="number" placeholder="1000" />
                  </div>
                  <Button>Update Server Settings</Button>
                </CardContent>
              </Card>

              {/* Game Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Game Configuration
                  </CardTitle>
                  <CardDescription>Global game settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="default-currency">Default Currency</Label>
                    <Input id="default-currency" placeholder="INR" />
                  </div>
                  <div>
                    <Label htmlFor="min-deposit">Minimum Deposit</Label>
                    <Input id="min-deposit" type="number" placeholder="100" />
                  </div>
                  <div>
                    <Label htmlFor="max-deposit">Maximum Deposit</Label>
                    <Input id="max-deposit" type="number" placeholder="50000" />
                  </div>
                  <Button>Save Game Settings</Button>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Configure system notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <Switch id="email-notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <Switch id="sms-notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <Switch id="push-notifications" />
                  </div>
                  <Button>Update Notifications</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payment">
            <AdminPaymentMethods />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;