import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  Database, 
  Mail, 
  DollarSign, 
  Clock, 
  Shield,
  Bell,
  Palette,
  Server,
  Save
} from 'lucide-react';

export const PlatformSettings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Platform Settings</h2>
        <p className="text-muted-foreground">Configure global platform settings and behavior</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input id="platform-name" defaultValue="Gaming Platform" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-url">Platform URL</Label>
              <Input id="platform-url" defaultValue="https://yourplatform.com" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="platform-description">Platform Description</Label>
            <Textarea 
              id="platform-description" 
              defaultValue="A comprehensive online gaming platform offering various casino games, sports betting, and more."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input id="support-email" type="email" defaultValue="support@yourplatform.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input id="admin-email" type="email" defaultValue="admin@yourplatform.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Settings
          </CardTitle>
          <CardDescription>Configure payment and financial limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min-deposit">Minimum Deposit (₹)</Label>
              <Input id="min-deposit" type="number" defaultValue="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-deposit">Maximum Deposit (₹)</Label>
              <Input id="max-deposit" type="number" defaultValue="50000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-withdrawal">Minimum Withdrawal (₹)</Label>
              <Input id="min-withdrawal" type="number" defaultValue="500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Platform Commission (%)</Label>
              <Input id="commission-rate" type="number" step="0.01" defaultValue="5.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-fee">Withdrawal Fee (₹)</Label>
              <Input id="withdrawal-fee" type="number" defaultValue="25" />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Financial Controls</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Auto-approve deposits</div>
                  <div className="text-xs text-muted-foreground">Automatically approve deposits under ₹10,000</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Auto-approve withdrawals</div>
                  <div className="text-xs text-muted-foreground">Automatically approve withdrawals under ₹5,000</div>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>Configure system behavior and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input id="session-timeout" type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-concurrent-sessions">Max Concurrent Sessions</Label>
              <Input id="max-concurrent-sessions" type="number" defaultValue="1000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="api-rate-limit">API Rate Limit (requests/minute)</Label>
              <Input id="api-rate-limit" type="number" defaultValue="60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup-frequency">Backup Frequency (hours)</Label>
              <Input id="backup-frequency" type="number" defaultValue="6" />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">System Controls</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Maintenance Mode</div>
                  <div className="text-xs text-muted-foreground">Put platform in maintenance mode</div>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Debug Mode</div>
                  <div className="text-xs text-muted-foreground">Enable detailed error logging</div>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Registration Open</div>
                  <div className="text-xs text-muted-foreground">Allow new user registrations</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Email Notifications</div>
                <div className="text-xs text-muted-foreground">Send email notifications for important events</div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">SMS Notifications</div>
                <div className="text-xs text-muted-foreground">Send SMS alerts for critical events</div>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Push Notifications</div>
                <div className="text-xs text-muted-foreground">Send browser push notifications</div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Security Alerts</div>
                <div className="text-xs text-muted-foreground">Immediate alerts for security events</div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};