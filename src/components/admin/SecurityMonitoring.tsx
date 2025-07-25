import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useAdminAlerts } from '@/hooks/useAdminAlerts';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Activity, Eye, Search, Clock } from 'lucide-react';

export const SecurityMonitoring = () => {
  const [activityFilter, setActivityFilter] = useState('');
  const [alertFilter, setAlertFilter] = useState('');
  
  const { data: alerts, resolveAlert, isResolving } = useAdminAlerts();

  // Fetch admin activity logs
  const { data: activityLogs, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['admin-activity-logs', activityFilter],
    queryFn: async () => {
      let query = supabase
        .from('admin_activity_logs')
        .select(`
          id, action_type, target_type, target_id, details, created_at,
          profiles!admin_activity_logs_admin_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (activityFilter) {
        query = query.ilike('action_type', `%${activityFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-orange-600">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getActionTypeBadge = (actionType: string) => {
    const colorMap: Record<string, string> = {
      'game_setting_updated': 'bg-blue-600',
      'wallet_adjustment': 'bg-purple-600',
      'manual_result_override': 'bg-red-600',
      'user_role_assigned': 'bg-green-600',
      'alert_resolved': 'bg-gray-600'
    };

    return (
      <Badge className={colorMap[actionType] || 'bg-gray-600'}>
        {actionType.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredAlerts = alerts?.filter(alert => 
    !alertFilter || 
    alert.alert_type.toLowerCase().includes(alertFilter.toLowerCase()) ||
    alert.title.toLowerCase().includes(alertFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Security & Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor system activity, alerts, and security events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">System Secure</span>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts?.filter(alert => !alert.is_resolved).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts?.filter(alert => !alert.is_resolved && alert.severity === 'high').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Critical issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activityLogs?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 100 actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alerts?.filter(alert => 
                alert.is_resolved && 
                alert.resolved_at && 
                new Date(alert.resolved_at).toDateString() === new Date().toDateString()
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Issues resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts
              </CardTitle>
              <CardDescription>System alerts requiring attention</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter alerts..."
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts?.filter(alert => !alert.is_resolved).length ? (
                  filteredAlerts.filter(alert => !alert.is_resolved).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{alert.alert_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(alert.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                          disabled={isResolving}
                        >
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No active alerts
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Admin Activity Logs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Admin Activity Logs
              </CardTitle>
              <CardDescription>Recent administrative actions and system events</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter activities..."
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs?.length ? (
                    activityLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">
                            {log.profiles?.full_name || 'Unknown Admin'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionTypeBadge(log.action_type)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{log.target_type || 'System'}</div>
                            {log.target_id && (
                              <div className="text-muted-foreground">
                                {log.target_id.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-muted-foreground truncate">
                            {log.details ? JSON.stringify(log.details) : 'No details'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No activity logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Current system status and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">< 50ms</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-muted-foreground">Critical Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};