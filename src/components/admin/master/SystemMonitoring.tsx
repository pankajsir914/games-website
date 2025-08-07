import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const systemMetrics = [
  {
    name: 'CPU Usage',
    value: 23,
    status: 'good',
    icon: Cpu,
    description: 'Processor utilization'
  },
  {
    name: 'Memory Usage',
    value: 67,
    status: 'warning',
    icon: HardDrive,
    description: 'RAM consumption'
  },
  {
    name: 'Database Load',
    value: 34,
    status: 'good',
    icon: Database,
    description: 'Database performance'
  },
  {
    name: 'Network I/O',
    value: 12,
    status: 'good',
    icon: Wifi,
    description: 'Network traffic'
  }
];

const serviceStatus = [
  {
    name: 'Authentication Service',
    status: 'operational',
    uptime: '99.99%',
    lastIncident: 'None'
  },
  {
    name: 'Database Cluster',
    status: 'operational',
    uptime: '99.95%',
    lastIncident: '2 days ago'
  },
  {
    name: 'File Storage',
    status: 'operational',
    uptime: '99.98%',
    lastIncident: 'None'
  },
  {
    name: 'Edge Functions',
    status: 'degraded',
    uptime: '98.67%',
    lastIncident: '4 hours ago'
  },
  {
    name: 'Real-time Updates',
    status: 'operational',
    uptime: '99.92%',
    lastIncident: '1 day ago'
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'operational':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'outage':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'operational':
      return 'bg-green-100 text-green-800';
    case 'degraded':
      return 'bg-orange-100 text-orange-800';
    case 'outage':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getMetricColor = (status: string) => {
  switch (status) {
    case 'good':
      return 'text-green-600';
    case 'warning':
      return 'text-orange-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const SystemMonitoring = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">System Monitoring</h2>
        <p className="text-muted-foreground">Real-time system health and performance metrics</p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getMetricColor(metric.status)}`}>
                {metric.value}%
              </div>
              <Progress value={metric.value} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>Current status of all platform services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceStatus.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Uptime: {service.uptime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-muted-foreground">
                    Last incident: {service.lastIncident}
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
            <CardDescription>Average API response times (last 24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Authentication API</span>
                <span className="text-sm font-medium text-green-600">125ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Game API</span>
                <span className="text-sm font-medium text-green-600">89ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Payment API</span>
                <span className="text-sm font-medium text-orange-600">234ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">WebSocket</span>
                <span className="text-sm font-medium text-green-600">45ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Rates</CardTitle>
            <CardDescription>Error percentages (last 24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">HTTP 4xx Errors</span>
                <span className="text-sm font-medium text-green-600">0.12%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">HTTP 5xx Errors</span>
                <span className="text-sm font-medium text-green-600">0.03%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Database Errors</span>
                <span className="text-sm font-medium text-orange-600">0.08%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Connection Timeouts</span>
                <span className="text-sm font-medium text-green-600">0.01%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent System Events
          </CardTitle>
          <CardDescription>Latest system events and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50 rounded-r">
              <div>
                <div className="font-medium text-green-800">Database backup completed</div>
                <div className="text-sm text-green-600">Scheduled backup finished successfully</div>
              </div>
              <div className="text-sm text-green-600">2 minutes ago</div>
            </div>
            
            <div className="flex items-center justify-between p-3 border-l-4 border-orange-500 bg-orange-50 rounded-r">
              <div>
                <div className="font-medium text-orange-800">High memory usage detected</div>
                <div className="text-sm text-orange-600">Memory usage exceeded 70% threshold</div>
              </div>
              <div className="text-sm text-orange-600">15 minutes ago</div>
            </div>
            
            <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r">
              <div>
                <div className="font-medium text-blue-800">Security scan completed</div>
                <div className="text-sm text-blue-600">No vulnerabilities detected</div>
              </div>
              <div className="text-sm text-blue-600">1 hour ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};