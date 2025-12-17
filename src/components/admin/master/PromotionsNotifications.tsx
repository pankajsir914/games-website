import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Trash2,
  Image,
  Upload,
  X,
  Loader2
} from 'lucide-react';
import { useMasterAdminPromos, type Promotion, type BannerPromotion, type Notification } from '@/hooks/useMasterAdminPromos';

export const PromotionsNotifications = () => {
  const {
    promotions,
    bannerPromotions,
    notifications,
    isLoading,
    isUploading,
    createPromotion,
    updatePromotion,
    deletePromotion,
    uploadBannerImage,
    createBannerPromotion,
    updateBannerPromotion,
    deleteBannerPromotion,
    sendNotification,
    getPromotionStats,
  } = useMasterAdminPromos();

  // Form states
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    description: '',
    promotion_type: '',
    value: '',
    percentage: '',
    start_date: '',
    end_date: '',
    max_usage: '',
    target_audience: 'all',
  });

  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    redirect_url: '',
    display_order: '0',
    end_date: '',
  });

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    notification_type: 'system',
    target_audience: 'all',
    is_scheduled: false,
    scheduled_for: '',
  });

  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Helper functions
  const getStatusBadge = (status: string | boolean) => {
    switch (status) {
      case 'active': case true: return <Badge className="bg-gaming-success text-gaming-success-foreground">Active</Badge>;
      case 'paused': case false: return <Badge className="bg-orange-500 text-white">Paused</Badge>;
      case 'expired': return <Badge className="bg-gaming-danger text-gaming-danger-foreground">Expired</Badge>;
      case 'sent': return <Badge className="bg-gaming-success text-gaming-success-foreground">Sent</Badge>;
      case 'draft': return <Badge className="bg-muted text-muted-foreground">Draft</Badge>;
      case 'scheduled': return <Badge className="bg-blue-500 text-white">Scheduled</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleBannerFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setBannerPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePromotion = async () => {
    try {
      await createPromotion.mutateAsync({
        ...promotionForm,
        value: promotionForm.value ? parseFloat(promotionForm.value) : undefined,
        percentage: promotionForm.percentage ? parseFloat(promotionForm.percentage) : undefined,
        max_usage: parseInt(promotionForm.max_usage) || 0,
        current_usage: 0,
        is_active: true,
      } as Omit<Promotion, 'id' | 'created_at' | 'updated_at'>);
      
      setPromotionForm({
        title: '',
        description: '',
        promotion_type: '',
        value: '',
        percentage: '',
        start_date: '',
        end_date: '',
        max_usage: '',
        target_audience: 'all',
      });
    } catch (error) {
      console.error('Error creating promotion:', error);
    }
  };

  const handleCreateBannerPromotion = async () => {
    if (!selectedBannerFile) {
      alert('Please select a banner image');
      return;
    }

    try {
      const imageUrl = await uploadBannerImage(selectedBannerFile);
      
      await createBannerPromotion.mutateAsync({
        ...bannerForm,
        image_url: imageUrl,
        display_order: parseInt(bannerForm.display_order),
        is_active: true,
        start_date: new Date().toISOString(),
        end_date: bannerForm.end_date || null,
      } as Omit<BannerPromotion, 'id' | 'created_at' | 'click_count' | 'impression_count'>);

      setBannerForm({
        title: '',
        subtitle: '',
        redirect_url: '',
        display_order: '0',
        end_date: '',
      });
      setSelectedBannerFile(null);
      setBannerPreview(null);
    } catch (error) {
      console.error('Error creating banner promotion:', error);
    }
  };

  const handleSendNotification = async () => {
    try {
      await sendNotification.mutateAsync({
        ...notificationForm,
        scheduled_for: notificationForm.is_scheduled ? notificationForm.scheduled_for : undefined,
      } as Omit<Notification, 'id' | 'created_at' | 'delivered_count'>);

      setNotificationForm({
        title: '',
        message: '',
        notification_type: 'system',
        target_audience: 'all',
        is_scheduled: false,
        scheduled_for: '',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const stats = getPromotionStats();

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
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-gaming-gold">{stats.activePromotions}</div>
            )}
            <p className="text-xs text-muted-foreground">{promotions.length} total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-primary">{stats.totalRedemptions.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gaming-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
            <Users className="h-4 w-4 text-gaming-success" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-gaming-success">₹{(stats.totalReferralEarnings / 1000).toFixed(1)}K</div>
            )}
            <p className="text-xs text-muted-foreground">From referrals</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Bell className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-cyan-500">{(stats.messagesSent / 1000).toFixed(1)}K</div>
            )}
            <p className="text-xs text-muted-foreground">{notifications.length} notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Forms - Tabbed Interface */}
      <Tabs defaultValue="promotions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="promotions">Create Promotion</TabsTrigger>
          <TabsTrigger value="banners">Upload Banner</TabsTrigger>
          <TabsTrigger value="notifications">Send Notification</TabsTrigger>
        </TabsList>

        <TabsContent value="promotions">
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
                    <Input 
                      id="promo-title" 
                      placeholder="Enter promotion title" 
                      className="bg-background"
                      value={promotionForm.title}
                      onChange={(e) => setPromotionForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="promo-type">Promotion Type</Label>
                    <Select value={promotionForm.promotion_type} onValueChange={(value) => setPromotionForm(prev => ({ ...prev, promotion_type: value }))}>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo-value">Value (₹)</Label>
                      <Input 
                        id="promo-value" 
                        type="number" 
                        placeholder="500" 
                        className="bg-background"
                        value={promotionForm.value}
                        onChange={(e) => setPromotionForm(prev => ({ ...prev, value: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo-percentage">Percentage (%)</Label>
                      <Input 
                        id="promo-percentage" 
                        type="number" 
                        placeholder="50" 
                        className="bg-background"
                        value={promotionForm.percentage}
                        onChange={(e) => setPromotionForm(prev => ({ ...prev, percentage: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="promo-description">Description</Label>
                    <Textarea 
                      id="promo-description" 
                      placeholder="Describe the promotion..." 
                      className="bg-background"
                      value={promotionForm.description}
                      onChange={(e) => setPromotionForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input 
                        id="start-date" 
                        type="date" 
                        className="bg-background"
                        value={promotionForm.start_date}
                        onChange={(e) => setPromotionForm(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input 
                        id="end-date" 
                        type="date" 
                        className="bg-background"
                        value={promotionForm.end_date}
                        onChange={(e) => setPromotionForm(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-usage">Maximum Usage</Label>
                    <Input 
                      id="max-usage" 
                      type="number" 
                      placeholder="1000" 
                      className="bg-background"
                      value={promotionForm.max_usage}
                      onChange={(e) => setPromotionForm(prev => ({ ...prev, max_usage: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleCreatePromotion}
                disabled={createPromotion.isPending || !promotionForm.title || !promotionForm.promotion_type}
                className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90"
              >
                {createPromotion.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4 mr-2" />
                )}
                Create Promotion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Upload Banner Promotion
              </CardTitle>
              <CardDescription>Create banner promotions for carousel display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="banner-title">Banner Title</Label>
                      <Input 
                        id="banner-title" 
                        placeholder="Enter banner title" 
                        className="bg-background border-input"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                        autoComplete="off"
                      />
                    </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="banner-subtitle">Subtitle (Optional)</Label>
                    <Input 
                      id="banner-subtitle" 
                      placeholder="Enter subtitle" 
                      className="bg-background"
                      value={bannerForm.subtitle}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="banner-redirect">Redirect URL (Optional)</Label>
                    <Input 
                      id="banner-redirect" 
                      placeholder="https://..." 
                      className="bg-background"
                      value={bannerForm.redirect_url}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, redirect_url: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display-order">Display Order</Label>
                      <Input 
                        id="display-order" 
                        type="number" 
                        placeholder="0" 
                        className="bg-background"
                        value={bannerForm.display_order}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, display_order: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="banner-end-date">End Date (Optional)</Label>
                      <Input 
                        id="banner-end-date" 
                        type="date" 
                        className="bg-background"
                        value={bannerForm.end_date}
                        onChange={(e) => setBannerForm(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="banner-image">Banner Image</Label>
                      <div className="relative border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                        {bannerPreview ? (
                          <div className="relative">
                            <img src={bannerPreview} alt="Banner preview" className="max-w-full h-32 object-cover rounded mx-auto" />
                            <Button
                              size="sm"
                              variant="outline"
                              className="absolute -top-2 -right-2 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBannerFile(null);
                                setBannerPreview(null);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="pointer-events-none">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload banner image</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
                        />
                      </div>
                    </div>
                  </div>
              </div>
              
              <Button 
                onClick={handleCreateBannerPromotion}
                disabled={createBannerPromotion.isPending || isUploading || !selectedBannerFile || !bannerForm.title}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createBannerPromotion.isPending || isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? 'Uploading...' : 'Create Banner Promotion'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-cyan-500" />
                Send Notification
              </CardTitle>
              <CardDescription>Broadcast messages to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notif-title">Notification Title</Label>
                <Input 
                  id="notif-title" 
                  placeholder="Enter notification title" 
                  className="bg-background"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notif-message">Message</Label>
                <Textarea 
                  id="notif-message" 
                  placeholder="Enter your message..." 
                  className="bg-background"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notif-type">Notification Type</Label>
                  <Select value={notificationForm.notification_type} onValueChange={(value) => setNotificationForm(prev => ({ ...prev, notification_type: value }))}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Select value={notificationForm.target_audience} onValueChange={(value) => setNotificationForm(prev => ({ ...prev, target_audience: value }))}>
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
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="schedule" 
                  checked={notificationForm.is_scheduled}
                  onCheckedChange={(checked) => setNotificationForm(prev => ({ ...prev, is_scheduled: checked }))}
                />
                <Label htmlFor="schedule">Schedule for later</Label>
              </div>
              
              {notificationForm.is_scheduled && (
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Schedule Time</Label>
                  <Input 
                    id="schedule-time" 
                    type="datetime-local" 
                    className="bg-background"
                    value={notificationForm.scheduled_for}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, scheduled_for: e.target.value }))}
                  />
                </div>
              )}
              
              <Button 
                onClick={handleSendNotification}
                disabled={sendNotification.isPending || !notificationForm.title || !notificationForm.message}
                className="w-full bg-cyan-500 text-white hover:bg-cyan-600"
              >
                {sendNotification.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {notificationForm.is_scheduled ? 'Schedule Notification' : 'Send Notification'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active Promotions and Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-gaming-gold" />
              Active Promotions
            </CardTitle>
            <CardDescription>Manage existing promotional campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : promotions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No promotions created yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {promotions.slice(0, 5).map((promo) => (
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
                            {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {promo.current_usage}/{promo.max_usage} used
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-lg text-gaming-gold">
                          {promo.promotion_type === 'referral' ? `₹${promo.value}` : `${promo.percentage}%`}
                        </div>
                        <div className="w-20 h-2 bg-muted rounded">
                          <div 
                            className="h-2 bg-gaming-gold rounded" 
                            style={{ width: `${Math.min((promo.current_usage / promo.max_usage) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {getStatusBadge(promo.is_active)}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updatePromotion.mutate({ id: promo.id, is_active: !promo.is_active })}
                          disabled={updatePromotion.isPending}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {promo.is_active ? 'Pause' : 'Resume'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-gaming-danger"
                          onClick={() => deletePromotion.mutate(promo.id)}
                          disabled={deletePromotion.isPending}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Banner Promotions
            </CardTitle>
            <CardDescription>Manage carousel banner promotions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
                    <Skeleton className="w-16 h-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : bannerPromotions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No banner promotions created yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bannerPromotions.slice(0, 5).map((banner) => (
                  <div key={banner.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <img 
                        src={banner.image_url} 
                        alt={banner.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      
                      <div>
                        <h4 className="font-semibold">{banner.title}</h4>
                        {banner.subtitle && (
                          <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Order: {banner.display_order}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Clicks: {banner.click_count}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStatusBadge(banner.is_active)}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateBannerPromotion.mutate({ id: banner.id, is_active: !banner.is_active })}
                          disabled={updateBannerPromotion.isPending}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {banner.is_active ? 'Hide' : 'Show'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-gaming-danger"
                          onClick={() => deleteBannerPromotion.mutate(banner.id)}
                          disabled={deleteBannerPromotion.isPending}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-cyan-500" />
            Recent Notifications
          </CardTitle>
          <CardDescription>Previously sent messages and their delivery status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-48 mb-2" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    {getStatusBadge(notification.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>To: {notification.target_audience} users</span>
                    {notification.sent_at && (
                      <span>{new Date(notification.sent_at).toLocaleString()}</span>
                    )}
                  </div>
                  {notification.delivered_count > 0 && (
                    <div className="text-xs text-gaming-success mt-1">
                      Delivered to {notification.delivered_count.toLocaleString()} users
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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