import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Gift, 
  Send, 
  Users, 
  Megaphone,
  Target,
  Calendar,
  Percent,
  Trophy,
  Star,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

export const PromotionsNotifications = () => {
  const [promotions] = useState([
    {
      id: 1,
      title: 'Welcome Bonus',
      description: '50% bonus on first deposit',
      type: 'deposit_bonus',
      value: 50,
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      usage: 1247,
      maxUsage: 5000
    },
    {
      id: 2,
      title: 'Weekend Special',
      description: '20% extra on weekends',
      type: 'deposit_bonus',
      value: 20,
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      usage: 892,
      maxUsage: 2000
    },
    {
      id: 3,
      title: 'Referral Reward',
      description: '₹500 for each referral',
      type: 'referral',
      value: 500,
      status: 'paused',
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      usage: 456,
      maxUsage: 1000
    }
  ]);

  const [notifications] = useState([
    {
      id: 1,
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday 3 AM',
      type: 'system',
      status: 'sent',
      sentTo: 'all',
      sentTime: '2024-01-15 10:30',
      delivered: 15247
    },
    {
      id: 2,
      title: 'New Game Launch',
      message: 'Try our new Crash game!',
      type: 'promotion',
      status: 'draft',
      sentTo: 'active',
      sentTime: null,
      delivered: 0
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>;
      case 'paused': return <Badge className="bg-orange-500 text-white">Paused</Badge>;
      case 'expired': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Expired</Badge>;
      case 'sent': return <Badge className="bg-gaming-success text-gaming-success-foreground">Sent</Badge>;
      case 'draft': return <Badge className="bg-muted text-muted-foreground">Draft</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Promotions & Notifications</h2>
          <p className="text-muted-foreground">Manage promotional campaigns and user notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Gift className="h-4 w-4 mr-2" />
            New Promotion
          </Button>
          <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <Gift className="h-4 w-4 text-gaming-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-gold">8</div>
            <p className="text-xs text-muted-foreground">2 ending soon</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12,847</div>
            <p className="text-xs text-muted-foreground">+23% this month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
            <Users className="h-4 w-4 text-gaming-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">₹45.2K</div>
            <p className="text-xs text-muted-foreground">892 referrals</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Bell className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-500">156K</div>
            <p className="text-xs text-muted-foreground">98.5% delivery rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Promotion */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-gaming-gold" />
            Create New Promotion
          </CardTitle>
          <CardDescription>Design and launch promotional campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-title">Promotion Title</Label>
                <Input id="promo-title" placeholder="Enter promotion title" className="bg-background" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promo-type">Promotion Type</Label>
                <Select>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit_bonus">Deposit Bonus</SelectItem>
                    <SelectItem value="referral">Referral Reward</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="free_spins">Free Spins</SelectItem>
                    <SelectItem value="tournament">Tournament Prize</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promo-value">Value/Percentage</Label>
                <Input id="promo-value" type="number" placeholder="50" className="bg-background" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-description">Description</Label>
                <Textarea id="promo-description" placeholder="Describe the promotion..." className="bg-background" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" className="bg-background" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-usage">Maximum Usage</Label>
                <Input id="max-usage" type="number" placeholder="1000" className="bg-background" />
              </div>
            </div>
          </div>
          
          <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
            <Gift className="h-4 w-4 mr-2" />
            Create Promotion
          </Button>
        </CardContent>
      </Card>

      {/* Active Promotions */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-gaming-gold" />
            Active Promotions
          </CardTitle>
          <CardDescription>Manage existing promotional campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {promotions.map((promo) => (
              <div key={promo.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gaming-gold/10 rounded-lg flex items-center justify-center">
                    <Percent className="h-5 w-5 text-gaming-gold" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">{promo.title}</h4>
                    <p className="text-sm text-muted-foreground">{promo.description}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {promo.startDate} - {promo.endDate}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {promo.usage}/{promo.maxUsage} used
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-lg text-gaming-gold">
                      {promo.type === 'referral' ? `₹${promo.value}` : `${promo.value}%`}
                    </div>
                    <div className="w-20 h-2 bg-muted rounded">
                      <div 
                        className="h-2 bg-gaming-gold rounded" 
                        style={{ width: `${(promo.usage / promo.maxUsage) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {getStatusBadge(promo.status)}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-gaming-danger">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Send Notification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Send Notification
            </CardTitle>
            <CardDescription>Broadcast messages to users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notif-title">Notification Title</Label>
              <Input id="notif-title" placeholder="Enter notification title" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notif-message">Message</Label>
              <Textarea id="notif-message" placeholder="Enter your message..." className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-audience">Target Audience</Label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Users</SelectItem>
                  <SelectItem value="inactive">Inactive Users</SelectItem>
                  <SelectItem value="high_value">High Value Users</SelectItem>
                  <SelectItem value="new">New Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="schedule" />
              <Label htmlFor="schedule">Schedule for later</Label>
            </div>
            
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-cyan-500" />
              Recent Notifications
            </CardTitle>
            <CardDescription>Previously sent messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    {getStatusBadge(notification.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>To: {notification.sentTo} users</span>
                    {notification.sentTime && (
                      <span>{notification.sentTime}</span>
                    )}
                  </div>
                  {notification.delivered > 0 && (
                    <div className="text-xs text-gaming-success mt-1">
                      Delivered to {notification.delivered.toLocaleString()} users
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Program */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gaming-success" />
            Referral Program Management
          </CardTitle>
          <CardDescription>Configure referral rewards and tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="referrer-reward">Referrer Reward (₹)</Label>
              <Input id="referrer-reward" type="number" defaultValue="500" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referee-reward">Referee Reward (₹)</Label>
              <Input id="referee-reward" type="number" defaultValue="200" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-deposit">Minimum Deposit (₹)</Label>
              <Input id="min-deposit" type="number" defaultValue="1000" className="bg-background" />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-background/50 rounded-lg">
            <h4 className="font-semibold mb-2">Referral Statistics</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gaming-success">892</div>
                <div className="text-sm text-muted-foreground">Total Referrals</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gaming-gold">₹45.2K</div>
                <div className="text-sm text-muted-foreground">Total Rewards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">68%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
            </div>
          </div>
          
          <Button className="mt-4 bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90">
            Update Referral Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};