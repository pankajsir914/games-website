import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserCog, 
  Shield, 
  Crown,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

export const TeamManagement = () => {
  const [admins] = useState([
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh@company.com',
      phone: '+91 98765*****',
      role: 'master_admin',
      status: 'active',
      lastLogin: '2024-01-15 14:30',
      location: 'Mumbai, IN',
      permissions: ['all'],
      joinDate: '2023-01-15',
      actionsCount: 2847
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya@company.com',
      phone: '+91 87654*****',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15 13:45',
      location: 'Delhi, IN',
      permissions: ['user_management', 'game_management', 'transactions'],
      joinDate: '2023-03-10',
      actionsCount: 1923
    },
    {
      id: 3,
      name: 'Amit Patel',
      email: 'amit@company.com',
      phone: '+91 76543*****',
      role: 'moderator',
      status: 'active',
      lastLogin: '2024-01-15 12:20',
      location: 'Bangalore, IN',
      permissions: ['user_support', 'content_management'],
      joinDate: '2023-06-22',
      actionsCount: 856
    },
    {
      id: 4,
      name: 'Sneha Reddy',
      email: 'sneha@company.com',
      phone: '+91 65432*****',
      role: 'support',
      status: 'inactive',
      lastLogin: '2024-01-10 16:15',
      location: 'Hyderabad, IN',
      permissions: ['user_support'],
      joinDate: '2023-09-15',
      actionsCount: 445
    }
  ]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master_admin': return <Badge className="bg-gaming-gold text-gaming-gold-foreground">Master Admin</Badge>;
      case 'admin': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Admin</Badge>;
      case 'moderator': return <Badge className="bg-primary text-primary-foreground">Moderator</Badge>;
      case 'support': return <Badge className="bg-gaming-success text-gaming-success-foreground">Support</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>;
      case 'inactive': return <Badge className="bg-orange-500 text-white">Inactive</Badge>;
      case 'suspended': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Suspended</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master_admin': return <Crown className="h-4 w-4 text-gaming-gold" />;
      case 'admin': return <Shield className="h-4 w-4 text-gaming-danger" />;
      case 'moderator': return <UserCog className="h-4 w-4 text-primary" />;
      case 'support': return <Users className="h-4 w-4 text-gaming-success" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team & Admin Management</h2>
          <p className="text-muted-foreground">Manage admin roles, permissions, and team access</p>
        </div>
        <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Master Admins</CardTitle>
            <Crown className="h-4 w-4 text-gaming-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-gold">1</div>
            <p className="text-xs text-muted-foreground">Ultimate access</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-danger/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-gaming-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-danger">3</div>
            <p className="text-xs text-muted-foreground">Full management access</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderators</CardTitle>
            <UserCog className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">2</div>
            <p className="text-xs text-muted-foreground">Content & user moderation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Staff</CardTitle>
            <Users className="h-4 w-4 text-gaming-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gaming-success">6</div>
            <p className="text-xs text-muted-foreground">Customer support</p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Admin */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-gaming-gold" />
            Add New Team Member
          </CardTitle>
          <CardDescription>Create new admin accounts with specific roles and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Full Name</Label>
                <Input id="admin-name" placeholder="Enter full name" className="bg-background" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email Address</Label>
                <Input id="admin-email" type="email" placeholder="Enter email" className="bg-background" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-phone">Phone Number</Label>
                <Input id="admin-phone" placeholder="Enter phone number" className="bg-background" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-role">Role</Label>
                <Select>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="support">Support Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-location">Location</Label>
                <Input id="admin-location" placeholder="City, Country" className="bg-background" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-password">Temporary Password</Label>
                <Input id="admin-password" type="password" placeholder="Auto-generated" className="bg-background" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">User Management</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Game Management</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Financial Control</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Content Management</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Analytics Access</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Security Settings</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">User Support</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">System Monitoring</span>
              </label>
            </div>
          </div>
          
          <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Admin Account
          </Button>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members
          </CardTitle>
          <CardDescription>Manage existing team members and their access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 bg-primary">
                    <AvatarFallback className="text-primary-foreground font-semibold">
                      {admin.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{admin.name}</h4>
                      {getRoleIcon(admin.role)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {admin.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {admin.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {admin.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last login: {admin.lastLogin}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{admin.actionsCount}</div>
                    <div className="text-xs text-muted-foreground">Actions</div>
                  </div>
                  
                  <div className="flex gap-2">
                    {getRoleBadge(admin.role)}
                    {getStatusBadge(admin.status)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {admin.role !== 'master_admin' && (
                      <Button size="sm" variant="outline" className="text-gaming-danger">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gaming-danger" />
            Permission Matrix
          </CardTitle>
          <CardDescription>Overview of role-based permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Permission</th>
                  <th className="text-center p-2">Master Admin</th>
                  <th className="text-center p-2">Admin</th>
                  <th className="text-center p-2">Moderator</th>
                  <th className="text-center p-2">Support</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                <tr className="border-b border-border/50">
                  <td className="p-2">User Management</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">❌</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2">Game Management</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">❌</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2">Financial Control</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">❌</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2">Content Management</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">❌</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2">User Support</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">✅</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2">Admin Management</td>
                  <td className="text-center p-2">✅</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">❌</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};