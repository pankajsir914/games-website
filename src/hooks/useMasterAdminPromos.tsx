import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  promotion_type: string;
  value?: number;
  percentage?: number;
  banner_url?: string;
  start_date: string;
  end_date: string;
  max_usage: number;
  current_usage: number;
  target_audience: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BannerPromotion {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  redirect_url?: string;
  is_active: boolean;
  display_order: number;
  start_date: string;
  end_date?: string;
  click_count: number;
  impression_count: number;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  target_audience: string;
  is_scheduled: boolean;
  scheduled_for?: string;
  sent_at?: string;
  delivered_count: number;
  status: string;
  created_at: string;
}

export const useMasterAdminPromos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch promotions
  const { data: promotions = [], isLoading: promotionsLoading } = useQuery({
    queryKey: ['master-admin-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotions:', error);
        return [];
      }
      return data as Promotion[];
    },
  });

  // Fetch banner promotions
  const { data: bannerPromotions = [], isLoading: bannersLoading } = useQuery({
    queryKey: ['banner-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banner_promotions')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching banner promotions:', error);
        return [];
      }
      return data as BannerPromotion[];
    },
  });

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['master-admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      return data as Notification[];
    },
  });

  // Create promotion
  const createPromotion = useMutation({
    mutationFn: async (promotionData: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert([promotionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-promotions'] });
      toast({
        title: 'Success',
        description: 'Promotion created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create promotion: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update promotion
  const updatePromotion = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Promotion> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('promotions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-promotions'] });
      toast({
        title: 'Success',
        description: 'Promotion updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update promotion: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete promotion
  const deletePromotion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-promotions'] });
      toast({
        title: 'Success',
        description: 'Promotion deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete promotion: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Upload banner image
  const uploadBannerImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('promotion-banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('promotion-banners')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  // Create banner promotion
  const createBannerPromotion = useMutation({
    mutationFn: async (data: Omit<BannerPromotion, 'id' | 'created_at' | 'click_count' | 'impression_count'>) => {
      const { data: result, error } = await supabase
        .from('banner_promotions')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-promotions'] });
      toast({
        title: 'Success',
        description: 'Banner promotion created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create banner promotion: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update banner promotion
  const updateBannerPromotion = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BannerPromotion> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('banner_promotions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-promotions'] });
      toast({
        title: 'Success',
        description: 'Banner promotion updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update banner promotion: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete banner promotion
  const deleteBannerPromotion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banner_promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-promotions'] });
      toast({
        title: 'Success',
        description: 'Banner promotion deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete banner promotion: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Send notification
  const sendNotification = useMutation({
    mutationFn: async (notificationData: Omit<Notification, 'id' | 'created_at' | 'delivered_count'>) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notificationData,
          status: notificationData.is_scheduled ? 'scheduled' : 'sent',
          sent_at: notificationData.is_scheduled ? null : new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-notifications'] });
      toast({
        title: 'Success',
        description: 'Notification sent successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send notification: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Get promotion stats
  const getPromotionStats = () => {
    const activePromotions = promotions.filter(p => p.is_active).length;
    const totalRedemptions = promotions.reduce((sum, p) => sum + p.current_usage, 0);
    const totalReferralEarnings = promotions
      .filter(p => p.promotion_type === 'referral')
      .reduce((sum, p) => sum + (p.current_usage * (p.value || 0)), 0);
    const messagesSent = notifications.reduce((sum, n) => sum + n.delivered_count, 0);

    return {
      activePromotions,
      totalRedemptions,
      totalReferralEarnings,
      messagesSent,
    };
  };

  return {
    promotions,
    bannerPromotions,
    notifications,
    isLoading: promotionsLoading || bannersLoading || notificationsLoading,
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
  };
};