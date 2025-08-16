import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BannerPromotion {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  redirect_url?: string;
  is_active: boolean;
  display_order: number;
  click_count: number;
  impression_count: number;
}

export const BannerCarousel = () => {
  const [banners, setBanners] = useState<BannerPromotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveBanners();
  }, []);

  const fetchActiveBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching banners:', error);
        return;
      }

      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerClick = async (banner: BannerPromotion) => {
    // Track click
    try {
      await supabase
        .from('banner_promotions')
        .update({ click_count: banner.click_count + 1 })
        .eq('id', banner.id);

      // Redirect if URL is provided
      if (banner.redirect_url) {
        window.open(banner.redirect_url, '_blank');
      }
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }
  };

  const nextBanner = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevBanner = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  // Auto-advance carousel
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(nextBanner, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Track impression when banner changes
  useEffect(() => {
    if (banners.length > 0 && banners[currentIndex]) {
      const banner = banners[currentIndex];
      const trackImpression = async () => {
        try {
          await supabase
            .from('banner_promotions')
            .update({ impression_count: banner.impression_count + 1 })
            .eq('id', banner.id);
          
          // Update local state to reflect the change
          setBanners(prev => prev.map(b => 
            b.id === banner.id 
              ? { ...b, impression_count: b.impression_count + 1 }
              : b
          ));
        } catch (error) {
          console.error('Error tracking impression:', error);
        }
      };
      
      trackImpression();
    }
  }, [currentIndex]);

  if (isLoading) {
    return (
      <Card className="w-full h-48 bg-gradient-card animate-pulse">
        <div className="w-full h-full bg-muted/50 rounded-lg"></div>
      </Card>
    );
  }

  if (banners.length === 0) {
    return null; // Don't show anything if no banners
  }

  const currentBanner = banners[currentIndex];

  return (
    <Card className="relative w-full overflow-hidden bg-gradient-card border-primary/20">
      <div className="relative w-full h-48 md:h-64">
        <img
          src={currentBanner.image_url}
          alt={currentBanner.title}
          className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
          onClick={() => handleBannerClick(currentBanner)}
        />
        
        {/* Overlay content */}
        <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
          <div className="text-white">
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              {currentBanner.title}
            </h3>
            {currentBanner.subtitle && (
              <p className="text-sm md:text-base opacity-90">
                {currentBanner.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Navigation arrows - only show if more than 1 banner */}
        {banners.length > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 border-white/30 text-white hover:bg-black/40"
              onClick={prevBanner}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 border-white/30 text-white hover:bg-black/40"
              onClick={nextBanner}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Dots indicator - only show if more than 1 banner */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/50'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};